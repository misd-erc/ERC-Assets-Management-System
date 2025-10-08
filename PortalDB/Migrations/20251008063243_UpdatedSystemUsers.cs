using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedSystemUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<byte[]>(
                name: "SystemUserLastName",
                table: "SystemUsers",
                type: "varbinary(max)",
                nullable: true,
                oldClrType: typeof(byte[]),
                oldType: "varbinary(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<byte[]>(
                name: "SystemUserFirstName",
                table: "SystemUsers",
                type: "varbinary(max)",
                nullable: true,
                oldClrType: typeof(byte[]),
                oldType: "varbinary(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<byte[]>(
                name: "SystemUserEmail",
                table: "SystemUsers",
                type: "varbinary(max)",
                nullable: true,
                oldClrType: typeof(byte[]),
                oldType: "varbinary(150)",
                oldMaxLength: 150,
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<byte[]>(
                name: "SystemUserLastName",
                table: "SystemUsers",
                type: "varbinary(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(byte[]),
                oldType: "varbinary(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<byte[]>(
                name: "SystemUserFirstName",
                table: "SystemUsers",
                type: "varbinary(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(byte[]),
                oldType: "varbinary(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<byte[]>(
                name: "SystemUserEmail",
                table: "SystemUsers",
                type: "varbinary(150)",
                maxLength: 150,
                nullable: true,
                oldClrType: typeof(byte[]),
                oldType: "varbinary(max)",
                oldNullable: true);
        }
    }
}
