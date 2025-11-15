using System;
using System.IO;
using System.Threading.Tasks;
using PortalCommon.Constants;
using RazorLight;

namespace PortalTools.Services
{
    public class RazorRendererTools
    {
        private readonly RazorLightEngine _engine;
        private readonly string _viewsRoot;

        public RazorRendererTools()
        {
            var baseDir = AppContext.BaseDirectory;
            var binPath = Path.Combine(baseDir, "Partials");
            var devPath = Path.GetFullPath(binPath);

            _viewsRoot = Directory.Exists(binPath) ? binPath :
                         Directory.Exists(devPath) ? devPath :
                         throw new DirectoryNotFoundException($"Razor views folder not found at either:\n{binPath}\n{devPath}");

            _engine = new RazorLightEngineBuilder()
                .UseFileSystemProject(_viewsRoot)
                .UseMemoryCachingProvider()
                .SetOperatingAssembly(typeof(RazorRendererTools).Assembly)
                .Build();
        }

        public async Task<string> RenderAsync<TModel>(string relativeViewPath, TModel model)
        {
            if (string.IsNullOrWhiteSpace(relativeViewPath))
                throw new ArgumentException("View path cannot be null or empty.", nameof(relativeViewPath));

            var fullPath = Path.Combine(_viewsRoot, relativeViewPath);

            if (!File.Exists(fullPath))
                throw new FileNotFoundException($"Razor view not found at: {fullPath}");

            var relativePath = Path.GetRelativePath(_viewsRoot, fullPath);

            return await _engine.CompileRenderAsync(relativePath, model);
        }
    }
}
