using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddedSessionTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblSessionTokens",
                schema: "dbo",
                columns: table => new
                {
                    SessionTokenId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SystemUserId = table.Column<long>(type: "bigint", nullable: false),
                    SessionTokenKey = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SessionTokenValidUntil = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SessionTokenCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSessionTokens", x => x.SessionTokenId);
                    table.ForeignKey(
                        name: "FK_tblSessionTokens_tblSystemUsers_SystemUserId",
                        column: x => x.SystemUserId,
                        principalSchema: "dbo",
                        principalTable: "tblSystemUsers",
                        principalColumn: "SystemUserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_tblSessionTokens_SystemUserId",
                schema: "dbo",
                table: "tblSessionTokens",
                column: "SystemUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblSessionTokens",
                schema: "dbo");
        }
    }
}
