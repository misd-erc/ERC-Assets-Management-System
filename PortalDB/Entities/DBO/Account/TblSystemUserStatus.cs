using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using PortalCommon.Utilities;

namespace PortalDB.Entities.DBO.Account
{
    [Table("tblSystemUserStatuses", Schema = "dbo")]
    public class TblSystemUserStatus
    {

        #region Constants
        [NotMapped] public const string ACTIVE = "Active";
        [NotMapped] public const string INACTIVE = "Inactive";
        [NotMapped] public const string SUSPENDED = "Suspended";
        [NotMapped] public const string PENDING = "Pending";
        #endregion

        #region Dictionary
        public static readonly TwoWayDictionaryHelper<long, string> Dictionary = new([
            (1, ACTIVE),
            (2, INACTIVE),
            (3, SUSPENDED),
            (4, PENDING),
        ]);
        #endregion

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        [Column("SystemUserStatusId")]
        public long Id { get; set; }

        [Column("SystemUserStatusName")]
        public string? Name { get; set; }

        [Column("SystemUserStatusIsActive")]
        public bool IsActive { get; set; } = true;

        [Column("SystemUserStatusIsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("SystemUserCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


    }
}
