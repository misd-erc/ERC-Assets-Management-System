using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddedNewTblSupplyVendor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblSupplyVendors",
                schema: "asset",
                columns: table => new
                {
                    SupplyVendorId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SupplyVendorName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupplyVendorIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SupplyVendorIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SupplyVendorCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSupplyVendors", x => x.SupplyVendorId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblSupplyVendors",
                schema: "asset");
        }
    }
}
