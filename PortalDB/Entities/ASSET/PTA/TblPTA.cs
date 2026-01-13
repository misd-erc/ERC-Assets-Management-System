using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using PortalCommon.Utilities;

namespace PortalDB.Entities.ASSET.PTA
{
    [Table("tblPTAs", Schema = "asset")]
    public class TblPTA
    {

        # region Constants
        [NotMapped] public const string PPE = "PPE"; //text=Property Plant Equipment value="PPE"
        [NotMapped] public const string SE = "SE";
        #endregion

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("PTAId")]
        public long Id { get; set; }

        [Column("PTAGroup")]
        public string? Group { get; set; }

        [Column("PTAFiscalDate")]
        public DateTime? FiscalDate { get; set; }

        [Column("PTAPropertyNumber")]
        public string? PropertyNumberEncrypted { get; set; }
        [NotMapped]
        public string? PropertyNumber
        {
            get => string.IsNullOrEmpty(PropertyNumberEncrypted) ? null : EncryptionHelper.Decrypt(PropertyNumberEncrypted);
            set => PropertyNumberEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PTACategoryId")]
        public long? CategoryId { get; set; }

        [Column("PTALegendId")]
        public long? LegendId { get; set; }

        [Column("PTADescription")]
        public string? DescriptionEncrypted { get; set; }
        [NotMapped]
        public string? Description
        {
            get => string.IsNullOrEmpty(DescriptionEncrypted) ? null : EncryptionHelper.Decrypt(DescriptionEncrypted);
            set => DescriptionEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PTABrand")]
        public string? BrandEncrypted { get; set; }
        [NotMapped]
        public string? Brand
        {
            get => string.IsNullOrEmpty(BrandEncrypted) ? null : EncryptionHelper.Decrypt(BrandEncrypted);
            set => BrandEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PTAModel")]
        public string? ModelEncrypted { get; set; }
        [NotMapped]
        public string? Model
        {
            get => string.IsNullOrEmpty(ModelEncrypted) ? null : EncryptionHelper.Decrypt(ModelEncrypted);
            set => ModelEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PTASerialNumber")]
        public string? SerialNumberEncrypted { get; set; }
        [NotMapped]
        public string? SerialNumber
        {
            get => string.IsNullOrEmpty(SerialNumberEncrypted) ? null : EncryptionHelper.Decrypt(SerialNumberEncrypted);
            set => SerialNumberEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PTAUnitOfMeasurement")]
        public string? UnitOfMeasurementEncrypted { get; set; }
        [NotMapped]
        public string? UnitOfMeasurement
        {
            get => string.IsNullOrEmpty(UnitOfMeasurementEncrypted) ? null : EncryptionHelper.Decrypt(UnitOfMeasurementEncrypted);
            set => UnitOfMeasurementEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PTAUnitValue")]
        public string? UnitValueEncrypted { get; set; }
        [NotMapped]
        public long? UnitValue
        {
            get => string.IsNullOrEmpty(UnitValueEncrypted) ? null : long.Parse(EncryptionHelper.Decrypt(UnitValueEncrypted));
            set => UnitValueEncrypted = string.IsNullOrEmpty(value.ToString()) ? null : EncryptionHelper.Encrypt(value.ToString());
        }

        [Column("PTADateAcquired")]
        public string? DateAcquiredEncrypted { get; set; }
        [NotMapped]
        public DateTime? DateAcquired
        {
            get => string.IsNullOrEmpty(DateAcquiredEncrypted) ? null : DateTime.Parse(EncryptionHelper.Decrypt(DateAcquiredEncrypted));
            set => DateAcquiredEncrypted = string.IsNullOrEmpty(value.ToString()) ? null : EncryptionHelper.Encrypt(value.ToString());
        }

        [Column("PTAEstimatedUsefulLife")]
        public string? EstimatedUsefulLifeEncrypted { get; set; }
        [NotMapped]
        public long? EstimatedUsefulLife
        {
            get => string.IsNullOrEmpty(EstimatedUsefulLifeEncrypted) ? null : long.Parse(EncryptionHelper.Decrypt(EstimatedUsefulLifeEncrypted));
            set => EstimatedUsefulLifeEncrypted = string.IsNullOrEmpty(value.ToString()) ? null : EncryptionHelper.Encrypt(value.ToString());
        }

        [Column("PTAIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("PTAIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("PTACreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


    }
}
