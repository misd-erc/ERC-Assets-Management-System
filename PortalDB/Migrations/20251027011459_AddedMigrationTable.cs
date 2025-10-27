using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddedMigrationTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblFileStorages",
                schema: "dbo",
                columns: table => new
                {
                    FileStorageId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FileStorageBlobName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FileStorageOriginalFileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    FileStorageFlatFolderName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    FileStorageContentType = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    FileStorageUploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FileStorageUploadedBy = table.Column<long>(type: "bigint", nullable: false),
                    FileStorageIsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblFileStorages", x => x.FileStorageId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblFileStorages",
                schema: "dbo");
        }
    }
}
