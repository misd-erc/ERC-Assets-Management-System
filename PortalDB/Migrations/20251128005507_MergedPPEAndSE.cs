using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class MergedPPEAndSE : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblPPECategories",
                schema: "asset");

            migrationBuilder.DropTable(
                name: "tblPPELegends",
                schema: "asset");

            migrationBuilder.DropTable(
                name: "tblPPEMovements",
                schema: "asset");

            migrationBuilder.DropTable(
                name: "tblPPEParts",
                schema: "asset");

            migrationBuilder.DropTable(
                name: "tblPPEs",
                schema: "asset");

            migrationBuilder.DropTable(
                name: "tblSECategories",
                schema: "asset");

            migrationBuilder.DropTable(
                name: "tblSELegends",
                schema: "asset");

            migrationBuilder.DropTable(
                name: "tblSEMovements",
                schema: "asset");

            migrationBuilder.DropTable(
                name: "tblSEParts",
                schema: "asset");

            migrationBuilder.DropTable(
                name: "tblSEs",
                schema: "asset");

            migrationBuilder.CreateTable(
                name: "tblPTACategories",
                schema: "asset",
                columns: table => new
                {
                    PTACategoryId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PTACategoryName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PTACategoryIsActive = table.Column<bool>(type: "bit", nullable: false),
                    PTACategoryIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    PTACategoryCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblPTACategories", x => x.PTACategoryId);
                });

            migrationBuilder.CreateTable(
                name: "tblPTALegends",
                schema: "asset",
                columns: table => new
                {
                    PTALegendId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PTALegendName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PTALegendIsActive = table.Column<bool>(type: "bit", nullable: false),
                    PTALegendIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    PTALegendCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblPTALegends", x => x.PTALegendId);
                });

            migrationBuilder.CreateTable(
                name: "tblPTAMovements",
                schema: "asset",
                columns: table => new
                {
                    PTAMovementId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PTAId = table.Column<long>(type: "bigint", nullable: true),
                    PTAMovementDateAssigned = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PTAMovementPARITRNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PlantillaEmployeeId = table.Column<long>(type: "bigint", nullable: true),
                    PlantillaEmployeeIdOriginal = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NonPlantillaEmployeeId = table.Column<long>(type: "bigint", nullable: true),
                    NonPlantillaEmployeeIdOriginal = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PTAMovementActualOfficeId = table.Column<long>(type: "bigint", nullable: true),
                    PTAMovementActualDivisionId = table.Column<long>(type: "bigint", nullable: true),
                    PTAMovementRemarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PTAMovementIsActive = table.Column<bool>(type: "bit", nullable: false),
                    PTAMovementIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    PTAMovementCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblPTAMovements", x => x.PTAMovementId);
                });

            migrationBuilder.CreateTable(
                name: "tblPTAParts",
                schema: "asset",
                columns: table => new
                {
                    PTAPartId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PTAId = table.Column<long>(type: "bigint", nullable: false),
                    PTAPartName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PTAPartSerialNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PTAPartIsActive = table.Column<bool>(type: "bit", nullable: false),
                    PTAPartIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    PTAPartCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblPTAParts", x => x.PTAPartId);
                });

            migrationBuilder.CreateTable(
                name: "tblPTAs",
                schema: "asset",
                columns: table => new
                {
                    PTAId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PTAGroup = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PTAPropertyNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PTACategoryId = table.Column<long>(type: "bigint", nullable: true),
                    PTALegendId = table.Column<long>(type: "bigint", nullable: true),
                    PTADescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PTABrand = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PTAModel = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PTASerialNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PTAUnitOfMeasurement = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PTAUnitValue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PTADateAcquired = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PTAEstimatedUsefulLife = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PTAIsActive = table.Column<bool>(type: "bit", nullable: false),
                    PTAIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    PTACreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblPTAs", x => x.PTAId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblPTACategories",
                schema: "asset");

            migrationBuilder.DropTable(
                name: "tblPTALegends",
                schema: "asset");

            migrationBuilder.DropTable(
                name: "tblPTAMovements",
                schema: "asset");

            migrationBuilder.DropTable(
                name: "tblPTAParts",
                schema: "asset");

            migrationBuilder.DropTable(
                name: "tblPTAs",
                schema: "asset");

            migrationBuilder.CreateTable(
                name: "tblPPECategories",
                schema: "asset",
                columns: table => new
                {
                    PPECategoryId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PPECategoryCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PPECategoryIsActive = table.Column<bool>(type: "bit", nullable: false),
                    PPECategoryIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    PPECategoryName = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblPPECategories", x => x.PPECategoryId);
                });

            migrationBuilder.CreateTable(
                name: "tblPPELegends",
                schema: "asset",
                columns: table => new
                {
                    PPELegendId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PPELegendCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PPELegendIsActive = table.Column<bool>(type: "bit", nullable: false),
                    PPELegendIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    PPELegendName = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblPPELegends", x => x.PPELegendId);
                });

            migrationBuilder.CreateTable(
                name: "tblPPEMovements",
                schema: "asset",
                columns: table => new
                {
                    PPEMovementId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PPEMovementActualDivisionId = table.Column<long>(type: "bigint", nullable: true),
                    PPEMovementActualOfficeId = table.Column<long>(type: "bigint", nullable: true),
                    PPEMovementCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PPEMovementDateAssigned = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEMovementIsActive = table.Column<bool>(type: "bit", nullable: false),
                    PPEMovementIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    NonPlantillaEmployeeId = table.Column<long>(type: "bigint", nullable: true),
                    NonPlantillaEmployeeIdOriginal = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEMovementPARITRNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEId = table.Column<long>(type: "bigint", nullable: true),
                    PlantillaEmployeeId = table.Column<long>(type: "bigint", nullable: true),
                    PlantillaEmployeeIdOriginal = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEMovementRemarks = table.Column<string>(type: "nvarchar(max)", nullable: true)
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
                    PPEPartId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PPEPartCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PPEPartIsActive = table.Column<bool>(type: "bit", nullable: false),
                    PPEPartIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    PPEPartName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEId = table.Column<long>(type: "bigint", nullable: false),
                    PPEPartSerialNumber = table.Column<string>(type: "nvarchar(max)", nullable: true)
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
                    PPEBrand = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPECategoryId = table.Column<long>(type: "bigint", nullable: true),
                    PPECreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PPEDateAcquired = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEEstimatedUsefulLife = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEIsActive = table.Column<bool>(type: "bit", nullable: false),
                    PPEIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    PPELegendId = table.Column<long>(type: "bigint", nullable: true),
                    PPEModel = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEPropertyNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPESerialNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEUnitOfMeasurement = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPEUnitValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblPPEs", x => x.PPEId);
                });

            migrationBuilder.CreateTable(
                name: "tblSECategories",
                schema: "asset",
                columns: table => new
                {
                    SECategoryId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SECategoryCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SECategoryIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SECategoryIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SECategoryName = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSECategories", x => x.SECategoryId);
                });

            migrationBuilder.CreateTable(
                name: "tblSELegends",
                schema: "asset",
                columns: table => new
                {
                    SELegendId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SELegendCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SELegendIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SELegendIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SELegendName = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSELegends", x => x.SELegendId);
                });

            migrationBuilder.CreateTable(
                name: "tblSEMovements",
                schema: "asset",
                columns: table => new
                {
                    SEMovementId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SEMovementActualDivisionId = table.Column<long>(type: "bigint", nullable: true),
                    SEMovementActualOfficeId = table.Column<long>(type: "bigint", nullable: true),
                    SEMovementCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SEMovementDateAssigned = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SEMovementIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SEMovementIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    NonPlantillaEmployeeId = table.Column<long>(type: "bigint", nullable: true),
                    NonPlantillaEmployeeIdOriginal = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SEMovementPARITRNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PlantillaEmployeeId = table.Column<long>(type: "bigint", nullable: true),
                    PlantillaEmployeeIdOriginal = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SEMovementRemarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SEId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSEMovements", x => x.SEMovementId);
                });

            migrationBuilder.CreateTable(
                name: "tblSEParts",
                schema: "asset",
                columns: table => new
                {
                    SEPartId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SEPartCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SEPartIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SEPartIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SEPartName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SEId = table.Column<long>(type: "bigint", nullable: false),
                    SEPartSerialNumber = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSEParts", x => x.SEPartId);
                });

            migrationBuilder.CreateTable(
                name: "tblSEs",
                schema: "asset",
                columns: table => new
                {
                    SEId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SEBrand = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SECategoryId = table.Column<long>(type: "bigint", nullable: true),
                    SECreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SEDateAcquired = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SEDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SEIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SEIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SELegendId = table.Column<long>(type: "bigint", nullable: true),
                    SEModel = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SEPropertyNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SESerialNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SEUnitOfMeasurement = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SEUnitValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSEs", x => x.SEId);
                });
        }
    }
}
