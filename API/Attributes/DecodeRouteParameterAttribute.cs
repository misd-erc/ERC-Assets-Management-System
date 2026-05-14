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
                    string normalized = encodedValue
                        .Replace(" ", "+")      // Recover lost '+'
                        .Replace("%2F", "/")    // Re-allow slash
                        .Replace("%5C", "\\");  // Backslashes

                    string decoded = Uri.UnescapeDataString(normalized);

                    context.ActionArguments[paramName] = decoded;
                }
            }

            base.OnActionExecuting(context);
        }

    }
}
