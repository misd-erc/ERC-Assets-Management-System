using System;
using System.Threading.Tasks;
using PortalTools.Services;
using Xunit;

namespace Tests.Azure
{
    public class AzureToolsTests
    {
        [Fact(DisplayName = "AzureTools should successfully retrieve an access token from Azure AD")]
        public async Task AzureTools_Should_Connect_To_Azure_And_Get_Token()
        {
            // Arrange
            var azureTools = new AzureTools();

            // Act
            string token = null;
            Exception exception = null;

            try
            {
                var usersJson = await azureTools.GetAzureEntraUsersAsync();
                Assert.False(string.IsNullOrWhiteSpace(usersJson));
                return;
            }
            catch (Exception ex)
            {
                exception = ex;
            }

            Assert.Null(exception);
        }
    }
}
