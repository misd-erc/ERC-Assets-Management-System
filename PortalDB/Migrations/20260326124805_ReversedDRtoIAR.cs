using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class ReversedDRtoIAR : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SupplyIARId",
                schema: "asset",
                table: "tblDeliveryRecords");

            migrationBuilder.AddColumn<long>(
                name: "DeliveryRecordId",
                schema: "asset",
                table: "tblSupplyIARs",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeliveryRecordId",
                schema: "asset",
                table: "tblSupplyIARs");

            migrationBuilder.AddColumn<long>(
                name: "SupplyIARId",
                schema: "asset",
                table: "tblDeliveryRecords",
                type: "bigint",
                nullable: true);
        }
    }
}
