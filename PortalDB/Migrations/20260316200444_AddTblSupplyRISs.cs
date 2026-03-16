using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddTblSupplyRISs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblSupplyRISs",
                schema: "asset",
                columns: table => new
                {
                    SupplyRISId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SupplyRISEntityName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupplyRISFundCluster = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DivisionId = table.Column<long>(type: "bigint", nullable: true),
                    OfficeId = table.Column<long>(type: "bigint", nullable: true),
                    SupplyResponsibilityCenterCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupplyRISNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupplyRISNumberDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SupplyRISPurpose = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupplyRISRequestedBySystemUserId = table.Column<long>(type: "bigint", nullable: true),
                    SupplyRISApprovedBySystemUserId = table.Column<long>(type: "bigint", nullable: true),
                    SupplyRISIssuedBySystemUserId = table.Column<long>(type: "bigint", nullable: true),
                    SupplyRISRecievedBySystemUserId = table.Column<long>(type: "bigint", nullable: true),
                    SupplyRISIsApproved = table.Column<bool>(type: "bit", nullable: false),
                    SupplyRISIsActive = table.Column<bool>(type: "bit", nullable: false),
                    SupplyRISIsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    SupplyRISCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SupplyRISApprovedOn = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblSupplyRISs", x => x.SupplyRISId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblSupplyRISs",
                schema: "asset");
        }
    }
}
