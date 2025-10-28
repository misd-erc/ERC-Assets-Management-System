using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSystemUserVw : Migration
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
                SU.SystemUserEmployeeId,
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
                P.PositionId,
                P.PositionName,
                P.PositionSalaryGrade,
                ET.EmploymentTypeId,
                ET.EmploymentTypeName,
                SU.SystemUserIsActive,
                SU.SystemUserIsDeleted,
                SU.SystemUserCreatedAt,
                SU.SystemUserLastLoginAt,
                SU.SystemUserProfilePictureFileStorageId,
                FS.FileStorageOriginalFileName AS SystemUserProfilePictureOriginalFileName
            FROM [dbo].[tblSystemUsers] AS SU
            LEFT JOIN [dbo].[tblSystemRoles] AS SR ON SR.SystemRoleId = SU.SystemRoleId
            LEFT JOIN [dbo].[tblSystemUserStatuses] AS SUS ON SUS.SystemUserStatusId = SU.SystemUserStatusId
            LEFT JOIN [dbo].[tblOffices] AS O ON O.OfficeId = SU.OfficeId
            LEFT JOIN [dbo].[tblDivisions] AS D ON D.DivisionId = SU.DivisionId
            LEFT JOIN [dbo].[tblEmploymentTypes] AS ET ON ET.EmploymentTypeId = SU.EmploymentTypeId
            LEFT JOIN [dbo].[tblPositions] AS P ON P.PositionId = SU.PositionId
            LEFT JOIN [dbo].[tblFileStorages] AS FS ON FS.FileStorageId = SU.SystemUserProfilePictureFileStorageId;
        ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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
                P.PositionId,
                P.PositionName,
                P.PositionSalaryGrade,
                ET.EmploymentTypeId,
                ET.EmploymentTypeName,
                SU.SystemUserIsActive,
                SU.SystemUserIsDeleted,
                SU.SystemUserCreatedAt,
                SU.SystemUserLastLoginAt,
                SU.SystemUserProfilePictureFileStorageId,
                FS.FileStorageOriginalFileName AS SystemUserProfilePictureOriginalFileName
            FROM [dbo].[tblSystemUsers] AS SU
            LEFT JOIN [dbo].[tblSystemRoles] AS SR ON SR.SystemRoleId = SU.SystemRoleId
            LEFT JOIN [dbo].[tblSystemUserStatuses] AS SUS ON SUS.SystemUserStatusId = SU.SystemUserStatusId
            LEFT JOIN [dbo].[tblOffices] AS O ON O.OfficeId = SU.OfficeId
            LEFT JOIN [dbo].[tblDivisions] AS D ON D.DivisionId = SU.DivisionId
            LEFT JOIN [dbo].[tblEmploymentTypes] AS ET ON ET.EmploymentTypeId = SU.EmploymentTypeId
            LEFT JOIN [dbo].[tblPositions] AS P ON P.PositionId = SU.PositionId
            LEFT JOIN [dbo].[tblFileStorages] AS FS ON FS.FileStorageId = SU.SystemUserProfilePictureFileStorageId;
        ");
        }
    }
}
