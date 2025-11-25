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
    [Table("tblSEMovements", Schema = "asset")]
    public class TblSEMovement
    {

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("SEMovementId")]
        public long Id { get; set; }

        [Column("SEId")]
        public long? SEId { get; set; }

        [Column("SEMovementDateAssigned")]
        public string? DateAssignedEncrypted { get; set; }
        [NotMapped]
        public DateTime? DateAssigned
        {
            get => string.IsNullOrEmpty(DateAssignedEncrypted) ? null : DateTime.Parse(EncryptionHelper.Decrypt(DateAssignedEncrypted));
            set => DateAssignedEncrypted = string.IsNullOrEmpty(value.ToString()) ? null : EncryptionHelper.Encrypt(value.ToString());
        }

        [Column("SEMovementPARITRNumber")]
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

        [Column("SEMovementActualOfficeId")]
        public long? ActualOfficeId { get; set; }

        [Column("SEMovementActualDivisionId")]
        public long? ActualDivisionId { get; set; }

        [Column("SEMovementRemarks")]
        public string? RemarksEncrypted { get; set; }
        [NotMapped]
        public string? Remarks
        {
            get => string.IsNullOrEmpty(RemarksEncrypted) ? null : EncryptionHelper.Decrypt(RemarksEncrypted);
            set => RemarksEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("SEMovementIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("SEMovementIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("SEMovementCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


    }
}
