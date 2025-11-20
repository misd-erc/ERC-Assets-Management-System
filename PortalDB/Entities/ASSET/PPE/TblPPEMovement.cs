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
    [Table("tblPPEMovements", Schema = "asset")]
    public class TblPPEMovement
    {

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("PPEMovementId")]
        public long Id { get; set; }

        [Column("PPEId")]
        public long? PPEId { get; set; }

        [Column("PPEMovementDateAssigned")]
        public string? DateAssignedEncrypted { get; set; }
        [NotMapped]
        public DateTime? DateAssigned
        {
            get => string.IsNullOrEmpty(DateAssignedEncrypted) ? null : DateTime.Parse(EncryptionHelper.Decrypt(DateAssignedEncrypted));
            set => DateAssignedEncrypted = string.IsNullOrEmpty(value.ToString()) ? null : EncryptionHelper.Encrypt(value.ToString());
        }

        [Column("PPEMovementPARITRNumber")]
        public string? PARITRNumberEncrypted { get; set; }
        [NotMapped]
        public string? PARITRNumber
        {
            get => string.IsNullOrEmpty(PARITRNumberEncrypted) ? null : EncryptionHelper.Decrypt(PARITRNumberEncrypted);
            set => PARITRNumberEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PlantillaEmployeeId")]
        public long? PlantillaEmployeeId { get; set; }

        [Column("PlantillaEmployeeIdOriginal")]
        public string? PlantillaEmployeeIdOriginalEncrypted { get; set; }
        [NotMapped]
        public string? PlantillaEmployeeIdOriginal
        {
            get => string.IsNullOrEmpty(PlantillaEmployeeIdOriginalEncrypted) ? null : EncryptionHelper.Decrypt(PlantillaEmployeeIdOriginalEncrypted);
            set => PlantillaEmployeeIdOriginalEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("NonPlantillaEmployeeId")]
        public long? NonPlantillaEmployeeId { get; set; }

        [Column("NonPlantillaEmployeeIdOriginal")]
        public string? NonPlantillaEmployeeIdOriginalEncrypted { get; set; }
        [NotMapped]
        public string? NonPlantillaEmployeeIdOriginal
        {
            get => string.IsNullOrEmpty(NonPlantillaEmployeeIdOriginalEncrypted) ? null : EncryptionHelper.Decrypt(NonPlantillaEmployeeIdOriginalEncrypted);
            set => NonPlantillaEmployeeIdOriginalEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PPEMovementActualOfficeId")]
        public long? ActualOfficeId { get; set; }

        [Column("PPEMovementActualDivisionId")]
        public long? ActualDivisionId { get; set; }

        [Column("PPEMovementRemarks")]
        public string? RemarksEncrypted { get; set; }
        [NotMapped]
        public string? Remarks
        {
            get => string.IsNullOrEmpty(RemarksEncrypted) ? null : EncryptionHelper.Decrypt(RemarksEncrypted);
            set => RemarksEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PPEMovementIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("PPEMovementIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("PPEMovementCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


    }
}
