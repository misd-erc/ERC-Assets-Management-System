using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedTbls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "SystemUserStatusIsActive",
                schema: "dbo",
                table: "tblSystemUserStatuses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SystemUserStatusIsDeleted",
                schema: "dbo",
                table: "tblSystemUserStatuses",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "SystemUserIsDeleted",
                schema: "dbo",
                table: "tblSystemUsers",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "SystemRoleIsDeleted",
                schema: "dbo",
                table: "tblSystemRoles",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "SessionTokenIsDeleted",
                schema: "dbo",
                table: "tblSessionTokens",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PositionIsActive",
                schema: "dbo",
                table: "tblPositions",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PositionIsDeleted",
                schema: "dbo",
                table: "tblPositions",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "OneTimePasswordIsDeleted",
                schema: "dbo",
                table: "tblOneTimePasswords",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "OfficeIsActive",
                schema: "dbo",
                table: "tblOffices",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "OfficeIsDeleted",
                schema: "dbo",
                table: "tblOffices",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EmploymentTypeIsActive",
                schema: "dbo",
                table: "tblEmploymentTypes",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EmploymentTypeIsDeleted",
                schema: "dbo",
                table: "tblEmploymentTypes",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "DivisionIsActive",
                schema: "dbo",
                table: "tblDivisions",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "DivisionIsDeleted",
                schema: "dbo",
                table: "tblDivisions",
                type: "bit",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SystemUserStatusIsActive",
                schema: "dbo",
                table: "tblSystemUserStatuses");

            migrationBuilder.DropColumn(
                name: "SystemUserStatusIsDeleted",
                schema: "dbo",
                table: "tblSystemUserStatuses");

            migrationBuilder.DropColumn(
                name: "SystemUserIsDeleted",
                schema: "dbo",
                table: "tblSystemUsers");

            migrationBuilder.DropColumn(
                name: "SystemRoleIsDeleted",
                schema: "dbo",
                table: "tblSystemRoles");

            migrationBuilder.DropColumn(
                name: "SessionTokenIsDeleted",
                schema: "dbo",
                table: "tblSessionTokens");

            migrationBuilder.DropColumn(
                name: "PositionIsActive",
                schema: "dbo",
                table: "tblPositions");

            migrationBuilder.DropColumn(
                name: "PositionIsDeleted",
                schema: "dbo",
                table: "tblPositions");

            migrationBuilder.DropColumn(
                name: "OneTimePasswordIsDeleted",
                schema: "dbo",
                table: "tblOneTimePasswords");

            migrationBuilder.DropColumn(
                name: "OfficeIsActive",
                schema: "dbo",
                table: "tblOffices");

            migrationBuilder.DropColumn(
                name: "OfficeIsDeleted",
                schema: "dbo",
                table: "tblOffices");

            migrationBuilder.DropColumn(
                name: "EmploymentTypeIsActive",
                schema: "dbo",
                table: "tblEmploymentTypes");

            migrationBuilder.DropColumn(
                name: "EmploymentTypeIsDeleted",
                schema: "dbo",
                table: "tblEmploymentTypes");

            migrationBuilder.DropColumn(
                name: "DivisionIsActive",
                schema: "dbo",
                table: "tblDivisions");

            migrationBuilder.DropColumn(
                name: "DivisionIsDeleted",
                schema: "dbo",
                table: "tblDivisions");
        }
    }
}
