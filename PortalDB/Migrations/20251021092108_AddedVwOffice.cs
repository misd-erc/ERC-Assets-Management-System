using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddedVwOffice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
            CREATE OR ALTER VIEW [dbo].[vwDivisions]
            AS
            SELECT 
	            D.DivisionId,
	            O.OfficeId,
	            D.DivisionName,
	            D.DivisionAcronym,
	            O.OfficeName,
	            O.OfficeAcronym,
	            D.DivisionCreatedAt
            FROM [dbo].[tblDivisions] AS D
            LEFT JOIN [dbo].[tblOffices] AS O ON O.OfficeId = D.OfficeId;
        ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP VIEW IF EXISTS [dbo].[vwDivisions];");
        }
    }
}
