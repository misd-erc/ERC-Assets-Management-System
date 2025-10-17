using PortalTools.Utilities;

namespace Tests.Encryption
{
    public class EncryptionHelperTests
    {

        #region Encrypt_And_Decrypt_Should_Return_Original_Text
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
        #endregion

        #region Encrypt_Should_Not_Return_PlainText
        [Fact(DisplayName = "Encrypt should not return the same as input text")]
        public void Encrypt_Should_Not_Return_PlainText()
        {
            // Arrange
            var plainText = "34a3c75d-10fe-482b-9220-04df09540e89";
            var plainText2 = "f9bb9b9b-9f98-4be2-85df-97a89308c5ab";
            var plainText3 = "6b4bf372-8763-4353-9716-544f12b144e7";
            var plainText4 = "pbW8Q~BZ7kjesbXPnIGni7-DcdZi.yIVWRVnxcA_";
            var plainText5 = "55375c74-0a90-43c4-a77f-6f7837263053";

            // Act
            var encrypted = EncryptionHelper.Encrypt(plainText);
            var encrypted2 = EncryptionHelper.Encrypt(plainText2);
            var encrypted3 = EncryptionHelper.Encrypt(plainText3);
            var encrypted4 = EncryptionHelper.Encrypt(plainText4);
            var encrypted5 = EncryptionHelper.Encrypt(plainText5);

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
            var invalidCipher = "InvalidBase64@@@";

            // Act & Assert
            Assert.ThrowsAny<System.Exception>(() => EncryptionHelper.Decrypt(invalidCipher));
        }
        #endregion

    }
}
