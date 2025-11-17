using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class PPETbls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblEmployees",
                schema: "dbo",
                columns: table => new
                {
                    EmployeeId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SystemUserId = table.Column<long>(type: "bigint", nullable: true),
                    EmployeeFirstName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EmployeeLastName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EmployeeIdOriginal = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OfficeId = table.Column<long>(type: "bigint", nullable: true),
                    DivisionId = table.Column<long>(type: "bigint", nullable: true),
                    EmploymentTypeId = table.Column<long>(type: "bigint", nullable: true),
                    PositionId = table.Column<long>(type: "bigint", nullable: true),
                    EmployeeIsActive = table.Column<bool>(type: "bit", nullable: false),
                    EmployeeIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    EmployeeCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblEmployees", x => x.EmployeeId);
                });

            migrationBuilder.CreateTable(
                name: "tblPPEMovements",
                schema: "asset",
                columns: table => new
                {
                    PPEMovementId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PPEId = table.Column<long>(type: "bigint", nullable: true),
                    PPEMovementDateAcquired = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEMovementPARITRNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PlantillaEmployeeId = table.Column<long>(type: "bigint", nullable: true),
                    NonPlantillaEmployeeId = table.Column<long>(type: "bigint", nullable: true),
                    PPEMovementActualDivisionId = table.Column<long>(type: "bigint", nullable: true),
                    PPEMovementRemarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEMovementIsActive = table.Column<bool>(type: "bit", nullable: false),
                    PPEMovementIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    PPEMovementCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblPPEMovements", x => x.PPEMovementId);
                });

            migrationBuilder.CreateTable(
                name: "tblPPEParts",
                schema: "asset",
                columns: table => new
                {
                    PPEPartId = table.Column<long>(type: "bigint", nullable: false),
                    PPEId = table.Column<long>(type: "bigint", nullable: false),
                    PPEPartName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEPartSerialNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEPartIsActive = table.Column<bool>(type: "bit", nullable: false),
                    PPEPartIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    PPEPartCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblPPEParts", x => x.PPEPartId);
                });

            migrationBuilder.CreateTable(
                name: "tblPPEs",
                schema: "asset",
                columns: table => new
                {
                    PPEId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PPEPropertyNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPECategoryId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPELegend = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEBrand = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEModel = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPESerialNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEUnitOfMeasurement = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEUnitValue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEDateAcquired = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEIsActive = table.Column<bool>(type: "bit", nullable: false),
                    PPEIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    PPECreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblPPEs", x => x.PPEId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblEmployees",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "tblPPEMovements",
                schema: "asset");

            migrationBuilder.DropTable(
                name: "tblPPEParts",
                schema: "asset");

            migrationBuilder.DropTable(
                name: "tblPPEs",
                schema: "asset");
        }
    }
}
