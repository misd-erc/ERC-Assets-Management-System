using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddTblSupplyRISItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblRISItems",
                schema: "asset",
                columns: table => new
                {
                    SupplyRISItemId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SupplyRISId = table.Column<long>(type: "bigint", nullable: true),
                    SupplyRISItemStockNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupplyRISItemUnitId = table.Column<long>(type: "bigint", nullable: true),
                    SupplyRISItemDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupplyRISItemRequisitionQuantity = table.Column<long>(type: "bigint", nullable: false),
                    SupplyRISItemIsAvailable = table.Column<bool>(type: "bit", nullable: false),
                    SupplyRISItemIssueQuantity = table.Column<long>(type: "bigint", nullable: false),
                    SupplyRISItemRemarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupplyRISItemIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SupplyRISItemIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SupplyRISItemCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblRISItems", x => x.SupplyRISItemId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblRISItems",
                schema: "asset");
        }
    }
}
