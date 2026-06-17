using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalDB.Entities.ASSET.Supply
{
    [Table("tblIARSignatoryTemplates", Schema = "asset")]
    public class TblIARSignatoryTemplate
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("IARSignatoryTemplateId")]
        public long Id { get; set; }

        [Column("IARSignatoryTemplateName")]
        public string Name { get; set; } = string.Empty;

        [Column("IARSignatoryTemplateData")]
        public string SignatoryDataJson { get; set; } = string.Empty;

        [Column("IARSignatoryTemplateIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("IARSignatoryTemplateCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("IARSignatoryTemplateCreatedBy")]
        public long CreatedBy { get; set; }
    }
}
