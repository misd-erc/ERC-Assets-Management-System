using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchController : ControllerBase
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;

        public SearchController(
            DbContextOptions<PortalDbContext> options,
            IPortalGetTools getTools)
        {
            _options = options;
            _getTools = getTools;
        }

        public class GlobalSearchResultItem
        {
            public string Id { get; set; } = string.Empty;
            public string Title { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public string Category { get; set; } = string.Empty;
            public string Module { get; set; } = string.Empty;
        }

        // GET api/search?q=...
        [HttpGet]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GlobalSearch([FromQuery] SoloQueryParams model, [FromQuery] string q = "")
        {
            if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
                return Ok(ApiResponse<List<GlobalSearchResultItem>>.Ok(new List<GlobalSearchResultItem>(), "Query too short"));

            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                var results = new List<GlobalSearchResultItem>();
                string search = q.Trim().ToLowerInvariant();

                // ── PPE / SE Assets ──
                var ptas = await _getTools.PTA.GetTblPTAs(context)
                    .Where(x => x.IsActive && !x.IsDeleted)
                    .ToListAsync();

                var matchedPTAs = ptas.Where(x =>
                    (x.PropertyNumber ?? "").ToLowerInvariant().Contains(search) ||
                    (x.Description ?? "").ToLowerInvariant().Contains(search) ||
                    (x.Brand ?? "").ToLowerInvariant().Contains(search) ||
                    (x.Model ?? "").ToLowerInvariant().Contains(search) ||
                    (x.SerialNumber ?? "").ToLowerInvariant().Contains(search))
                    .Take(10)
                    .ToList();

                foreach (var pta in matchedPTAs)
                {
                    var label = string.IsNullOrEmpty(pta.Description) ? pta.PropertyNumber : pta.Description;
                    var sub = new List<string>();
                    if (!string.IsNullOrEmpty(pta.PropertyNumber)) sub.Add(pta.PropertyNumber!);
                    if (!string.IsNullOrEmpty(pta.Brand)) sub.Add(pta.Brand!);
                    if (!string.IsNullOrEmpty(pta.Model)) sub.Add(pta.Model!);

                    results.Add(new GlobalSearchResultItem
                    {
                        Id = $"pta-{pta.Id}",
                        Title = label ?? $"Asset #{pta.Id}",
                        Description = sub.Count > 0 ? string.Join(" · ", sub) : (pta.Group ?? "Asset"),
                        Category = pta.Group == "PPE" ? "PPE Assets" : "Semi-Expendable",
                        Module = "ppe-se"
                    });
                }

                // ── Supply Items ──
                var supplyItems = await _getTools.Supply.GetTblSupplyItems(context)!
                    .Where(x => x.IsActive && !x.IsDeleted)
                    .ToListAsync();

                var matchedSupply = supplyItems.Where(x =>
                    (x.Code ?? "").ToLowerInvariant().Contains(search) ||
                    (x.Description ?? "").ToLowerInvariant().Contains(search))
                    .GroupBy(x => new { x.Code, x.Description })
                    .Take(10)
                    .ToList();

                foreach (var grp in matchedSupply)
                {
                    var first = grp.First();
                    results.Add(new GlobalSearchResultItem
                    {
                        Id = $"supply-{first.Id}",
                        Title = first.Description ?? first.Code ?? $"Supply #{first.Id}",
                        Description = $"Code: {first.Code ?? "N/A"} · Qty: {grp.Sum(x => x.Quantity ?? 0)}",
                        Category = "Supply Items",
                        Module = "supply-management"
                    });
                }

                // ── Employees ──
                var employees = await _getTools.Account.GetEmployees(context)
                    .ToListAsync();

                var matchedEmployees = employees.Where(x =>
                    x != null && (
                    (x.FirstName ?? "").ToLowerInvariant().Contains(search) ||
                    (x.LastName ?? "").ToLowerInvariant().Contains(search) ||
                    (x.MiddleName ?? "").ToLowerInvariant().Contains(search) ||
                    (x.EmployeeIdOriginal ?? "").ToLowerInvariant().Contains(search)))
                    .Take(10)
                    .ToList();

                foreach (var emp in matchedEmployees)
                {
                    var fullName = $"{emp!.FirstName} {emp.LastName}".Trim();
                    results.Add(new GlobalSearchResultItem
                    {
                        Id = $"emp-{emp.Id}",
                        Title = fullName,
                        Description = emp.EmployeeIdOriginal ?? "Employee",
                        Category = "Employees",
                        Module = "office-management"
                    });
                }

                await transaction.CommitAsync();
                return Ok(ApiResponse<List<GlobalSearchResultItem>>.Ok(results, $"{results.Count} result(s) found"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SearchController));
                return StatusCode(
                    ApiStatusCode.InternalServerError,
                    ApiResponse<object>.Fail(
                        ErrorCodes.SERVER_ERROR,
                        "An error occurred while processing your request."
                    )
                );
            }
        }
    }
}
