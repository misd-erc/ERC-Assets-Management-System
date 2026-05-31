using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalDB.Entities.DBO.Chat
{
    [Table("tblChatGroupMembers", Schema = "dbo")]
    public class TblChatGroupMember
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("ChatGroupMemberId")]
        public long Id { get; set; }

        [Column("ChatGroupId")]
        public long ChatGroupId { get; set; }

        [Column("SystemUserId")]
        public long SystemUserId { get; set; }

        [Column("IsActive")]
        public bool IsActive { get; set; } = true;

        [Column("IsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("JoinedAt")]
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}
