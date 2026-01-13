using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddedPARICS : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PTAMovementPARITRNumber",
                schema: "asset",
                table: "tblPTAMovements",
                newName: "PTAMovementPTRITRNumber");

            migrationBuilder.AddColumn<string>(
                name: "PTAMovementPARICSNumber",
                schema: "asset",
                table: "tblPTAMovements",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.Sql(@"
            CREATE OR ALTER VIEW [asset].[vwPTAs]
            AS
			SELECT 
				PTA.PTAId,
				PTA.PTAGroup,
				PTA.PTAFiscalDate,
				PTA.PTAPropertyNumber,
				PTA.PTACategoryId,
				C.PTACategoryName,
				PTA.PTALegendId,
				L.PTALegendName,
				PTA.PTADescription,
				PTA.PTABrand,
				PTA.PTAModel,
				pta.PTASerialNumber,
				PTA.PTAUnitOfMeasurement,
				PTA.PTAUnitValue,
				pta.PTADateAcquired,
				PTAEstimatedUsefulLife,
				PTAM.PTAMovementId,
				PTAM.PTAMovementDateAssigned,
				PTAM.PTAMovementPTRITRNumber,
				PTAM.PTAMovementPARICSNumber,
				PTAM.PlantillaEmployeeId,
				PTAM.PlantillaEmployeeIdOriginal,
				EP.SystemUserId AS PlantillaSystemUserId,
				EP.EmployeeFirstName AS PlantillaEmployeeFirstName,
				EP.EmployeeMiddleName AS PlantillaEmployeeMiddleName,
				EP.EmployeeLastName AS PlantillaEmployeeLastName,
				EP.EmployeeSuffixName AS PlantillaEmployeeSuffixName,
				EP.OfficeId PlantillaOfficeId,
				EP.DivisionId PlantillaDivisionId,
				EP.EmploymentTypeId PlantillaEmploymentTypeId,
				EP.PositionId PlantillaPositionId,
				PTAM.NonPlantillaEmployeeId,
				PTAM.NonPlantillaEmployeeIdOriginal,
				ENP.SystemUserId AS NonPlantillaSystemUserId,
				ENP.EmployeeFirstName AS NonPlantillaEmployeeFirstName,
				ENP.EmployeeMiddleName AS NonPlantillaEmployeeMiddleName,
				ENP.EmployeeLastName AS NonPlantillaEmployeeLastName,
				ENP.EmployeeSuffixName AS NonPlantillaEmployeeSuffixName,
				ENP.OfficeId NonPlantillaOfficeId,
				ENP.DivisionId NonPlantillaDivisionId,
				ENP.EmploymentTypeId NonPlantillaEmploymentTypeId,
				ENP.PositionId NonPlantillaPositionId,
				PTAM.PTAMovementActualOfficeId,
				PTAM.PTAMovementActualDivisionId,
				PTAM.PTAMovementRemarks,
				PTA.PTAIsDeleted,
				PTA.PTAIsActive,
				PTA.PTACreatedAt
			FROM asset.tblPTAs AS PTA
			LEFT JOIN asset.tblPTACategories C ON PTA.PTACategoryId = C.PTACategoryId
			LEFT JOIN asset.tblPTALegends L ON PTA.PTALegendId = L.PTALegendId
			LEFT JOIN asset.tblPTAMovements AS PTAM ON PTA.PTAId = PTAM.PTAId
			LEFT JOIN dbo.tblEmployees AS EP ON PTAM.PlantillaEmployeeId = EP.EmployeeId
			LEFT JOIN dbo.tblEmployees AS ENP ON PTAM.NonPlantillaEmployeeId = ENP.EmployeeId;
        ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PTAMovementPARICSNumber",
                schema: "asset",
                table: "tblPTAMovements");

            migrationBuilder.RenameColumn(
                name: "PTAMovementPTRITRNumber",
                schema: "asset",
                table: "tblPTAMovements",
                newName: "PTAMovementPARITRNumber");

            migrationBuilder.Sql(@"
            CREATE OR ALTER VIEW [asset].[vwPTAs]
            AS
			SELECT 
				PTA.PTAId,
				PTA.PTAGroup,
				PTA.PTAFiscalDate,
				PTA.PTAPropertyNumber,
				PTA.PTACategoryId,
				C.PTACategoryName,
				PTA.PTALegendId,
				L.PTALegendName,
				PTA.PTADescription,
				PTA.PTABrand,
				PTA.PTAModel,
				pta.PTASerialNumber,
				PTA.PTAUnitOfMeasurement,
				PTA.PTAUnitValue,
				pta.PTADateAcquired,
				PTAEstimatedUsefulLife,
				PTAM.PTAMovementId,
				PTAM.PTAMovementDateAssigned,
				PTAM.PTAMovementPARITRNumber,
				PTAM.PlantillaEmployeeId,
				PTAM.PlantillaEmployeeIdOriginal,
				EP.SystemUserId AS PlantillaSystemUserId,
				EP.EmployeeFirstName AS PlantillaEmployeeFirstName,
				EP.EmployeeMiddleName AS PlantillaEmployeeMiddleName,
				EP.EmployeeLastName AS PlantillaEmployeeLastName,
				EP.EmployeeSuffixName AS PlantillaEmployeeSuffixName,
				EP.OfficeId PlantillaOfficeId,
				EP.DivisionId PlantillaDivisionId,
				EP.EmploymentTypeId PlantillaEmploymentTypeId,
				EP.PositionId PlantillaPositionId,
				PTAM.NonPlantillaEmployeeId,
				PTAM.NonPlantillaEmployeeIdOriginal,
				ENP.SystemUserId AS NonPlantillaSystemUserId,
				ENP.EmployeeFirstName AS NonPlantillaEmployeeFirstName,
				ENP.EmployeeMiddleName AS NonPlantillaEmployeeMiddleName,
				ENP.EmployeeLastName AS NonPlantillaEmployeeLastName,
				ENP.EmployeeSuffixName AS NonPlantillaEmployeeSuffixName,
				ENP.OfficeId NonPlantillaOfficeId,
				ENP.DivisionId NonPlantillaDivisionId,
				ENP.EmploymentTypeId NonPlantillaEmploymentTypeId,
				ENP.PositionId NonPlantillaPositionId,
				PTAM.PTAMovementActualOfficeId,
				PTAM.PTAMovementActualDivisionId,
				PTAM.PTAMovementRemarks,
				PTA.PTAIsDeleted,
				PTA.PTAIsActive,
				PTA.PTACreatedAt
			FROM asset.tblPTAs AS PTA
			LEFT JOIN asset.tblPTACategories C ON PTA.PTACategoryId = C.PTACategoryId
			LEFT JOIN asset.tblPTALegends L ON PTA.PTALegendId = L.PTALegendId
			LEFT JOIN asset.tblPTAMovements AS PTAM ON PTA.PTAId = PTAM.PTAId
			LEFT JOIN dbo.tblEmployees AS EP ON PTAM.PlantillaEmployeeId = EP.EmployeeId
			LEFT JOIN dbo.tblEmployees AS ENP ON PTAM.NonPlantillaEmployeeId = ENP.EmployeeId;
        ");
        }
    }
}
