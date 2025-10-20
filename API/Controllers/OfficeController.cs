using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class OfficeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
