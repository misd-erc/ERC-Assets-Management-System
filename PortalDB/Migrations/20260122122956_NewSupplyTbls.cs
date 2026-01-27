using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class NewSupplyTbls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblSupplyCategories",
                schema: "asset",
                columns: table => new
                {
                    SupplyCategoryId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SupplyCategoryName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupplyCategoryIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SupplyCategoryIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SupplyCategoryCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSupplyCategories", x => x.SupplyCategoryId);
                });

            migrationBuilder.CreateTable(
                name: "tblSupplyItems",
                schema: "asset",
                columns: table => new
                {
                    SupplyItemId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SupplyItemCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupplyCategoryId = table.Column<long>(type: "bigint", nullable: true),
                    SupplyItemDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupplyItemCurrentStock = table.Column<int>(type: "int", nullable: true),
                    SupplyItemUnitCost = table.Column<long>(type: "bigint", nullable: true),
                    SupplyItemReorderPoint = table.Column<int>(type: "int", nullable: true),
                    SupplyStorageLocationId = table.Column<long>(type: "bigint", nullable: true),
                    SupplyVendorId = table.Column<long>(type: "bigint", nullable: true),
                    SupplyItemIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SupplyItemIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SupplyItemCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSupplyItems", x => x.SupplyItemId);
                });

            migrationBuilder.CreateTable(
                name: "tblSupplyStorageLocations",
                schema: "asset",
                columns: table => new
                {
                    SupplyStorageLocationId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SupplyStorageLocationName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupplyStorageLocationIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SupplyStorageLocationIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SupplyStorageLocationCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSupplyStorageLocations", x => x.SupplyStorageLocationId);
                });

            migrationBuilder.CreateTable(
                name: "tblSupplyUnits",
                schema: "asset",
                columns: table => new
                {
                    SupplyUnitId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SupplyUnitName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupplyUnitIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SupplyUnitIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SupplyUnitCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSupplyUnits", x => x.SupplyUnitId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblSupplyCategories",
                schema: "asset");

            migrationBuilder.DropTable(
                name: "tblSupplyItems",
                schema: "asset");

            migrationBuilder.DropTable(
                name: "tblSupplyStorageLocations",
                schema: "asset");

            migrationBuilder.DropTable(
                name: "tblSupplyUnits",
                schema: "asset");
        }
    }
}
