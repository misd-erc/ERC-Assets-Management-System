using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.ASSET.PPE;
using PortalDB.Entities.DBO.Storage;
using PortalDB.Services;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalTools.Services.GetEditTools.ASSET.PPE
{
    public class PPEGetTools
    {
        public IQueryable<TblPPE> GetTblPPEs(PortalDbContext context) => context.TblPPEs.Where(x => !x.IsDeleted);
        public async Task<TblPPE?> GetTblPPEAsync(long? id, PortalDbContext context) => await context.TblPPEs.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblPPEMovement?> GetTblPPEMovementAsync(long? id, PortalDbContext context) => await context.TblPPEMovements.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblPPEPart?> GetTblPPEPartAsync(long? id, PortalDbContext context) => await context.TblPPEParts.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public IQueryable<TblPPECategory> GetTblPPECategories(PortalDbContext context) => context.TblPPECategories.Where(x => !x.IsDeleted);
        public async Task<TblPPECategory?> GetTblPPECategoryAsync(long? id, PortalDbContext context) => await context.TblPPECategories.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblPPECategory?> GetTblPPECategoryByNameAsync(string? categoryName, PortalDbContext context) => await context.TblPPECategories.Where(x => !x.IsDeleted && x.Name == categoryName).FirstOrDefaultAsync();
        public IQueryable<TblPPELegend> GetTblPPELegends(PortalDbContext context) => context.TblPPELegends.Where(x => !x.IsDeleted);
        public async Task<TblPPELegend?> GetTblPPELegendAsync(long? id, PortalDbContext context) => await context.TblPPELegends.Where(x => !x.IsDeleted && x.Id == id).FirstOrDefaultAsync();
        public async Task<TblPPELegend?> GetTblPPELegendByNameAsync(string? categoryName, PortalDbContext context) => await context.TblPPELegends.Where(x => !x.IsDeleted && x.Name == categoryName).FirstOrDefaultAsync();
    }
}
