using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddTblDeliveryRecordItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblDeliveryRecordItems",
                schema: "asset",
                columns: table => new
                {
                    DeliveryRecordItemId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DeliveryRecordId = table.Column<long>(type: "bigint", nullable: true),
                    DeliveryRecordItemType = table.Column<long>(type: "bigint", nullable: true),
                    PTACategoryId = table.Column<long>(type: "bigint", nullable: true),
                    DeliveryRecordItemDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeliveryRecordItemSpecification = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeliveryRecordItemQuantity = table.Column<long>(type: "bigint", nullable: true),
                    SupplyUnitId = table.Column<long>(type: "bigint", nullable: true),
                    DeliveryRecordUnitCost = table.Column<long>(type: "bigint", nullable: true),
                    DeliveryRecordItemIsActive = table.Column<bool>(type: "bit", nullable: false),
                    DeliveryRecordItemIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeliveryRecordItemCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblDeliveryRecordItems", x => x.DeliveryRecordItemId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblDeliveryRecordItems",
                schema: "asset");
        }
    }
}
