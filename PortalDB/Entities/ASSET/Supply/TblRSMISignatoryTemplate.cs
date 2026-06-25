using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalDB.Entities.ASSET.Supply
{
    [Table("tblRSMISignatoryTemplates", Schema = "asset")]
    public class TblRSMISignatoryTemplate
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("RSMISignatoryTemplateId")]
        public long Id { get; set; }

        [Column("RSMISignatoryTemplateName")]
        public string Name { get; set; } = string.Empty;

        [Column("RSMISignatoryTemplateData")]
        public string SignatoryDataJson { get; set; } = string.Empty;

        [Column("RSMISignatoryTemplateIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("RSMISignatoryTemplateCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("RSMISignatoryTemplateCreatedBy")]
        public long CreatedBy { get; set; }
    }
}
