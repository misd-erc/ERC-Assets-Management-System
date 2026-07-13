using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddRPCPPESignatoryTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblRPCPPESignatoryTemplates",
                schema: "asset",
                columns: table => new
                {
                    RPCPPESignatoryTemplateId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RPCPPESignatoryTemplateName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RPCPPESignatoryTemplateData = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RPCPPESignatoryTemplateIsActive = table.Column<bool>(type: "bit", nullable: false),
                    RPCPPESignatoryTemplateCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RPCPPESignatoryTemplateCreatedBy = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblRPCPPESignatoryTemplates", x => x.RPCPPESignatoryTemplateId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblRPCPPESignatoryTemplates",
                schema: "asset");
        }
    }
}
