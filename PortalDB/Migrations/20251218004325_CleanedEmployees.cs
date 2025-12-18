using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class CleanedEmployees : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Execute in a transaction for atomicity
            migrationBuilder.Sql(@"
                BEGIN TRANSACTION;

                TRUNCATE TABLE asset.tblPTAParts;
                TRUNCATE TABLE asset.tblPTAs;
                TRUNCATE TABLE dbo.tblEmployees;

                COMMIT TRANSACTION;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
