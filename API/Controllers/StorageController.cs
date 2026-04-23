using API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalAPI.Attributes;
using PortalCommon.Constants;
using PortalCommon.Utilities;
using PortalDB.Entities.DBO.Storage;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.QueryParams.Uploader;
using PortalDB.Models.ResponseModels.Uploader;
using PortalDB.Models.Responses;
using PortalDB.Models.ViewModels.Account;
using PortalDB.Models.ViewModels.Delivery;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;
using PortalTools.Services.GetEditTools.DBO.Account;
using PortalTools.Services.GetEditTools.DBO.Storage;

namespace API.Controllers
{
    [Route("api/[controller]")]
    /*[Authorize]*/
    [ApiController]
    public class StorageController : ControllerBase
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;
        private readonly IPortalEditTools _editTools;
        private readonly AuthTools _authTools;

        public StorageController(DbContextOptions<PortalDbContext> options,
            IPortalGetTools getTools,
            IPortalEditTools editTools,
            AuthTools authTools)
        {
            _options = options;
            _getTools = getTools;
            _editTools = editTools;
            _authTools = authTools;
        }

        #region POST

        [HttpPost("upload/user/profile-picture")]
        [RequestSizeLimit(1_000_000)] // optional, limit 1MB
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadSystemUserProfilePicture(IFormFile file, [FromForm] FileUploaderQueryParams model)
        {

            if (file == null || file.Length == 0)
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.UPLOAD_FAILED, "Upload failed. Please check your file"));

            try
            {
                await using var context = new PortalDbContext(_options);
                await using var transaction = await context.Database.BeginTransactionAsync();

                await using var stream = file.OpenReadStream();

                var fileId = await AzureTools.UploadFileAndSaveToDbAsync(
                    _options,
                    stream,
                    file.FileName,
                    file.ContentType,
                    model.ActionBySystemUserId,
                    TblFileStorage.USER_PROFILE_PICTURE
                );

                if (fileId == null)
                    throw new Exception("Upload failed");

                EditSystemUserProfilePictureViewModel profileVM = new()
                {
                    SystemUserId = model.ActionBySystemUserId,
                    FileStorageId = fileId.Value
                };

                await _editTools.Account.UpdateTblSystemUserProfilePictureAsync(profileVM, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                UploaderResponseModel uploaderRM = new()
                {
                    FileId = fileId
                };

                return Ok(ApiResponse<object>.Ok(uploaderRM, $"Profile picture has been uploaded"));

            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(StorageController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        [HttpPost("upload/delivery-record/proof")]
        [RequestSizeLimit(10_000_000)] // 10MB limit for documents/images
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadDeliveryRecordProof(IFormFile file, [FromForm] UploadDeliveryProofViewModel model)
        {
            if (file == null || file.Length == 0)
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.UPLOAD_FAILED, "Upload failed. Please check your file"));

            try
            {
                await using var context = new PortalDbContext(_options);
                await using var transaction = await context.Database.BeginTransactionAsync();

                await using var stream = file.OpenReadStream();

                var fileId = await AzureTools.UploadFileAndSaveToDbAsync(
                    _options,
                    stream,
                    file.FileName,
                    file.ContentType,
                    model.ActionBySystemUserId,
                    TblFileStorage.DELIVERY_RECORD_PROOF
                );

                if (fileId == null)
                    throw new Exception("Upload failed");

                // NOTE: You will need to create this EditTool method to update the TblDeliveryRecord 
                // with the returned fileId (e.g., saving it to a 'ProofFileStorageId' column).
                await _editTools.Delivery.UpdateDeliveryRecordProofAsync(model.DeliveryRecordId, fileId.Value, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                UploaderResponseModel uploaderRM = new()
                {
                    FileId = fileId
                };

                return Ok(ApiResponse<object>.Ok(uploaderRM, $"Delivery proof has been successfully uploaded."));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(StorageController));
                return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }
        }

        #endregion

        #region GET

        [HttpGet("retrieve/{fileStorageId}")]
        [ValidateSessionToken]
        [ValidateModelRequiredFields]
        [DecodeRouteParameter(nameof(fileStorageId))]
        public async Task<IActionResult> GetFileById([FromQuery] SoloQueryParams model, [FromRoute] long fileStorageId)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();

            try
            {

                // Retrieve record
                var fileRecord = await _getTools.Storage.GetTblFileStorageAsync(fileStorageId, context);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                if (fileRecord == null)
                    return NotFound(ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, "File not found."));

                // Get stream from Azure Blob Storage
                var stream = await AzureTools.GetFileStreamAsync(fileRecord.BlobName);

                if (stream == null)
                    return NotFound(ApiResponse<object>.Fail(ErrorCodes.NOT_FOUND, "File not found in storage."));

                // Return file stream
                return File(stream, fileRecord.ContentType ?? "application/octet-stream", fileRecord.OriginalFileName);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(StorageController));
               return StatusCode(ApiStatusCode.InternalServerError, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while retrieving the file."));
            }
        }

        #endregion
    }
}
