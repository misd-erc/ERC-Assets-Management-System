using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Models.ParserModels.PTA;
using PortalDB.Models.QueryParams.Office;
using PortalDB.Models.QueryParams.Pagination;
using PortalDB.Models.QueryParams.PTA;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.ResponseModels.Account;
using PortalDB.Models.ResponseModels.Office;
using PortalDB.Models.ResponseModels.PPE;
using PortalDB.Models.ResponseModels.PTA;
using PortalDB.Models.Responses;
using PortalDB.Models.ViewModels.PTA;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;
using PortalTools.Services.GetEditTools.ASSET.PTA;
using PortalTools.Services.GetEditTools.DBO.Account;
using PortalTools.Services.GetEditTools.DBO.Office;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics;
using System.Globalization;
using System.Linq.Expressions;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace API.Services.Inventory
{
    public partial class InventoryService
    {
public async Task<IActionResult> GetNextParIcsNumber([FromQuery] string parType = "PAR", [FromQuery] SoloQueryParams model = null)
        {
            await using var context = new PortalDbContext(_options);

            try
            {
                // Validate PAR/ICS type
                if (string.IsNullOrWhiteSpace(parType) || (!parType.Equals("PAR", StringComparison.OrdinalIgnoreCase) && !parType.Equals("ICS", StringComparison.OrdinalIgnoreCase)))
                {
                    return StatusCode(ApiStatusCode.BadRequest, ApiResponse<object>.Fail(ErrorCodes.VALIDATION_FAILED, "PAR type must be either 'PAR' or 'ICS'"));
                }

                var now = DateTime.UtcNow;
                var year = now.Year;
                var month = now.Month.ToString("D2");
                var yearMonth = $"{year}-{month}";

                // Get all movements for the current month and PAR/ICS type
                var movements = await _getTools.PTA.GetTblPTAMovements(context).ToListAsync();

                var currentMonthMovements = movements
                    .Where(x => !string.IsNullOrEmpty(x.PARICSNumber) &&
                                x.PARICSNumber.ToUpper().StartsWith(parType.ToUpper()) &&
                                x.PARICSNumber.Contains(yearMonth))
                    .ToList();

                // Extract sequence numbers from the PAR/ICS numbers (format: PAR-yyyy-mm-001 / ICS-yyyy-mm-001)
                var sequenceNumbers = currentMonthMovements
                    .Select(x =>
                    {
                        var parts = x.PARICSNumber.Split('-');
                        if (parts.Length >= 4 && int.TryParse(parts[3], out var sequence))
                        {
                            return sequence;
                        }
                        return 0;
                    })
                    .Where(x => x > 0)
                    .ToList();

                var maxSequence = sequenceNumbers.Any() ? sequenceNumbers.Max() : 0;
                var nextSequence = maxSequence + 1;

                var nextNumber = $"{parType.ToUpper()}-{yearMonth}-{nextSequence:D3}";

                Console.WriteLine($"[NEXT_PAR_NUMBER] Type: {parType}, Year-Month: {yearMonth}, Max Sequence: {maxSequence}, Next: {nextNumber}");

                return Ok(ApiResponse<object>.Ok(new { parNumber = nextNumber, sequence = nextSequence }, "Next PAR/ICS number generated successfully"));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error generating next PAR/ICS number: {ex.Message}");
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while generating the PAR/ICS number."));
            }
        }
    }
}
