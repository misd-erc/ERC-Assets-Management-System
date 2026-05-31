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
                    .Where(m => (m.SenderId == currentUserId && m.ReceiverId == otherUserId) ||
                                (m.SenderId == otherUserId && m.ReceiverId == currentUserId));

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

                var result = messages.Select(m => new {
                    m.Id,
                    m.SenderId,
                    m.ReceiverId,
                    m.Message,
                    m.FileStorageId,
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
        public async Task<IActionResult> GetGroupHistory([FromRoute] long groupId, [FromQuery] long? beforeMessageId, [FromQuery] int limit = 20)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
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

                var result = messages.Select(m => new {
                    m.Id,
                    m.SenderId,
                    m.GroupId,
                    m.Message,
                    m.FileStorageId,
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
                    .Where(m => m.ReceiverId == systemUserId)
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
                    .Where(m => m.GroupId != null && userGroupIds.Contains(m.GroupId.Value) && m.SenderId != systemUserId)
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

                var responsePayload = new {
                    chatMessage.Id,
                    chatMessage.SenderId,
                    chatMessage.ReceiverId,
                    chatMessage.GroupId,
                    chatMessage.ReplyToMessageId,
                    chatMessage.Message,
                    chatMessage.FileStorageId,
                    chatMessage.IsUnsent,
                    chatMessage.CreatedAt
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

                // Add creator as member
                await _editTools.Chat.AddMemberToGroupAsync(new TblChatGroupMember { ChatGroupId = group.Id, SystemUserId = req.SystemUserId }, context);

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
        public async Task<IActionResult> UnsendMessage([FromRoute] long messageId)
        {
            await using var context = new PortalDbContext(_options);
            try
            {
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
