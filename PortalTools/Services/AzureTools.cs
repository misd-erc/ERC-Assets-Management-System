using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Microsoft.Identity.Client;
using PortalCommon.Constants;
using PortalTools.Utilities;

namespace PortalTools.Services
{
    public class AzureTools
    {
        private readonly IConfidentialClientApplication _confidentialClientApp;
        private readonly HttpClient _httpClient;

        public AzureTools()
        {
            _confidentialClientApp = ConfidentialClientApplicationBuilder.Create(EncryptionHelper.Decrypt(AzureConstants.ClientId))
                .WithClientSecret(EncryptionHelper.Decrypt(AzureConstants.ClientSecret))
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
    }
}
