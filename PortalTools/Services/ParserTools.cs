using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.AspNetCore.Http;
using OfficeOpenXml;
using PortalDB.Models.ParserModels.PTA;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;

namespace PortalTools.Services
{
    public sealed class ParserTools
    {
        private static readonly DateTime ExcelEpoch = new DateTime(1899, 12, 30);
        private static readonly Regex PartRegex = new(
            @"(?:^|\n)\s*(?:(?<name>[^\n:]+):)?\s*SN[#:]?\s*(?<sn>[A-Z0-9]+)",
            RegexOptions.IgnoreCase | RegexOptions.Compiled | RegexOptions.Multiline);

        static ParserTools()
        {
            ExcelPackage.License.SetNonCommercialPersonal("ERC AMS");
        }

        #region Required Columns
        private static readonly HashSet<string> RequiredStaticColumns = new(StringComparer.OrdinalIgnoreCase)
        {

            "Property Number",
            "Category",
            "Legend/Sub-Category",
            "Description",
            "Brand",
            "Model",
            "Serial Number",
            "Parts/Accessories",
            "Unit of Measurement",
            "Unit Value (PHP)",
            "Date Acquired (YYYY-MM-DD)",
            "Estimated Useful Life (Years)",
            "Fiscal Date (YYYY-MM-DD)"
        };

        private static readonly string[] RequiredMovementColumns = new[]
        {
            "PTR/ITR Number",
            "PAR/ICS Number",
            "Plantilla Employee ID",
            "Non-Plantilla Employee ID",
            "Office/Division",
            "Condition",
            "Date Assigned (YYYY-MM-DD)"
        };
        #endregion

        public List<PTAItem> ParsePtaFile(IFormFile file)
        {
            if (file == null) throw new ArgumentException("File is required.");

            var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? "";
            return ext switch
            {
                ".csv" => ParsePtaCsv(file.OpenReadStream()),
                ".xlsx" or ".xls" => ParsePtaExcel(file.OpenReadStream()),
                _ => throw new NotSupportedException("Only .csv and .xlsx files are supported.")
            };
        }

        private List<PTAItem> ParsePtaCsv(Stream stream)
        {
            using var reader = new StreamReader(stream);
            using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = false,
                TrimOptions = TrimOptions.Trim,
                MissingFieldFound = null,
                BadDataFound = null
            });

            var rows = new List<string[]>();
            while (csv.Read())
            {
                var fields = new List<string>();
                for (int i = 0; csv.TryGetField(i, out string? field); i++)
                {
                    fields.Add(field ?? string.Empty);
                }
                rows.Add(fields.ToArray());
            }

            ValidatePtaTemplate(rows);
            return ParsePtaRows(rows);
        }

        private List<PTAItem> ParsePtaExcel(Stream stream)
        {
            using var package = new ExcelPackage(stream);
            var ws = package.Workbook.Worksheets[0];
            if (ws.Dimension == null) throw new InvalidDataException("The Excel file is empty or corrupted.");

            var rows = new List<string[]>();
            int rowCount = ws.Dimension.Rows;
            int colCount = ws.Dimension.Columns;

            for (int r = 1; r <= rowCount; r++)
            {
                var row = new string[colCount];
                for (int c = 1; c <= colCount; c++)
                {
                    var cellValue = ws.Cells[r, c].Value;
                    row[c - 1] = cellValue?.ToString()?.Trim() ?? string.Empty;
                }
                rows.Add(row);
            }

            ValidatePtaTemplate(rows);
            return ParsePtaRows(rows);
        }

        private void ValidatePtaTemplate(List<string[]> rows)
        {
            if (rows.Count < 3)
                throw new InvalidDataException("Invalid template: File must have at least 3 rows (title, header, data).");

            var headerRow = rows[1];
            var headers = headerRow
                .Select(h => h.Trim())
                .Where(h => !string.IsNullOrWhiteSpace(h))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            // 1. Always check static columns
            var missingStatic = RequiredStaticColumns.Except(headers).ToList();
            if (missingStatic.Any())
            {
                throw new InvalidDataException(
                    $"Invalid PTA template: Missing required column(s): {string.Join(", ", missingStatic)}. " +
                    "Please use the official template.");
            }

            // 2. Only validate movement columns IF they exist (i.e., file has more than 13 columns)
            if (headerRow.Length <= 13)
            {
                // No movement columns at all → this is perfectly valid
                return;
            }

            // 3. There are extra columns → check if at least one complete, correct movement block exists.
            // Movement blocks start at index 13 (after the 13 static columns 0-12).
            // Each block begins at a "PTR/ITR Number" column; scan forward to find it.
            int movementStart = 13;
            bool hasValidMovementBlock = false;

            while (movementStart < headerRow.Length)
            {
                // Find the next block start (PTR/ITR Number)
                if (!string.Equals(headerRow[movementStart].Trim(), "PTR/ITR Number", StringComparison.OrdinalIgnoreCase))
                {
                    movementStart++;
                    continue;
                }

                var block = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                for (int i = movementStart; i < headerRow.Length; i++)
                {
                    // Stop at the next PTR/ITR Number (next block)
                    if (i > movementStart && string.Equals(headerRow[i].Trim(), "PTR/ITR Number", StringComparison.OrdinalIgnoreCase))
                        break;
                    if (!string.IsNullOrWhiteSpace(headerRow[i]))
                        block.Add(headerRow[i].Trim());
                }

                // Check if this block contains ALL required movement columns
                if (RequiredMovementColumns.All(col => block.Contains(col)))
                {
                    hasValidMovementBlock = true;
                    break;
                }

                movementStart++;
            }

            if (!hasValidMovementBlock)
            {
                throw new InvalidDataException(
                    "Invalid PTA template: Movement columns detected but incorrectly formatted. " +
                    $"Expected complete blocks of: {string.Join(" | ", RequiredMovementColumns)} [+ optional Status]. " +
                    "Either remove movement columns entirely or ensure they follow the official template exactly.");
            }
        }

        private List<PTAItem> ParsePtaRows(List<string[]> rows)
        {
            var headerRow = rows[1].Select(h => h.Trim()).ToArray();
            var dataRows = rows.Skip(2)
                              .Where(row => row.Any(cell => !string.IsNullOrWhiteSpace(cell)))
                              .ToList();

            // Pre-compute movement block column maps from the header row.
            // Static columns occupy indices 0-12; movement columns start at index 13.
            // Each movement block starts at a "PTR/ITR Number" header.
            // Blocks may vary in size (e.g. one block may omit Plantilla Employee ID),
            // so we build a name→index map per block for safe header-driven lookup.
            const int movementColStart = 13;
            var movementBlockMaps = new List<Dictionary<string, int>>();
            for (int i = movementColStart; i < headerRow.Length; i++)
            {
                if (!string.Equals(headerRow[i], "PTR/ITR Number", StringComparison.OrdinalIgnoreCase))
                    continue;

                var blockMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                for (int j = i; j < headerRow.Length; j++)
                {
                    // Each new "PTR/ITR Number" after the block start marks the next block
                    if (j > i && string.Equals(headerRow[j], "PTR/ITR Number", StringComparison.OrdinalIgnoreCase))
                        break;
                    if (!string.IsNullOrWhiteSpace(headerRow[j]))
                        blockMap.TryAdd(headerRow[j], j); // TryAdd: first occurrence wins within a block
                }
                movementBlockMaps.Add(blockMap);
            }

            var result = new List<PTAItem>(dataRows.Count);

            foreach (var dataRow in dataRows)
            {
                var item = new PTAItem();

                var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                int colCount = Math.Min(headerRow.Length, dataRow.Length);
                for (int i = 0; i < colCount; i++)
                {
                    var header = headerRow[i];
                    if (!string.IsNullOrWhiteSpace(header))
                    {
                        map[header] = dataRow[i]?.Trim() ?? string.Empty;
                    }
                }

                item.PropertyNumber = Get(map, "Property Number", "property_number");
                item.Category = Get(map, "Category", "category");
                item.Legend = Get(map, "Legend/Sub-Category", "legend");
                item.Description = Get(map, "Description", "description");
                item.Brand = Get(map, "Brand", "brand");
                item.Model = Get(map, "Model", "model");
                item.SerialNumber = Get(map, "Serial Number", "serial_number", "sn");
                item.UnitOfMeasurement = Get(map, "Unit of Measurement", "unit_of_measurement", "uom");

                item.UnitValue = ParseLong(Get(map, "Unit Value (PHP)", "unit_value", "Unit Value")) ?? 0;
                item.EstimatedUsefulLife = ParseLong(Get(map,
                    "Estimated Useful Life (Years)",
                    "estimated_useful_life",
                    "Useful Life (Years)",
                    "useful_life",
                    "EUL",
                    "Estimated Useful Life")) ?? 0;

                var dateAcquired = Get(map, "Date Acquired (YYYY-MM-DD)", "date_acquired", "Date Acquired");
                item.DateAssigned = TryParseDate(dateAcquired);

                var discalDate = Get(map, "Fiscal Date (YYYY-mm-dd)", "fiscal_date", "Fiscal Date");
                item.FiscalDate = TryParseDate(discalDate);

                var partsStr = Get(map, "Parts/Accessories", "parts", "accessories");
                item.Parts = string.IsNullOrWhiteSpace(partsStr) ? null : ParsePtaParts(partsStr);

                // Parse movement blocks using header-driven block maps.
                // Each block is identified by its "Date Assigned (YYYY-MM-DD)" column;
                // rows with a blank date in a block are simply skipped for that block.
                var movements = new List<PTAAnnualCount>();
                foreach (var blockMap in movementBlockMaps)
                {
                    if (!blockMap.TryGetValue("Date Assigned (YYYY-MM-DD)", out int dateIdx))
                        continue;
                    if (dateIdx >= dataRow.Length)
                        continue;

                    var dateCell = dataRow[dateIdx].Trim();
                    if (string.IsNullOrWhiteSpace(dateCell))
                        continue;

                    string GetBlockCell(string colName) =>
                        blockMap.TryGetValue(colName, out int idx) && idx < dataRow.Length
                            ? dataRow[idx]?.Trim() ?? string.Empty
                            : string.Empty;

                    movements.Add(new PTAAnnualCount
                    {
                        PtrItrNumber          = GetBlockCell("PTR/ITR Number"),
                        ParIcsNumber          = GetBlockCell("PAR/ICS Number"),
                        PlantillaEmployeeId   = GetBlockCell("Plantilla Employee ID"),
                        NonPlantillaEmployeeId = GetBlockCell("Non-Plantilla Employee ID"),
                        ActualOfficeAndDivision = GetBlockCell("Office/Division"),
                        Condition             = GetBlockCell("Condition"),
                        DateAssigned          = TryParseDate(dateCell),
                        Status                = GetBlockCell("Status")
                    });
                }

                item.AnnualCount = movements.Count > 0 ? movements : null;
                result.Add(item);
            }

            return result;
        }

        #region Helpers
        private static string? Get(Dictionary<string, string> map, params string[] keys)
        {
            foreach (var key in keys)
            {
                if (map.TryGetValue(key.Trim(), out var value) && !string.IsNullOrWhiteSpace(value))
                    return value.Trim();
            }
            return null;
        }

        private static string GetCell(string[] row, int index)
            => index < row.Length ? (row[index]?.Trim() ?? string.Empty) : string.Empty;

        private static long? ParseLong(string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) return null;
            var cleaned = input.Replace(",", "").Replace("₱", "").Replace("$", "").Replace("PHP", "").Trim();
            return long.TryParse(cleaned, NumberStyles.Integer, CultureInfo.InvariantCulture, out var result)
                ? result
                : double.TryParse(cleaned, NumberStyles.Any, CultureInfo.InvariantCulture, out var d)
                    ? (long)Math.Round(d)
                    : null;
        }

        private static List<PTAPart> ParsePtaParts(string input)
        {
            var list = new List<PTAPart>();
            foreach (Match m in PartRegex.Matches(input))
            {
                var name = m.Groups["name"].Value.Trim();
                var sn = m.Groups["sn"].Value.Trim();
                if (!string.IsNullOrEmpty(sn))
                {
                    list.Add(new PTAPart
                    {
                        PartName = string.IsNullOrEmpty(name) ? "unknown" : name.ToLowerInvariant(),
                        PartSerialNumber = sn
                    });
                }
            }
            return list;
        }

        private static DateTime? TryParseDate(string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) return null;
            var s = input.Trim();

            if (double.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var serial))
            {
                try
                {
                    var days = (int)serial;
                    if (days > 60) days--; // Excel leap year bug
                    return ExcelEpoch.AddDays(days);
                }
                catch { }
            }

            var formats = new[] { "yyyy-MM-dd", "MM/dd/yyyy", "dd/MM/yyyy", "yyyy/MM/dd", "M/d/yyyy", "d/M/yyyy" };
            return DateTime.TryParseExact(s, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt)
                ? dt
                : DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.None, out dt) ? dt : null;
        }
        #endregion
    }
}