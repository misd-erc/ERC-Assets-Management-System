using Microsoft.EntityFrameworkCore;
using PortalDB.Services;
using PortalCommon.Utilities;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

#region DB Connection
builder.Services.AddDbContext<PortalDbContext>(options =>
    options.UseSqlServer(DatabaseHelper.ConnectionString()));
#endregion

#region Seeder Command
// Check if we’re running in “seed mode”
if (args.Contains("seed", StringComparer.OrdinalIgnoreCase))
{
    Console.WriteLine("Running database seeder...");

    using var scope = builder.Services.BuildServiceProvider().CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<PortalDbContext>();
    DbSeeder.Seed(context);

    Console.WriteLine("Seeding completed successfully!");
    return; // Exit the app after seeding
}
#endregion

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
