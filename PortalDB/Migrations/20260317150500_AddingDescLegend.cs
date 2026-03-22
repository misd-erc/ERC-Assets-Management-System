using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class AddingDescLegend : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SupplyRISNumberDate",
                schema: "asset",
                table: "tblSupplyRISs");

            migrationBuilder.AddColumn<string>(
                name: "PTALegendDescription",
                schema: "asset",
                table: "tblPTALegends",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PTALegendDescription",
                schema: "asset",
                table: "tblPTALegends");

            migrationBuilder.AddColumn<DateTime>(
                name: "SupplyRISNumberDate",
                schema: "asset",
                table: "tblSupplyRISs",
                type: "datetime2",
                nullable: true);
        }
    }
}
