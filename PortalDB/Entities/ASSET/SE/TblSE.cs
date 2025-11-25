using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using PortalCommon.Utilities;

namespace PortalDB.Entities.ASSET.SE
{
    [Table("tblSEs", Schema = "asset")]
    public class TblSE
    {

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("SEId")]
        public long Id { get; set; }

        [Column("SEPropertyNumber")]
        public string? PropertyNumberEncrypted { get; set; }
        [NotMapped]
        public string? PropertyNumber
        {
            get => string.IsNullOrEmpty(PropertyNumberEncrypted) ? null : EncryptionHelper.Decrypt(PropertyNumberEncrypted);
            set => PropertyNumberEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SECategoryId")]
        public long? CategoryId { get; set; }

        [Column("SELegendId")]
        public long? LegendId { get; set; }

        [Column("SEDescription")]
        public string? DescriptionEncrypted { get; set; }
        [NotMapped]
        public string? Description
        {
            get => string.IsNullOrEmpty(DescriptionEncrypted) ? null : EncryptionHelper.Decrypt(DescriptionEncrypted);
            set => DescriptionEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SEBrand")]
        public string? BrandEncrypted { get; set; }
        [NotMapped]
        public string? Brand
        {
            get => string.IsNullOrEmpty(BrandEncrypted) ? null : EncryptionHelper.Decrypt(BrandEncrypted);
            set => BrandEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SEModel")]
        public string? ModelEncrypted { get; set; }
        [NotMapped]
        public string? Model
        {
            get => string.IsNullOrEmpty(ModelEncrypted) ? null : EncryptionHelper.Decrypt(ModelEncrypted);
            set => ModelEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SESerialNumber")]
        public string? SerialNumberEncrypted { get; set; }
        [NotMapped]
        public string? SerialNumber
        {
            get => string.IsNullOrEmpty(SerialNumberEncrypted) ? null : EncryptionHelper.Decrypt(SerialNumberEncrypted);
            set => SerialNumberEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SEUnitOfMeasurement")]
        public string? UnitOfMeasurementEncrypted { get; set; }
        [NotMapped]
        public string? UnitOfMeasurement
        {
            get => string.IsNullOrEmpty(UnitOfMeasurementEncrypted) ? null : EncryptionHelper.Decrypt(UnitOfMeasurementEncrypted);
            set => UnitOfMeasurementEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SEUnitValue")]
        public string? UnitValueEncrypted { get; set; }
        [NotMapped]
        public long? UnitValue
        {
            get => string.IsNullOrEmpty(UnitValueEncrypted) ? null : long.Parse(EncryptionHelper.Decrypt(UnitValueEncrypted));
            set => UnitValueEncrypted = string.IsNullOrEmpty(value.ToString()) ? null : EncryptionHelper.Encrypt(value.ToString());
        }

        [Column("SEDateAcquired")]
        public string? DateAcquiredEncrypted { get; set; }
        [NotMapped]
        public DateTime? DateAcquired
        {
            get => string.IsNullOrEmpty(DateAcquiredEncrypted) ? null : DateTime.Parse(EncryptionHelper.Decrypt(DateAcquiredEncrypted));
            set => DateAcquiredEncrypted = string.IsNullOrEmpty(value.ToString()) ? null : EncryptionHelper.Encrypt(value.ToString());
        }

        [Column("SEIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("SEIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("SECreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


    }
}
