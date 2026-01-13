using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using PortalCommon.Utilities;

namespace PortalDB.Entities.ASSET.PTA
{
    [Table("tblPTAMovements", Schema = "asset")]
    public class TblPTAMovement
    {

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("PTAMovementId")]
        public long Id { get; set; }

        [Column("PTAId")]
        public long? PTAId { get; set; }

        [Column("PTAMovementDateAssigned")]
        public string? DateAssignedEncrypted { get; set; }
        [NotMapped]
        public DateTime? DateAssigned
        {
            get => string.IsNullOrEmpty(DateAssignedEncrypted) ? null : DateTime.Parse(EncryptionHelper.Decrypt(DateAssignedEncrypted));
            set => DateAssignedEncrypted = string.IsNullOrEmpty(value.ToString()) ? null : EncryptionHelper.Encrypt(value.ToString());
        }

        [Column("PTAMovementPTRITRNumber")]
        public string? PTRITRNumberEncrypted { get; set; }
        [NotMapped]
        public string? PTRITRNumber
        {
            get => string.IsNullOrEmpty(PTRITRNumberEncrypted) ? null : EncryptionHelper.Decrypt(PTRITRNumberEncrypted);
            set => PTRITRNumberEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PTAMovementPARICSNumber")]
        public string? PARICSNumberEncrypted { get; set; }
        [NotMapped]
        public string? PARICSNumber
        {
            get => string.IsNullOrEmpty(PARICSNumberEncrypted) ? null : EncryptionHelper.Decrypt(PARICSNumberEncrypted);
            set => PARICSNumberEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
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

        [Column("PTAMovementActualOfficeId")]
        public long? ActualOfficeId { get; set; }

        [Column("PTAMovementActualDivisionId")]
        public long? ActualDivisionId { get; set; }

        [Column("PTAMovementRemarks")]
        public string? RemarksEncrypted { get; set; }
        [NotMapped]
        public string? Remarks
        {
            get => string.IsNullOrEmpty(RemarksEncrypted) ? null : EncryptionHelper.Decrypt(RemarksEncrypted);
            set => RemarksEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PTAMovementIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("PTAMovementIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("PTAMovementCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


    }
}
