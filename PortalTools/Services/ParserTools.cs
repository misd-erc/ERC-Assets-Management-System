using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.AspNetCore.Http;
using OfficeOpenXml;
using PortalDB.Models.ParserModels.PPE;
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

        public List<PPEItem> ParsePpeFile(IFormFile file)
        {
            if (file == null) throw new ArgumentException("File is required.");

            var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? "";
            return ext switch
            {
                ".csv" => ParsePpeCsv(file.OpenReadStream()),
                ".xlsx" or ".xls" => ParsePpeExcel(file.OpenReadStream()),
                _ => throw new NotSupportedException("Only .csv and .xlsx files are supported.")
            };
        }

        private List<PPEItem> ParsePpeCsv(Stream stream)
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

            return ParseRows(rows);
        }

        private List<PPEItem> ParsePpeExcel(Stream stream)
        {
            using var package = new ExcelPackage(stream);
            var ws = package.Workbook.Worksheets[0];
            var rows = new List<string[]>();

            if (ws.Dimension == null) return new List<PPEItem>();

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

            return ParseRows(rows);
        }

        private List<PPEItem> ParseRows(List<string[]> rows)
        {
            if (rows.Count < 3)
                throw new InvalidDataException("File must have at least 3 rows.");

            var headerRow = rows[1].Select(h => h.Trim()).ToArray();
            var dataRows = rows.Skip(2)
                              .Where(row => row.Any(cell => !string.IsNullOrWhiteSpace(cell)))
                              .ToList();

            var result = new List<PPEItem>(dataRows.Count);

            foreach (var dataRow in dataRows)
            {
                var item = new PPEItem();

                // Build dictionary from ALL columns (critical fix!)
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

                // String fields
                item.PropertyNumber = Get(map, "Property Number", "property_number");
                item.Category = Get(map, "Category", "category");
                item.Legend = Get(map, "Legend/Sub-Category", "legend");
                item.Description = Get(map, "Description", "description");
                item.Brand = Get(map, "Brand", "brand");
                item.Model = Get(map, "Model", "model");
                item.SerialNumber = Get(map, "Serial Number", "serial_number", "sn");
                item.UnitOfMeasurement = Get(map, "Unit of Measurement", "unit_of_measurement", "uom");

                // Numeric fields — NOW WORKS 100%
                item.UnitValue = ParseLong(Get(map, "Unit Value (PHP)", "unit_value", "Unit Value")) ?? 0;
                item.EstimatedUsefulLife = ParseLong(Get(map,
                    "Estimated Useful Life (Years)",
                    "estimated_useful_life",
                    "Useful Life (Years)",
                    "useful_life",
                    "EUL",
                    "Estimated Useful Life")) ?? 0;

                // Date
                var dateAcquired = Get(map, "Date Acquired (YYYY-MM-DD)", "date_acquired", "Date Acquired");
                item.DateAssigned = TryParseDate(dateAcquired);

                // Parts
                var partsStr = Get(map, "Parts/Accessories", "parts", "accessories");
                item.Parts = string.IsNullOrWhiteSpace(partsStr) ? null : ParseParts(partsStr);

                // Annual movements (dynamic columns after column 11)
                var movements = new List<AnnualCount>();
                int col = 11; // start after first 11 static columns

                while (col + 5 < dataRow.Length)
                {
                    var dateCell = dataRow[col].Trim();
                    if (string.IsNullOrWhiteSpace(dateCell))
                    {
                        col += 6;
                        continue;
                    }

                    var movement = new AnnualCount
                    {
                        DateAssigned = TryParseDate(dateCell),
                        ParItrNumber = GetCell(dataRow, col + 1),
                        PlantillaEmployeeId = GetCell(dataRow, col + 2),
                        NonPlantillaEmployeeId = GetCell(dataRow, col + 3),
                        ActualOfficeAndDivision = GetCell(dataRow, col + 4),
                        Condition = GetCell(dataRow, col + 5)
                    };

                    movements.Add(movement);
                    col += 6;
                }

                item.AnnualCount = movements.Count > 0 ? movements : null;
                result.Add(item);
            }

            return result;
        }

        // ─────────────── CLEAN, BULLETPROOF HELPERS ───────────────

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
            if (string.IsNullOrWhiteSpace(input))
                return null;

            var cleaned = input
                .Replace(",", "", StringComparison.Ordinal)
                .Replace("₱", "", StringComparison.Ordinal)
                .Replace("$", "", StringComparison.Ordinal)
                .Replace("PHP", "", StringComparison.Ordinal)
                .Trim();

            if (long.TryParse(cleaned, NumberStyles.Integer, CultureInfo.InvariantCulture, out var result))
                return result;

            if (double.TryParse(cleaned, NumberStyles.Any, CultureInfo.InvariantCulture, out var d))
                return (long)Math.Round(d);

            return null;
        }

        private static List<Part> ParseParts(string input)
        {
            var list = new List<Part>();
            foreach (Match m in PartRegex.Matches(input))
            {
                var name = m.Groups["name"].Value.Trim();
                var sn = m.Groups["sn"].Value.Trim();
                if (!string.IsNullOrEmpty(sn))
                {
                    list.Add(new Part
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

            // Excel serial date
            if (double.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var serial))
            {
                try
                {
                    var days = (int)serial;
                    if (days > 60) days--; // Excel leap year bug
                    return ExcelEpoch.AddDays(days);
                }
                catch { /* ignore */ }
            }

            // Standard formats
            if (DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
                return dt;

            var formats = new[] { "yyyy-MM-dd", "MM/dd/yyyy", "dd/MM/yyyy", "yyyy/MM/dd" };
            return DateTime.TryParseExact(s, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out dt) ? dt : null;
        }
    }
}