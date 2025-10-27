using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using PortalCommon.Models.Responses;
using PortalCommon.Utilities;
using PortalTools.Services;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace PortalAPI.Attributes
{
    /// <summary>
    /// Validates the session token using the ActionBySystemUserIdEncrypted property
    /// from the incoming model. Returns SessionTokenExpired() if invalid.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class ValidateSessionTokenAttribute : Attribute, IAsyncActionFilter
    {
        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            try
            {
                // 🔍 Find any action parameter that has a property named ActionBySystemUserIdEncrypted
                var modelObj = context.ActionArguments.Values
                    .FirstOrDefault(arg => arg?.GetType().GetProperty("ActionBySystemUserIdEncrypted") != null);

                if (modelObj == null)
                {
                    context.Result = new JsonResult(ApiResponse<object>.NoContent("Missing ActionBySystemUserIdEncrypted in request model."));
                    return;
                }

                // 🧩 Get encrypted ID
                var encryptedId = modelObj.GetType()
                    .GetProperty("ActionBySystemUserIdEncrypted")
                    ?.GetValue(modelObj)?
                    .ToString();

                if (string.IsNullOrWhiteSpace(encryptedId))
                {
                    context.Result = new JsonResult(ApiResponse<object>.Unauthorized("Invalid or missing encrypted user ID."));
                    return;
                }

                // 🔓 Decrypt and validate token
                var userId = long.Parse(EncryptionHelper.Decrypt(encryptedId));

                // ✅ Resolve AuthTools from DI container
                var authTools = context.HttpContext.RequestServices.GetService<AuthTools>();
                if (authTools == null)
                {
                    context.Result = new JsonResult(ApiResponse<object>.Conflict("Internal service error: AuthTools not available."));
                    return;
                }

                bool isValid = await authTools.ValidateSessionTokenInternally(userId);
                if (!isValid)
                {
                    context.Result = new JsonResult(ApiResponse<object>.SessionTokenExpired());
                    return;
                }

                // 🎯 Continue to controller action
                await next();
            }
            catch (Exception ex)
            {
                context.Result = new JsonResult(ApiResponse<object>.Unauthorized($"Token validation failed: {ex.Message}"));
            }
        }
    }
}
