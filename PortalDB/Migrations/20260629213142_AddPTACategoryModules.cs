using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddPTACategoryModules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblPTACategoryModules",
                schema: "asset",
                columns: table => new
                {
                    PTACategoryModuleId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PTACategoryId = table.Column<long>(type: "bigint", nullable: false),
                    SystemModuleId = table.Column<long>(type: "bigint", nullable: false),
                    PTACategoryModuleIsActive = table.Column<bool>(type: "bit", nullable: false),
                    PTACategoryModuleIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    PTACategoryModuleCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblPTACategoryModules", x => x.PTACategoryModuleId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblPTACategoryModules",
                schema: "asset");
        }
    }
}
