using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddedNotificationTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblSystemNotificationReads",
                schema: "dbo",
                columns: table => new
                {
                    SystemNotificationReadId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SystemNotificationId = table.Column<long>(type: "bigint", nullable: true),
                    SystemNotificationReadBySystemUserId = table.Column<long>(type: "bigint", nullable: true),
                    SystemNotificationReadIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SystemNotificationReadCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSystemNotificationReads", x => x.SystemNotificationReadId);
                });

            migrationBuilder.CreateTable(
                name: "tblSystemNotifications",
                schema: "dbo",
                columns: table => new
                {
                    SystemNotificationId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SystemNotificationTitle = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SystemNotificationDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SystemNotificationForSystemUserId = table.Column<long>(type: "bigint", nullable: true),
                    SystemNotificationIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SystemNotificationCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSystemNotifications", x => x.SystemNotificationId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblSystemNotificationReads",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "tblSystemNotifications",
                schema: "dbo");
        }
    }
}
