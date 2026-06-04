using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddVendorFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "SupplyVendorContractEnd",
                schema: "asset",
                table: "tblSupplyVendors",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SupplyVendorContractStart",
                schema: "asset",
                table: "tblSupplyVendors",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SupplyVendorDeliveryDate",
                schema: "asset",
                table: "tblSupplyVendors",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SupplyVendorDeliveryDueDate",
                schema: "asset",
                table: "tblSupplyVendors",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SupplyVendorProcurementTitle",
                schema: "asset",
                table: "tblSupplyVendors",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SupplyVendorTerms",
                schema: "asset",
                table: "tblSupplyVendors",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SupplyVendorType",
                schema: "asset",
                table: "tblSupplyVendors",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SupplyVendorContractEnd",
                schema: "asset",
                table: "tblSupplyVendors");

            migrationBuilder.DropColumn(
                name: "SupplyVendorContractStart",
                schema: "asset",
                table: "tblSupplyVendors");

            migrationBuilder.DropColumn(
                name: "SupplyVendorDeliveryDate",
                schema: "asset",
                table: "tblSupplyVendors");

            migrationBuilder.DropColumn(
                name: "SupplyVendorDeliveryDueDate",
                schema: "asset",
                table: "tblSupplyVendors");

            migrationBuilder.DropColumn(
                name: "SupplyVendorProcurementTitle",
                schema: "asset",
                table: "tblSupplyVendors");

            migrationBuilder.DropColumn(
                name: "SupplyVendorTerms",
                schema: "asset",
                table: "tblSupplyVendors");

            migrationBuilder.DropColumn(
                name: "SupplyVendorType",
                schema: "asset",
                table: "tblSupplyVendors");
        }
    }
}
