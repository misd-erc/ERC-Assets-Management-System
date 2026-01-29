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

            // 2. Only validate movement columns IF they exist (i.e., file has more than 12 columns)
            if (headerRow.Length <= 12)
            {
                // No movement columns at all → this is perfectly valid
                return;
            }

            // 3. There are extra columns → check if at least one complete, correct movement block exists
            int movementStart = 12;
            bool hasValidMovementBlock = false;

            while (movementStart + 6 < headerRow.Length)
            {
                var block = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                // Check 8 columns to account for optional Status column
                for (int i = 0; i < 8 && (movementStart + i) < headerRow.Length; i++)
                {
                    var header = headerRow[movementStart + i].Trim();
                    if (!string.IsNullOrWhiteSpace(header))
                        block.Add(header);
                }

                // Check if this block contains ALL required movement columns
                if (RequiredMovementColumns.All(col => block.Contains(col)))
                {
                    hasValidMovementBlock = true;
                    break;
                }

                movementStart += 8; // Increment by 8 to account for optional Status
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

                // Parse movement blocks (only if columns exist)
                var movements = new List<PTAAnnualCount>();
                int col = 12;

                while (col + 6 < dataRow.Length)
                {
                    var dateCell = dataRow[col].Trim();
                    if (string.IsNullOrWhiteSpace(dateCell))
                    {
                        col += 7;
                        continue;
                    }

                    var movement = new PTAAnnualCount
                    {
                        DateAssigned = TryParseDate(dateCell),
                        PtrItrNumber = GetCell(dataRow, col + 1),
                        ParIcsNumber = GetCell(dataRow, col + 2),
                        PlantillaEmployeeId = GetCell(dataRow, col + 3),
                        NonPlantillaEmployeeId = GetCell(dataRow, col + 4),
                        ActualOfficeAndDivision = GetCell(dataRow, col + 5),
                        Condition = GetCell(dataRow, col + 6),
                        Status = GetCell(dataRow, col + 7) // Optional Status column
                    };
                    movements.Add(movement);
                    col += 8; // Increment by 8 to account for optional Status column
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