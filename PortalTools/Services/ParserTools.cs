using CsvHelper;
using CsvHelper.Configuration;
using PortalDB.Models.ParserModels.PPE;
using System;
using System.Collections.Generic;
using System.Formats.Asn1;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace PortalTools.Services
{
    /// <summary>
    /// Production-grade PPE Excel CSV parser with ISO date conversion, multi-year & multi-row support.
    /// </summary>
    internal static class ParserTools
    {
        private static readonly DateTime ExcelEpoch = new DateTime(1899, 12, 30);
        private static readonly Regex PartRegex = new(
            @"(?:^|\n)\s*(?:(?<name>[^\n:]+):)?\s*SN[#:]?\s*(?<sn>[A-Z0-9]+)",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        /// <summary>
        /// Parses PPE template CSV content into strongly-typed list of items with ISO dates.
        /// </summary>
        /// <param name="csvContent">Raw CSV string from Excel export</param>
        /// <returns>List of PpeItem</returns>
        public static List<PPEItem> ParsePpeCsv(string csvContent)
        {
            if (string.IsNullOrWhiteSpace(csvContent))
                throw new ArgumentException("CSV content cannot be null or empty.", nameof(csvContent));

            using var reader = new StringReader(csvContent);
            using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = false,
                TrimOptions = TrimOptions.Trim,
                MissingFieldFound = null,
                BadDataFound = null
            });

            var rows = csv.GetRecords<string[]>().ToList();
            if (rows.Count < 3)
                throw new InvalidDataException("CSV must have at least 3 rows: year row, header row, data row(s).");

            var yearRow = rows[0];
            var headerRow = rows[1].Select(h => h.Trim()).ToArray();
            var dataRows = rows.Skip(2).ToList();

            var yearBlocks = FindYearBlocks(yearRow);
            if (!yearBlocks.Any())
                throw new InvalidDataException("No valid year blocks found in first row.");

            var result = new List<PPEItem>();

            foreach (var dataRow in dataRows)
            {
                var item = new PPEItem();

                // === Static fields (first 10 columns) ===
                var staticMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                int maxStaticCols = Math.Min(10, Math.Min(headerRow.Length, dataRow.Length));
                for (int i = 0; i < maxStaticCols; i++)
                {
                    staticMap[headerRow[i]] = dataRow[i].Trim();
                }

                item.PropertyNumber = GetValue(staticMap, "property_number");
                item.Legend = GetValue(staticMap, "legend");
                item.Description = GetValue(staticMap, "description");
                item.Brand = GetValue(staticMap, "brand");
                item.Model = GetValue(staticMap, "model");
                item.SerialNumber = GetValue(staticMap, "serial_number");
                item.UnitOfMeasurement = GetValue(staticMap, "unit_of_measurement");
                item.UnitValue = int.TryParse(GetValue(staticMap, "unit_value"), out var uv) ? uv : 0;

                // Date Acquired
                item.DateAcquired = TryConvertExcelDate(GetValue(staticMap, "date_acquired"));

                // Parts
                item.Parts = ParseParts(GetValue(staticMap, "parts"));

                // Annual Counts
                foreach (var (year, startCol) in yearBlocks)
                {
                    if (startCol + 3 >= dataRow.Length) continue;

                    var dateCell = dataRow[startCol].Trim();
                    if (string.IsNullOrEmpty(dateCell)) continue;

                    var annual = new AnnualCount
                    {
                        Year = year,
                        Date = TryConvertExcelDate(dateCell),
                        ParItrNumber = startCol + 1 < dataRow.Length ? dataRow[startCol + 1].Trim() : "",
                        EmployeeId = startCol + 2 < dataRow.Length ? dataRow[startCol + 2].Trim() : "",
                        Condition = startCol + 3 < dataRow.Length ? dataRow[startCol + 3].Trim() : ""
                    };

                    item.AnnualCount.Add(annual);
                }

                result.Add(item);
            }

            return result;
        }

        private static string GetValue(Dictionary<string, string> map, string key)
            => map.TryGetValue(key, out var value) ? value : string.Empty;

        private static List<Part> ParseParts(string partsStr)
        {
            var parts = new List<Part>();
            if (string.IsNullOrWhiteSpace(partsStr)) return parts;

            foreach (Match m in PartRegex.Matches(partsStr))
            {
                var name = m.Groups["name"].Value.Trim();
                var sn = m.Groups["sn"].Value.Trim();
                parts.Add(new Part
                {
                    PartName = string.IsNullOrEmpty(name) ? "unknown" : name.ToLowerInvariant(),
                    PartSerialNumber = sn
                });
            }
            return parts;
        }

        private static List<(int Year, int StartCol)> FindYearBlocks(string[] yearRow)
        {
            var blocks = new List<(int, int)>();
            for (int i = 0; i < yearRow.Length; i++)
            {
                var cell = yearRow[i].Trim();
                if (cell.Length == 4 && int.TryParse(cell, out var year))
                {
                    blocks.Add((year, i));
                    i += 4; // Skip: date, par, emp, cond
                }
            }
            return blocks;
        }

        private static string TryConvertExcelDate(string input)
        {
            if (double.TryParse(input, NumberStyles.Any, CultureInfo.InvariantCulture, out var serial))
            {
                try
                {
                    int days = (int)serial;
                    return ExcelEpoch.AddDays(days).ToString("yyyy-MM-dd");
                }
                catch { /* ignore */ }
            }
            return input; // fallback
        }
    }
}
