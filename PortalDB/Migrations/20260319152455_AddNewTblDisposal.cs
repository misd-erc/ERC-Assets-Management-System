using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddNewTblDisposal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblDisposalItems",
                schema: "asset",
                columns: table => new
                {
                    DisposalItemId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DisposalId = table.Column<long>(type: "bigint", nullable: true),
                    PTAId = table.Column<long>(type: "bigint", nullable: true),
                    DisposalItemIsActive = table.Column<bool>(type: "bit", nullable: false),
                    DisposalItemIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DisposalItemCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblDisposalItems", x => x.DisposalItemId);
                });

            migrationBuilder.CreateTable(
                name: "tblDisposals",
                schema: "asset",
                columns: table => new
                {
                    DisposalId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DisposalGroup = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DisposalNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DisposalReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DisposalMethod = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DisposalRequestedBySystemUserId = table.Column<long>(type: "bigint", nullable: true),
                    DisposalApprovedBySystemUserId = table.Column<long>(type: "bigint", nullable: true),
                    DisposalDateRequested = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DisposalDateApproved = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DisposalDateDisposed = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DisposalProceedAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    DisposalBuyer = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DisposalRemarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DisposalStatus = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DisposalIsActive = table.Column<bool>(type: "bit", nullable: false),
                    DisposalIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DisposalCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblDisposals", x => x.DisposalId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblDisposalItems",
                schema: "asset");

            migrationBuilder.DropTable(
                name: "tblDisposals",
                schema: "asset");
        }
    }
}
