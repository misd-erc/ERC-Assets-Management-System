using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddedNewTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "EmploymentTypeId",
                schema: "dbo",
                table: "tblSystemUsers",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "PositionId",
                schema: "dbo",
                table: "tblSystemUsers",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "tblEmploymentTypes",
                schema: "dbo",
                columns: table => new
                {
                    EmploymentTypeId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmploymentTypeName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    EmploymentTypeCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblEmploymentTypes", x => x.EmploymentTypeId);
                });

            migrationBuilder.CreateTable(
                name: "tblPositions",
                schema: "dbo",
                columns: table => new
                {
                    PositionId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PositionName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PositionAcronym = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    PositionSalaryGrade = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: true),
                    PositionCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblPositions", x => x.PositionId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblEmploymentTypes",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "tblPositions",
                schema: "dbo");

            migrationBuilder.DropColumn(
                name: "EmploymentTypeId",
                schema: "dbo",
                table: "tblSystemUsers");

            migrationBuilder.DropColumn(
                name: "PositionId",
                schema: "dbo",
                table: "tblSystemUsers");
        }
    }
}
