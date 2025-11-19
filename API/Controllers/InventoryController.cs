using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalCommon.Constants;
using PortalDB.Models.Responses;
using PortalDB.Models.ViewModels.PPE;
using PortalDB.Services;
using PortalTools.Services;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InventoryController : ControllerBase
    {
        private readonly ParserTools _parserTools;
        private readonly DbContextOptions<PortalDbContext> _options;

        public InventoryController(ParserTools parserTools, DbContextOptions<PortalDbContext> options)
        {
            _parserTools = parserTools;
            _options = options;
        }

        /// <summary>
        /// Upload PPE batch file (CSV or Excel .xlsx)
        /// </summary>
        [HttpPost("ppe/batch-upload")]
        public async Task<IActionResult> PPEBatchUpload(IFormFile file)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var fileName = file.FileName.ToLowerInvariant();
            if (!fileName.EndsWith(".csv") && !fileName.EndsWith(".xlsx"))
                return BadRequest("Only CSV and Excel (.xlsx) files are allowed.");

            try
            {
                //_logger.LogInformation("Starting PPE batch upload: {FileName} ({Size} bytes)", file.FileName, file.Length);

                // This single call handles BOTH CSV and XLSX perfectly
                var items = _parserTools.ParsePpeFile(file);

                if (!items.Any())
                {
                    //_logger.LogInformation("File parsed successfully but contained no data.");
                    return Ok(new List<PPEExcelViewModel>());
                }

                //_logger.LogInformation("Successfully parsed {Count} PPE item(s)", items.Count);

                return Ok(items);
            }
            catch (Exception ex)
            {

                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(OfficeController));
                return StatusCode(ApiStatusCode.BadRequest, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request. Please check the template format."));

            }
        }
    }
}