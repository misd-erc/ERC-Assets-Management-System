using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PortalDB.Models.QueryParams.PTA;
using PortalDB.Models.QueryParams.Pagination;
using PortalDB.Models.QueryParams.Universal;
using System.ComponentModel.DataAnnotations;

namespace API.Services.Inventory
{
    public interface IInventoryService
    {
        Task<IActionResult> GetAllPTACategories([FromQuery] PaginationGenericQueryParams model);

        Task<IActionResult> GetAllPTAConditions([FromQuery] PaginationGenericQueryParams model);

        Task<IActionResult> GetAllPTALegends([FromQuery] PaginationGenericQueryParams model);

        Task<IActionResult> GetAllPTAs([FromQuery] PTAPaginationQueryParams model);

        Task<IActionResult> GetPTA([FromQuery] SoloQueryParams model, [FromRoute] long ptaId);

        Task<IActionResult> GetPTAsWithNoMovement([FromQuery] PTAPaginationQueryParams model);

        Task<IActionResult> GetPTAsForDisposal([FromQuery] PTAPaginationQueryParams model);

        Task<IActionResult> PTABatchUpload([FromQuery] SoloQueryParams model, [Required] IFormFile file);

        Task<IActionResult> EditPTA([FromBody] EditPTAQueryParams model);

        Task<IActionResult> EditPTAPart([FromBody] EditPTAPartQueryParams model);

        Task<IActionResult> EditPTAMovement([FromBody] EditPTAMovementQueryParams model);

        Task<IActionResult> GetNextTransferNumber([FromQuery] string transferType = "PTR", [FromQuery] SoloQueryParams model = null);

        Task<IActionResult> GetNextReturnNumber([FromQuery] string returnType = "RRPPE", [FromQuery] SoloQueryParams model = null);

        Task<IActionResult> GetNextParIcsNumber([FromQuery] string parType = "PAR", [FromQuery] SoloQueryParams model = null);

        Task<IActionResult> GetPTAMovementStatistics([FromQuery] SoloQueryParams model);

        Task<IActionResult> GetPTAMovements([FromQuery] PTAMovementListQueryParams model);

        Task<IActionResult> GetPTAIssuanceList([FromQuery] PTAIssuanceListQueryParams model);

        Task<IActionResult> GetPTATransferDetails([FromQuery] string transferNumber, [FromQuery] SoloQueryParams model);

        Task<IActionResult> EditPTACategory([FromBody] EditPTACategoryQueryParams model);

        Task<IActionResult> EditPTALegend([FromBody] EditPTACategoryQueryParams model);

        Task<IActionResult> DeletePTA([FromQuery] SoloQueryParams model, [FromRoute] long ptaId);

        Task<IActionResult> DeletePTAPart([FromQuery] SoloQueryParams model, [FromRoute] long ptaPartId);

        Task<IActionResult> DeletePTAMovement([FromQuery] SoloQueryParams model, [FromRoute] long ptaPartId);

        Task<IActionResult> DeletePTACategory([FromQuery] SoloQueryParams model, [FromRoute] long ptaCategoryId);

        Task<IActionResult> DeletePTALegend([FromQuery] SoloQueryParams model, [FromRoute] long ptaLegendId);
    }
}
