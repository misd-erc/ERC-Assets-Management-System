using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class RISSignatoryTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblRISSignatoryTemplates",
                schema: "asset",
                columns: table => new
                {
                    RISSignatoryTemplateId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RISSignatoryTemplateName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RISSignatoryTemplateData = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RISSignatoryTemplateIsActive = table.Column<bool>(type: "bit", nullable: false),
                    RISSignatoryTemplateCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RISSignatoryTemplateCreatedBy = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblRISSignatoryTemplates", x => x.RISSignatoryTemplateId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblRISSignatoryTemplates",
                schema: "asset");
        }
    }
}
