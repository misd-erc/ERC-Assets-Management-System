using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalDB.Entities.ASSET.PTA
{
    [Table("tblRPCPPESignatoryTemplates", Schema = "asset")]
    public class TblRPCPPESignatoryTemplate
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("RPCPPESignatoryTemplateId")]
        public long Id { get; set; }

        [Column("RPCPPESignatoryTemplateName")]
        public string Name { get; set; } = string.Empty;

        [Column("RPCPPESignatoryTemplateData")]
        public string SignatoryDataJson { get; set; } = string.Empty;

        [Column("RPCPPESignatoryTemplateIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("RPCPPESignatoryTemplateCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("RPCPPESignatoryTemplateCreatedBy")]
        public long CreatedBy { get; set; }
    }
}
