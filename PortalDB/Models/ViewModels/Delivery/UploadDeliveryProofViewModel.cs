using PortalDB.Models.QueryParams.Uploader;

namespace PortalDB.Models.ViewModels.Delivery
{
    public class UploadDeliveryProofViewModel : FileUploaderQueryParams
    {
        public long DeliveryRecordId { get; set; }
    }
}