using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedSupplyItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeliveryRecordPONumber",
                schema: "asset",
                table: "tblDeliveryRecords");

            migrationBuilder.RenameColumn(
                name: "VendorId",
                schema: "asset",
                table: "tblDeliveryRecords",
                newName: "SupplyIARId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "SupplyIARId",
                schema: "asset",
                table: "tblDeliveryRecords",
                newName: "VendorId");

            migrationBuilder.AddColumn<string>(
                name: "DeliveryRecordPONumber",
                schema: "asset",
                table: "tblDeliveryRecords",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
