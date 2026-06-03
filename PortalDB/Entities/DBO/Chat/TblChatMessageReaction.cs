using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalDB.Entities.DBO.Chat
{
    [Table("tblChatMessageReactions", Schema = "dbo")]
    public class TblChatMessageReaction
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("ReactionId")]
        public long Id { get; set; }

        [Column("ChatMessageId")]
        public long ChatMessageId { get; set; }

        [Column("SystemUserId")]
        public long SystemUserId { get; set; }

        [Column("ReactionType")]
        public string? ReactionType { get; set; } // "like", "smile", "sad", "angry", "shock", "heart"

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
