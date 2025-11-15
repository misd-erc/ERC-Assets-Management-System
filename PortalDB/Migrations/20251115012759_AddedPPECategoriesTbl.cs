using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddedPPECategoriesTbl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "asset");

            migrationBuilder.CreateTable(
                name: "tblPPECategories",
                schema: "asset",
                columns: table => new
                {
                    PPECategoryId = table.Column<long>(type: "bigint", nullable: false),
                    PPECategoryName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PPECategoryIsActive = table.Column<bool>(type: "bit", nullable: false),
                    PPECategoryIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    PPECategoryCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblPPECategories", x => x.PPECategoryId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblPPECategories",
                schema: "asset");
        }
    }
}
