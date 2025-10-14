using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalCommon.Enums;
using PortalCommon.Responses;
using PortalCommon.Utilities;
using PortalCommon.ViewModels.Account;
using PortalCommon.ViewModels.SMTP;
using PortalDB.Entities.DBO.Account;
using PortalDB.Services;
using PortalTools.Services.DBO.Account;
using PortalTools.Utilities;
using System.Diagnostics;
using System.Threading.Tasks;
using static System.Net.WebRequestMethods;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly AccountGetTools _accountGetTools;
        private readonly AccountEditTools _accountEditTools;

        public UsersController(AccountGetTools accountGetTools, 
            AccountEditTools accountEditTools,
            DbContextOptions<PortalDbContext> options)
        {
            _accountGetTools = accountGetTools;
            _accountEditTools = accountEditTools;
            _options = options;
        }

        // POST api/users/validation
        [HttpPost("validation")]
        public async Task<IActionResult> ValidateUser([FromBody] UserValidationViewModel model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.EntraId) || string.IsNullOrWhiteSpace(model.Email))
                return BadRequest(ApiResponse<object>.Fail(ErrorCodes.INVALID_INPUT, "Invalid request payload."));

            try
            {

                #region Transaction
                await using var context = new PortalDbContext(_options);
                await using var transaction = await context.Database.BeginTransactionAsync();

                TblSystemUser user = new()
                {
                    EntraId = long.Parse(EncryptionHelper.Decrypt(model.EntraId)),
                    FirstName = EncryptionHelper.Decrypt(model.FirstName),
                    LastName = EncryptionHelper.Decrypt(model.LastName),
                    Email = EncryptionHelper.Decrypt(model.Email)
                };

                long systemUserId = await _accountEditTools.EditTblSystemUserAsync(user, context);

                if (systemUserId > 0)
                {
                    #region OTP Generation
                    var (otp, expiry) = OTPHelper.GenerateTimedOTP(user.EntraId.ToString(), 3);

                    TblOneTimePassword otpGenerated = new()
                    {
                        SystemUserId = systemUserId,
                        OTP = otp,
                        ValidUntil = expiry
                    };
                    #endregion
                    #region OTP Insert
                    await _accountEditTools.AddTblOneTimePasswordAsync(otpGenerated, context);
                    #endregion
                    #region OTP Email Sender
                    EmailViewModel newEmail = new()
                    {
                        Email = user.Email,
                        Name = $"{user.FirstName} {user.LastName}",
                        Subject = "Your AMS One-Time Password (OTP)",
                        Body = $"Hello {user.FirstName},<br/><br/>Your One-Time Password (OTP) is: <strong>{otp}</strong><br/>This OTP is valid for 3 minutes.<br/><br/>If you did not request this, please contact support immediately.<br/><br/>Best regards,<br/>AMS Team"
                    };

                    //await EmailHelper.SendEmailAsync(newEmail);

                    #endregion
                }
                else
                    throw new Exception("SystemUserId was not returned");

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                #endregion

                return Ok(ApiResponse<object>.Ok(null, $"OTP has been sent to email address"));

            }
            catch (Exception ex)
            {
                //Log the exception (not shown here for brevity)
                return StatusCode(500, ApiResponse<object>.Fail(ErrorCodes.SERVER_ERROR, "An error occurred while processing your request."));
            }

        }
    }
}
