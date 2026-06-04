using System.Text.Json;

namespace Tests;

/// <summary>
/// Loads ERC_AMS_* environment variables from API/Properties/launchSettings.json
/// so integration tests can use the same secrets as the API.
/// </summary>
public static class TestSettingsInitializer
{
    private static bool _initialized;

    public static void Initialize()
    {
        if (_initialized)
            return;

        LoadLaunchSettingsEnvironmentVariables();
        _initialized = true;
    }

    private static void LoadLaunchSettingsEnvironmentVariables()
    {
        var dir = Directory.GetCurrentDirectory();
        string? launchSettingsPath = null;

        while (dir != null)
        {
            var path = Path.Combine(dir, "Properties", "launchSettings.json");
            if (File.Exists(path))
            {
                launchSettingsPath = path;
                break;
            }

            var apiPath = Path.Combine(dir, "API", "Properties", "launchSettings.json");
            if (File.Exists(apiPath))
            {
                launchSettingsPath = apiPath;
                break;
            }

            dir = Directory.GetParent(dir)?.FullName;
        }

        if (launchSettingsPath == null)
            return;

        try
        {
            var json = File.ReadAllText(launchSettingsPath);
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("profiles", out var profiles))
                return;

            JsonElement envVars = default;
            if (profiles.TryGetProperty("http", out var httpProfile) &&
                httpProfile.TryGetProperty("environmentVariables", out envVars))
            {
            }
            else if (profiles.TryGetProperty("https", out var httpsProfile) &&
                     httpsProfile.TryGetProperty("environmentVariables", out envVars))
            {
            }

            if (envVars.ValueKind != JsonValueKind.Object)
                return;

            foreach (var prop in envVars.EnumerateObject())
            {
                if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(prop.Name)))
                    Environment.SetEnvironmentVariable(prop.Name, prop.Value.GetString());
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading launchSettings.json: {ex.Message}");
        }
    }
}
