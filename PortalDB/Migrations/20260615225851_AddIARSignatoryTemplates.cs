using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddIARSignatoryTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblIARSignatoryTemplates",
                schema: "asset",
                columns: table => new
                {
                    IARSignatoryTemplateId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IARSignatoryTemplateName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IARSignatoryTemplateData = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IARSignatoryTemplateIsActive = table.Column<bool>(type: "bit", nullable: false),
                    IARSignatoryTemplateCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IARSignatoryTemplateCreatedBy = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblIARSignatoryTemplates", x => x.IARSignatoryTemplateId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblIARSignatoryTemplates",
                schema: "asset");
        }
    }
}
