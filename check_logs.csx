using System;
using System.IO;
using System.Data.SqlClient;
using Microsoft.Extensions.Configuration;

var builder = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory() + "/API")
    .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
    .AddJsonFile("appsettings.Development.json", optional: true);
var config = builder.Build();

string connStr = config.GetConnectionString("DefaultConnection") ?? config.GetConnectionString("PortalDbConnection");
if (string.IsNullOrEmpty(connStr)) {
    Console.WriteLine("Connection string not found.");
    return;
}

using var conn = new SqlConnection(connStr);
conn.Open();
using var cmd = new SqlCommand("SELECT TOP 5 ErrorMessage, ErrorStackTrace, CreatedAt FROM dbo.tblErrorLogs ORDER BY CreatedAt DESC", conn);
using var reader = cmd.ExecuteReader();
while (reader.Read()) {
    Console.WriteLine($"[{reader["CreatedAt"]}] {reader["ErrorMessage"]}\n{reader["StackTrace"]}\n");
}
