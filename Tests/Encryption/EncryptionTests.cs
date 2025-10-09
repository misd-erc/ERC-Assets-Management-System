using PortalTools.Utilities;

namespace Tests.Encryption
{
    public class EncryptionHelperTests
    {
        [Fact(DisplayName = "Encrypt and Decrypt should return the original text")]
        public void Encrypt_And_Decrypt_Should_Return_Original_Text()
        {
            // Arrange
            var plainText = "MySecretPassword123!";

            // Act
            var encrypted = EncryptionHelper.Encrypt(plainText);
            var decrypted = EncryptionHelper.Decrypt(encrypted);

            // Assert
            Assert.Equal(plainText, decrypted);
        }

        [Fact(DisplayName = "Encrypt should not return the same as input text")]
        public void Encrypt_Should_Not_Return_PlainText()
        {
            // Arrange
            var plainText = "https://graph.microsoft.com/.default";

            // Act
            var encrypted = EncryptionHelper.Encrypt(plainText);

            // Assert
            Assert.NotEqual(plainText, encrypted);
            Assert.False(string.IsNullOrWhiteSpace(encrypted));
        }

        [Fact(DisplayName = "Decrypt should throw exception on invalid input")]
        public void Decrypt_Should_Throw_On_Invalid_Input()
        {
            // Arrange
            var invalidCipher = "InvalidBase64@@@";

            // Act & Assert
            Assert.ThrowsAny<System.Exception>(() => EncryptionHelper.Decrypt(invalidCipher));
        }
    }
}
