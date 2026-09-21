using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PortalDB.Entities.DBO.Account;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalCommon.Utilities;
using PortalTools.Services;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace PortalAPI.Attributes
{
    /// <summary>
    /// Validates the session token using the ActionBySystemUserId property
    /// from the incoming model. Returns SessionTokenExpired() if invalid.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class ValidateSessionTokenAttribute : Attribute, IAsyncActionFilter
    {
        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            try
            {

                // TEMPORARY DEV LOGIN BYPASS - remove this block when no longer needed.
                // Enable via "DevAuthBypass:Enabled" in appsettings.Development.json.
                var configuration = context.HttpContext.RequestServices.GetService<IConfiguration>();
                var environment = context.HttpContext.RequestServices.GetService<IWebHostEnvironment>();
                if (environment?.IsDevelopment() == true && configuration?.GetValue<bool>("DevAuthBypass:Enabled") == true)
                {
                    EnsureDevSessionToken(configuration, context.HttpContext.RequestServices);
                    Console.WriteLine("[DevAuthBypass] Skipping session token validation.");
                    await next();
                    return;
                }

                var modelObj = context.ActionArguments.Values
                    .FirstOrDefault(arg => arg?.GetType().GetProperty("ActionBySystemUserId") != null && arg?.GetType().GetProperty("SessionKey") != null);

                if (modelObj == null)
                {
                    context.Result = new BadRequestObjectResult(ApiResponse<object>.Fail("INVALID_INPUT", "Missing ActionBySystemUserId or SessionKey in request model."));
                    return;
                }

                var ActionBySystemUserId = modelObj.GetType()
                    .GetProperty("ActionBySystemUserId")
                    ?.GetValue(modelObj)?
                    .ToString();

                var sessionKey = modelObj.GetType()
                    .GetProperty("SessionKey")
                    ?.GetValue(modelObj)?
                    .ToString();

                if (string.IsNullOrWhiteSpace(ActionBySystemUserId))
                {
                    context.Result = new UnauthorizedObjectResult(ApiResponse<object>.Unauthorized("Invalid or missing system user id."));
                    return;
                }

                if (string.IsNullOrWhiteSpace(sessionKey))
                {
                    context.Result = new UnauthorizedObjectResult(ApiResponse<object>.Unauthorized("Invalid or missing session key."));
                    return;
                }

                long userId = long.Parse(ActionBySystemUserId);

                var authTools = context.HttpContext.RequestServices.GetService<AuthTools>();
                if (authTools == null)
                {
                    context.Result = new ConflictObjectResult(ApiResponse<object>.Conflict("Internal service error: AuthTools not available."));
                    return;
                }

                bool isValid = await authTools.ValidateSessionTokenInternally(userId, sessionKey);
                if (!isValid)
                {
                    context.Result = new UnauthorizedObjectResult(ApiResponse<object>.SessionTokenExpired());
                    return;
                }

                await next();
            }
            catch (Exception ex)
            {
                context.Result = new UnauthorizedObjectResult(ApiResponse<object>.Unauthorized($"Token validation failed: {ex.Message}"));
            }
        }

        private static bool _devSessionEnsured;
        private static readonly object _devSessionLock = new();

        /// <summary>
        /// TEMPORARY DEV LOGIN BYPASS helper. Skipping the attribute alone is not enough:
        /// some controllers resolve the caller via GetSystemUserIdBySessionKeyAsync and would
        /// throw "Session not found". This seeds a real (long-lived) session row for the dev
        /// user once per process so those lookups succeed.
        /// </summary>
        private static void EnsureDevSessionToken(IConfiguration? configuration, IServiceProvider services)
        {
            if (_devSessionEnsured)
                return;

            lock (_devSessionLock)
            {
                if (_devSessionEnsured)
                    return;

                try
                {
                    var options = services.GetService<DbContextOptions<PortalDbContext>>();
                    if (options != null)
                    {
                        long devSystemUserId = configuration?.GetValue<long?>("DevAuthBypass:SystemUserId") ?? 1;
                        string devSessionKey = configuration?.GetValue<string>("DevAuthBypass:SessionKey") ?? "dev-bypass-session";

                        using var db = new PortalDbContext(options);
                        var token = db.TblSessionTokens.FirstOrDefault(x => x.Key == devSessionKey && !x.IsDeleted);
                        if (token == null)
                        {
                            db.TblSessionTokens.Add(new TblSessionToken
                            {
                                SystemUserId = devSystemUserId,
                                Key = devSessionKey,
                                ValidUntil = DateTime.UtcNow.AddYears(1),
                                IsDeleted = false,
                                CreatedAt = DateTime.UtcNow
                            });
                            db.SaveChanges();
                        }
                        else if (token.SystemUserId != devSystemUserId || token.ValidUntil < DateTime.UtcNow)
                        {
                            token.SystemUserId = devSystemUserId;
                            token.ValidUntil = DateTime.UtcNow.AddYears(1);
                            db.SaveChanges();
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[DevAuthBypass] Failed to ensure dev session token: {ex.Message}");
                }

                _devSessionEnsured = true;
            }
        }
    }
}
