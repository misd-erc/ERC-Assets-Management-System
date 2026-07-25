using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalDB.Entities.ASSET.Supply
{
    [Table("tblRPCISignatoryTemplates", Schema = "asset")]
    public class TblRPCISignatoryTemplate
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("RPCISignatoryTemplateId")]
        public long Id { get; set; }

        [Column("RPCISignatoryTemplateName")]
        public string Name { get; set; } = string.Empty;

        [Column("RPCISignatoryTemplateData")]
        public string SignatoryDataJson { get; set; } = string.Empty;

        [Column("RPCISignatoryTemplateIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("RPCISignatoryTemplateCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("RPCISignatoryTemplateCreatedBy")]
        public long CreatedBy { get; set; }
    }
}
