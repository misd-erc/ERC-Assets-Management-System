using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalDB.Migrations
{
    public partial class RecreateIdentityColumn : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // === 1. Handle tblOffices (OfficeId) ===
            migrationBuilder.Sql(
                @"
        BEGIN TRANSACTION;

        -- Drop FK from tblDivisions (if exists)
        IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_tblDivisions_tblOffices_OfficeId')
            ALTER TABLE dbo.tblDivisions DROP CONSTRAINT FK_tblDivisions_tblOffices_OfficeId;

        -- Drop PK on tblOffices
        ALTER TABLE dbo.tblOffices DROP CONSTRAINT PK_tblOffices;

        -- Add new identity column
        ALTER TABLE dbo.tblOffices ADD OfficeId_Temp BIGINT IDENTITY(1,1) NOT NULL;

        -- Drop old OfficeId
        ALTER TABLE dbo.tblOffices DROP COLUMN OfficeId;

        -- Rename temp to OfficeId
        EXEC sp_rename 'dbo.tblOffices.OfficeId_Temp', 'OfficeId', 'COLUMN';

        -- Re-add PK
        ALTER TABLE dbo.tblOffices ADD CONSTRAINT PK_tblOffices PRIMARY KEY (OfficeId);

        -- Re-add FK from tblDivisions
        ALTER TABLE dbo.tblDivisions ADD CONSTRAINT FK_tblDivisions_tblOffices_OfficeId
            FOREIGN KEY (OfficeId) REFERENCES dbo.tblOffices (OfficeId);

        COMMIT;
        ");

            // === 2. Handle tblDivisions (DivisionId) ===
            migrationBuilder.Sql(
                @"
        BEGIN TRANSACTION;

        -- Check if PK exists
        IF EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'PK_tblDivisions')
            ALTER TABLE dbo.tblDivisions DROP CONSTRAINT PK_tblDivisions;

        -- Add new identity column
        ALTER TABLE dbo.tblDivisions ADD DivisionId_Temp BIGINT IDENTITY(1,1) NOT NULL;

        -- Drop old DivisionId
        ALTER TABLE dbo.tblDivisions DROP COLUMN DivisionId;

        -- Rename temp
        EXEC sp_rename 'dbo.tblDivisions.DivisionId_Temp', 'DivisionId', 'COLUMN';

        -- Re-add PK
        ALTER TABLE dbo.tblDivisions ADD CONSTRAINT PK_tblDivisions PRIMARY KEY (DivisionId);

        COMMIT;
        ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"
        BEGIN TRANSACTION;

        -- === Reverse tblOffices ===
        ALTER TABLE dbo.tblDivisions DROP CONSTRAINT FK_tblDivisions_tblOffices_OfficeId;
        ALTER TABLE dbo.tblOffices DROP CONSTRAINT PK_tblOffices;

        EXEC sp_rename 'dbo.tblOffices.OfficeId', 'OfficeId_Temp', 'COLUMN';
        ALTER TABLE dbo.tblOffices ADD OfficeId BIGINT NOT NULL DEFAULT 0;
        ALTER TABLE dbo.tblOffices ADD CONSTRAINT PK_tblOffices PRIMARY KEY (OfficeId);
        ALTER TABLE dbo.tblOffices DROP COLUMN OfficeId_Temp;

        ALTER TABLE dbo.tblDivisions ADD CONSTRAINT FK_tblDivisions_tblOffices_OfficeId
            FOREIGN KEY (OfficeId) REFERENCES dbo.tblOffices (OfficeId);

        -- === Reverse tblDivisions ===
        ALTER TABLE dbo.tblDivisions DROP CONSTRAINT PK_tblDivisions;
        EXEC sp_rename 'dbo.tblDivisions.DivisionId', 'DivisionId_Temp', 'COLUMN';
        ALTER TABLE dbo.tblDivisions ADD DivisionId BIGINT NOT NULL DEFAULT 0;
        ALTER TABLE dbo.tblDivisions ADD CONSTRAINT PK_tblDivisions PRIMARY KEY (DivisionId);
        ALTER TABLE dbo.tblDivisions DROP COLUMN DivisionId_Temp;

        COMMIT;
        ");
        }
    }
}