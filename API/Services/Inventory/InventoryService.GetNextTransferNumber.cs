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
public async Task<IActionResult> GetNextTransferNumber([FromQuery] string transferType = "PTR", [FromQuery] SoloQueryParams model = null)
        {
            await using var context = new PortalDbContext(_options);

            try
            {
                // Validate transfer type
                if (string.IsNullOrWhiteSpace(transferType) || (!transferType.Equals("PTR", StringComparison.OrdinalIgnoreCase) && !transferType.Equals("ITR", StringComparison.OrdinalIgnoreCase)))
                {
                    return StatusCode(ApiStatusCode.BadRequest, ApiResponse<object>.Fail(ErrorCodes.VALIDATION_FAILED, "Transfer type must be either 'PTR' or 'ITR'"));
                }

                // Get current date
                var now = DateTime.UtcNow;
                var year = now.Year;
                var month = now.Month.ToString("D2");
                var yearMonth = $"{year}-{month}";

                // Get all movements for the current month and type
                var movements = await _getTools.PTA.GetTblPTAMovements(context).ToListAsync();

                // Filter for current month and transfer type
                var currentMonthMovements = movements
                    .Where(x => !string.IsNullOrEmpty(x.PTRITRNumber) && 
                                x.PTRITRNumber.ToUpper().StartsWith(transferType.ToUpper()) &&
                                x.PTRITRNumber.Contains(yearMonth))
                    .ToList();

                // Extract sequence numbers from the PTR/ITR numbers (format: PTR-yyyy-mm-001)
                var sequenceNumbers = currentMonthMovements
                    .Select(x =>
                    {
                        var parts = x.PTRITRNumber.Split('-');
                        if (parts.Length >= 4 && int.TryParse(parts[3], out var sequence))
                        {
                            return sequence;
                        }
                        return 0;
                    })
                    .Where(x => x > 0)
                    .ToList();

                // Get the maximum sequence number, default to 0 if none found
                var maxSequence = sequenceNumbers.Any() ? sequenceNumbers.Max() : 0;
                var nextSequence = maxSequence + 1;

                // Format the new transfer number
                var nextNumber = $"{transferType.ToUpper()}-{yearMonth}-{nextSequence:D3}";

                Console.WriteLine($"[NEXT_NUMBER] Type: {transferType}, Year-Month: {yearMonth}, Max Sequence: {maxSequence}, Next: {nextNumber}");

                return Ok(ApiResponse<object>.Ok(new { transferNumber = nextNumber, sequence = nextSequence }, "Next transfer number generated successfully"));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error generating next transfer number: {ex.Message}");
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while generating the transfer number."));
            }
        }
    }
}
