using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class ReportsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
