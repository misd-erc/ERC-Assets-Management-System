using Azure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Graph;
using Microsoft.Graph.Models;
using Microsoft.Graph.Models.ODataErrors;
using Microsoft.Graph.Users.Item.SendMail;
using Microsoft.Identity.Client;
using Microsoft.Kiota.Abstractions;
using PortalCommon.Constants;
using PortalCommon.Utilities;
using PortalCommon.ViewModels.SMTP;
using PortalDB.Services;
using PortalTools.Services.DBO.Account;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace PortalTools.Services
{
    public class AzureTools
    {
        private readonly IConfidentialClientApplication _confidentialClientApp;
        private static GraphServiceClient? _graphClient;
        public readonly HttpClient _httpClient;

        public AzureTools(DbContextOptions<PortalDbContext> options)
        {
            _confidentialClientApp = ConfidentialClientApplicationBuilder.Create(EncryptionHelper.Decrypt(AzureConstants.ClientId))
                .WithClientSecret(EncryptionHelper.Decrypt(AzureConstants.ClientSecretValue))
                .WithAuthority(new Uri($"{EncryptionHelper.Decrypt(AzureConstants.Authority)}/{EncryptionHelper.Decrypt(AzureConstants.TenantId)}"))
                .Build();
            _httpClient = new HttpClient();
        }

        /// <summary>
        /// Authenticates to Azure and retrieves an access token for Microsoft Graph.
        /// </summary>
        private async Task<string> GetAccessTokenAsync()
        {
            var result = await _confidentialClientApp
                .AcquireTokenForClient(new[] { EncryptionHelper.Decrypt(AzureConstants.GraphScope) })
                .ExecuteAsync();

            return result.AccessToken;
        }

        /// <summary>
        /// Fetches a list of Microsoft Entra ID (Azure AD) users via Microsoft Graph API.
        /// </summary>
        public async Task<string> GetAzureEntraUsersAsync()
        {
            var token = await GetAccessTokenAsync();

            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.GetAsync("https://graph.microsoft.com/v1.0/users");

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Error fetching users from Azure AD: {response.StatusCode} - {error}");
            }

            return await response.Content.ReadAsStringAsync(); // returns JSON string of Entra users
        }

        /// <summary>
        /// Initializes the Microsoft Graph client using Azure AD credentials from environment variables.
        /// </summary>
        public static GraphServiceClient GetGraphClient()
        {
            if (_graphClient != null)
                return _graphClient;

            var tenantId = EncryptionHelper.Decrypt(AzureConstants.TenantId);
            var clientId = EncryptionHelper.Decrypt(AzureConstants.ClientId);
            var clientSecret = EncryptionHelper.Decrypt(AzureConstants.ClientSecretValue);

            if (string.IsNullOrWhiteSpace(tenantId) ||
                string.IsNullOrWhiteSpace(clientId) ||
                string.IsNullOrWhiteSpace(clientSecret))
            {
                throw new InvalidOperationException("Azure AD credentials are missing in environment variables.");
            }

            var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
            _graphClient = new GraphServiceClient(credential, new[] { EncryptionHelper.Decrypt(AzureConstants.GraphScope) });

            return _graphClient;
        }

        /// <summary>
        /// Sends an HTML email via Microsoft Graph API using Azure AD app credentials.
        /// </summary>
        public static async Task<bool> SendEmailAsync(EmailViewModel vm, DbContextOptions<PortalDbContext> options)
        {
            try
            {
                var graphClient = GetGraphClient();

                var message = new Message
                {
                    Subject = vm.Subject,
                    Body = new ItemBody
                    {
                        ContentType = vm.IsHTML ? BodyType.Html : BodyType.Text,
                        Content = vm.Body
                    },
                    ToRecipients = vm.Emails?.Select(email => new Recipient
                    {
                        EmailAddress = new EmailAddress
                        {
                            Address = email
                        }
                    }).ToList() ?? new List<Recipient>()
                };

                await graphClient.Users[EncryptionHelper.Decrypt(EmailConstants.NoReplyEmail)]
                    .SendMail
                    .PostAsync(new SendMailPostRequestBody
                    {
                        Message = message,
                        SaveToSentItems = true
                    });

                return true;
            }
            catch (ODataError ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(options), ex, nameof(AzureTools));
                throw;
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(new PortalDbContext(options), ex, nameof(AzureTools));
                throw;
            }
        }

    }
}
