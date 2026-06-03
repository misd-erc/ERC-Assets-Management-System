using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalDB.Entities.DBO.Chat
{
    [Table("tblChatMessageReadReceipts", Schema = "dbo")]
    public class TblChatMessageReadReceipt
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("ReadReceiptId")]
        public long Id { get; set; }

        [Column("ChatMessageId")]
        public long ChatMessageId { get; set; }

        [Column("SystemUserId")]
        public long SystemUserId { get; set; }

        [Column("ReadAt")]
        public DateTime ReadAt { get; set; } = DateTime.UtcNow;
    }
}
