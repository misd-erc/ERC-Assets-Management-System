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
public async Task<IActionResult> GetPTAMovementStatistics([FromQuery] SoloQueryParams model)
        {
            await using var context = new PortalDbContext(_options);

            try
            {
                // Get all current movements
                var allMovements = await _getTools.PTA.GetTblPTAMovements(context)
                    .Where(x => x.IsCurrent == true && !x.IsDeleted)
                    .ToListAsync();

                // Count unique Active PTR (PTRITRNumber starts with "PTR")
                var activePTR = allMovements
                    .Where(x => !string.IsNullOrEmpty(x.PTRITRNumber) && x.PTRITRNumber.ToUpper().StartsWith("PTR"))
                    .Select(x => x.PTRITRNumber.ToUpper())
                    .Distinct()
                    .Count();

                // Count unique Active ITR (PTRITRNumber starts with "ITR")
                var activeITR = allMovements
                    .Where(x => !string.IsNullOrEmpty(x.PTRITRNumber) && x.PTRITRNumber.ToUpper().StartsWith("ITR"))
                    .Select(x => x.PTRITRNumber.ToUpper())
                    .Distinct()
                    .Count();

                // Count unique Active Returns PPE (RRPPERRSPNumber starts with "RRPPE")
                var activeReturnsPPE = allMovements
                    .Where(x => !string.IsNullOrEmpty(x.RRPPERRSPNumber) && x.RRPPERRSPNumber.ToUpper().StartsWith("RRPPE"))
                    .Select(x => x.RRPPERRSPNumber.ToUpper())
                    .Distinct()
                    .Count();

                // Count unique Active Returns SE (RRPPERRSPNumber starts with "RRSP")
                var activeReturnsSE = allMovements
                    .Where(x => !string.IsNullOrEmpty(x.RRPPERRSPNumber) && x.RRPPERRSPNumber.ToUpper().StartsWith("RRSP"))
                    .Select(x => x.RRPPERRSPNumber.ToUpper())
                    .Distinct()
                    .Count();

                var statistics = new
                {
                    activePTR = activePTR,
                    activeITR = activeITR,
                    activeReturnsPPE = activeReturnsPPE,
                    activeReturnsSE = activeReturnsSE,
                    totalActive = activePTR + activeITR + activeReturnsPPE + activeReturnsSE
                };

                return Ok(ApiResponse<object>.Ok(statistics, "Movement statistics retrieved successfully"));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving movement statistics: {ex.Message}");
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(InventoryService));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while retrieving statistics."));
            }
        }
    }
}
