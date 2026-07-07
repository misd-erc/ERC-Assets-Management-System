using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationDeepLinkFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SystemNotificationActionType",
                schema: "dbo",
                table: "tblSystemNotifications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "SystemNotificationEntityId",
                schema: "dbo",
                table: "tblSystemNotifications",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SystemNotificationEntityLabel",
                schema: "dbo",
                table: "tblSystemNotifications",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SystemNotificationActionType",
                schema: "dbo",
                table: "tblSystemNotifications");

            migrationBuilder.DropColumn(
                name: "SystemNotificationEntityId",
                schema: "dbo",
                table: "tblSystemNotifications");

            migrationBuilder.DropColumn(
                name: "SystemNotificationEntityLabel",
                schema: "dbo",
                table: "tblSystemNotifications");
        }
    }
}
