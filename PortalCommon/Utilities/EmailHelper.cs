using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using PortalCommon.Constants;
using PortalCommon.ViewModels.SMTP;
using PortalTools.Utilities;
using System;
using System.Threading.Tasks;

namespace PortalCommon.Utilities
{
    public static class EmailHelper
    {
        /// <summary>
        /// Sends an email using Microsoft SMTP (Office 365 / Outlook) with the provided email model.
        /// </summary>
        /// <param name="vm">
        /// The <see cref="EmailViewModel"/> containing all required email details such as 
        /// recipient address, subject, body, sender credentials, and optional HTML flag.
        /// </param>
        /// <returns>
        /// A task that represents the asynchronous send operation. 
        /// The task result is <c>true</c> if the email was sent successfully; otherwise, <c>false</c>.
        /// </returns>
        public static async Task<bool> SendEmailAsync(EmailViewModel vm)
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("AMS Portal Notification", EncryptionHelper.Decrypt(EmailConstants.SMTPEmail)));
                message.To.Add(new MailboxAddress("", vm.Email));
                message.Subject = vm.Subject;

                var builder = new BodyBuilder();
                if (vm.IsHTML)
                    builder.HtmlBody = vm.Body;
                else
                    builder.TextBody = vm.Body;

                message.Body = builder.ToMessageBody();

                using var client = new SmtpClient();

                await client.ConnectAsync(EmailConstants.SMTPHost, EmailConstants.SMTPPort, SecureSocketOptions.SslOnConnect);
                await client.AuthenticateAsync(EncryptionHelper.Decrypt(EmailConstants.SMTPEmail), EncryptionHelper.Decrypt(EmailConstants.SMTPPassword));
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Email sending failed: {ex.Message}");
                return false;
            }
        }
    }
}
