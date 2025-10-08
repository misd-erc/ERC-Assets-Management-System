# useful__commands
1. `Add-Migration <Migration_Name_> -p PortalDB -s API` to create migration.
2. `Update-Database -p PortalDB -s API` to update database and apply migration.


# naming__conventions
## table__naming__conventions
1. Table file and class name should start with Tbl and should be singular (e.g. TblUser.cs, TblProduct.cs).
2. Database table name should start with tbl and plural (e.g. tblUsers, tblProducts).
3. Refer to TblSystemUser for column naming reference and appropriate attributes. 