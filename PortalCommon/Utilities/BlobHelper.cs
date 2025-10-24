using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.Utilities
{
    public static class BlobHelper
    {
        /// <summary>
        /// Generates a unique, URL-safe blob name to prevent collisions when uploading files.
        /// Combines the original filename, timestamp, and a GUID.
        /// </summary>
        /// <param name="originalFileName">The original name of the uploaded file.</param>
        /// <returns>A unique blob name with the same file extension.</returns>
        public static string GenerateUniqueBlobName(string originalFileName)
        {
            if (string.IsNullOrWhiteSpace(originalFileName))
                throw new ArgumentException("Original file name cannot be null or empty.", nameof(originalFileName));

            var sanitizedFileName = Path.GetFileNameWithoutExtension(originalFileName)
                .Replace(" ", "_")
                .Replace(":", "-")
                .Replace("/", "-")
                .Replace("\\", "-");

            var extension = Path.GetExtension(originalFileName);
            var uniqueId = Guid.NewGuid().ToString("N");
            var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");

            // Example output: profilepic_20251023_9b4d8aefb2134f9db97a123456789abc.jpg
            return $"{sanitizedFileName}_{timestamp}_{uniqueId}{extension}";
        }
    }
}
