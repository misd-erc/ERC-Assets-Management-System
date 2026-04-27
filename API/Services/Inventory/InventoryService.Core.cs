using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;

namespace API.Services.Inventory
{
    public partial class InventoryService : ControllerBase, IInventoryService
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;
        private readonly IPortalEditTools _editTools;
        private readonly ParserTools _parserTools;

        public InventoryService(
            DbContextOptions<PortalDbContext> options,
            IPortalGetTools getTools,
            IPortalEditTools editTools,
            ParserTools parserTools)
        {
            _options = options;
            _getTools = getTools;
            _editTools = editTools;
            _parserTools = parserTools;
        }
    }
}
