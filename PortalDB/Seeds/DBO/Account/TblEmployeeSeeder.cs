using PortalCommon.Utilities;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Services;
using System.Collections.Generic;
using System.Linq;

namespace PortalDB.Seeds.DBO.Account
{
    internal static class TblEmployeeSeeder
    {
        //public static void Seed(PortalDbContext context)
        //{
        //    if (context.TblEmployees.Any())
        //        return;

        //    TblEmployee Employee(string firstName, 
        //        string middleName, 
        //        string lastName, 
        //        string employeeIdOriginal, 
        //        long officeId, 
        //        long divisionId, 
        //        long employmentTypeId, 
        //        long positionId) => new()
        //        {
        //            FirstNameEncrypted = EncryptionHelper.Encrypt(firstName),
        //            MiddleNameEncrypted = EncryptionHelper.Encrypt(middleName),
        //            LastNameEncrypted = EncryptionHelper.Encrypt(lastName),
        //            EmployeeIdOriginalEncrypted = EncryptionHelper.Encrypt(employeeIdOriginal),
        //            OfficeId = officeId,
        //            DivisionId = divisionId,
        //            EmploymentTypeId = employmentTypeId,
        //            PositionId = positionId
        //        };

        //    var employees = new List<TblEmployee>
        //    {
        //        Employee("Administrator", "Oversees and manages all components of the system"),
        //        Employee("Employee", "Default system role with basic privileges")
        //    };

        //    context.TblEmployees.AddRange(employees);
        //    context.SaveChanges();
        //}
    }
}
