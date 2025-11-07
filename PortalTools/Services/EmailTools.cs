using Microsoft.EntityFrameworkCore;
using PortalDB.Models.ViewModels.Email;
using PortalDB.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PortalTools.Services
{
    public static class EmailTools
    {
        /// <summary>
        /// Sends an email using a Razor template or plain text.
        /// Automatically logs failures to the error log.
        /// </summary>
        public static async Task<bool> SendSystemEmailAsync(
            DbContextOptions<PortalDbContext> options,
            string subject,
            string templateNameOrBody,
            IEnumerable<string> recipients,
            bool isHtml = true,
            EmailViewModel? model = null)
        {
            try
            {
                string body = templateNameOrBody;

                // If a Razor template is specified, render it using the provided EmailViewModel
                if (templateNameOrBody.EndsWith(".cshtml", StringComparison.OrdinalIgnoreCase))
                {
                    if (model == null)
                        throw new ArgumentNullException(nameof(model),
                            "An EmailViewModel is required when rendering a Razor template.");

                    var renderer = new RazorRendererTools();
                    body = await renderer.RenderAsync(templateNameOrBody, model);
                }

                // Use the given model or create one if not provided (for plain-text emails)
                var emailVm = model ?? new EmailViewModel
                {
                    Subject = subject,
                    Body = body,
                    Emails = recipients.ToList(),
                    IsHTML = isHtml
                };

                // Ensure recipients and subject/body are updated from parameters
                emailVm.Subject = subject;
                emailVm.Body = body;
                emailVm.Emails = recipients.ToList();
                emailVm.IsHTML = isHtml;

                return await AzureTools.SendEmailAsync(emailVm, options);
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(options), ex, nameof(EmailTools));
                return false;
            }
        }

        /// <summary>
        /// Quick shortcut for sending to a single recipient.
        /// </summary>
        public static Task<bool> SendSystemEmailAsync(
            DbContextOptions<PortalDbContext> options,
            string subject,
            string templateNameOrBody,
            string recipient,
            bool isHtml = true,
            EmailViewModel? model = null)
        {
            return SendSystemEmailAsync(options, subject, templateNameOrBody, new List<string> { recipient }, isHtml, model);
        }
    }
}
