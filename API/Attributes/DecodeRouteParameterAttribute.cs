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
                if (context.ActionArguments.ContainsKey(paramName) &&
                    context.ActionArguments[paramName] is string encodedValue &&
                    !string.IsNullOrWhiteSpace(encodedValue))
                {
                    // Decode the URL-encoded parameter value
                    string decodedValue = HttpUtility.UrlDecode(encodedValue);
                    context.ActionArguments[paramName] = decodedValue;
                }
            }

            base.OnActionExecuting(context);
        }
    }
}
