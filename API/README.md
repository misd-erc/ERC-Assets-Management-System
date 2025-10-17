# useful__commands
- `Add-Migration <Migration_Name> -p PortalDB -s API` to create migration using the db context on PortalDB in API project.
- `Update-Database -p PortalDB -s API` to update database and apply migration from PortalDB in API project.
- `dotnet run -- seed` to run the seed data script.


# naming__conventions
## table__naming__conventions
- Table file and class name should start with Tbl and should be singular (e.g. TblUser.cs, TblProduct.cs).
- Database table name should start with tbl and plural (e.g. tblUsers, tblProducts).
- If it's a view, it should start with vw (e.g. vwUserDetails.cs, vwProductDetails.cs).
- Database view file and class name should start with Vw (e.g. VwUserDetails, VwProductDetails).

## column__naming__conventions
- Column name should indicate the table class name it belongs to in singular (e.g. SystemUserId, ProductName - where SystemUser is the table class name).
- Ids should always be long
- Follow encrypted get/set form for contents that needs to be encrypted (e.g. EncryptedPassword, EncryptedApiKey).
- All should be nullable (except primary key) even though we will make it as required to prevent future possible issues.

# resetting__gitignore
- `git add .`
- `git commit -m "Save work before reapplying .gitignore"`
- `git rm -r --cached .`
- `git add .`
- `git commit -m "Reapply .gitignore"`