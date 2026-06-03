using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading.Tasks;

namespace API.Hubs
{
    public class ChatHub : Hub
    {
        // Thread-safe dictionary: ConnectionId -> SystemUserId
        private static readonly ConcurrentDictionary<string, long> _userConnections = new();

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (_userConnections.TryRemove(Context.ConnectionId, out long systemUserId))
            {
                // If user has no more connections, broadcast offline
                if (!_userConnections.Values.Contains(systemUserId))
                {
                    await Clients.All.SendAsync("UserOffline", systemUserId);
                }
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task RegisterUser(long systemUserId)
        {
            _userConnections[Context.ConnectionId] = systemUserId;
            await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{systemUserId}");
            
            // Broadcast that this user is now online
            await Clients.All.SendAsync("UserOnline", systemUserId);
            
            // Send back the currently online users to the caller
            var onlineUsers = _userConnections.Values.Distinct().ToList();
            await Clients.Caller.SendAsync("OnlineUsersList", onlineUsers);
        }

        public async Task JoinChatGroup(long groupId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Group_{groupId}");
        }

        public async Task LeaveChatGroup(long groupId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Group_{groupId}");
        }

        public async Task TypingStarted(long? receiverId, long? groupId)
        {
            if (_userConnections.TryGetValue(Context.ConnectionId, out long senderId))
            {
                var payload = new { senderId, groupId };
                if (groupId.HasValue)
                {
                    // Exclude sender to not show typing to themselves
                    await Clients.GroupExcept($"Group_{groupId.Value}", Context.ConnectionId).SendAsync("UserTyping", payload);
                }
                else if (receiverId.HasValue)
                {
                    await Clients.Group($"User_{receiverId.Value}").SendAsync("UserTyping", payload);
                }
            }
        }

        public async Task TypingStopped(long? receiverId, long? groupId)
        {
            if (_userConnections.TryGetValue(Context.ConnectionId, out long senderId))
            {
                var payload = new { senderId, groupId };
                if (groupId.HasValue)
                {
                    await Clients.GroupExcept($"Group_{groupId.Value}", Context.ConnectionId).SendAsync("UserStoppedTyping", payload);
                }
                else if (receiverId.HasValue)
                {
                    await Clients.Group($"User_{receiverId.Value}").SendAsync("UserStoppedTyping", payload);
                }
            }
        }
    }
}
