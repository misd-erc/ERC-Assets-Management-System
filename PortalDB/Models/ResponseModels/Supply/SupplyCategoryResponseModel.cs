using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace PortalDB.Models.ResponseModels.Supply
{
    public class SupplyCategoryResponseModel
    {

        public long Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime? CreatedAt { get; set; }

    }
}
