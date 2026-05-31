using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PortalCommon.Utilities;

namespace PortalDB.Entities.DBO.Chat
{
    [Table("tblChatMessages", Schema = "dbo")]
    public class TblChatMessage
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("ChatMessageId")]
        public long Id { get; set; }

        [Column("SenderSystemUserId")]
        public long SenderId { get; set; }

        [Column("ReceiverSystemUserId")]
        public long? ReceiverId { get; set; } // Null if Group Message

        [Column("ChatGroupId")]
        public long? GroupId { get; set; } // Null if Direct Message

        [Column("ReplyToMessageId")]
        public long? ReplyToMessageId { get; set; } // For thread replies

        [Column("MessageContentEncrypted")]
        public string? MessageEncrypted { get; set; }

        [NotMapped]
        public string? Message
        {
            get => string.IsNullOrEmpty(MessageEncrypted) ? null : EncryptionHelper.Decrypt(MessageEncrypted);
            set => MessageEncrypted = string.IsNullOrEmpty(value) ? null : EncryptionHelper.Encrypt(value);
        }

        [Column("FileStorageId")]
        public long? FileStorageId { get; set; } // For attachments

        [Column("IsUnsent")]
        public bool IsUnsent { get; set; } = false; // Allows unsending message

        [Column("IsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
