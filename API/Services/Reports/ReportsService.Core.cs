using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalDB.Services;

namespace API.Services.Reports
{
    public partial class ReportsService : ControllerBase, IReportsService
    {
        private readonly DbContextOptions<PortalDbContext> _options;

        public ReportsService(DbContextOptions<PortalDbContext> options)
        {
            _options = options;
        }
    }
}
