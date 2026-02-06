using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddTblDeliveryRecord : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblSupplyCategories",
                schema: "asset");

            migrationBuilder.CreateTable(
                name: "tblDeliveryRecords",
                schema: "asset",
                columns: table => new
                {
                    DeliveryRecordId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DeliveryRecordDRNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeliveryRecordPONumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    VendorId = table.Column<long>(type: "bigint", nullable: true),
                    DeliveryRecordDeliveryDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EmployeeId = table.Column<long>(type: "bigint", nullable: true),
                    DeliveryRecordRemarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeliveryRecordIsReceived = table.Column<bool>(type: "bit", nullable: false),
                    DeliveryRecordIsActive = table.Column<bool>(type: "bit", nullable: false),
                    DeliveryRecordIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeliveryRecordCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblDeliveryRecords", x => x.DeliveryRecordId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblDeliveryRecords",
                schema: "asset");

            migrationBuilder.CreateTable(
                name: "tblSupplyCategories",
                schema: "asset",
                columns: table => new
                {
                    SupplyCategoryId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SupplyCategoryCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SupplyCategoryIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SupplyCategoryIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SupplyCategoryName = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSupplyCategories", x => x.SupplyCategoryId);
                });
        }
    }
}
