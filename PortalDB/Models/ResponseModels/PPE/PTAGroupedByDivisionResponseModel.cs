using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Models.ResponseModels.Office;
using PortalDB.Models.ResponseModels.PTA;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalDB.Models.ResponseModels.PPE
{
    public class PTAGroupedByDivisionResponseModel
    {
        public long? DivisionId { get; set; }
        public string? Name { get; set; }
        public string? Acronym { get; set; }
        public TblOffice? Office { get; set; }
        public List<PTAResponseModel>? PTA { get; set; }
    }
}
