using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddedIARApproval : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "SupplyIARCreatedAt",
                schema: "asset",
                table: "tblSupplyIARs",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AddColumn<DateTime>(
                name: "SupplyIARApprovedOn",
                schema: "asset",
                table: "tblSupplyIARs",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "SupplyIARIsApproved",
                schema: "asset",
                table: "tblSupplyIARs",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SupplyIARApprovedOn",
                schema: "asset",
                table: "tblSupplyIARs");

            migrationBuilder.DropColumn(
                name: "SupplyIARIsApproved",
                schema: "asset",
                table: "tblSupplyIARs");

            migrationBuilder.AlterColumn<DateTime>(
                name: "SupplyIARCreatedAt",
                schema: "asset",
                table: "tblSupplyIARs",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);
        }
    }
}
