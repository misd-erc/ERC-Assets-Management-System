using Microsoft.EntityFrameworkCore;
using PortalDB.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

///Defined on Environment Variables
///e.g. Variable name: ConnectionStrings__AMSDev
///e.g. Varialbe value: Server=MARK\SQLEXPRESS;Database=AMSDev;Trusted_Connection=True;TrustServerCertificate=True;
builder.Services.AddDbContext<PortalDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("AMSDev")));

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
