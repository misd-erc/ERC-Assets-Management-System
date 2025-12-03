using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalCommon.Constants;
using System.Reflection;

namespace API.Controllers
{

    [Route("api/[controller]")]
    [ApiController]
    public class SystemStatusController : ControllerBase
    {
        [HttpGet("system-environment")]
        [AllowAnonymous]
        public IActionResult GetSystemEnvironment()
        {
            var type = typeof(EnvironmentConstants);
            var fields = type.GetFields(BindingFlags.Public | BindingFlags.Static)
                             .Where(f => f.FieldType == typeof(string))
                             .Select(f => new
                             {
                                 Name = f.Name,
                                 Value = (string?)f.GetValue(null) ?? string.Empty
                             })
                             .ToList();

            var missing = fields
                .Where(f => string.IsNullOrWhiteSpace(f.Value))
                .Select(f => f.Name)
                .ToList();

            if (missing.Count == 0)
            {
                return Ok(new { status = "healthy" });
            }

            return Ok(new
            {
                status = "unhealth",
                missing
            });
        }
    }
}
