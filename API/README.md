# useful__commands
- `Add-Migration <Migration_Name> -p PortalDB -s API` to create migration using the db context on PortalDB in API project.
- `Update-Database -p PortalDB -s API` to update database and apply migration from PortalDB in API project.
- `dotnet run -- seed` to run the seed data script.
- `Remove-Migration -p PortalDB -s API -Force` to remove previous migration

--------------------------------------------------------------------------------------------------------------------------------------------

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

--------------------------------------------------------------------------------------------------------------------------------------------

# resetting__gitignore
- `git add .`
- `git commit -m "Save work before reapplying .gitignore"`
- `git rm -r --cached .`
- `git add .`
- `git commit -m "Reapply .gitignore"`

--------------------------------------------------------------------------------------------------------------------------------------------

# environtment__variables
- Import the following unto the System Environment Variables on the hosting machine.

## azure__variables
- `ERC_AMS_AZURE_AUTHORITY=tJxPb3k6l37LZhWTlOBVpxf9/UoMkUhDTeYr6XQCw4S6O90zWIZ3QajqOdoVh+Q4`
- `ERC_AMS_AZURE_BLOB_STORAGE_ACCOUNT_KEY=GGrac9KV17pWiRYwLU60kdo2AhMUyXzi3Y6yVM6ar7RF9R+/1bryqEFfEW7FgWObV/vuZquHfJOUubr2f4QLCEILuSrQF/I/g7tthyk60wK/vbmbk4KwKWBAIQNhCdTT`
- `ERC_AMS_AZURE_BLOB_STORAGE_ACCOUNT_NAME=leHnOJCtUaJ72nwaDZ/+5YevkqCKeTKL3AqGYu+MmpI=`
- `ERC_AMS_AZURE_BLOB_STORAGE_CONTAINER_NAME=nLNfRtyOHSHB2TEdGoKyWRCfv6g0dU0NG338omYmXJQ=`
- `ERC_AMS_AZURE_BLOB_STORAGE_DEFAULT_ENDPOINT_PROTOCOL=Uk6vyOJSm8ULHCU/0qxx3g==`
- `ERC_AMS_AZURE_BLOB_STORAGE_ENDPOINT_SUFFIX=3rcoKLONrsRNgSk8Q7nHYI89mi5qOPgMclV5kucC1QE=`
- `ERC_AMS_AZURE_CLIENT_ID=FQhEhmVVc3o32pXXchPKfBqDshZ5U6mtN7oSj/mONrlu0t5rp9A53XuXopvEX4LK`
- `ERC_AMS_AZURE_CLIENT_SECRET_ID=dEL14somWDhZ3018vLjkNRUrurjNmbcwk1pFz83SiuAvkP1tPVR8CjAJfmJjaiGn`
- `ERC_AMS_AZURE_CLIENT_SECRET_VALUE=HBVCu5gC51IVwpCilFFTHitNICzAsduKW6HzXsgVJYyiYsOOnkfMLmMT5chWKRs9`
- `ERC_AMS_AZURE_GRAPH_SCOPE=05UJ4pgdPTT/r5DliJ3d23xeoeauQIo0YQTRz7b5lQsGZfX1gSUEZuGbA8vs3Uvd`
- `ERC_AMS_AZURE_OBJECT_ID=UV+F/QSpW3HAD+WvwmpniEEjxJY3PUgSLG1ekNqGonsMXw4ugbDancRYqsGpRSay`
- `ERC_AMS_AZURE_TENANT_ID=JEvCi69uc4QwK8yIxbVpLz9qbcKo8q1/x6DtRAKp1IaHYv1YbnKDUi6P1zZi6IZ0`

## db_variable
- Change the following according to your database server settings. Use `Tests/Encryption/EncryptionTests.cs` project to encrypt/decrypt values.
- `ERC_AMS_DB_CONNECTION=XiP7wblRWSLas7dRnatQQ9nHsYEEHfNawKd6OQnydxmp7uS7M6VM1F7KFOExd0CHtAi2noDBWW6VW9dc7JcFkQL4EIr3Z1vEu5qbV1qt2J7fISppympXPFLbGDe9gM18WJf8zIzQUQKL4eCOjkkF5w==`

## email_variable
- `ERC_AMS_EMAIL_NO_REPLY=OMTirdOB+1NCo0FopAlxxXCDyCXr2vYrvnl2n0qnq1g=`

## encryption_variables
- `ERC_AMS_ENCRYPTION_IV=NDZE5W*##cENbgWk`
- `ERC_AMS_ENCRYPTION_KEY=?rv$bwB9SKbYQSw*GZyQ?&x7mHC2kkJD`