using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddPerfectChatFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDeletedForReceiver",
                schema: "dbo",
                table: "tblChatMessages",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeletedForSender",
                schema: "dbo",
                table: "tblChatMessages",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsSystemMessage",
                schema: "dbo",
                table: "tblChatMessages",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDeletedForReceiver",
                schema: "dbo",
                table: "tblChatMessages");

            migrationBuilder.DropColumn(
                name: "IsDeletedForSender",
                schema: "dbo",
                table: "tblChatMessages");

            migrationBuilder.DropColumn(
                name: "IsSystemMessage",
                schema: "dbo",
                table: "tblChatMessages");
        }
    }
}
