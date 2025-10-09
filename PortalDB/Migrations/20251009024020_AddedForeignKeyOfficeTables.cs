using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddedForeignKeyOfficeTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_tblDivisions_OfficeId",
                schema: "dbo",
                table: "tblDivisions",
                column: "OfficeId");

            migrationBuilder.AddForeignKey(
                name: "FK_tblDivisions_tblOffices_OfficeId",
                schema: "dbo",
                table: "tblDivisions",
                column: "OfficeId",
                principalSchema: "dbo",
                principalTable: "tblOffices",
                principalColumn: "OfficeId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_tblDivisions_tblOffices_OfficeId",
                schema: "dbo",
                table: "tblDivisions");

            migrationBuilder.DropIndex(
                name: "IX_tblDivisions_OfficeId",
                schema: "dbo",
                table: "tblDivisions");
        }
    }
}
