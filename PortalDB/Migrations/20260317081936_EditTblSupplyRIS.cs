using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class EditTblSupplyRIS : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF EXISTS (
                    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = 'asset'
                      AND TABLE_NAME = 'tblSupplyRISs'
                      AND COLUMN_NAME = 'SupplyRISNumberDate'
                )
                BEGIN
                    EXEC sp_rename N'[asset].[tblSupplyRISs].[SupplyRISNumberDate]', N'SupplyRISRequestedDate', 'COLUMN';
                END
            ");

            migrationBuilder.AlterColumn<DateTime>(
                name: "SupplyRISCreatedAt",
                schema: "asset",
                table: "tblSupplyRISs",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "SupplyRISApprovedOn",
                schema: "asset",
                table: "tblSupplyRISs",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AddColumn<DateTime>(
                name: "SupplyRISApprovedDate",
                schema: "asset",
                table: "tblSupplyRISs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SupplyRISIssuedDate",
                schema: "asset",
                table: "tblSupplyRISs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SupplyRISRecievedDate",
                schema: "asset",
                table: "tblSupplyRISs",
                type: "datetime2",
                nullable: true);

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

            migrationBuilder.AlterColumn<DateTime>(
                name: "SupplyIARApprovedOn",
                schema: "asset",
                table: "tblSupplyIARs",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SupplyRISApprovedDate",
                schema: "asset",
                table: "tblSupplyRISs");

            migrationBuilder.DropColumn(
                name: "SupplyRISIssuedDate",
                schema: "asset",
                table: "tblSupplyRISs");

            migrationBuilder.DropColumn(
                name: "SupplyRISRecievedDate",
                schema: "asset",
                table: "tblSupplyRISs");

            migrationBuilder.RenameColumn(
                name: "SupplyRISRequestedDate",
                schema: "asset",
                table: "tblSupplyRISs",
                newName: "SupplyRISNumberDate");

            migrationBuilder.AlterColumn<DateTime>(
                name: "SupplyRISCreatedAt",
                schema: "asset",
                table: "tblSupplyRISs",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<DateTime>(
                name: "SupplyRISApprovedOn",
                schema: "asset",
                table: "tblSupplyRISs",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "SupplyIARCreatedAt",
                schema: "asset",
                table: "tblSupplyIARs",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<DateTime>(
                name: "SupplyIARApprovedOn",
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
