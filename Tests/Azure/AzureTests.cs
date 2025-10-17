using System;
using System.Threading.Tasks;
using Microsoft.Identity.Client;
using PortalCommon.Constants;
using PortalTools.Utilities;
using Xunit;
using System.Net.Http;
using System.Net.Http.Headers;

namespace Tests.Azure
{
    public class AzureToolsTests
    {

        #region AzureConstants_Should_Have_Valid_Decrypted_Keys
        [Fact(DisplayName = "AzureConstants should contain valid decrypted keys")]
        public void AzureConstants_Should_Have_Valid_Decrypted_Keys()
        {
            // Arrange + Act
            var tenantId = EncryptionHelper.Decrypt(AzureConstants.TenantId);
            var clientId = EncryptionHelper.Decrypt(AzureConstants.ClientId);
            var clientSecret = EncryptionHelper.Decrypt(AzureConstants.ClientSecretValue);
            var authority = EncryptionHelper.Decrypt(AzureConstants.Authority);
            var graphScope = EncryptionHelper.Decrypt(AzureConstants.GraphScope);

            // Assert
            Assert.False(string.IsNullOrWhiteSpace(tenantId), "TenantId is missing or invalid.");
            Assert.False(string.IsNullOrWhiteSpace(clientId), "ClientId is missing or invalid.");
            Assert.False(string.IsNullOrWhiteSpace(clientSecret), "ClientSecret is missing or invalid.");
            Assert.False(string.IsNullOrWhiteSpace(authority), "Authority is missing or invalid.");
            Assert.False(string.IsNullOrWhiteSpace(graphScope), "GraphScope is missing or invalid.");

            // Optional sanity check for GUIDs
            Assert.True(Guid.TryParse(clientId, out _), "ClientId should be a valid GUID.");
        }
        #endregion

        #region Should_Connect_To_Azure_And_Get_Access_Token
        [Fact(DisplayName = "Should successfully connect to Azure AD and acquire an access token")]
        public async Task Should_Connect_To_Azure_And_Get_Access_Token()
        {
            // Arrange
            var clientId = EncryptionHelper.Decrypt(AzureConstants.ClientId);
            var clientSecret = EncryptionHelper.Decrypt(AzureConstants.ClientSecretValue);
            var authority = $"{EncryptionHelper.Decrypt(AzureConstants.Authority)}/{EncryptionHelper.Decrypt(AzureConstants.TenantId)}";
            var graphScope = EncryptionHelper.Decrypt(AzureConstants.GraphScope);

            var app = ConfidentialClientApplicationBuilder.Create(clientId)
                .WithClientSecret(clientSecret)
                .WithAuthority(new Uri(authority))
                .Build();

            // Act
            AuthenticationResult result = null!;
            Exception exception = null!;

            try
            {
                result = await app.AcquireTokenForClient(new[] { graphScope }).ExecuteAsync();
                //string accessToken = result.AccessToken;
                //using var httpClient = new HttpClient();
                //httpClient.DefaultRequestHeaders.Authorization =
                //    new AuthenticationHeaderValue("Bearer", accessToken);
                //var response = await httpClient.GetAsync("https://graph.microsoft.com/v1.0/users");
                //var content = await response.Content.ReadAsStringAsync();

            }
            catch (Exception ex)
            {
                exception = ex;
            }

            // Assert
            Assert.Null(exception);
            Assert.NotNull(result);
            Assert.False(string.IsNullOrWhiteSpace(result.AccessToken), "Access token should not be null or empty.");
        }
        #endregion

    }
}
