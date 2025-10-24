using Azure.Identity;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Graph;
using Microsoft.Graph.Models;
using Microsoft.Graph.Models.ODataErrors;
using Microsoft.Graph.Users.Item.SendMail;
using Microsoft.Identity.Client;
using Microsoft.Kiota.Abstractions;
using PortalCommon.Constants;
using PortalCommon.Models.ViewModels.Email;
using PortalCommon.Utilities;
using PortalDB;
using PortalDB.Services;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
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
            _confidentialClientApp = ConfidentialClientApplicationBuilder.Create(EncryptionHelper.Decrypt(AzureConstants.CLIENT_ID))
                .WithClientSecret(EncryptionHelper.Decrypt(AzureConstants.CLIENT_SECRET_VALUE))
                .WithAuthority(new Uri($"{EncryptionHelper.Decrypt(AzureConstants.AUTHORITY)}/{EncryptionHelper.Decrypt(AzureConstants.TENANT_ID)}"))
                .Build();
            _httpClient = new HttpClient();
        }

        #region Azure Entra
        /// <summary>
        /// Authenticates to Azure and retrieves an access token for Microsoft Graph.
        /// </summary>
        private async Task<string> GetAccessTokenAsync()
        {
            var result = await _confidentialClientApp
                .AcquireTokenForClient(new[] { EncryptionHelper.Decrypt(AzureConstants.GRAPH_SCOPE) })
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
        #endregion

        #region Azure Email
        /// <summary>
        /// Initializes the Microsoft Graph client using Azure AD credentials from environment variables.
        /// </summary>
        public static GraphServiceClient GetGraphClient()
        {
            if (_graphClient != null)
                return _graphClient;

            var tenantId = EncryptionHelper.Decrypt(AzureConstants.TENANT_ID);
            var clientId = EncryptionHelper.Decrypt(AzureConstants.CLIENT_ID);
            var clientSecret = EncryptionHelper.Decrypt(AzureConstants.CLIENT_SECRET_VALUE);

            if (string.IsNullOrWhiteSpace(tenantId) ||
                string.IsNullOrWhiteSpace(clientId) ||
                string.IsNullOrWhiteSpace(clientSecret))
            {
                throw new InvalidOperationException("Azure AD credentials are missing in environment variables.");
            }

            var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
            _graphClient = new GraphServiceClient(credential, new[] { EncryptionHelper.Decrypt(AzureConstants.GRAPH_SCOPE) });

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

                await graphClient.Users[EncryptionHelper.Decrypt(EmailConstants.NO_REPLY_EMAIL)]
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
        #endregion

        #region Azure Blob Storage

        private static readonly string _fixedContainerName =
            EncryptionHelper.Decrypt(AzureConstants.BLOB_STORAGE_CONTAINER_NAME);

        private static BlobServiceClient GetBlobServiceClient()
        {
            var accountName = EncryptionHelper.Decrypt(AzureConstants.BLOB_STORAGE_ACCOUNT_NAME);
            var accountKey = EncryptionHelper.Decrypt(AzureConstants.BLOB_STORAGE_ACCOUNT_KEY);
            var protocol = EncryptionHelper.Decrypt(AzureConstants.BLOB_STORAGE_DEFAULT_ENDPOINT_PROTOCOL);
            var endpointSuffix = EncryptionHelper.Decrypt(AzureConstants.BLOB_STORAGE_ENDPOINT_SUFFIX);

            var connectionString =
                $"DefaultEndpointsProtocol={protocol};AccountName={accountName};AccountKey={accountKey};EndpointSuffix={endpointSuffix}";

            return new BlobServiceClient(connectionString);
        }

        private static BlobContainerClient GetContainerClient()
        {
            var blobServiceClient = GetBlobServiceClient();
            var containerClient = blobServiceClient.GetBlobContainerClient(_fixedContainerName);
            containerClient.CreateIfNotExists();
            return containerClient;
        }

        public static async Task<bool> UploadFileAsync(string blobName, Stream fileStream, string contentType = "application/octet-stream")
        {
            try
            {
                var containerClient = GetContainerClient();
                var blobClient = containerClient.GetBlobClient(blobName);

                await blobClient.UploadAsync(fileStream, new BlobHttpHeaders { ContentType = contentType });
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AzureTools] Upload failed: {ex.Message}");
                return false;
            }
        }

        public static async Task<Stream?> DownloadFileAsync(string blobName)
        {
            try
            {
                var containerClient = GetContainerClient();
                var blobClient = containerClient.GetBlobClient(blobName);

                if (!await blobClient.ExistsAsync())
                    return null;

                var downloadInfo = await blobClient.DownloadAsync();
                return downloadInfo.Value.Content;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AzureTools] Download failed: {ex.Message}");
                return null;
            }
        }

        public static async Task<bool> DeleteFileAsync(string blobName)
        {
            try
            {
                var containerClient = GetContainerClient();
                var blobClient = containerClient.GetBlobClient(blobName);

                var response = await blobClient.DeleteIfExistsAsync();
                return response.Value;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AzureTools] Delete failed: {ex.Message}");
                return false;
            }
        }

        public static async Task<List<string>> ListFilesAsync()
        {
            var containerClient = GetContainerClient();
            var files = new List<string>();

            await foreach (BlobItem blobItem in containerClient.GetBlobsAsync())
                files.Add(blobItem.Name);

            return files;
        }

        public static string GetBlobUrl(string blobName)
        {
            var accountName = EncryptionHelper.Decrypt(AzureConstants.BLOB_STORAGE_ACCOUNT_NAME);
            var endpointSuffix = EncryptionHelper.Decrypt(AzureConstants.BLOB_STORAGE_ENDPOINT_SUFFIX);
            var protocol = EncryptionHelper.Decrypt(AzureConstants.BLOB_STORAGE_DEFAULT_ENDPOINT_PROTOCOL);

            return $"{protocol}://{accountName}.blob.{endpointSuffix}/{_fixedContainerName}/{blobName}";
        }

        #endregion

    }
}
