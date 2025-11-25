using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddedSETbls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblSECategories",
                schema: "asset",
                columns: table => new
                {
                    SECategoryId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SECategoryName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SECategoryIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SECategoryIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SECategoryCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
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
                    SELegendName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SELegendIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SELegendIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SELegendCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
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
                    SEId = table.Column<long>(type: "bigint", nullable: true),
                    SEMovementDateAssigned = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SEMovementPARITRNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PlantillaEmployeeId = table.Column<long>(type: "bigint", nullable: true),
                    PlantillaEmployeeIdOriginal = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NonPlantillaEmployeeId = table.Column<long>(type: "bigint", nullable: true),
                    NonPlantillaEmployeeIdOriginal = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SEMovementActualOfficeId = table.Column<long>(type: "bigint", nullable: true),
                    SEMovementActualDivisionId = table.Column<long>(type: "bigint", nullable: true),
                    SEMovementRemarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SEMovementIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SEMovementIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SEMovementCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
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
                    SEId = table.Column<long>(type: "bigint", nullable: false),
                    SEPartName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SEPartSerialNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SEPartIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SEPartIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SEPartCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
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
                    SEPropertyNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SECategoryId = table.Column<long>(type: "bigint", nullable: true),
                    SELegendId = table.Column<long>(type: "bigint", nullable: true),
                    SEDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SEBrand = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SEModel = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SESerialNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SEUnitOfMeasurement = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SEUnitValue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SEDateAcquired = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SEIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SEIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SECreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSEs", x => x.SEId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
        }
    }
}
