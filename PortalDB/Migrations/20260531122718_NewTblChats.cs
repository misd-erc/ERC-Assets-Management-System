using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class NewTblChats : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblChatGroupMembers",
                schema: "dbo",
                columns: table => new
                {
                    ChatGroupMemberId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChatGroupId = table.Column<long>(type: "bigint", nullable: false),
                    SystemUserId = table.Column<long>(type: "bigint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblChatGroupMembers", x => x.ChatGroupMemberId);
                });

            migrationBuilder.CreateTable(
                name: "tblChatGroups",
                schema: "dbo",
                columns: table => new
                {
                    ChatGroupId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GroupDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedBySystemUserId = table.Column<long>(type: "bigint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblChatGroups", x => x.ChatGroupId);
                });

            migrationBuilder.CreateTable(
                name: "tblChatMessageReactions",
                schema: "dbo",
                columns: table => new
                {
                    ReactionId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChatMessageId = table.Column<long>(type: "bigint", nullable: false),
                    SystemUserId = table.Column<long>(type: "bigint", nullable: false),
                    ReactionType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblChatMessageReactions", x => x.ReactionId);
                });

            migrationBuilder.CreateTable(
                name: "tblChatMessageReadReceipts",
                schema: "dbo",
                columns: table => new
                {
                    ReadReceiptId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChatMessageId = table.Column<long>(type: "bigint", nullable: false),
                    SystemUserId = table.Column<long>(type: "bigint", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblChatMessageReadReceipts", x => x.ReadReceiptId);
                });

            migrationBuilder.CreateTable(
                name: "tblChatMessages",
                schema: "dbo",
                columns: table => new
                {
                    ChatMessageId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SenderSystemUserId = table.Column<long>(type: "bigint", nullable: false),
                    ReceiverSystemUserId = table.Column<long>(type: "bigint", nullable: true),
                    ChatGroupId = table.Column<long>(type: "bigint", nullable: true),
                    MessageContentEncrypted = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FileStorageId = table.Column<long>(type: "bigint", nullable: true),
                    IsUnsent = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblChatMessages", x => x.ChatMessageId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblChatGroupMembers",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "tblChatGroups",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "tblChatMessageReactions",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "tblChatMessageReadReceipts",
                schema: "dbo");

            migrationBuilder.DropTable(
                name: "tblChatMessages",
                schema: "dbo");
        }
    }
}
