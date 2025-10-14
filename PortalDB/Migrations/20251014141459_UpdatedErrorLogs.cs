using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedErrorLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ErrorLogLine",
                schema: "log",
                table: "tblErrorLogs");

            migrationBuilder.RenameColumn(
                name: "ErrorLogDescription",
                schema: "log",
                table: "tblErrorLogs",
                newName: "ErrorLogStackTrace");

            migrationBuilder.AlterColumn<DateTime>(
                name: "ErrorLogCreatedAt",
                schema: "log",
                table: "tblErrorLogs",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ErrorLogController",
                schema: "log",
                table: "tblErrorLogs",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ErrorLogAction",
                schema: "log",
                table: "tblErrorLogs",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ErrorLogInnerMessage",
                schema: "log",
                table: "tblErrorLogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ErrorLogInnerStackTrace",
                schema: "log",
                table: "tblErrorLogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ErrorLogMachineName",
                schema: "log",
                table: "tblErrorLogs",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ErrorLogMessage",
                schema: "log",
                table: "tblErrorLogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ErrorLogRequestPath",
                schema: "log",
                table: "tblErrorLogs",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ErrorLogSource",
                schema: "log",
                table: "tblErrorLogs",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ErrorLogTargetSite",
                schema: "log",
                table: "tblErrorLogs",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ErrorLogAction",
                schema: "log",
                table: "tblErrorLogs");

            migrationBuilder.DropColumn(
                name: "ErrorLogInnerMessage",
                schema: "log",
                table: "tblErrorLogs");

            migrationBuilder.DropColumn(
                name: "ErrorLogInnerStackTrace",
                schema: "log",
                table: "tblErrorLogs");

            migrationBuilder.DropColumn(
                name: "ErrorLogMachineName",
                schema: "log",
                table: "tblErrorLogs");

            migrationBuilder.DropColumn(
                name: "ErrorLogMessage",
                schema: "log",
                table: "tblErrorLogs");

            migrationBuilder.DropColumn(
                name: "ErrorLogRequestPath",
                schema: "log",
                table: "tblErrorLogs");

            migrationBuilder.DropColumn(
                name: "ErrorLogSource",
                schema: "log",
                table: "tblErrorLogs");

            migrationBuilder.DropColumn(
                name: "ErrorLogTargetSite",
                schema: "log",
                table: "tblErrorLogs");

            migrationBuilder.RenameColumn(
                name: "ErrorLogStackTrace",
                schema: "log",
                table: "tblErrorLogs",
                newName: "ErrorLogDescription");

            migrationBuilder.AlterColumn<DateTime>(
                name: "ErrorLogCreatedAt",
                schema: "log",
                table: "tblErrorLogs",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<string>(
                name: "ErrorLogController",
                schema: "log",
                table: "tblErrorLogs",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ErrorLogLine",
                schema: "log",
                table: "tblErrorLogs",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);
        }
    }
}
