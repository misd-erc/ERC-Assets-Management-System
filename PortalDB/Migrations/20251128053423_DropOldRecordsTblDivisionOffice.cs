using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class DropOldRecordsTblDivisionOffice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmployeeMiddleName",
                schema: "dbo",
                table: "tblEmployees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.Sql(@"
                DELETE FROM dbo.tblDivisions;
                DBCC CHECKIDENT ('dbo.tblDivisions', RESEED, 0);

                DELETE FROM dbo.tblOffices;
                DBCC CHECKIDENT ('dbo.tblOffices', RESEED, 0);
            ");

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmployeeMiddleName",
                schema: "dbo",
                table: "tblEmployees");
        }
    }
}
