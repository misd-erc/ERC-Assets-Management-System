using PortalCommon.Utilities;

namespace Tests.Encryption
{
    public class EncryptionHelperTests
    {
        static EncryptionHelperTests()
        {
            TestSettingsInitializer.Initialize();
        }

        #region Encrypt_And_Decrypt_Should_Return_Original_Text
        [Fact(DisplayName = "Encrypt and Decrypt should return the original text")]
        public void Encrypt_And_Decrypt_Should_Return_Original_Text()
        {
            // Arrange
            var plainText = "Hello, this is a secret message!";

            // Act
            var encrypted = EncryptionHelper.Encrypt(plainText);
            var decrypted = EncryptionHelper.Decrypt(encrypted);

            // Assert
            Assert.Equal(plainText, decrypted);
        }
        #endregion

        #region Encrypt_Should_Not_Return_PlainText
        [Fact(DisplayName = "Encrypt should not return the same as input text")]
        public void Encrypt_Should_Not_Return_PlainText()
        {
            // Arrange
            var plainText = "Server=localhost,1433;Database=AMSStaging;User Id=sa;Password=P@$$w0rd123;TrustServerCertificate=True;Encrypt=True";

            // Act
            var encrypted = EncryptionHelper.Encrypt(plainText);

            // Assert
            Assert.NotEqual(plainText, encrypted);
            Assert.False(string.IsNullOrWhiteSpace(encrypted));
        }
        #endregion

        #region Decrypt_Should_Throw_On_Invalid_Input
        [Fact(DisplayName = "Decrypt should throw exception on invalid input")]
        public void Decrypt_Should_Throw_On_Invalid_Input()
        {
            // Arrange
            var invalidCipher = "NotABase64String!!!";

            // Act & Assert
            Assert.ThrowsAny<System.Exception>(() => EncryptionHelper.Decrypt(invalidCipher));
        }
        #endregion

    }
}
