using PortalTools.Utilities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Entities.DBO.Account
{
    [Table("tblSessionTokens", Schema = "dbo")]
    public class TblSessionToken
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("SessionTokenId")]
        public long Id { get; set; }

        [Column("SystemUserId")]
        public long SystemUserId { get; set; }
        [ForeignKey(nameof(SystemUserId))]
        [System.Text.Json.Serialization.JsonIgnore]
        public virtual TblSystemUser SystemUser { get; set; } = null!;

        [Column("SessionTokenKey")]
        public string? Key { get; set; }

        [Column("SessionTokenValidUntil")]
        public DateTime? ValidUntil { get; set; }

        [Column("SessionTokenCreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
