using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalDB.Entities.ASSET.Supply
{
    [Table("tblRISSignatoryTemplates", Schema = "asset")]
    public class TblRISSignatoryTemplate
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("RISSignatoryTemplateId")]
        public long Id { get; set; }

        [Column("RISSignatoryTemplateName")]
        public string Name { get; set; } = string.Empty;

        [Column("RISSignatoryTemplateData")]
        public string SignatoryDataJson { get; set; } = string.Empty;

        [Column("RISSignatoryTemplateIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("RISSignatoryTemplateCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("RISSignatoryTemplateCreatedBy")]
        public long CreatedBy { get; set; }
    }
}
