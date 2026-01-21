using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.ASSET.Supply;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services.GetEditTools.ASSET.PTA;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalTools.Services.GetEditTools.ASSET.Supply
{
    public class SupplyEditTools
    {

        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;

        public SupplyEditTools(DbContextOptions<PortalDbContext> options, IPortalGetTools getTools)
        {
            _options = options;
            _getTools = getTools;
        }

        public async Task<long> EditTblSupplyVendorAsync(TblSupplyVendor model, long actionBySystemUserId, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblSupplyVendor? existingSupplyVendor = null;

                if (isInsert)
                {
                    await context.TblSupplyVendors.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingSupplyVendor = await _getTools.Supply.GetTblSupplyVendorAsync(model.Id, context);

                    if (existingSupplyVendor == null)
                        return 0;

                    model.Id = existingSupplyVendor.Id;

                    await context.TblSupplyVendors.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.NameEncrypted, model.NameEncrypted));
                }

                return isInsert ? model.Id : existingSupplyVendor.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyEditTools));
                throw;
            }
        }
        public async Task<bool> DeleteTblSupplyVendorAsync(long id, long actionBySystemUserId, PortalDbContext context)
        {
            if (id == 0)
                return false;

            try
            {
                TblSupplyVendor? supplyVendorModel = await _getTools.Supply.GetTblSupplyVendorAsync(id, context);
                await context.TblSupplyVendors.Where(x => x.Id == id).ExecuteSoftDeleteAsync(context);
                await AuditTrailTool.LogActivityAsync(_options, $"Deleted a Supply Vendor", actionBy: actionBySystemUserId,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, supplyVendorModel, null, nameof(TblSupplyVendor), actionBySystemUserId, "Delete"));

                return true;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(SupplyEditTools));
                throw;
            }
        }

    }
}
