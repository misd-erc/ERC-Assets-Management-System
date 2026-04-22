using API.Attributes;
using API.Services.Inventory;
using Microsoft.AspNetCore.Mvc;
using PortalAPI.Attributes;
using PortalDB.Models.QueryParams.PTA;
using PortalDB.Models.QueryParams.Pagination;
using PortalDB.Models.QueryParams.Universal;
using System.ComponentModel.DataAnnotations;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryService _inventoryService;

        public InventoryController(IInventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }


        [HttpGet("pta/category/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllPTACategories([FromQuery] PaginationGenericQueryParams model) => await _inventoryService.GetAllPTACategories(model);



        [HttpGet("pta/conditions/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllPTAConditions([FromQuery] PaginationGenericQueryParams model) => await _inventoryService.GetAllPTAConditions(model);



        [HttpGet("pta/legend/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllPTALegends([FromQuery] PaginationGenericQueryParams model) => await _inventoryService.GetAllPTALegends(model);



        [HttpGet("pta/se-ppe/all")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetAllPTAs([FromQuery] PTAPaginationQueryParams model) => await _inventoryService.GetAllPTAs(model);



        [HttpGet("pta/se-ppe/all/{ptaId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetPTA([FromQuery] SoloQueryParams model, [FromRoute] long ptaId) => await _inventoryService.GetPTA(model, ptaId);


        [HttpGet("pta/se-ppe/no-movement")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetPTAsWithNoMovement([FromQuery] PTAPaginationQueryParams model) => await _inventoryService.GetPTAsWithNoMovement(model);


        [HttpGet("pta/se-ppe/for-disposal")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetPTAsForDisposal([FromQuery] PTAPaginationQueryParams model) => await _inventoryService.GetPTAsForDisposal(model);


        [HttpPost("pta/batch-upload")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> PTABatchUpload([FromQuery] SoloQueryParams model, [Required] IFormFile file) => await _inventoryService.PTABatchUpload(model, file);



        [HttpPost("pta/se-ppe/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditPTA([FromBody] EditPTAQueryParams model) => await _inventoryService.EditPTA(model);



        [HttpPost("pta/part/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditPTAPart([FromBody] EditPTAPartQueryParams model) => await _inventoryService.EditPTAPart(model);




        [HttpPost("pta/movement/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditPTAMovement([FromBody] EditPTAMovementQueryParams model) => await _inventoryService.EditPTAMovement(model);


        [HttpGet("pta/movement/next-number")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetNextTransferNumber([FromQuery] string transferType = "PTR", [FromQuery] SoloQueryParams model = null) => await _inventoryService.GetNextTransferNumber(transferType, model);


        [HttpGet("pta/movement/next-return-number")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetNextReturnNumber([FromQuery] string returnType = "RRPPE", [FromQuery] SoloQueryParams model = null) => await _inventoryService.GetNextReturnNumber(returnType, model);


        [HttpGet("pta/movement/next-par-number")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetNextParIcsNumber([FromQuery] string parType = "PAR", [FromQuery] SoloQueryParams model = null) => await _inventoryService.GetNextParIcsNumber(parType, model);


        [HttpGet("pta/movement/statistics")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetPTAMovementStatistics([FromQuery] SoloQueryParams model) => await _inventoryService.GetPTAMovementStatistics(model);


        [HttpGet("pta/movement/list")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetPTAMovements([FromQuery] PTAMovementListQueryParams model) => await _inventoryService.GetPTAMovements(model);


        [HttpGet("pta/issuance/list")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetPTAIssuanceList([FromQuery] PTAIssuanceListQueryParams model) => await _inventoryService.GetPTAIssuanceList(model);


        [HttpGet("pta/movement/transfer-details")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> GetPTATransferDetails([FromQuery] string transferNumber, [FromQuery] SoloQueryParams model) => await _inventoryService.GetPTATransferDetails(transferNumber, model);




        [HttpPost("pta/category/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditPTACategory([FromBody] EditPTACategoryQueryParams model) => await _inventoryService.EditPTACategory(model);



        [HttpPost("pta/legend/edit")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> EditPTALegend([FromBody] EditPTACategoryQueryParams model) => await _inventoryService.EditPTALegend(model);


        [HttpDelete("pta/delete/{ptaId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeletePTA([FromQuery] SoloQueryParams model, [FromRoute] long ptaId) => await _inventoryService.DeletePTA(model, ptaId);



        [HttpDelete("pta/part/delete/{ptaPartId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeletePTAPart([FromQuery] SoloQueryParams model, [FromRoute] long ptaPartId) => await _inventoryService.DeletePTAPart(model, ptaPartId);



        [HttpDelete("pta/movement/delete/{ptaPartId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeletePTAMovement([FromQuery] SoloQueryParams model, [FromRoute] long ptaPartId) => await _inventoryService.DeletePTAMovement(model, ptaPartId);



        [HttpDelete("pta/category/delete/{ptaCategoryId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeletePTACategory([FromQuery] SoloQueryParams model, [FromRoute] long ptaCategoryId) => await _inventoryService.DeletePTACategory(model, ptaCategoryId);



        [HttpDelete("pta/legend/delete/{ptaLegendId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        public async Task<IActionResult> DeletePTALegend([FromQuery] SoloQueryParams model, [FromRoute] long ptaLegendId) => await _inventoryService.DeletePTALegend(model, ptaLegendId);

    }
}
