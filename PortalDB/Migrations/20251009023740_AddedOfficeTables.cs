using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddedOfficeTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblDivisions",
                schema: "dbo",
                columns: table => new
                {
                    DivisionId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OfficeId = table.Column<long>(type: "bigint", nullable: false),
                    DivisionName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DivisionAcronym = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblDivisions", x => x.DivisionId);
                });

            migrationBuilder.CreateTable(
                name: "tblOffices",
                schema: "dbo",
                columns: table => new
                {
                    OfficeId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OfficeName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    OfficeAcronym = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblOffices", x => x.OfficeId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblDivisions",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "tblOffices",
                schema: "dbo");
        }
    }
}
