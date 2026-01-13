using PortalCommon.Utilities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Entities.ASSET.PTA
{
    [Table("vwPTAs", Schema = "asset")]
    public class VwPTA
    {
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

        [Column("PTACategoryName")]
        public string? CategoryName { get; set; }

        [Column("PTALegendId")]
        public long? LegendId { get; set; }

        [Column("PTALegendName")]
        public string? LegendName { get; set; }

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

        [Column("PTAMovementId")]
        public long MovementId { get; set; }

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

        [Column("PlantillaSystemUserId")]
        public long? PlantillaSystemUserId { get; set; }

        [Column("PlantillaEmployeeFirstName")]
        public string? PlantillaEmployeeFirstNameEncrypted { get; set; }
        [NotMapped]
        public string? PlantillaEmployeeFirstName
        {
            get => string.IsNullOrEmpty(PlantillaEmployeeFirstNameEncrypted) ? null : EncryptionHelper.Decrypt(PlantillaEmployeeFirstNameEncrypted);
            set => PlantillaEmployeeFirstNameEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PlantillaEmployeeMiddleName")]
        public string? PlantillaEmployeeMiddleNameEncrypted { get; set; }
        [NotMapped]
        public string? PlantillaEmployeeMiddleName
        {
            get => string.IsNullOrEmpty(PlantillaEmployeeMiddleNameEncrypted) ? null : EncryptionHelper.Decrypt(PlantillaEmployeeMiddleNameEncrypted);
            set => PlantillaEmployeeMiddleNameEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PlantillaEmployeeLastName")]
        public string? PlantillaEmployeeLastNameEncrypted { get; set; }
        [NotMapped]
        public string? PlantillaEmployeeLastName
        {
            get => string.IsNullOrEmpty(PlantillaEmployeeLastNameEncrypted) ? null : EncryptionHelper.Decrypt(PlantillaEmployeeLastNameEncrypted);
            set => PlantillaEmployeeLastNameEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PlantillaEmployeeSuffixName")]
        public string? PlantillaEmployeeSuffixNameEncrypted { get; set; }
        [NotMapped]
        public string? PlantillaEmployeeSuffixName
        {
            get => string.IsNullOrEmpty(PlantillaEmployeeSuffixNameEncrypted) ? null : EncryptionHelper.Decrypt(PlantillaEmployeeSuffixNameEncrypted);
            set => PlantillaEmployeeSuffixNameEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("PlantillaOfficeId")]
        public long? PlantillaOfficeId { get; set; }

        [Column("PlantillaDivisionId")]
        public long? PlantillaDivisionId { get; set; }

        [Column("PlantillaEmploymentTypeId")]
        public long? PlantillaEmploymentTypeId { get; set; }

        [Column("PlantillaPositionId")]
        public long? PlantillaPositionId { get; set; }

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

        [Column("NonPlantillaSystemUserId")]
        public long? NonPlantillaSystemUserId { get; set; }

        [Column("NonPlantillaEmployeeFirstName")]
        public string? NonPlantillaEmployeeFirstNameEncrypted { get; set; }
        [NotMapped]
        public string? NonPlantillaEmployeeFirstName
        {
            get => string.IsNullOrEmpty(NonPlantillaEmployeeFirstNameEncrypted) ? null : EncryptionHelper.Decrypt(NonPlantillaEmployeeFirstNameEncrypted);
            set => NonPlantillaEmployeeFirstNameEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("NonPlantillaEmployeeMiddleName")]
        public string? NonPlantillaEmployeeMiddleNameEncrypted { get; set; }
        [NotMapped]
        public string? NonPlantillaEmployeeMiddleName
        {
            get => string.IsNullOrEmpty(NonPlantillaEmployeeMiddleNameEncrypted) ? null : EncryptionHelper.Decrypt(NonPlantillaEmployeeMiddleNameEncrypted);
            set => NonPlantillaEmployeeMiddleNameEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("NonPlantillaEmployeeLastName")]
        public string? NonPlantillaEmployeeLastNameEncrypted { get; set; }
        [NotMapped]
        public string? NonPlantillaEmployeeLastName
        {
            get => string.IsNullOrEmpty(NonPlantillaEmployeeLastNameEncrypted) ? null : EncryptionHelper.Decrypt(NonPlantillaEmployeeLastNameEncrypted);
            set => NonPlantillaEmployeeLastNameEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("NonPlantillaEmployeeSuffixName")]
        public string? NonPlantillaEmployeeSuffixNameEncrypted { get; set; }
        [NotMapped]
        public string? NonPlantillaEmployeeSuffixName
        {
            get => string.IsNullOrEmpty(NonPlantillaEmployeeSuffixNameEncrypted) ? null : EncryptionHelper.Decrypt(NonPlantillaEmployeeSuffixNameEncrypted);
            set => NonPlantillaEmployeeSuffixNameEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("NonPlantillaOfficeId")]
        public long? NonPlantillaOfficeId { get; set; }

        [Column("NonPlantillaDivisionId")]
        public long? NonPlantillaDivisionId { get; set; }

        [Column("NonPlantillaEmploymentTypeId")]
        public long? NonPlantillaEmploymentTypeId { get; set; }

        [Column("NonPlantillaPositionId")]
        public long? NonPlantillaPositionId { get; set; }

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

        [Column("PTAIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("PTAIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("PTACreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    }
}
