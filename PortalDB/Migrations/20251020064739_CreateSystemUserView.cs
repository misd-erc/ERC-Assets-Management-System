using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class CreateSystemUserView : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
            CREATE OR ALTER VIEW [dbo].[vwSystemUsers]
            AS
            SELECT 
	            SU.SystemUserId,
	            SU.SystemUserEmail,
	            SU.SystemUserFirstName,
	            SU.SystemUserLastName,
                SR.SystemRoleId,
	            SR.SystemRoleName,
                SUS.SystemUserStatusId,
	            SUS.SystemUserStatusName,
	            O.OfficeId,
                O.OfficeName,
	            O.OfficeAcronym,
                D.DivisionId,
	            D.DivisionName,
	            D.DivisionAcronym,
	            SU.SystemUserIsActive,
	            SU.SystemUserCreatedAt,
	            SU.SystemUserLastLoginAt
            FROM [dbo].[tblSystemUsers] AS SU
            LEFT JOIN [dbo].[tblSystemRoles] AS SR ON SR.SystemRoleId = SU.SystemRoleId
            LEFT JOIN [dbo].[tblSystemUserStatuses] AS SUS ON SUS.SystemUserStatusId = SU.SystemUserStatusId
            LEFT JOIN [dbo].[tblOffices] AS O ON O.OfficeId = SU.OfficeId
            LEFT JOIN [dbo].[tblDivisions] AS D ON D.DivisionId = SU.DivisionId;
        ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP VIEW IF EXISTS [dbo].[vwSystemUsers];");
        }
    }
}
