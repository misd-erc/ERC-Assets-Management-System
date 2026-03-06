using PortalCommon.Utilities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Entities.ASSET.Delivery
{
    [Table("tblDeliveryRecords", Schema = "asset")]
    public class TblDeliveryRecord
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("DeliveryRecordId")]
        public long Id { get; set; }

        [Column("DeliveryRecordDRNumber")]
        public string? DRNumberEncrypted { get; set; }
        [NotMapped]
        public string? DRNumber
        {
            get => string.IsNullOrEmpty(DRNumberEncrypted) ? null : EncryptionHelper.Decrypt(DRNumberEncrypted);
            set => DRNumberEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SupplyIARId")]
        public long? SupplyIARId { get; set; }

        [Column("DeliveryRecordDeliveryDate")]
        public DateTime? DeliveryDate { get; set; }

        [Column("EmployeeId")]
        public long? EmployeeId { get; set; }

        [Column("DeliveryRecordRemarks")]
        public string? RemarksEncrypted { get; set; }
        [NotMapped]
        public string? Remarks
        {
            get => string.IsNullOrEmpty(RemarksEncrypted) ? null : EncryptionHelper.Decrypt(RemarksEncrypted);
            set => RemarksEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("DeliveryRecordIsReceived")]
        public bool IsReceived { get; set; } = false;

        [Column("DeliveryRecordIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("DeliveryRecordIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("DeliveryRecordCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
