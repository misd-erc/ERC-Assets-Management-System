using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddedSupplyIAR : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblSupplyIARs",
                schema: "asset",
                columns: table => new
                {
                    SupplyIARId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SupplyIAREntityName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupplyIARFundCluster = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupplySupplyVendorId = table.Column<long>(type: "bigint", nullable: true),
                    SupplyIARPONumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupplyOfficeId = table.Column<long>(type: "bigint", nullable: true),
                    SupplyDivisionId = table.Column<long>(type: "bigint", nullable: true),
                    SupplyIARNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupplyIARNumberDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SupplyIARInvoiceNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupplyIARInvoiceDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SupplyIARPODate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SupplyIARIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SupplyIARIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SupplyIARCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSupplyIARs", x => x.SupplyIARId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblSupplyIARs",
                schema: "asset");
        }
    }
}
