using PortalDB;
using PortalDB.Entities.LOG;
using PortalDB.Services;
using System;
using System.Diagnostics;
using System.Threading.Tasks;

namespace PortalTools.Services
{
    public static class ErrorTool
    {
        /// <summary>
        /// Logs an exception automatically detecting the calling controller or class.
        /// </summary>
        public static async Task ErrorLogAsync(PortalDbContext context, Exception ex, string file)
        {
            try
            {
                // Find the caller (controller, service, etc.)
                var stackTrace = new StackTrace();
                var frame = stackTrace.GetFrame(1); // 1 level up = caller
                var callerType = frame?.GetMethod()?.DeclaringType;

                // Try to get line number of exception
                var exTrace = new StackTrace(ex, true);
                var exFrame = exTrace.GetFrame(exTrace.FrameCount - 1);
                var lineNumber = exFrame?.GetFileLineNumber().ToString() ?? "N/A";

                var error = new TblErrorLog
                {
                    File = file,
                    Line = lineNumber,
                    Description = BuildErrorDescription(ex),
                    CreatedAt = DateTime.UtcNow
                };

                await context.TblErrorLogs.AddAsync(error);
                await context.SaveChangesAsync();
            }
            catch (Exception logEx)
            {
                Console.WriteLine($"[ErrorTool] Failed to log error: {logEx.Message}");
                Console.WriteLine($"[ErrorTool] Original exception: {ex.Message}");
            }
        }

        private static string BuildErrorDescription(Exception ex)
        {
            var desc = $"{ex.Message}\n{ex.StackTrace}";
            var inner = ex.InnerException;
            while (inner != null)
            {
                desc += $"\nInner Exception: {inner.Message}\n{inner.StackTrace}";
                inner = inner.InnerException;
            }

            // Limit very long entries (SQL safe)
            return desc.Length > 4000 ? desc[..4000] : desc;
        }
    }
}
