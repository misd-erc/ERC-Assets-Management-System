using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace PortalDB.Models.QueryParams.SE
{
    public class EditSEQueryParams
    {
        [Required] public long Id { get; set; }
        [Required] public string PropertyNumber { get; set; } = string.Empty;
        [Required] public long CategoryId { get; set; }
        [Required] public long LegendId { get; set; }
        [Required] public string Description { get; set; } = string.Empty;
        [Required] public string Brand { get; set; } = string.Empty;
        [Required] public string Model { get; set; } = string.Empty;
        [Required] public string SerialNumber { get; set; } = string.Empty;
        [Required] public string UnitOfMeasurement { get; set; } = string.Empty;
        [Required] public long UnitValue { get; set; }
        [Required] public DateTime DateAcquired { get; set; }
        [Required] public bool IsActive { get; set; }
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
