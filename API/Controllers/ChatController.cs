using API.Attributes;
using API.Hubs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PortalCommon.Constants;
using PortalDB.Entities.DBO.Chat;
using PortalDB.Models.QueryParams.Universal;
using PortalDB.Models.Responses;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly DbContextOptions<PortalDbContext> _options;
        private readonly IPortalGetTools _getTools;
        private readonly IPortalEditTools _editTools;
        private readonly IHubContext<ChatHub> _hubContext;

        public ChatController(
            DbContextOptions<PortalDbContext> options,
            IPortalGetTools getTools,
            IPortalEditTools editTools,
            IHubContext<ChatHub> hubContext)
        {
            _options = options;
            _getTools = getTools;
            _editTools = editTools;
            _hubContext = hubContext;
        }

        [HttpGet("history/direct/{otherUserId}")]
        public async Task<IActionResult> GetDirectHistory([FromQuery] long currentUserId, [FromRoute] long otherUserId, [FromQuery] long? beforeMessageId, [FromQuery] int limit = 20)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                var query = _getTools.Chat.GetChatMessages(context)
                    .Where(m => (m.SenderId == currentUserId && m.ReceiverId == otherUserId && !m.IsDeletedForSender) ||
                                (m.SenderId == otherUserId && m.ReceiverId == currentUserId && !m.IsDeletedForReceiver));

                if (beforeMessageId.HasValue)
                {
                    query = query.Where(m => m.Id < beforeMessageId.Value);
                }

                var messages = await query
                    .OrderByDescending(m => m.CreatedAt)
                    .Take(limit)
                    .ToListAsync();
                
                messages.Reverse();

                // Fetch read receipts to know who read what
                var messageIds = messages.Select(m => m.Id).ToList();
                var receipts = await _getTools.Chat.GetChatReadReceipts(context)
                    .Where(r => messageIds.Contains(r.ChatMessageId))
                    .ToListAsync();
                    
                var reactions = await _getTools.Chat.GetChatReactions(context)
                    .Where(r => messageIds.Contains(r.ChatMessageId))
                    .ToListAsync();

                var fileStorageIds = messages.Where(m => m.FileStorageId.HasValue).Select(m => m.FileStorageId.Value).Distinct().ToList();
                var fileRecords = await context.TblFileStorages.Where(f => fileStorageIds.Contains(f.Id)).ToListAsync();

                var result = messages.Select(m => new {
                    m.Id,
                    m.SenderId,
                    m.ReceiverId,
                    m.ReplyToMessageId,
                    m.Message,
                    m.FileStorageId,
                    AttachmentName = m.FileStorageId.HasValue ? fileRecords.FirstOrDefault(f => f.Id == m.FileStorageId.Value)?.OriginalFileName : null,
                    AttachmentType = m.FileStorageId.HasValue ? fileRecords.FirstOrDefault(f => f.Id == m.FileStorageId.Value)?.ContentType : null,
                    m.IsUnsent,
                    m.CreatedAt,
                    ReadReceipts = receipts.Where(r => r.ChatMessageId == m.Id).Select(r => new { r.SystemUserId, r.ReadAt }),
                    Reactions = reactions.Where(r => r.ChatMessageId == m.Id).Select(r => new { r.SystemUserId, r.ReactionType, r.CreatedAt })
                });

                return Ok(ApiResponse<object>.Ok(result, "Chat history retrieved"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(context, ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }

        [HttpGet("history/group/{groupId}")]
        public async Task<IActionResult> GetGroupHistory([FromRoute] long groupId, [FromQuery] long currentUserId, [FromQuery] long? beforeMessageId, [FromQuery] int limit = 20)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                if (!await CanAccessGroupAsync(context, groupId, currentUserId))
                {
                    return Forbid();
                }

                var query = _getTools.Chat.GetChatMessages(context)
                    .Where(m => m.GroupId == groupId);

                if (beforeMessageId.HasValue)
                {
                    query = query.Where(m => m.Id < beforeMessageId.Value);
                }

                var messages = await query
                    .OrderByDescending(m => m.CreatedAt)
                    .Take(limit)
                    .ToListAsync();
                    
                messages.Reverse();

                var messageIds = messages.Select(m => m.Id).ToList();
                var receipts = await _getTools.Chat.GetChatReadReceipts(context)
                    .Where(r => messageIds.Contains(r.ChatMessageId))
                    .ToListAsync();

                var reactions = await _getTools.Chat.GetChatReactions(context)
                    .Where(r => messageIds.Contains(r.ChatMessageId))
                    .ToListAsync();

                var fileStorageIds = messages.Where(m => m.FileStorageId.HasValue).Select(m => m.FileStorageId.Value).Distinct().ToList();
                var fileRecords = await context.TblFileStorages.Where(f => fileStorageIds.Contains(f.Id)).ToListAsync();

                var result = messages.Select(m => new {
                    m.Id,
                    m.SenderId,
                    m.GroupId,
                    m.ReplyToMessageId,
                    m.Message,
                    m.FileStorageId,
                    AttachmentName = m.FileStorageId.HasValue ? fileRecords.FirstOrDefault(f => f.Id == m.FileStorageId.Value)?.OriginalFileName : null,
                    AttachmentType = m.FileStorageId.HasValue ? fileRecords.FirstOrDefault(f => f.Id == m.FileStorageId.Value)?.ContentType : null,
                    m.IsUnsent,
                    m.CreatedAt,
                    ReadReceipts = receipts.Where(r => r.ChatMessageId == m.Id).Select(r => new { r.SystemUserId, r.ReadAt }),
                    Reactions = reactions.Where(r => r.ChatMessageId == m.Id).Select(r => new { r.SystemUserId, r.ReactionType, r.CreatedAt })
                });

                return Ok(ApiResponse<object>.Ok(result, "Group history retrieved"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(context, ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }

        [HttpGet("unread-counts/{systemUserId}")]
        public async Task<IActionResult> GetUnreadCounts([FromRoute] long systemUserId)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                var unreadDirectMessages = await _getTools.Chat.GetChatMessages(context)
                    .Where(m => m.ReceiverId == systemUserId && !m.IsDeletedForReceiver && !m.IsUnsent)
                    .GroupJoin(
                        _getTools.Chat.GetChatReadReceipts(context).Where(r => r.SystemUserId == systemUserId),
                        m => m.Id,
                        r => r.ChatMessageId,
                        (m, r) => new { Message = m, Receipts = r }
                    )
                    .Where(x => !x.Receipts.Any())
                    .GroupBy(x => x.Message.SenderId)
                    .Select(g => new { SenderId = g.Key, UnreadCount = g.Count() })
                    .ToListAsync();

                var userGroupIds = await _getTools.Chat.GetChatGroupMembers(context)
                    .Where(m => m.SystemUserId == systemUserId)
                    .Select(m => m.ChatGroupId)
                    .ToListAsync();

                var unreadGroupMessages = await _getTools.Chat.GetChatMessages(context)
                    .Where(m => m.GroupId != null && userGroupIds.Contains(m.GroupId.Value) && m.SenderId != systemUserId && !m.IsUnsent)
                    .GroupJoin(
                        _getTools.Chat.GetChatReadReceipts(context).Where(r => r.SystemUserId == systemUserId),
                        m => m.Id,
                        r => r.ChatMessageId,
                        (m, r) => new { Message = m, Receipts = r }
                    )
                    .Where(x => !x.Receipts.Any())
                    .GroupBy(x => x.Message.GroupId)
                    .Select(g => new { GroupId = g.Key, UnreadCount = g.Count() })
                    .ToListAsync();

                return Ok(ApiResponse<object>.Ok(new { Direct = unreadDirectMessages, Group = unreadGroupMessages }, "Unread counts retrieved"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(context, ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }

        [HttpGet("groups/{systemUserId}")]
        public async Task<IActionResult> GetUserGroups([FromRoute] long systemUserId)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                var memberships = await _getTools.Chat.GetChatGroupMembers(context)
                    .Where(m => m.SystemUserId == systemUserId)
                    .Select(m => m.ChatGroupId)
                    .ToListAsync();

                var groups = await _getTools.Chat.GetChatGroups(context)
                    .Where(g => memberships.Contains(g.Id))
                    .ToListAsync();

                return Ok(ApiResponse<object>.Ok(groups, "Groups retrieved"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(context, ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromForm] long senderId, [FromForm] long? receiverId, [FromForm] long? groupId, [FromForm] long? replyToMessageId, [FromForm] string? message, [FromForm] IFormFile? file)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();
            try
            {
                long? fileStorageId = null;

                if (file != null && file.Length > 0)
                {
                    using var stream = file.OpenReadStream();
                    fileStorageId = await AzureTools.UploadFileAndSaveToDbAsync(
                        _options,
                        stream,
                        file.FileName,
                        file.ContentType,
                        senderId,
                        "chat-attachments"
                    );
                }

                var chatMessage = new TblChatMessage
                {
                    SenderId = senderId,
                    ReceiverId = receiverId,
                    GroupId = groupId,
                    ReplyToMessageId = replyToMessageId,
                    Message = message,
                    FileStorageId = fileStorageId
                };

                await _editTools.Chat.SaveMessageAsync(chatMessage, context);
                await transaction.CommitAsync();

                string? attachmentName = null;
                string? attachmentType = null;
                if (fileStorageId.HasValue)
                {
                    var fileRecord = await context.TblFileStorages.FirstOrDefaultAsync(f => f.Id == fileStorageId.Value);
                    if (fileRecord != null)
                    {
                        attachmentName = fileRecord.OriginalFileName;
                        attachmentType = fileRecord.ContentType;
                    }
                }

                var responsePayload = new {
                    chatMessage.Id,
                    chatMessage.SenderId,
                    chatMessage.ReceiverId,
                    chatMessage.GroupId,
                    chatMessage.ReplyToMessageId,
                    chatMessage.Message,
                    chatMessage.FileStorageId,
                    AttachmentName = attachmentName,
                    AttachmentType = attachmentType,
                    chatMessage.IsUnsent,
                    chatMessage.CreatedAt,
                    ReadReceipts = Array.Empty<object>(),
                    Reactions = Array.Empty<object>()
                };

                // Notify via SignalR
                if (groupId.HasValue)
                {
                    await _hubContext.Clients.Group($"Group_{groupId.Value}").SendAsync("ReceiveMessage", responsePayload);
                }
                else if (receiverId.HasValue)
                {
                    await _hubContext.Clients.Group($"User_{receiverId.Value}").SendAsync("ReceiveMessage", responsePayload);
                    // Also send to the sender's own other devices
                    await _hubContext.Clients.Group($"User_{senderId}").SendAsync("ReceiveMessage", responsePayload);
                }

                return Ok(ApiResponse<object>.Ok(responsePayload, "Message sent"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }

        [HttpPost("group/create")]
        public async Task<IActionResult> CreateGroup([FromBody] CreateGroupRequest req)
        {
            await using var context = new PortalDbContext(_options);
            await using var transaction = await context.Database.BeginTransactionAsync();
            try
            {
                var group = new TblChatGroup
                {
                    Name = req.Name,
                    Description = req.Description,
                    CreatedBySystemUserId = req.SystemUserId
                };
                await _editTools.Chat.CreateChatGroupAsync(group, context);

                // Add creator as member (admin!)
                await _editTools.Chat.AddMemberToGroupAsync(new TblChatGroupMember 
                { 
                    ChatGroupId = group.Id, 
                    SystemUserId = req.SystemUserId, 
                    IsAdmin = true 
                }, context);

                if (req.MemberIds != null)
                {
                    foreach (var memberId in req.MemberIds.Distinct())
                    {
                        if (memberId != req.SystemUserId)
                        {
                            await _editTools.Chat.AddMemberToGroupAsync(new TblChatGroupMember { ChatGroupId = group.Id, SystemUserId = memberId }, context);
                        }
                    }
                }

                await transaction.CommitAsync();

                // Notify all members that they were added to a group
                if (req.MemberIds != null)
                {
                    foreach (var memberId in req.MemberIds)
                    {
                        await _hubContext.Clients.Group($"User_{memberId}").SendAsync("GroupCreated", group);
                    }
                }
                await _hubContext.Clients.Group($"User_{req.SystemUserId}").SendAsync("GroupCreated", group);

                return Ok(ApiResponse<object>.Ok(group, "Group created"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(new PortalDbContext(_options), ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }

        [HttpPost("unsend/{messageId}")]
        public async Task<IActionResult> UnsendMessage([FromRoute] long messageId, [FromQuery] long systemUserId)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                var message = await context.TblChatMessages.FirstOrDefaultAsync(x => x.Id == messageId);
                if (message == null) return BadRequest(ApiResponse<object>.Fail("NOT_FOUND", "Message not found"));

                if (message.SenderId != systemUserId)
                    return BadRequest(ApiResponse<object>.Fail("FORBIDDEN", "Only the sender can unsend this message."));

                // Delete file from Azure if it exists
                if (message.FileStorageId.HasValue)
                {
                    var fileRecord = await context.TblFileStorages.FirstOrDefaultAsync(f => f.Id == message.FileStorageId.Value);
                    if (fileRecord != null && !string.IsNullOrEmpty(fileRecord.BlobName))
                    {
                        await PortalTools.Services.AzureTools.DeleteFileAsync(fileRecord.BlobName, _options);
                    }
                }

                var success = await _editTools.Chat.UnsendMessageAsync(messageId, context);
                if (success)
                {
                    var msg = await _getTools.Chat.GetChatMessageAsync(messageId, context);
                    if (msg != null)
                    {
                        // Notify
                        if (msg.GroupId.HasValue)
                        {
                            await _hubContext.Clients.Group($"Group_{msg.GroupId.Value}").SendAsync("MessageUnsent", messageId);
                        }
                        else if (msg.ReceiverId.HasValue)
                        {
                            await _hubContext.Clients.Group($"User_{msg.ReceiverId.Value}").SendAsync("MessageUnsent", messageId);
                            await _hubContext.Clients.Group($"User_{msg.SenderId}").SendAsync("MessageUnsent", messageId);
                        }
                    }
                    return Ok(ApiResponse<object>.Ok((object?)null, "Message unsent"));
                }
                return BadRequest(ApiResponse<object>.Fail("FAILED", "Could not unsend message"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(context, ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }

        [HttpPost("read/{messageId}")]
        public async Task<IActionResult> ReadMessage([FromRoute] long messageId, [FromBody] ReadMessageRequest req)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                var receipt = new TblChatMessageReadReceipt
                {
                    ChatMessageId = messageId,
                    SystemUserId = req.SystemUserId
                };
                await _editTools.Chat.SaveReadReceiptAsync(receipt, context);

                var msg = await _getTools.Chat.GetChatMessageAsync(messageId, context);
                if (msg != null)
                {
                    // Notify sender that message was read
                    await _hubContext.Clients.Group($"User_{msg.SenderId}").SendAsync("MessageRead", new { messageId, systemUserId = req.SystemUserId });
                }

                return Ok(ApiResponse<object>.Ok((object?)null, "Read receipt saved"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(context, ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }

        [HttpPost("read-conversation")]
        public async Task<IActionResult> ReadConversation([FromBody] ReadConversationRequest req)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                var messagesQuery = _getTools.Chat.GetChatMessages(context).Where(m => m.SenderId != req.SystemUserId && !m.IsUnsent);
                if (req.IsGroup)
                {
                    if (!await CanAccessGroupAsync(context, req.TargetId, req.SystemUserId))
                    {
                        return Forbid();
                    }

                    messagesQuery = messagesQuery.Where(m => m.GroupId == req.TargetId);
                }
                else
                {
                    messagesQuery = messagesQuery.Where(m => m.GroupId == null && m.SenderId == req.TargetId && m.ReceiverId == req.SystemUserId);
                }

                var unreadMessages = await messagesQuery
                    .GroupJoin(
                        _getTools.Chat.GetChatReadReceipts(context).Where(r => r.SystemUserId == req.SystemUserId),
                        m => m.Id,
                        r => r.ChatMessageId,
                        (m, r) => new { Message = m, Receipts = r }
                    )
                    .Where(x => !x.Receipts.Any())
                    .Select(x => x.Message)
                    .ToListAsync();
                var receipts = unreadMessages.Select(m => new TblChatMessageReadReceipt
                {
                    ChatMessageId = m.Id,
                    SystemUserId = req.SystemUserId
                }).ToList();

                if (receipts.Any())
                {
                    await _editTools.Chat.SaveReadReceiptsAsync(receipts, context);

                    foreach (var message in unreadMessages)
                    {
                        await _hubContext.Clients.Group($"User_{message.SenderId}").SendAsync("MessageRead", new { messageId = message.Id, systemUserId = req.SystemUserId });
                    }
                }

                return Ok(ApiResponse<object>.Ok((object?)null, "Conversation marked as read"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(context, ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }

        [HttpPost("react")]
        public async Task<IActionResult> ReactToMessage([FromBody] ReactMessageRequest req)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                var reaction = new TblChatMessageReaction
                {
                    ChatMessageId = req.MessageId,
                    SystemUserId = req.SystemUserId,
                    ReactionType = req.ReactionType
                };
                await _editTools.Chat.SaveReactionAsync(reaction, context);

                var msg = await _getTools.Chat.GetChatMessageAsync(req.MessageId, context);
                if (msg != null)
                {
                    var payload = new { messageId = req.MessageId, systemUserId = req.SystemUserId, reactionType = req.ReactionType };
                    if (msg.GroupId.HasValue)
                    {
                        await _hubContext.Clients.Group($"Group_{msg.GroupId.Value}").SendAsync("ReactionUpdated", payload);
                    }
                    else if (msg.ReceiverId.HasValue)
                    {
                        await _hubContext.Clients.Group($"User_{msg.ReceiverId.Value}").SendAsync("ReactionUpdated", payload);
                        await _hubContext.Clients.Group($"User_{msg.SenderId}").SendAsync("ReactionUpdated", payload);
                    }
                }

                return Ok(ApiResponse<object>.Ok((object?)null, "Reaction saved"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(context, ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }

        [HttpPost("unreact")]
        public async Task<IActionResult> UnreactToMessage([FromBody] UnreactMessageRequest req)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                var success = await _editTools.Chat.RemoveReactionAsync(req.MessageId, req.SystemUserId, context);
                if (success)
                {
                    var msg = await _getTools.Chat.GetChatMessageAsync(req.MessageId, context);
                    if (msg != null)
                    {
                        var payload = new { messageId = req.MessageId, systemUserId = req.SystemUserId };
                        if (msg.GroupId.HasValue)
                        {
                            await _hubContext.Clients.Group($"Group_{msg.GroupId.Value}").SendAsync("ReactionRemoved", payload);
                        }
                        else if (msg.ReceiverId.HasValue)
                        {
                            await _hubContext.Clients.Group($"User_{msg.ReceiverId.Value}").SendAsync("ReactionRemoved", payload);
                            await _hubContext.Clients.Group($"User_{msg.SenderId}").SendAsync("ReactionRemoved", payload);
                        }
                    }
                }

                return Ok(ApiResponse<object>.Ok((object?)null, "Reaction removed"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(context, ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }
        [HttpGet("group/{groupId}/members")]
        public async Task<IActionResult> GetGroupMembers([FromRoute] long groupId)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                var members = await context.TblChatGroupMembers
                    .Where(m => m.ChatGroupId == groupId && !m.IsDeleted && m.IsActive)
                    .ToListAsync();

                var userIds = members.Select(m => m.SystemUserId).ToList();
                var users = await context.TblSystemUsers
                    .Where(u => userIds.Contains(u.Id))
                    .ToListAsync();

                var result = members.Select(m => {
                    var user = users.FirstOrDefault(u => u.Id == m.SystemUserId);
                    return new {
                        m.Id,
                        m.ChatGroupId,
                        m.SystemUserId,
                        m.IsAdmin,
                        FirstName = user?.FirstName ?? "Unknown",
                        LastName = user?.LastName ?? "User",
                        Email = user?.Email ?? ""
                    };
                });

                return Ok(ApiResponse<object>.Ok(result, "Group members retrieved"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(context, ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }

        [HttpPost("group/assign-admin")]
        public async Task<IActionResult> AssignAdmin([FromBody] AssignAdminRequest req)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                var isRequesterAdmin = await context.TblChatGroupMembers
                    .AnyAsync(m => m.ChatGroupId == req.GroupId && m.SystemUserId == req.RequesterUserId && m.IsAdmin && !m.IsDeleted && m.IsActive);
                
                if (!isRequesterAdmin)
                {
                    return BadRequest(ApiResponse<object>.Fail("FORBIDDEN", "Only group admins can assign or remove admins."));
                }

                var member = await context.TblChatGroupMembers
                    .FirstOrDefaultAsync(m => m.ChatGroupId == req.GroupId && m.SystemUserId == req.TargetUserId && !m.IsDeleted && m.IsActive);

                if (member == null)
                {
                    return BadRequest(ApiResponse<object>.Fail("NOT_FOUND", "User is not a member of this group."));
                }

                member.IsAdmin = req.IsAdmin;
                context.TblChatGroupMembers.Update(member);
                await context.SaveChangesAsync();

                // Notify members via SignalR
                await _hubContext.Clients.Group($"Group_{req.GroupId}").SendAsync("AdminStatusUpdated", new { req.GroupId, req.TargetUserId, req.IsAdmin });

                return Ok(ApiResponse<object>.Ok((object?)null, "Admin status updated"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(context, ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }

        [HttpPost("group/add-member")]
        public async Task<IActionResult> AddMember([FromBody] GroupMemberRequest req)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                var isRequesterAdmin = await context.TblChatGroupMembers
                    .AnyAsync(m => m.ChatGroupId == req.GroupId && m.SystemUserId == req.RequesterUserId && m.IsAdmin && !m.IsDeleted && m.IsActive);
                
                if (!isRequesterAdmin)
                {
                    return BadRequest(ApiResponse<object>.Fail("FORBIDDEN", "Only group admins can add new members."));
                }

                var existing = await context.TblChatGroupMembers
                    .FirstOrDefaultAsync(m => m.ChatGroupId == req.GroupId && m.SystemUserId == req.TargetUserId);

                if (existing != null)
                {
                    if (existing.IsDeleted || !existing.IsActive)
                    {
                        existing.IsDeleted = false;
                        existing.IsActive = true;
                        context.TblChatGroupMembers.Update(existing);
                        await context.SaveChangesAsync();
                    }
                    else
                    {
                        return BadRequest(ApiResponse<object>.Fail("CONFLICT", "User is already a member of this group."));
                    }
                }
                else
                {
                    await _editTools.Chat.AddMemberToGroupAsync(new TblChatGroupMember 
                    { 
                        ChatGroupId = req.GroupId, 
                        SystemUserId = req.TargetUserId 
                    }, context);
                }

                var group = await context.TblChatGroups.FirstOrDefaultAsync(g => g.Id == req.GroupId);

                // Add System Message
                var chatMessage = new TblChatMessage
                {
                    SenderId = req.TargetUserId,
                    GroupId = req.GroupId,
                    Message = "was added to the group.",
                    IsSystemMessage = true
                };
                context.TblChatMessages.Add(chatMessage);
                await context.SaveChangesAsync();

                var responsePayload = new {
                    chatMessage.Id,
                    chatMessage.SenderId,
                    chatMessage.ReceiverId,
                    chatMessage.GroupId,
                    chatMessage.ReplyToMessageId,
                    chatMessage.Message,
                    chatMessage.FileStorageId,
                    chatMessage.IsUnsent,
                    chatMessage.IsSystemMessage,
                    chatMessage.CreatedAt
                };

                // Notify target via SignalR
                await _hubContext.Clients.Group($"User_{req.TargetUserId}").SendAsync("GroupCreated", group);
                await _hubContext.Clients.Group($"Group_{req.GroupId}").SendAsync("MemberAdded", new { req.GroupId, req.TargetUserId });
                await _hubContext.Clients.Group($"Group_{req.GroupId}").SendAsync("ReceiveMessage", responsePayload);

                return Ok(ApiResponse<object>.Ok((object?)null, "Member added successfully"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(context, ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }

        [HttpPost("group/remove-member")]
        public async Task<IActionResult> RemoveMember([FromBody] GroupMemberRequest req)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                var isLeaving = req.RequesterUserId == req.TargetUserId;
                var isRequesterAdmin = await context.TblChatGroupMembers
                    .AnyAsync(m => m.ChatGroupId == req.GroupId && m.SystemUserId == req.RequesterUserId && m.IsAdmin && !m.IsDeleted && m.IsActive);
                
                if (!isRequesterAdmin && !isLeaving)
                {
                    return BadRequest(ApiResponse<object>.Fail("FORBIDDEN", "Only group admins can remove members."));
                }

                var member = await context.TblChatGroupMembers
                    .FirstOrDefaultAsync(m => m.ChatGroupId == req.GroupId && m.SystemUserId == req.TargetUserId && !m.IsDeleted && m.IsActive);

                if (member == null)
                {
                    return BadRequest(ApiResponse<object>.Fail("NOT_FOUND", "User is not a member of this group."));
                }

                if (isLeaving && member.IsAdmin)
                {
                    var otherAdminsExist = await context.TblChatGroupMembers
                        .AnyAsync(m => m.ChatGroupId == req.GroupId && m.SystemUserId != req.TargetUserId && m.IsAdmin && !m.IsDeleted && m.IsActive);
                    var otherMembersExist = await context.TblChatGroupMembers
                        .AnyAsync(m => m.ChatGroupId == req.GroupId && m.SystemUserId != req.TargetUserId && !m.IsDeleted && m.IsActive);
                    
                    if (otherMembersExist && !otherAdminsExist)
                    {
                        return BadRequest(ApiResponse<object>.Fail("ADMIN_REQUIRED", "You cannot leave as the sole admin. Assign another admin first."));
                    }
                }

                member.IsDeleted = true;
                context.TblChatGroupMembers.Update(member);

                // Add System Message
                var systemMessageText = isLeaving ? "left the group." : "was removed from the group by an admin.";
                var chatMessage = new TblChatMessage
                {
                    SenderId = req.TargetUserId,
                    GroupId = req.GroupId,
                    Message = systemMessageText,
                    IsSystemMessage = true
                };
                context.TblChatMessages.Add(chatMessage);

                await context.SaveChangesAsync();

                // Notify target and group via SignalR
                var responsePayload = new {
                    chatMessage.Id,
                    chatMessage.SenderId,
                    chatMessage.ReceiverId,
                    chatMessage.GroupId,
                    chatMessage.ReplyToMessageId,
                    chatMessage.Message,
                    chatMessage.FileStorageId,
                    chatMessage.IsUnsent,
                    chatMessage.IsSystemMessage,
                    chatMessage.CreatedAt
                };

                await _hubContext.Clients.Group($"User_{req.TargetUserId}").SendAsync("LeftGroup", req.GroupId);
                await _hubContext.Clients.Group($"Group_{req.GroupId}").SendAsync("MemberRemoved", new { req.GroupId, req.TargetUserId });
                await _hubContext.Clients.Group($"Group_{req.GroupId}").SendAsync("ReceiveMessage", responsePayload);

                return Ok(ApiResponse<object>.Ok((object?)null, "Member removed successfully"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(context, ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }

        [HttpPost("group/update-settings")]
        public async Task<IActionResult> UpdateSettings([FromForm] UpdateSettingsRequest req)
        {
            await using var context = new PortalDbContext(_options);
            using var transaction = await context.Database.BeginTransactionAsync();
            try
            {
                var isRequesterAdmin = await context.TblChatGroupMembers
                    .AnyAsync(m => m.ChatGroupId == req.GroupId && m.SystemUserId == req.RequesterUserId && m.IsAdmin && !m.IsDeleted && m.IsActive);
                
                if (!isRequesterAdmin)
                {
                    return BadRequest(ApiResponse<object>.Fail("FORBIDDEN", "Only group admins can update group settings."));
                }

                var group = await context.TblChatGroups.FirstOrDefaultAsync(g => g.Id == req.GroupId);
                if (group == null)
                {
                    return BadRequest(ApiResponse<object>.Fail("NOT_FOUND", "Group not found."));
                }

                if (!string.IsNullOrWhiteSpace(req.Name)) group.Name = req.Name;
                if (req.Description != null) group.Description = req.Description;

                if (req.LogoFile != null && req.LogoFile.Length > 0)
                {
                    // 1. Delete old logo if it exists
                    if (group.GroupLogoStorageFileId.HasValue)
                    {
                        var oldFileRecord = await context.TblFileStorages.FirstOrDefaultAsync(f => f.Id == group.GroupLogoStorageFileId.Value);
                        if (oldFileRecord != null && !string.IsNullOrEmpty(oldFileRecord.BlobName))
                        {
                            await PortalTools.Services.AzureTools.DeleteFileAsync(oldFileRecord.BlobName, _options);
                        }
                    }

                    // 2. Upload new logo
                    using var stream = req.LogoFile.OpenReadStream();
                    var newFileId = await PortalTools.Services.AzureTools.UploadFileAndSaveToDbAsync(
                        _options,
                        stream,
                        req.LogoFile.FileName,
                        req.LogoFile.ContentType,
                        req.RequesterUserId,
                        $"chat/group/{group.Id}/logo"
                    );

                    if (newFileId.HasValue)
                    {
                        group.GroupLogoStorageFileId = newFileId.Value;
                    }
                    else
                    {
                        return StatusCode(500, ApiResponse<object>.Fail("UPLOAD_FAILED", "Failed to upload group logo."));
                    }
                }

                context.TblChatGroups.Update(group);
                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Notify members via SignalR
                await _hubContext.Clients.Group($"Group_{req.GroupId}").SendAsync("GroupSettingsUpdated", group);

                return Ok(ApiResponse<object>.Ok(group, "Group settings updated successfully"));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(context, ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }

        [HttpDelete("group/{groupId}/{requesterUserId}")]
        public async Task<IActionResult> DeleteGroup([FromRoute] long groupId, [FromRoute] long requesterUserId)
        {
            await using var context = new PortalDbContext(_options);
            using var transaction = await context.Database.BeginTransactionAsync();
            try
            {
                var isRequesterAdmin = await context.TblChatGroupMembers
                    .AnyAsync(m => m.ChatGroupId == groupId && m.SystemUserId == requesterUserId && m.IsAdmin && !m.IsDeleted && m.IsActive);
                
                if (!isRequesterAdmin)
                {
                    return BadRequest(ApiResponse<object>.Fail("FORBIDDEN", "Only group admins can delete the group."));
                }

                var group = await context.TblChatGroups.FirstOrDefaultAsync(g => g.Id == groupId && !g.IsDeleted);
                if (group == null)
                    return BadRequest(ApiResponse<object>.Fail("NOT_FOUND", "Group not found."));

                // 1. Delete Logo Blob
                if (group.GroupLogoStorageFileId.HasValue)
                {
                    var logoRecord = await context.TblFileStorages.FirstOrDefaultAsync(f => f.Id == group.GroupLogoStorageFileId.Value);
                    if (logoRecord != null && !string.IsNullOrEmpty(logoRecord.BlobName))
                        await PortalTools.Services.AzureTools.DeleteFileAsync(logoRecord.BlobName, _options);
                }

                // 2. Delete Message Blobs & Messages
                var messages = await context.TblChatMessages.Where(m => m.GroupId == groupId).ToListAsync();
                foreach (var msg in messages)
                {
                    if (msg.FileStorageId.HasValue)
                    {
                        var fileRecord = await context.TblFileStorages.FirstOrDefaultAsync(f => f.Id == msg.FileStorageId.Value);
                        if (fileRecord != null && !string.IsNullOrEmpty(fileRecord.BlobName))
                            await PortalTools.Services.AzureTools.DeleteFileAsync(fileRecord.BlobName, _options);
                    }
                    msg.IsDeleted = true;
                }

                // 3. Delete Members
                var members = await context.TblChatGroupMembers.Where(m => m.ChatGroupId == groupId).ToListAsync();
                foreach (var m in members)
                {
                    m.IsDeleted = true;
                    m.IsActive = false;
                }

                // 4. Delete Group
                group.IsDeleted = true;
                group.IsActive = false;

                context.TblChatMessages.UpdateRange(messages);
                context.TblChatGroupMembers.UpdateRange(members);
                context.TblChatGroups.Update(group);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Notify all members
                await _hubContext.Clients.Group($"Group_{groupId}").SendAsync("GroupDeleted", groupId);

                return Ok(ApiResponse<object>.Ok((object?)null, "Group deleted successfully."));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                await ErrorTool.ErrorLogAsync(context, ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }

        [HttpGet("conversations/{systemUserId}")]
        public async Task<IActionResult> GetConversations([FromRoute] long systemUserId)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                // Use the proper shared query which already filters IsDeleted
                var partnerMessages = await _getTools.Chat.GetChatMessages(context)
                    .Where(m => m.GroupId == null && m.ReceiverId != null && !m.IsUnsent &&
                        ((m.SenderId == systemUserId && !m.IsDeletedForSender) || 
                         (m.ReceiverId == systemUserId && !m.IsDeletedForReceiver)))
                    .ToListAsync();

                // Group by conversation partner and get latest message details
                var conversationData = partnerMessages
                    .GroupBy(m => m.SenderId == systemUserId ? m.ReceiverId!.Value : m.SenderId)
                    .Select(g => {
                        var latestMsg = g.OrderByDescending(m => m.CreatedAt).First();
                        return new {
                            PartnerId = g.Key,
                            LastMessageAt = latestMsg.CreatedAt,
                            LastMessage = latestMsg.IsUnsent ? "Message unsent" : (latestMsg.Message ?? (latestMsg.FileStorageId.HasValue ? "Sent an attachment" : "")),
                            LastMessageSenderId = latestMsg.SenderId
                        };
                    })
                    .ToDictionary(x => x.PartnerId);

                var partnerIds = conversationData.Keys.ToList();

                if (!partnerIds.Any())
                {
                    return Ok(ApiResponse<object>.Ok(
                        new List<object>(), 
                        "No active conversations found"
                    ));
                }

                // Get details of these partner users using the Account tools
                var dbUsers = await _getTools.Account.GetVwSystemUsers(context)
                    .Where(x => x.Id.HasValue && partnerIds.Contains(x.Id.Value))
                    .ToListAsync();

                var results = new List<object>();
                foreach (var x in dbUsers)
                {
                    if (x == null || !x.Id.HasValue) continue;
                    var convo = conversationData.ContainsKey(x.Id.Value) ? conversationData[x.Id.Value] : null;
                    
                    results.Add(new {
                        Id = x.Id,
                        FirstName = x.FirstName,
                        LastName = x.LastName,
                        Email = x.Email,
                        EmployeeId = x.EmployeeId,
                        IsActive = x.IsActive,
                        SystemRole = await _getTools.Account.GetSystemRoleWithScopesAsListAsync(x.SystemRoleId, context),
                        SystemUserStatus = await _getTools.Account.GetSystemUserStatusAsync(x.StatusId, context),
                        Office = await _getTools.Office.GetTblOfficeAsync(x.OfficeId, context),
                        Division = await _getTools.Office.GetTblDivisionAsync(x.DivisionId, context),
                        EmploymentType = await _getTools.Office.GetTblEmploymentTypeAsync(x.EmploymentTypeId ?? 0, context),
                        Position = await _getTools.Office.GetTblPositionAsync(x.PositionId ?? 0, context),
                        ProfilePictureStorageFile = await _getTools.Storage.GetTblFileStorageAsync(x.ProfilePictureFileStorageId, context),
                        CreatedAt = x.CreatedAt,
                        LastLoginAt = x.LastLoginAt,
                        LastMessage = convo?.LastMessage,
                        LastMessageAt = convo?.LastMessageAt,
                        LastMessageSenderId = convo?.LastMessageSenderId
                    });
                }

                var sortedResults = results
                    .OrderByDescending(r => {
                        var prop = r.GetType().GetProperty("LastMessageAt");
                        return prop?.GetValue(r) as DateTime? ?? DateTime.MinValue;
                    })
                    .ToList();

                return Ok(ApiResponse<object>.Ok(sortedResults, "Conversations retrieved successfully"));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(context, ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }

        [HttpDelete("conversations/{requesterUserId}/{partnerUserId}")]
        public async Task<IActionResult> DeleteConversation([FromRoute] long requesterUserId, [FromRoute] long partnerUserId)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                var messages = await context.TblChatMessages
                    .Where(m => m.GroupId == null && m.ReceiverId != null && 
                           ((m.SenderId == requesterUserId && m.ReceiverId == partnerUserId) ||
                            (m.SenderId == partnerUserId && m.ReceiverId == requesterUserId)))
                    .ToListAsync();

                if (!messages.Any())
                    return Ok(ApiResponse<object>.Ok((object?)null, "No conversation found."));

                foreach (var m in messages)
                {
                    if (m.SenderId == requesterUserId)
                    {
                        m.IsDeletedForSender = true;
                    }
                    if (m.ReceiverId == requesterUserId)
                    {
                        m.IsDeletedForReceiver = true;
                    }
                }

                context.TblChatMessages.UpdateRange(messages);
                await context.SaveChangesAsync();

                // Notify frontend
                await _hubContext.Clients.Group($"User_{requesterUserId}").SendAsync("ConversationDeleted", partnerUserId);

                return Ok(ApiResponse<object>.Ok((object?)null, "Conversation deleted."));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(context, ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }

        [HttpGet("group/{groupId}/logo")]
        public async Task<IActionResult> GetGroupLogo([FromRoute] long groupId)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                var group = await context.TblChatGroups.FirstOrDefaultAsync(g => g.Id == groupId && !g.IsDeleted);
                if (group == null || !group.GroupLogoStorageFileId.HasValue)
                    return NotFound(ApiResponse<object>.Fail("NO_LOGO", "No logo found."));

                var fileRecord = await context.TblFileStorages.FirstOrDefaultAsync(f => f.Id == group.GroupLogoStorageFileId.Value);
                if (fileRecord == null || string.IsNullOrEmpty(fileRecord.BlobName))
                    return NotFound(ApiResponse<object>.Fail("NO_LOGO", "No logo found."));

                // We can redirect to the actual blob URL using AzureTools
                var stream = await PortalTools.Services.AzureTools.GetFileStreamAsync(fileRecord.BlobName);
                if (stream == null)
                    return NotFound(ApiResponse<object>.Fail("NOT_FOUND", "File not found in storage."));

                return File(stream, fileRecord.ContentType ?? "application/octet-stream", fileRecord.OriginalFileName);
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(context, ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }

        [HttpGet("message/{messageId}/attachment")]
        public async Task<IActionResult> GetMessageAttachment([FromRoute] long messageId, [FromQuery] long systemUserId)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                var message = await context.TblChatMessages.FirstOrDefaultAsync(m => m.Id == messageId && !m.IsDeleted && !m.IsUnsent);
                if (message == null || !message.FileStorageId.HasValue)
                    return NotFound(ApiResponse<object>.Fail("NO_ATTACHMENT", "No attachment found or message unsent."));

                if (!await CanAccessMessageAsync(context, message, systemUserId))
                {
                    return Forbid();
                }

                var fileRecord = await context.TblFileStorages.FirstOrDefaultAsync(f => f.Id == message.FileStorageId.Value && f.IsActive);
                if (fileRecord == null || string.IsNullOrEmpty(fileRecord.BlobName))
                    return NotFound(ApiResponse<object>.Fail("NO_ATTACHMENT", "No attachment found."));

                var stream = await PortalTools.Services.AzureTools.GetFileStreamAsync(fileRecord.BlobName);
                if (stream == null)
                    return NotFound(ApiResponse<object>.Fail("NOT_FOUND", "File not found in storage."));

                return File(stream, fileRecord.ContentType ?? "application/octet-stream", fileRecord.OriginalFileName);
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(context, ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }

        private static Task<bool> CanAccessMessageAsync(PortalDbContext context, TblChatMessage message, long systemUserId)
        {
            if (message.GroupId.HasValue)
            {
                return CanAccessGroupAsync(context, message.GroupId.Value, systemUserId);
            }

            return Task.FromResult(message.SenderId == systemUserId || message.ReceiverId == systemUserId);
        }

        private static Task<bool> CanAccessGroupAsync(PortalDbContext context, long groupId, long systemUserId) =>
            context.TblChatGroupMembers.AnyAsync(m =>
                m.ChatGroupId == groupId &&
                m.SystemUserId == systemUserId &&
                !m.IsDeleted &&
                m.IsActive);

        [HttpPost("seed-sample-data")]
        public async Task<IActionResult> SeedSampleData()
        {
            await using var context = new PortalDbContext(_options);
            try
            {
                DbSeeder.SeedSampleChatData(context);
                return Ok(ApiResponse<object>.Ok((object?)null, "Sample chat data and groups seeded successfully."));
            }
            catch (Exception ex)
            {
                await ErrorTool.ErrorLogAsync(context, ex, nameof(ChatController));
                return StatusCode(500, ApiResponse<object>.Fail("SERVER_ERROR", ex.Message));
            }
        }
    }

    public class AssignAdminRequest
    {
        public long RequesterUserId { get; set; }
        public long TargetUserId { get; set; }
        public long GroupId { get; set; }
        public bool IsAdmin { get; set; }
    }

    public class GroupMemberRequest
    {
        public long RequesterUserId { get; set; }
        public long TargetUserId { get; set; }
        public long GroupId { get; set; }
    }

    public class UpdateSettingsRequest
    {
        public long RequesterUserId { get; set; }
        public long GroupId { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public IFormFile? LogoFile { get; set; }
    }

    public class CreateGroupRequest
    {
        public long SystemUserId { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public List<long>? MemberIds { get; set; }
    }

    public class ReadMessageRequest
    {
        public long SystemUserId { get; set; }
    }

    public class ReadConversationRequest
    {
        public long SystemUserId { get; set; }
        public long TargetId { get; set; }
        public bool IsGroup { get; set; }
    }

    public class ReactMessageRequest
    {
        public long MessageId { get; set; }
        public long SystemUserId { get; set; }
        public string? ReactionType { get; set; }
    }

    public class UnreactMessageRequest
    {
        public long MessageId { get; set; }
        public long SystemUserId { get; set; }
    }
}
