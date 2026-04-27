using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalDB.Services;
using PortalTools.Composition;

namespace API.Services.Dashboard
{
    public partial class DashboardService : ControllerBase, IDashboardService
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;

        public DashboardService(
            DbContextOptions<PortalDbContext> options,
            IPortalGetTools getTools)
        {
            _options = options;
            _getTools = getTools;
        }
    }
}