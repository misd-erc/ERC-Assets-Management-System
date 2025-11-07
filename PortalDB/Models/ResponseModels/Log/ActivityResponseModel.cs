using PortalDB.Models.ResponseModels.Log.AuditTrail;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace PortalDB.Models.ResponseModels.Log
{
    public class ActivityResponseModel
    {
        public long ActivityId { get; set; }
        public string? Action { get; set; } = String.Empty;
        public long? AuditTrailId{ get; set; }
        public long? ActionBySystemUserId { get; set; }
        public string? ActionBy { get; set; } = String.Empty;
        public DateTime? CreatedAt { get; set; }
        public AuditTrailResponseModel? AuditTrail { get; set; }
    }
}
