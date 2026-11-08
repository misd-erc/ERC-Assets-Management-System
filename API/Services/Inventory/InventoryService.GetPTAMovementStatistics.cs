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
                // Load every non-deleted movement. The dashboard cards need the
                // same historical scope as the report/list screens; filtering to
                // IsCurrent here made old but valid PTR/ITR records disappear
                // from the totals (for example, 15 instead of 56 PTRs).
                var allMovements = await _getTools.PTA.GetTblPTAMovements(context)
                    .Where(x => !x.IsDeleted)
                    .ToListAsync();

                var currentMovements = allMovements
                    .Where(x => x.IsCurrent == true)
                    .ToList();

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
                    .Where(p => transferPtaIds.Contains(p.Id) && !p.IsDeleted)
                    .ToDictionaryAsync(p => p.Id, p => p.Group ?? string.Empty);

                int CountTransfers(IEnumerable<PortalDB.Entities.ASSET.PTA.TblPTAMovement> movements, string group)
                {
                    return movements
                        .Where(x => x.PTAId.HasValue
                            && ptaGroupMap.TryGetValue(x.PTAId.Value, out var ptaGroup)
                            && string.Equals(ptaGroup, group, StringComparison.OrdinalIgnoreCase))
                        .Select(x => x.PTRITRNumber!.Trim().ToUpperInvariant())
                        .Distinct()
                        .Count();
                }

                // Historical totals: one count per unique PTR/ITR number.
                var totalPTR = CountTransfers(validTransferMovements, TblPTA.PPE);
                var totalITR = CountTransfers(validTransferMovements, TblPTA.SE);

                // Current counts are retained for the UI's secondary context.
                var currentValidTransferMovements = currentMovements
                    .Where(x => !string.IsNullOrWhiteSpace(x.PTRITRNumber)
                        && !invalidPtrItrValues.Contains(x.PTRITRNumber.Trim()))
                    .ToList();
                var activePTR = CountTransfers(currentValidTransferMovements, TblPTA.PPE);
                var activeITR = CountTransfers(currentValidTransferMovements, TblPTA.SE);

                int CountReturns(IEnumerable<PortalDB.Entities.ASSET.PTA.TblPTAMovement> movements, string prefix)
                {
                    return movements
                        .Where(x => !string.IsNullOrWhiteSpace(x.RRPPERRSPNumber)
                            && x.RRPPERRSPNumber.Trim().StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                        .Select(x => x.RRPPERRSPNumber!.Trim().ToUpperInvariant())
                        .Distinct()
                        .Count();
                }

                var totalReturnsPPE = CountReturns(allMovements, "RRPPE");
                var totalReturnsSE = CountReturns(allMovements, "RRSP");
                var activeReturnsPPE = CountReturns(currentMovements, "RRPPE");
                var activeReturnsSE = CountReturns(currentMovements, "RRSP");

                var statistics = new
                {
                    totalPTR = totalPTR,
                    totalITR = totalITR,
                    totalReturnsPPE = totalReturnsPPE,
                    totalReturnsSE = totalReturnsSE,
                    totalRecords = totalPTR + totalITR + totalReturnsPPE + totalReturnsSE,
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
