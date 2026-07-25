using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedTblRPCI : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblRPCISignatoryTemplates",
                schema: "asset",
                columns: table => new
                {
                    RPCISignatoryTemplateId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RPCISignatoryTemplateName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RPCISignatoryTemplateData = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RPCISignatoryTemplateIsActive = table.Column<bool>(type: "bit", nullable: false),
                    RPCISignatoryTemplateCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RPCISignatoryTemplateCreatedBy = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblRPCISignatoryTemplates", x => x.RPCISignatoryTemplateId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblRPCISignatoryTemplates",
                schema: "asset");
        }
    }
}
