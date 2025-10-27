using Microsoft.EntityFrameworkCore;
using PortalCommon.Utilities;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Services;
using PortalTools.Services.DBO.Account;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalTools.Services.DBO.Office
{
    public class OfficeEditTools
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly AccountGetTools _accountGetTools;
        private readonly OfficeGetTools _officeGetTools;
        public OfficeEditTools(DbContextOptions<PortalDbContext> options, AccountGetTools accountGetTools, OfficeGetTools officeGetTools)
        {
            _options = options;
            _accountGetTools = accountGetTools;
            _officeGetTools = officeGetTools;
        }

        public async Task<long> EditTblOfficeAsync(TblOffice model, PortalDbContext context)
        {
            if (model == null)
                return 0;

            try
            {

                bool isInsert = model.Id == 0;
                TblOffice? existingOffice = null;

                if (isInsert)
                {
                    await context.TblOffices.AddAsync(model);
                    await context.SaveChangesAsync();
                }
                else
                {
                    existingOffice = await _officeGetTools.GetTblOffice(model.Id);

                    if (existingOffice == null)
                        return 0;

                    model.Id = existingOffice.Id;

                    await context.TblOffices.Where(u => u.Id == model.Id)
                        .ExecuteUpdateAsync(u => u
                            .SetProperty(x => x.Name, model.Name)
                            .SetProperty(x => x.Acronym, model.Acronym)
                            .SetProperty(x => x.IsActive, model.IsActive));

                }

                await AuditTrailTool.LogActivityAsync(_options, $"{(isInsert ? "Added" : "Updated")} an office", actionBy: model.Id,
                    linkedAuditTrailId: AuditTrailTool.TrackChanges(context, isInsert ? null! : existingOffice!, model, nameof(TblOffice), model.Id, isInsert ? "Insert" : "Update"));
                

                return isInsert ? model.Id : existingOffice.Id;
            }
            catch (DbUpdateException ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeEditTools));
                throw;
            }
        }

    }
}
