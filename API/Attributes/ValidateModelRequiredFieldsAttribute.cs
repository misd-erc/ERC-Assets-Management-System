using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using PortalCommon.Models.Responses;
using System.ComponentModel.DataAnnotations;
using System.Reflection;

namespace API.Attributes
{
    /// <summary>
    /// Automatically validates that all [Required] properties
    /// in the incoming model have non-null, non-empty values.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class ValidateModelRequiredFieldsAttribute : Attribute, IActionFilter
    {
        public void OnActionExecuting(ActionExecutingContext context)
        {
            // 🔍 Find the model parameter
            var model = context.ActionArguments.Values.FirstOrDefault();
            if (model == null)
            {
                context.Result = new BadRequestObjectResult(ApiResponse<object>.Fail("INVALID_INPUT", "Request body is missing."));
                return;
            }

            // 🔎 Inspect all properties marked [Required]
            var requiredProps = model.GetType()
                .GetProperties(BindingFlags.Public | BindingFlags.Instance)
                .Where(p => p.GetCustomAttribute<RequiredAttribute>() != null)
                .ToList();

            foreach (var prop in requiredProps)
            {
                var value = prop.GetValue(model);

                bool isInvalid = value == null ||
                                 (value is string str && string.IsNullOrWhiteSpace(str));

                if (isInvalid)
                {
                    context.Result = new BadRequestObjectResult(
                        ApiResponse<object>.Fail("INVALID_INPUT", $"{prop.Name} is required and cannot be empty.")
                    );
                    return;
                }
            }
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
            // No action needed after execution
        }
    }
}
