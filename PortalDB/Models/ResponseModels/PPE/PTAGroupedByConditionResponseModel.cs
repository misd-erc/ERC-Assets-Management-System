using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Models.ResponseModels.PTA;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalDB.Models.ResponseModels.PPE
{
    public class PTAGroupedByConditionResponseModel
    {
        public string? Condition { get; set; }
        public List<PTAResponseModel>? PTA { get; set; }
    }
}
