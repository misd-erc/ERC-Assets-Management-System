using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Entities.DBO.Storage
{
    [Table("tblFileStorages", Schema = "dbo")]
    public class TblFileStorage
    {

        #region Constants
        [NotMapped] public const string USERS_PROFILE_PICTURES = "users/profile-pictures";
        #endregion

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("FileStorageId")]
        public long Id { get; set; }

        [Required, MaxLength(255)]
        [Column("FileStorageBlobName")]
        public string BlobName { get; set; } = null!;   

        [MaxLength(255)]
        [Column("FileStorageOriginalFileName")]
        public string? OriginalFileName { get; set; }

        [MaxLength(255)]
        [Column("FileStorageFlatFolderName")]
        public string? FolderName { get; set; }

        [MaxLength(255)]
        [Column("FileStorageContentType")]
        public string? ContentType { get; set; }

        [Column("FileStorageUploadedAt")]
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        [Column("FileStorageUploadedBy")]
        public long UploadedBy { get; set; }

        [Column("FileStorageIsActive")]
        public bool IsActive { get; set; } = true;
    }

}
