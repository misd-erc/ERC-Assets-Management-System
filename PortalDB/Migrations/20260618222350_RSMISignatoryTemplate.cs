using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class RSMISignatoryTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblRSMISignatoryTemplates",
                schema: "asset",
                columns: table => new
                {
                    RSMISignatoryTemplateId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RSMISignatoryTemplateName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RSMISignatoryTemplateData = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RSMISignatoryTemplateIsActive = table.Column<bool>(type: "bit", nullable: false),
                    RSMISignatoryTemplateCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RSMISignatoryTemplateCreatedBy = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblRSMISignatoryTemplates", x => x.RSMISignatoryTemplateId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblRSMISignatoryTemplates",
                schema: "asset");
        }
    }
}
