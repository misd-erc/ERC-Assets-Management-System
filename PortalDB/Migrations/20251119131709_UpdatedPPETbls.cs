using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedPPETbls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PPEMovementDateAcquired",
                schema: "asset",
                table: "tblPPEMovements",
                newName: "PPEMovementDateAssigned");

            migrationBuilder.AddColumn<string>(
                name: "PPEEstimatedUsefulLife",
                schema: "asset",
                table: "tblPPEs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "PPEMovementActualOfficeId",
                schema: "asset",
                table: "tblPPEMovements",
                type: "bigint",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PPEEstimatedUsefulLife",
                schema: "asset",
                table: "tblPPEs");

            migrationBuilder.DropColumn(
                name: "PPEMovementActualOfficeId",
                schema: "asset",
                table: "tblPPEMovements");

            migrationBuilder.RenameColumn(
                name: "PPEMovementDateAssigned",
                schema: "asset",
                table: "tblPPEMovements",
                newName: "PPEMovementDateAcquired");
        }
    }
}
