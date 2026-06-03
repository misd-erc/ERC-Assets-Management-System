using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.DBO.Chat;
using PortalDB.Services;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PortalTools.Services.GetEditTools.DBO.Chat
{
    public class ChatGetTools
    {
        public IQueryable<TblChatGroup> GetChatGroups(PortalDbContext context) =>
            context.TblChatGroups.AsNoTracking().Where(x => !x.IsDeleted && x.IsActive);

        public IQueryable<TblChatGroupMember> GetChatGroupMembers(PortalDbContext context) =>
            context.TblChatGroupMembers.AsNoTracking().Where(x => !x.IsDeleted && x.IsActive);

        public IQueryable<TblChatMessage> GetChatMessages(PortalDbContext context) =>
            context.TblChatMessages.AsNoTracking().Where(x => !x.IsDeleted);
            
        public IQueryable<TblChatMessageReadReceipt> GetChatReadReceipts(PortalDbContext context) =>
            context.TblChatMessageReadReceipts.AsNoTracking();

        public IQueryable<TblChatMessageReaction> GetChatReactions(PortalDbContext context) =>
            context.TblChatMessageReactions.AsNoTracking();
            
        public async Task<TblChatGroup?> GetChatGroupAsync(long id, PortalDbContext context) =>
            await context.TblChatGroups.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted && x.IsActive);
            
        public async Task<TblChatMessage?> GetChatMessageAsync(long id, PortalDbContext context) =>
            await context.TblChatMessages.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
    }
}
