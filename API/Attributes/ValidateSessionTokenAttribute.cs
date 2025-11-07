using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using PortalDB.Models.Responses;
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

                var modelObj = context.ActionArguments.Values
                    .FirstOrDefault(arg => arg?.GetType().GetProperty("ActionBySystemUserId") != null && arg?.GetType().GetProperty("SessionKey") != null);

                if (modelObj == null)
                {
                    context.Result = new JsonResult(ApiResponse<object>.NoContent("Missing ActionBySystemUserId o SessionKey in request model."));
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
                    context.Result = new JsonResult(ApiResponse<object>.Unauthorized("Invalid or missing system user id."));
                    return;
                }

                if (string.IsNullOrWhiteSpace(sessionKey))
                {
                    context.Result = new JsonResult(ApiResponse<object>.Unauthorized("Invalid or missing session key."));
                    return;
                }

                long userId = long.Parse(ActionBySystemUserId);

                var authTools = context.HttpContext.RequestServices.GetService<AuthTools>();
                if (authTools == null)
                {
                    context.Result = new JsonResult(ApiResponse<object>.Conflict("Internal service error: AuthTools not available."));
                    return;
                }

                bool isValid = await authTools.ValidateSessionTokenInternally(userId, sessionKey);
                if (!isValid)
                {
                    context.Result = new JsonResult(ApiResponse<object>.SessionTokenExpired());
                    return;
                }

                await next();
            }
            catch (Exception ex)
            {
                context.Result = new JsonResult(ApiResponse<object>.Unauthorized($"Token validation failed: {ex.Message}"));
            }
        }
    }
}
