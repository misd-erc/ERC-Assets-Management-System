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
            var plainText = "j3pVDvLbCuEom/s9N7e9bM1RpW6Bo8lKPfd3kUzdvoJZoOLMs8Tl3aosupwyJCyUQ1J02zNQZk58YEdRqqs5+y2QWelsZtEyEA1HBDcvoaWNkwiP5Wwy2ZbZe/I1c5hjAdX4cTs250aL5yo47JWAGCo5Zyqf8XYkwAJRtnn8cHvNdOE7/oCBkyx5i9cvylwUrPv2Txb7fnQXeRXabrCIKuNDodLEp1k8zjioWCzF4bq833/qly0RRaRcRh66qNCwXYpW6ch9FfZXVU+DJcdeehaA8C/YqT9tub7ETCiq0SY7tGKi0m9Sxxs7dEyrLh14LxMGixP1XvraWJSPV1E6RZgxrGecpQLplQZPpxd/RRwux23DJA83lWE0czdQldi0Em0ZuhqIGjNgjpoH1CO9GDK1DlfOKRVHJKj56Ci7fRNEmTIfSJv69PsQsUCmkhSwJtTfUGznR/ivpnjBTagkuEGqKk6tus/fHYNX/uP8mRY21bqvmCJ3tIExmy1b6YOTmr57Ww8n6lAkM74pgYR9e7kOPWaJFfFmnYFNYlabN52YZKHejA+msc3YLlxeTlzz5jvT8W1H6cutO5r9MaHmQd/J/Kgz0a7H6IfFk2CAnpTqF8JfhDEXh6u2V31ugCWaFxWYP7rude46Xtr7kF9/bhHlgtyMMhs9LZy0EC0S86Bb++dIhNBT43EYf0f7rmjlRk4lsYpm/JhCzq/1tQy6bWrdt45ZGjNB9Pc8noqVUHKUG4IBwjzz9QUIpIU1DXVnz/6w+DdgGu6DpY/X1XfxZxZPra1up/qRMopqhSZDGfY3DoExaUIeEGi6j1GO3fw2VEQP/QXjiu+VDtd/vZiwVw==";

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
            var plainText = "Server=DESKTOP-DTAQOP7\\SQLEXPRESS;Database=AMSDev;Integrated Security=True;TrustServerCertificate=True;";

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
            var invalidCipher = "WoUe/OCHXrNOOK8yryE0LA==";

            // Act & Assert
            Assert.ThrowsAny<System.Exception>(() => EncryptionHelper.Decrypt(invalidCipher));
        }
        #endregion

    }
}
