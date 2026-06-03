using Xunit;
using System;
using System.IO;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.DBO.Chat;
using PortalCommon.Utilities;
using PortalDB.Services;
using Tests;

namespace Tests.Encryption
{
    public class DatabaseCheckTest
    {
        static DatabaseCheckTest()
        {
            TestSettingsInitializer.Initialize();
        }

        [Fact]
        public void CheckDatabaseDirectMessages()
        {
            var connectionString = DatabaseHelper.ConnectionString();
            var optionsBuilder = new DbContextOptionsBuilder<PortalDbContext>();
            optionsBuilder.UseSqlServer(connectionString);

            using var context = new PortalDbContext(optionsBuilder.Options);

            var messages = context.TblChatMessages.ToList();
            var systemUsers = context.TblSystemUsers.ToList();

            var logFile = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "database_chat_log.txt");
            using var sw = new StreamWriter(logFile);

            sw.WriteLine($"Total System Users in Database: {systemUsers.Count}");
            foreach (var u in systemUsers)
            {
                sw.WriteLine($"User ID: {u.Id}, Name: {u.FirstName} {u.LastName}, Email: {u.Email}");
            }

            sw.WriteLine("\nAll Messages in TblChatMessages:");
            sw.WriteLine($"Total Messages: {messages.Count}");

            foreach (var msg in messages)
            {
                sw.WriteLine($"ID: {msg.Id}, Sender: {msg.SenderId}, Receiver: {msg.ReceiverId}, GroupId: {msg.GroupId}, Message: {msg.Message}, CreatedAt: {msg.CreatedAt}");
            }

            sw.WriteLine("\nDirect Message partner IDs for User 1:");
            var systemUserId = 1;
            var partnerIds = messages
                .Where(m => m.GroupId == null && m.ReceiverId != null && (m.SenderId == systemUserId || m.ReceiverId == systemUserId))
                .Select(m => m.SenderId == systemUserId ? m.ReceiverId!.Value : m.SenderId)
                .Distinct()
                .ToList();

            foreach (var p in partnerIds)
            {
                sw.WriteLine($"Partner ID: {p}");
            }

            sw.WriteLine($"Log generated at: {DateTime.Now}");
        }
    }
}
