using Microsoft.EntityFrameworkCore;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Entities.DBO.Chat;
using PortalDB.Entities.DBO.Account;
using System.Collections.Generic;
using PortalDB.Seeds.ASSET.PPE;
using PortalDB.Seeds.DBO.Account;
using PortalDB.Seeds.DBO.Module;
using PortalDB.Seeds.DBO.Office;
using PortalDB.Seeds.DBO.Office.Division;

namespace PortalDB.Services
{
    public static class DbSeeder
    {
        /// <summary>
        /// Seeds initial data into the database. 
        /// Applies migrations first, then runs entity-specific seeders.
        /// </summary>
        /// <param name="context">The database context</param>
        public static void Seed(PortalDbContext context)
        {
            context.Database.Migrate();
            
            // Retroactively make all group creators the admins of their groups
            try
            {
                context.Database.ExecuteSqlRaw(@"
                    UPDATE m
                    SET m.IsAdmin = 1
                    FROM dbo.tblChatGroupMembers m
                    INNER JOIN dbo.tblChatGroups g ON m.ChatGroupId = g.ChatGroupId
                    WHERE m.SystemUserId = g.CreatedBySystemUserId
                ");
            }
            catch (Exception sqlEx)
            {
                Console.WriteLine($"Retroactive creator admin assignment failed: {sqlEx.Message}");
            }

            Console.WriteLine("Starting database seeding...");

            try
            {
                #region DBO
                #region Account
                TblSystemUserStatusSeeder.Seed(context);
                TblSystemRoleSeeder.Seed(context);
                TblSystemRoleScopeSeeder.Seed(context);
                TblPTACategorySeeder.Seed(context);
                TblSystemModuleSeeder.Seed(context);
                #endregion

                #region Office
                TblOfficeSeeder.Seed(context);
                #region Division
                TblDivisionSeeder.Seed(context);
                #endregion

                TblEmploymentTypeSeeder.Seed(context);
                TblPositionSeeder.Seed(context);
                TblEmployeeSeeder.Seed(context);
                #endregion
                #endregion
                #region ASSET
                TblPTACategorySeeder.Seed(context);
                #region Chat Seeder
                SeedSampleChatData(context);
                #endregion
                #endregion

                Console.WriteLine("Database seeding completed successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Seeding failed: {ex.Message}");
                throw;
            }
        }

        public static void SeedSampleChatData(PortalDbContext context)
        {
            Console.WriteLine("Force seeding sample chat data...");

            // 1. Ensure at least 6 active system users exist so we can build a realistic organization
            var activeUsers = context.TblSystemUsers.ToList();
            if (activeUsers.Count < 6)
            {
                var role = context.TblSystemRoles.FirstOrDefault(r => r.RoleName == "Employee");
                long roleId = role?.Id ?? 2;

                var systemUsers = new List<TblSystemUser>();

                TblSystemUser CreateUser(string firstName, string lastName, string email, long entraId) => new()
                {
                    FirstName = firstName,
                    LastName = lastName,
                    Email = email,
                    EntraId = entraId,
                    SystemRoleId = roleId,
                    StatusId = 1, // Active
                    IsActive = true,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-10)
                };

                // Add missing mock users (using actual encryption under the hood via the properties)
                if (!activeUsers.Any(u => u.Email == "josh.reyes@erc.ph"))
                    systemUsers.Add(CreateUser("Josh", "Reyes", "josh.reyes@erc.ph", 10001));
                if (!activeUsers.Any(u => u.Email == "alice.smith@erc.ph"))
                    systemUsers.Add(CreateUser("Alice", "Smith", "alice.smith@erc.ph", 10002));
                if (!activeUsers.Any(u => u.Email == "bob.jones@erc.ph"))
                    systemUsers.Add(CreateUser("Bob", "Jones", "bob.jones@erc.ph", 10003));
                if (!activeUsers.Any(u => u.Email == "charlie.brown@erc.ph"))
                    systemUsers.Add(CreateUser("Charlie", "Brown", "charlie.brown@erc.ph", 10004));
                if (!activeUsers.Any(u => u.Email == "diana.prince@erc.ph"))
                    systemUsers.Add(CreateUser("Diana", "Prince", "diana.prince@erc.ph", 10005));
                if (!activeUsers.Any(u => u.Email == "ethan.hunt@erc.ph"))
                    systemUsers.Add(CreateUser("Ethan", "Hunt", "ethan.hunt@erc.ph", 10006));

                if (systemUsers.Any())
                {
                    foreach (var user in systemUsers)
                    {
                        context.TblSystemUsers.Add(user);
                    }
                    context.SaveChanges();
                    activeUsers = context.TblSystemUsers.ToList();
                }
            }

            // 2. Clear all existing chat-related records safely
            context.TblChatMessageReadReceipts.RemoveRange(context.TblChatMessageReadReceipts);
            context.TblChatMessageReactions.RemoveRange(context.TblChatMessageReactions);
            context.TblChatMessages.RemoveRange(context.TblChatMessages);
            context.TblChatGroupMembers.RemoveRange(context.TblChatGroupMembers);
            context.TblChatGroups.RemoveRange(context.TblChatGroups);
            context.SaveChanges();

            // 3. Let's select our core users
            var u1 = activeUsers[0];
            var u2 = activeUsers[1];
            var u3 = activeUsers[2];
            var u4 = activeUsers[3];
            var u5 = activeUsers[4];
            var u6 = activeUsers[5];

            // 4. Create Group 1: Project Alpha Sync
            var groupAlpha = new TblChatGroup
            {
                Name = "Project Alpha Sync",
                Description = "Official group chat for aligning on Project Alpha milestones and sprint tasks.",
                CreatedBySystemUserId = u1.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            };
            context.TblChatGroups.Add(groupAlpha);
            context.SaveChanges();

            // Add members to Project Alpha
            context.TblChatGroupMembers.AddRange(new List<TblChatGroupMember>
            {
                new TblChatGroupMember { ChatGroupId = groupAlpha.Id, SystemUserId = u1.Id, IsAdmin = true, JoinedAt = DateTime.UtcNow.AddDays(-2) },
                new TblChatGroupMember { ChatGroupId = groupAlpha.Id, SystemUserId = u2.Id, IsAdmin = false, JoinedAt = DateTime.UtcNow.AddDays(-2) },
                new TblChatGroupMember { ChatGroupId = groupAlpha.Id, SystemUserId = u3.Id, IsAdmin = true, JoinedAt = DateTime.UtcNow.AddDays(-2) }, // Bob is also Admin!
                new TblChatGroupMember { ChatGroupId = groupAlpha.Id, SystemUserId = u4.Id, IsAdmin = false, JoinedAt = DateTime.UtcNow.AddDays(-2) }
            });
            context.SaveChanges();

            // Add Group Messages for Project Alpha
            var groupMsgs = new List<TblChatMessage>
            {
                new TblChatMessage { SenderId = u1.Id, GroupId = groupAlpha.Id, Message = "Hey team, welcome to the Project Alpha sync group! Let's use this to discuss daily sprint updates.", CreatedAt = DateTime.UtcNow.AddDays(-1).AddHours(-4) },
                new TblChatMessage { SenderId = u2.Id, GroupId = groupAlpha.Id, Message = "Thanks for setting this up! I'll update the Trello board with our latest tasks shortly.", CreatedAt = DateTime.UtcNow.AddDays(-1).AddHours(-3.5) },
                new TblChatMessage { SenderId = u3.Id, GroupId = groupAlpha.Id, Message = "Sounds great! Ready to collaborate. I have finalized the core API specs.", CreatedAt = DateTime.UtcNow.AddDays(-1).AddHours(-3) },
                new TblChatMessage { SenderId = u4.Id, GroupId = groupAlpha.Id, Message = "Hi everyone! I am currently working on the responsive frontend layouts.", CreatedAt = DateTime.UtcNow.AddDays(-1).AddHours(-2.5) },
                new TblChatMessage { SenderId = u1.Id, GroupId = groupAlpha.Id, Message = "Awesome progress. Let's aim to have our first review meeting tomorrow morning.", CreatedAt = DateTime.UtcNow.AddDays(-1).AddHours(-2) },
                new TblChatMessage { SenderId = u2.Id, GroupId = groupAlpha.Id, Message = "Perfect, works for me!", CreatedAt = DateTime.UtcNow.AddDays(-1).AddHours(-1.8) },
                new TblChatMessage { SenderId = u3.Id, GroupId = groupAlpha.Id, Message = "Should we include the QA team in that call?", CreatedAt = DateTime.UtcNow.AddHours(-2) },
                new TblChatMessage { SenderId = u1.Id, GroupId = groupAlpha.Id, Message = "Yes, good idea. Bob, can you invite them?", CreatedAt = DateTime.UtcNow.AddHours(-1.8) },
                new TblChatMessage { SenderId = u3.Id, GroupId = groupAlpha.Id, Message = "On it! Invite sent.", CreatedAt = DateTime.UtcNow.AddMinutes(-15) }
            };
            context.TblChatMessages.AddRange(groupMsgs);
            context.SaveChanges();

            // Create Group 2: FAS Department Lounge
            var groupFAS = new TblChatGroup
            {
                Name = "FAS Department Lounge",
                Description = "General announcements, team lunches, and casual chat for FAS department employees.",
                CreatedBySystemUserId = u2.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            };
            context.TblChatGroups.Add(groupFAS);
            context.SaveChanges();

            // Add members to FAS Lounge
            context.TblChatGroupMembers.AddRange(new List<TblChatGroupMember>
            {
                new TblChatGroupMember { ChatGroupId = groupFAS.Id, SystemUserId = u2.Id, IsAdmin = true, JoinedAt = DateTime.UtcNow.AddDays(-3) },
                new TblChatGroupMember { ChatGroupId = groupFAS.Id, SystemUserId = u3.Id, IsAdmin = false, JoinedAt = DateTime.UtcNow.AddDays(-3) },
                new TblChatGroupMember { ChatGroupId = groupFAS.Id, SystemUserId = u4.Id, IsAdmin = false, JoinedAt = DateTime.UtcNow.AddDays(-3) },
                new TblChatGroupMember { ChatGroupId = groupFAS.Id, SystemUserId = u5.Id, IsAdmin = false, JoinedAt = DateTime.UtcNow.AddDays(-3) },
                new TblChatGroupMember { ChatGroupId = groupFAS.Id, SystemUserId = u6.Id, IsAdmin = false, JoinedAt = DateTime.UtcNow.AddDays(-3) }
            });
            context.SaveChanges();

            // Add Group Messages for FAS Lounge
            var groupFasMsgs = new List<TblChatMessage>
            {
                new TblChatMessage { SenderId = u2.Id, GroupId = groupFAS.Id, Message = "Hi everyone! Welcome to the new FAS Department Lounge.", CreatedAt = DateTime.UtcNow.AddDays(-2).AddHours(-5) },
                new TblChatMessage { SenderId = u5.Id, GroupId = groupFAS.Id, Message = "Hey team! Glad to be here. Quick reminder that the quarterly asset inventory checks start next Tuesday.", CreatedAt = DateTime.UtcNow.AddDays(-2).AddHours(-4) },
                new TblChatMessage { SenderId = u6.Id, GroupId = groupFAS.Id, Message = "Thanks for the reminder! I'll prepare the list of items under division custody.", CreatedAt = DateTime.UtcNow.AddDays(-2).AddHours(-3) },
                new TblChatMessage { SenderId = u3.Id, GroupId = groupFAS.Id, Message = "By the way, who is up for a team lunch tomorrow?", CreatedAt = DateTime.UtcNow.AddDays(-1).AddHours(-1) },
                new TblChatMessage { SenderId = u4.Id, GroupId = groupFAS.Id, Message = "Count me in! Where are we going?", CreatedAt = DateTime.UtcNow.AddDays(-1).AddHours(-0.8) },
                new TblChatMessage { SenderId = u2.Id, GroupId = groupFAS.Id, Message = "Let's try that new Italian restaurant down the street.", CreatedAt = DateTime.UtcNow.AddHours(-5) },
                new TblChatMessage { SenderId = u5.Id, GroupId = groupFAS.Id, Message = "Sounds delicious, I'm in!", CreatedAt = DateTime.UtcNow.AddHours(-4.5) }
            };
            context.TblChatMessages.AddRange(groupFasMsgs);
            context.SaveChanges();

            // 5. Seed Direct Chats between ALL pairs of the 6 active system users
            var directConvoTemplates = new List<(string, string)[]>
            {
                new[] {
                    ("Hey there! Did you get a chance to look at the latest sprint items?", "Hi! Yes, I did. I am currently working on the responsive mobile layout for our dashboards."),
                    ("Awesome. Let me know if you need any help with the media queries or styling.", "Thanks! I appreciate it. I'll ping you if I get stuck."),
                    ("No problem, happy to help!", "Sounds good. Talk to you later!")
                },
                new[] {
                    ("Hi! Quick question about the asset disposal list: are we finalizing it today?", "Yes, the manager wants it approved before 5 PM."),
                    ("Got it. I'll make sure all the items are double-checked and updated in the system.", "Perfect. Thanks for the quick turnaround!"),
                    ("Anytime. I'll send a notification once it's ready.", "Great, I'll be on the lookout.")
                },
                new[] {
                    ("Hey! Are you free for a quick sync on the database migration?", "Hey! Yes, I am free now. Should we jump on a Teams call?"),
                    ("Yes, let's do it. I'll send the invite.", "Awesome. Joining in a second.")
                },
                new[] {
                    ("Did you see the new dark mode aesthetics on the portal?", "Yes! The glassmorphism and subtle gradients look absolutely premium."),
                    ("Right? The developer did an amazing job with the HSL colors.", "Agreed. It feels super responsive and lively now!")
                },
                new[] {
                    ("Good morning! Just wanted to check if you have updated your profile info?", "Morning! Yes, I did that yesterday. Clean and simple."),
                    ("Excellent. We are matching employee details with AD records.", "Perfect, thanks for coordinating this!")
                }
            };

            int templateIndex = 0;
            // Seed direct conversations for only a select set of pairs
            var convoPairs = new List<(int, int)>
            {
                (0, 1) // u1 <-> u2 (Josh <-> Alice)
            };

            foreach (var pair in convoPairs)
            {
                var sender = activeUsers[pair.Item1];
                var receiver = activeUsers[pair.Item2];

                // Choose a template
                var template = directConvoTemplates[templateIndex % directConvoTemplates.Count];
                templateIndex++;

                // Create messages staggered in time
                var now = DateTime.UtcNow;
                var baseTime = now.AddDays(-1).AddHours(-pair.Item1 * 2);

                int msgIdx = 0;
                foreach (var convo in template)
                {
                    // Sender to Receiver
                    context.TblChatMessages.Add(new TblChatMessage
                    {
                        SenderId = sender.Id,
                        ReceiverId = receiver.Id,
                        Message = convo.Item1,
                        CreatedAt = baseTime.AddMinutes(msgIdx * 10)
                    });

                    // Receiver to Sender
                    context.TblChatMessages.Add(new TblChatMessage
                    {
                        SenderId = receiver.Id,
                        ReceiverId = sender.Id,
                        Message = convo.Item2,
                        CreatedAt = baseTime.AddMinutes(msgIdx * 10 + 5)
                    });

                    msgIdx++;
                }
            }

            context.SaveChanges();
            Console.WriteLine("Force seeding completed successfully!");
        }
    }
}
