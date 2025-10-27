using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PortalCommon.Utilities;
using PortalDB.Services;
using PortalTools.Services;
using PortalTools.Services.DBO.Account;
using PortalTools.Services.DBO.Office;
using PortalTools.Services.DBO.Storage;
using PortalTools.Services.LOG;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

#region DB Connection
builder.Services.AddDbContext<PortalDbContext>(options =>
    options.UseSqlServer(DatabaseHelper.ConnectionString()));
#endregion

#region Seeder Command
// Check if we�re running in �seed mode�
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

#region Services
builder.Services.AddScoped<AccountGetTools>();
builder.Services.AddScoped<AccountEditTools>();
builder.Services.AddScoped<OfficeGetTools>();
builder.Services.AddScoped<OfficeEditTools>();
builder.Services.AddScoped<StorageGetTools>();
builder.Services.AddScoped<LogGetTools>();

builder.Services.AddScoped<AuthTools>();
#endregion

#region CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendClient",
        policy =>
        {
            policy.WithOrigins(
                "http://localhost:3000",
                "https://localhost:3000",
                "https://ams-dev.erc.ph"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
        });
});
#endregion

#region JWT
/*builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });*/
#endregion

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontendClient");

app.UseAuthorization();

app.MapControllers();

app.Run();
