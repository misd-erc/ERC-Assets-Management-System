using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PortalDB.Services;
using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading.Tasks;

namespace API.Hubs
{
    public class NotificationHub : Hub
    {
        private static readonly ConcurrentDictionary<string, long> _userConnections = new();
        private readonly DbContextOptions<PortalDbContext> _options;

        public NotificationHub(DbContextOptions<PortalDbContext> options)
        {
            _options = options;
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _userConnections.TryRemove(Context.ConnectionId, out _);
            await base.OnDisconnectedAsync(exception);
        }

        public async Task RegisterUser(long systemUserId)
        {
            _userConnections[Context.ConnectionId] = systemUserId;

            await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{systemUserId}");

            await using var context = new PortalDbContext(_options);

            var user = await context.TblSystemUsers
                .AsNoTracking()
                .Where(x => !x.IsDeleted && x.Id == systemUserId)
                .FirstOrDefaultAsync();

            if (user?.SystemRoleId == null) return;

            var moduleIds = await context.TblSystemRoleScopes
                .AsNoTracking()
                .Where(x => !x.IsDeleted && x.IsActive && x.RoleId == user.SystemRoleId)
                .Select(x => x.ModuleId)
                .ToListAsync();

            foreach (var moduleId in moduleIds)
            {
                if (moduleId.HasValue)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"Module_{moduleId.Value}");
                }
            }
        }
    }
}
