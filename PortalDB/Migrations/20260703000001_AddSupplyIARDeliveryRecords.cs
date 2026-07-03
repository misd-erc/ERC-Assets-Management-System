using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PortalDB.Services;

#nullable disable

namespace PortalDB.Migrations
{
    [DbContext(typeof(PortalDbContext))]
    [Migration("20260703000001_AddSupplyIARDeliveryRecords")]
    public partial class AddSupplyIARDeliveryRecords : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblSupplyIARDeliveryRecords",
                schema: "asset",
                columns: table => new
                {
                    SupplyIARDeliveryRecordId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SupplyIARId = table.Column<long>(type: "bigint", nullable: false),
                    DeliveryRecordId = table.Column<long>(type: "bigint", nullable: false),
                    SupplyIARDeliveryRecordCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSupplyIARDeliveryRecords", x => x.SupplyIARDeliveryRecordId);
                });

            migrationBuilder.Sql(@"
                INSERT INTO asset.tblSupplyIARDeliveryRecords (SupplyIARId, DeliveryRecordId, SupplyIARDeliveryRecordCreatedAt)
                SELECT SupplyIARId, DeliveryRecordId, SYSUTCDATETIME()
                FROM asset.tblSupplyIARs
                WHERE DeliveryRecordId IS NOT NULL
            ");

            migrationBuilder.CreateIndex(
                name: "IX_tblSupplyIARDeliveryRecords_DeliveryRecordId",
                schema: "asset",
                table: "tblSupplyIARDeliveryRecords",
                column: "DeliveryRecordId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tblSupplyIARDeliveryRecords_SupplyIARId_DeliveryRecordId",
                schema: "asset",
                table: "tblSupplyIARDeliveryRecords",
                columns: new[] { "SupplyIARId", "DeliveryRecordId" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblSupplyIARDeliveryRecords",
                schema: "asset");
        }
    }
}
