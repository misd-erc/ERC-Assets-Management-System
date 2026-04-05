using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace PortalDB.Models.QueryParams.Supply
{
    public class EditSupplyVendorQueryParams
    {
        [Required]
        public long Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? Email { get; set; }
        public string? Contact { get; set; }
        public string? ContactPerson { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;


        [Required]
        public long ActionBySystemUserId { get; set; }

        [Required]
        public string SessionKey { get; set; } = string.Empty;
    }
}