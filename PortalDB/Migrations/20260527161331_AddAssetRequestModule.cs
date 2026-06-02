using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddAssetRequestModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblAssetRequestHistories",
                schema: "asset",
                columns: table => new
                {
                    AssetRequestHistoryId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AssetRequestId = table.Column<long>(type: "bigint", nullable: false),
                    AssetRequestHistoryActionType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AssetRequestHistoryFromStatus = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssetRequestHistoryToStatus = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssetRequestHistoryAssignedCommitteeSystemUserId = table.Column<long>(type: "bigint", nullable: true),
                    AssetRequestHistoryAssignedPersonnelSystemUserId = table.Column<long>(type: "bigint", nullable: true),
                    AssetRequestHistoryRemarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssetRequestHistoryUpdatedBySystemUserId = table.Column<long>(type: "bigint", nullable: false),
                    AssetRequestHistoryActionAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AssetRequestHistoryIsActive = table.Column<bool>(type: "bit", nullable: false),
                    AssetRequestHistoryIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    AssetRequestHistoryCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AssetRequestHistoryUpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblAssetRequestHistories", x => x.AssetRequestHistoryId);
                });

            migrationBuilder.CreateTable(
                name: "tblAssetRequestItems",
                schema: "asset",
                columns: table => new
                {
                    AssetRequestItemId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AssetRequestId = table.Column<long>(type: "bigint", nullable: false),
                    PTAId = table.Column<long>(type: "bigint", nullable: true),
                    AssetRequestItemPropertyNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssetRequestItemRemarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssetRequestItemIsActive = table.Column<bool>(type: "bit", nullable: false),
                    AssetRequestItemIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    AssetRequestItemCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AssetRequestItemUpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblAssetRequestItems", x => x.AssetRequestItemId);
                });

            migrationBuilder.CreateTable(
                name: "tblAssetRequests",
                schema: "asset",
                columns: table => new
                {
                    AssetRequestId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AssetRequestNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssetRequestEmployeeSystemUserId = table.Column<long>(type: "bigint", nullable: false),
                    AssetRequestAssignedCommitteeSystemUserId = table.Column<long>(type: "bigint", nullable: true),
                    AssetRequestAssignedPersonnelSystemUserId = table.Column<long>(type: "bigint", nullable: true),
                    AssetRequestStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AssetRequestIsActive = table.Column<bool>(type: "bit", nullable: false),
                    AssetRequestIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    AssetRequestCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AssetRequestUpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblAssetRequests", x => x.AssetRequestId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblAssetRequestHistories",
                schema: "asset");

            migrationBuilder.DropTable(
                name: "tblAssetRequestItems",
                schema: "asset");

            migrationBuilder.DropTable(
                name: "tblAssetRequests",
                schema: "asset");
        }
    }
}
