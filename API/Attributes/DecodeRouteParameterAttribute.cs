using Microsoft.AspNetCore.Mvc.Filters;
using System.Web;

namespace API.Attributes
{
    /// <summary>
    /// Automatically URL-decodes specified route parameters before reaching the controller action.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public class DecodeRouteParameterAttribute : ActionFilterAttribute
    {
        private readonly string[] _parameterNames;

        /// <param name="parameterNames">Names of route parameters to decode.</param>
        public DecodeRouteParameterAttribute(params string[] parameterNames)
        {
            _parameterNames = parameterNames;
        }

        public override void OnActionExecuting(ActionExecutingContext context)
        {
            foreach (var paramName in _parameterNames)
            {
                if (context.ActionArguments.TryGetValue(paramName, out var value) &&
                    value is string encodedValue &&
                    !string.IsNullOrWhiteSpace(encodedValue))
                {
                    // Re-normalize lost route-safe characters
                    string normalized = encodedValue
                        .Replace(" ", "+")      // Recover lost '+'
                        .Replace("%2F", "/")    // Optional: re-allow slash if you know your data can contain them
                        .Replace("%5C", "\\");  // Optional: if you expect backslashes

                    // Decode full URI
                    string decoded = Uri.UnescapeDataString(normalized);

                    context.ActionArguments[paramName] = decoded;
                }
            }

            base.OnActionExecuting(context);
        }

    }
}
