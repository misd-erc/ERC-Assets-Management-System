using System.Text;

namespace PortalCommon.Constants
{
    public static class EncryptionConstants
    {
        // 32 bytes key for AES-256
        public static readonly byte[] Key = Encoding.UTF8.GetBytes(EnvironmentConstants.ERC_AMS_ENCRYPTION_KEY);
        // 16 bytes IV
        public static readonly byte[] IV = Encoding.UTF8.GetBytes(EnvironmentConstants.ERC_AMS_ENCRYPTION_IV);
    }
}
