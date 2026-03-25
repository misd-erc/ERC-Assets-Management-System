using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedRISTbl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SupplyRISApprovedOn",
                schema: "asset",
                table: "tblSupplyRISs");

            migrationBuilder.DropColumn(
                name: "SupplyRISIsApproved",
                schema: "asset",
                table: "tblSupplyRISs");

            migrationBuilder.RenameColumn(
                name: "SupplyRISRecievedDate",
                schema: "asset",
                table: "tblSupplyRISs",
                newName: "SupplyRISReceivedDate");

            migrationBuilder.RenameColumn(
                name: "SupplyRISRecievedBySystemUserId",
                schema: "asset",
                table: "tblSupplyRISs",
                newName: "SupplyRISReceivedBySystemUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "SupplyRISReceivedDate",
                schema: "asset",
                table: "tblSupplyRISs",
                newName: "SupplyRISRecievedDate");

            migrationBuilder.RenameColumn(
                name: "SupplyRISReceivedBySystemUserId",
                schema: "asset",
                table: "tblSupplyRISs",
                newName: "SupplyRISRecievedBySystemUserId");

            migrationBuilder.AddColumn<DateTime>(
                name: "SupplyRISApprovedOn",
                schema: "asset",
                table: "tblSupplyRISs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "SupplyRISIsApproved",
                schema: "asset",
                table: "tblSupplyRISs",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
