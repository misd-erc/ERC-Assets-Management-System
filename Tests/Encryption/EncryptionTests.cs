using PortalCommon.Utilities;

namespace Tests.Encryption
{
    public class EncryptionHelperTests
    {

        #region Encrypt_And_Decrypt_Should_Return_Original_Text
        [Fact(DisplayName = "Encrypt and Decrypt should return the original text")]
        public void Encrypt_And_Decrypt_Should_Return_Original_Text()
        {
            // Arrange
            var plainText = "I3i6gwaMocz221Nd/UoSI0ffnz2WIpNEa/KqTAzA6Cw=";

            // Act
            //var encrypted = EncryptionHelper.Encrypt(plainText);
            var decrypted = EncryptionHelper.Decrypt(plainText);

            // Assert
            Assert.Equal(plainText, decrypted);
        }
        #endregion

        #region Encrypt_Should_Not_Return_PlainText
        [Fact(DisplayName = "Encrypt should not return the same as input text")]
        public void Encrypt_Should_Not_Return_PlainText()
        {
            // Arrange
            var plainText = "974961";
            var plainText2 = "1yxp+EZX1bHZN1IEG9GiZyY2/OBEXjkls5xkohkdqIKA8LVGUvgoTm31GcqnyNDAqqHynCOHkSrE+ASt8i8ctA==";
            var plainText3 = "core.windows.net";
            var plainText4 = "https";
            var plainText5 = "ams-container";

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
            var invalidCipher = "WoUe/OCHXrNOOK8yryE0LA==";

            // Act & Assert
            Assert.ThrowsAny<System.Exception>(() => EncryptionHelper.Decrypt(invalidCipher));
        }
        #endregion

    }
}
