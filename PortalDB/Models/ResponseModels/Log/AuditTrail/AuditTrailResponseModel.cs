using PortalDB.Models.ViewModels.AuditTrail;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace PortalDB.Models.ResponseModels.Log.AuditTrail
{
    public class AuditTrailResponseModel
    {
        public string? Table { get; set; }
        public long? RecordId { get; set; }
        public string? Action { get; set; }
        public JsonElement Changes { get; set; }  // raw JSON, can inspect dynamically
        public long? ActionBySystemUserId { get; set; }
        public string? ActionBy { get; set; }
        public DateTime Date { get; set; }
    }
}
