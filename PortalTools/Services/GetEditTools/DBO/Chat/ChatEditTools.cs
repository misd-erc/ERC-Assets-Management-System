using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.DBO.Chat;
using PortalDB.Services;
using System;
using System.Threading.Tasks;

namespace PortalTools.Services.GetEditTools.DBO.Chat
{
    public class ChatEditTools
    {
        public async Task<long> CreateChatGroupAsync(TblChatGroup group, PortalDbContext context)
        {
            await context.TblChatGroups.AddAsync(group);
            await context.SaveChangesAsync();
            return group.Id;
        }

        public async Task<long> AddMemberToGroupAsync(TblChatGroupMember member, PortalDbContext context)
        {
            await context.TblChatGroupMembers.AddAsync(member);
            await context.SaveChangesAsync();
            return member.Id;
        }

        public async Task<long> SaveMessageAsync(TblChatMessage message, PortalDbContext context)
        {
            await context.TblChatMessages.AddAsync(message);
            await context.SaveChangesAsync();
            return message.Id;
        }

        public async Task<bool> UnsendMessageAsync(long messageId, PortalDbContext context)
        {
            var message = await context.TblChatMessages.FirstOrDefaultAsync(x => x.Id == messageId);
            if (message != null)
            {
                message.IsUnsent = true;
                context.TblChatMessages.Update(message);
                await context.SaveChangesAsync();
                return true;
            }
            return false;
        }
        
        public async Task<long> SaveReadReceiptAsync(TblChatMessageReadReceipt receipt, PortalDbContext context)
        {
            var existing = await context.TblChatMessageReadReceipts
                .FirstOrDefaultAsync(x => x.ChatMessageId == receipt.ChatMessageId && x.SystemUserId == receipt.SystemUserId);
                
            if (existing == null)
            {
                await context.TblChatMessageReadReceipts.AddAsync(receipt);
                await context.SaveChangesAsync();
                return receipt.Id;
            }
            return existing.Id;
        }

        public async Task SaveReadReceiptsAsync(System.Collections.Generic.IEnumerable<TblChatMessageReadReceipt> receipts, PortalDbContext context)
        {
            foreach(var receipt in receipts)
            {
                var existing = await context.TblChatMessageReadReceipts
                    .FirstOrDefaultAsync(x => x.ChatMessageId == receipt.ChatMessageId && x.SystemUserId == receipt.SystemUserId);
                if (existing == null)
                {
                    await context.TblChatMessageReadReceipts.AddAsync(receipt);
                }
            }
            await context.SaveChangesAsync();
        }


        public async Task<long> SaveReactionAsync(TblChatMessageReaction reaction, PortalDbContext context)
        {
            var existing = await context.TblChatMessageReactions
                .FirstOrDefaultAsync(x => x.ChatMessageId == reaction.ChatMessageId && x.SystemUserId == reaction.SystemUserId);
                
            if (existing != null)
            {
                existing.ReactionType = reaction.ReactionType;
                context.TblChatMessageReactions.Update(existing);
                await context.SaveChangesAsync();
                return existing.Id;
            }
            
            await context.TblChatMessageReactions.AddAsync(reaction);
            await context.SaveChangesAsync();
            return reaction.Id;
        }

        public async Task<bool> RemoveReactionAsync(long messageId, long systemUserId, PortalDbContext context)
        {
            var existing = await context.TblChatMessageReactions
                .FirstOrDefaultAsync(x => x.ChatMessageId == messageId && x.SystemUserId == systemUserId);
                
            if (existing != null)
            {
                context.TblChatMessageReactions.Remove(existing);
                await context.SaveChangesAsync();
                return true;
            }
            return false;
        }
    }
}
