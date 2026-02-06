using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OfficeOpenXml;
using PortalCommon.Utilities;
using PortalDB.Services;
using PortalTools.Composition;
using PortalTools.Services;
using PortalTools.Services.GetEditTools.ASSET.PTA;
using PortalTools.Services.GetEditTools.ASSET.Supply;
using PortalTools.Services.GetEditTools.DBO.Account;
using PortalTools.Services.GetEditTools.DBO.Notification;
using PortalTools.Services.GetEditTools.DBO.Office;
using PortalTools.Services.GetEditTools.DBO.Storage;
using PortalTools.Services.GetEditTools.LOG;
using System.IO;
using System.Text;

Directory.CreateDirectory(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"));
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
builder.Services.AddScoped<IPortalGetTools, PortalGetTools>();
builder.Services.AddScoped<IPortalEditTools, PortalEditTools>();

builder.Services.AddScoped<AccountGetTools>();
builder.Services.AddScoped<AccountEditTools>();
builder.Services.AddScoped<OfficeGetTools>();
builder.Services.AddScoped<OfficeEditTools>();
builder.Services.AddScoped<StorageGetTools>();
builder.Services.AddScoped<LogEditTools>();
builder.Services.AddScoped<LogGetTools>();
builder.Services.AddScoped<NotificationEditTools>();
builder.Services.AddScoped<NotificationGetTools>();
builder.Services.AddScoped<PTAEditTools>();
builder.Services.AddScoped<PTAGetTools>();
builder.Services.AddScoped<SupplyGetTools>();
builder.Services.AddScoped<SupplyEditTools>();
builder.Services.AddScoped<DeliveryGetTools>();
builder.Services.AddScoped<DeliveryEditTools>();

builder.Services.AddScoped<AuthTools>();
builder.Services.AddScoped<ParserTools>();
#endregion

#region CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendClient",
        policy =>
        {
            policy.WithOrigins(
                "http://localhost:3000", //Local http
                "https://localhost:3000", //Local https
                "https://ams-uat.erc.ph", //Staging
                "https://ams.erc.ph" //Production
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
        });
});
#endregion

#region JWT
//builder.Services.AddAuthentication("Bearer")
//    .AddJwtBearer("Bearer", options =>
//    {
//        options.TokenValidationParameters = new TokenValidationParameters
//        {
//            ValidateIssuer = true,
//            ValidateAudience = true,
//            ValidateLifetime = true,
//            ValidateIssuerSigningKey = true,
//            ValidIssuer = builder.Configuration["Jwt:Issuer"],
//            ValidAudience = builder.Configuration["Jwt:Audience"],
//            IssuerSigningKey = new SymmetricSecurityKey(
//                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
//        };
//    });
#endregion

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontendClient");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapFallbackToFile("index.html");

app.Run();
