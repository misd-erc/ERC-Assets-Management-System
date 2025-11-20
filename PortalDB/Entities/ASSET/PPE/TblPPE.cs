using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using PortalCommon.Utilities;

namespace PortalDB.Entities.ASSET.PPE
{
    [Table("tblPPEs", Schema = "asset")]
    public class TblPPE
    {

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("PPEId")]
        public long Id { get; set; }

        [Column("PPEPropertyNumber")]
        public string? PropertyNumberEncrypted { get; set; }
        [NotMapped]
        public string? PropertyNumber
        {
            get => string.IsNullOrEmpty(PropertyNumberEncrypted) ? null : EncryptionHelper.Decrypt(PropertyNumberEncrypted);
            set => PropertyNumberEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PPECategoryId")]
        public long? CategoryId { get; set; }

        [Column("PPELegendId")]
        public long? LegendId { get; set; }

        [Column("PPEDescription")]
        public string? DescriptionEncrypted { get; set; }
        [NotMapped]
        public string? Description
        {
            get => string.IsNullOrEmpty(DescriptionEncrypted) ? null : EncryptionHelper.Decrypt(DescriptionEncrypted);
            set => DescriptionEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PPEBrand")]
        public string? BrandEncrypted { get; set; }
        [NotMapped]
        public string? Brand
        {
            get => string.IsNullOrEmpty(BrandEncrypted) ? null : EncryptionHelper.Decrypt(BrandEncrypted);
            set => BrandEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PPEModel")]
        public string? ModelEncrypted { get; set; }
        [NotMapped]
        public string? Model
        {
            get => string.IsNullOrEmpty(ModelEncrypted) ? null : EncryptionHelper.Decrypt(ModelEncrypted);
            set => ModelEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PPESerialNumber")]
        public string? SerialNumberEncrypted { get; set; }
        [NotMapped]
        public string? SerialNumber
        {
            get => string.IsNullOrEmpty(SerialNumberEncrypted) ? null : EncryptionHelper.Decrypt(SerialNumberEncrypted);
            set => SerialNumberEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PPEUnitOfMeasurement")]
        public string? UnitOfMeasurementEncrypted { get; set; }
        [NotMapped]
        public string? UnitOfMeasurement
        {
            get => string.IsNullOrEmpty(UnitOfMeasurementEncrypted) ? null : EncryptionHelper.Decrypt(UnitOfMeasurementEncrypted);
            set => UnitOfMeasurementEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PPEUnitValue")]
        public string? UnitValueEncrypted { get; set; }
        [NotMapped]
        public long? UnitValue
        {
            get => string.IsNullOrEmpty(UnitValueEncrypted) ? null : long.Parse(EncryptionHelper.Decrypt(UnitValueEncrypted));
            set => UnitValueEncrypted = string.IsNullOrEmpty(value.ToString()) ? null : EncryptionHelper.Encrypt(value.ToString());
        }

        [Column("PPEDateAcquired")]
        public string? DateAcquiredEncrypted { get; set; }
        [NotMapped]
        public DateTime? DateAcquired
        {
            get => string.IsNullOrEmpty(DateAcquiredEncrypted) ? null : DateTime.Parse(EncryptionHelper.Decrypt(DateAcquiredEncrypted));
            set => DateAcquiredEncrypted = string.IsNullOrEmpty(value.ToString()) ? null : EncryptionHelper.Encrypt(value.ToString());
        }

        [Column("PPEEstimatedUsefulLife")]
        public string? EstimatedUsefulLifeEncrypted { get; set; }
        [NotMapped]
        public long? EstimatedUsefulLife
        {
            get => string.IsNullOrEmpty(EstimatedUsefulLifeEncrypted) ? null : long.Parse(EncryptionHelper.Decrypt(EstimatedUsefulLifeEncrypted));
            set => EstimatedUsefulLifeEncrypted = string.IsNullOrEmpty(value.ToString()) ? null : EncryptionHelper.Encrypt(value.ToString());
        }

        [Column("PPEIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("PPEIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("PPECreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


    }
}
