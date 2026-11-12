using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Models.ResponseModels.Account;
using PortalDB.Services;

namespace API.Services.Inventory
{
    public partial class InventoryService
    {
        // Fetch only referenced people, including archived employees needed for reprints.
        // Batch lookup tables instead of issuing four queries per employee/item.
        private static async Task<Dictionary<long, EmployeeResponseModel>> LoadTransferReportEmployees(
            PortalDbContext context, IEnumerable<TblPTAMovement> movements)
        {
            var ids = movements.SelectMany(m => new[] { m.PlantillaEmployeeId, m.NonPlantillaEmployeeId })
                .Where(id => id > 0).Select(id => id!.Value).Distinct().ToList();
            var employees = await context.TblEmployees.AsNoTracking().Where(e => ids.Contains(e.Id)).ToListAsync();
            var positionIds = employees.Select(e => e.PositionId).ToList();
            var officeIds = employees.Select(e => e.OfficeId).ToList();
            var divisionIds = employees.Select(e => e.DivisionId).ToList();
            var typeIds = employees.Select(e => e.EmploymentTypeId).ToList();
            var positions = await context.TblPositions.AsNoTracking().Where(p => positionIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id);
            var offices = await context.TblOffices.AsNoTracking().Where(p => officeIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id);
            var divisions = await context.TblDivisions.AsNoTracking().Where(p => divisionIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id);
            var types = await context.TblEmploymentTypes.AsNoTracking().Where(p => typeIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id);
            return employees.ToDictionary(e => e.Id, e => new EmployeeResponseModel
            {
                Id = e.Id, FirstName = e.FirstName, MiddleName = e.MiddleName, LastName = e.LastName,
                SuffixName = e.SuffixName, EmployeeIdOriginal = e.EmployeeIdOriginal,
                Position = positions.GetValueOrDefault(e.PositionId ?? 0),
                Office = offices.GetValueOrDefault(e.OfficeId ?? 0),
                Division = divisions.GetValueOrDefault(e.DivisionId ?? 0),
                EmploymentType = types.GetValueOrDefault(e.EmploymentTypeId ?? 0),
                IsActive = e.IsActive, CreatedAt = e.CreatedAt
            });
        }
    }
}
