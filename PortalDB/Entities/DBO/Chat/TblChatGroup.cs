using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PortalDB.Entities.DBO.Chat
{
    [Table("tblChatGroups", Schema = "dbo")]
    public class TblChatGroup
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("ChatGroupId")]
        public long Id { get; set; }

        [Column("GroupName")]
        public string? Name { get; set; }

        [Column("GroupDescription")]
        public string? Description { get; set; }

        [Column("CreatedBySystemUserId")]
        public long CreatedBySystemUserId { get; set; }

        [Column("IsActive")]
        public bool IsActive { get; set; } = true;

        [Column("IsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
