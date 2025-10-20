using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class InventoryController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
