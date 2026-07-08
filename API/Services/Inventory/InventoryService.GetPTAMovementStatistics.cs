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

                // PTR/ITR numbers carry NO type prefix (format is yyyy-mm-NNN, see
                // GetNextTransferNumber) — the only reliable way to tell a PTR (PPE transfer)
                // apart from an ITR (SE transfer) is via the linked PTA's Group.
                var invalidPtrItrValues = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
                {
                    "N/A", "NA", "New", "Renewed", "None", "-"
                };

                var validTransferMovements = allMovements
                    .Where(x => !string.IsNullOrWhiteSpace(x.PTRITRNumber) && !invalidPtrItrValues.Contains(x.PTRITRNumber.Trim()))
                    .ToList();

                var transferPtaIds = validTransferMovements
                    .Where(x => x.PTAId.HasValue)
                    .Select(x => x.PTAId!.Value)
                    .Distinct()
                    .ToList();

                var ptaGroupMap = await context.TblPTAs
                    .AsNoTracking()
                    .Where(p => transferPtaIds.Contains(p.Id))
                    .ToDictionaryAsync(p => p.Id, p => p.Group ?? string.Empty);

                // Count unique Active PTR (linked PTA's Group is PPE)
                var activePTR = validTransferMovements
                    .Where(x => x.PTAId.HasValue && ptaGroupMap.TryGetValue(x.PTAId.Value, out var grp) && grp == TblPTA.PPE)
                    .Select(x => x.PTRITRNumber!.Trim().ToUpperInvariant())
                    .Distinct()
                    .Count();

                // Count unique Active ITR (linked PTA's Group is SE)
                var activeITR = validTransferMovements
                    .Where(x => x.PTAId.HasValue && ptaGroupMap.TryGetValue(x.PTAId.Value, out var grp) && grp == TblPTA.SE)
                    .Select(x => x.PTRITRNumber!.Trim().ToUpperInvariant())
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
