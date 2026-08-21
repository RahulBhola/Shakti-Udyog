namespace ShaktiUdyog.Infrastructure.Auth;

/// <summary>
/// Lightweight diagnostic parser for extracting user-friendly device, OS, and browser metadata
/// from User-Agent headers. Note: this metadata is for diagnostics and UI display only;
/// never use client-supplied metadata as security identity.
/// </summary>
public static class UserAgentParser
{
    public record ParsedDeviceInfo(
        string DeviceName,
        string DeviceType,
        string OperatingSystem,
        string Browser,
        string? Location);

    public static ParsedDeviceInfo Parse(string? userAgent, string? ipAddress)
    {
        if (string.IsNullOrWhiteSpace(userAgent))
        {
            var fallbackLoc = ResolveLocation(ipAddress);
            return new ParsedDeviceInfo("Unknown Device", "Unknown", "Unknown", "Unknown", fallbackLoc);
        }

        var os = DetectOperatingSystem(userAgent);
        var browser = DetectBrowser(userAgent);
        var deviceType = DetectDeviceType(userAgent, os);
        var location = ResolveLocation(ipAddress);

        var deviceName = $"{browser} on {os}";
        if (os == "Unknown" && browser == "Unknown")
        {
            deviceName = "Unknown Device";
        }
        else if (os == "Unknown")
        {
            deviceName = browser;
        }
        else if (browser == "Unknown")
        {
            deviceName = os;
        }

        return new ParsedDeviceInfo(deviceName, deviceType, os, browser, location);
    }

    private static string DetectOperatingSystem(string ua)
    {
        if (ua.Contains("iPhone", StringComparison.OrdinalIgnoreCase)) return "iOS (iPhone)";
        if (ua.Contains("iPad", StringComparison.OrdinalIgnoreCase)) return "iOS (iPad)";
        if (ua.Contains("Android", StringComparison.OrdinalIgnoreCase)) return "Android";
        if (ua.Contains("Windows NT", StringComparison.OrdinalIgnoreCase) || ua.Contains("Windows", StringComparison.OrdinalIgnoreCase)) return "Windows";
        if (ua.Contains("Macintosh", StringComparison.OrdinalIgnoreCase) || ua.Contains("Mac OS X", StringComparison.OrdinalIgnoreCase)) return "macOS";
        if (ua.Contains("Linux", StringComparison.OrdinalIgnoreCase)) return "Linux";
        if (ua.Contains("CrOS", StringComparison.OrdinalIgnoreCase)) return "Chrome OS";
        return "Unknown";
    }

    private static string DetectBrowser(string ua)
    {
        if (ua.Contains("Edg/", StringComparison.OrdinalIgnoreCase) || ua.Contains("Edge/", StringComparison.OrdinalIgnoreCase)) return "Edge";
        if (ua.Contains("OPR/", StringComparison.OrdinalIgnoreCase) || ua.Contains("Opera", StringComparison.OrdinalIgnoreCase)) return "Opera";
        if (ua.Contains("Brave", StringComparison.OrdinalIgnoreCase)) return "Brave";
        if (ua.Contains("Firefox/", StringComparison.OrdinalIgnoreCase) || ua.Contains("FxiOS/", StringComparison.OrdinalIgnoreCase)) return "Firefox";
        if (ua.Contains("Chrome/", StringComparison.OrdinalIgnoreCase) || ua.Contains("CriOS/", StringComparison.OrdinalIgnoreCase)) return "Chrome";
        if (ua.Contains("Safari/", StringComparison.OrdinalIgnoreCase) && !ua.Contains("Chrome", StringComparison.OrdinalIgnoreCase)) return "Safari";
        return "Unknown";
    }

    private static string DetectDeviceType(string ua, string os)
    {
        if (ua.Contains("iPad", StringComparison.OrdinalIgnoreCase) || ua.Contains("Tablet", StringComparison.OrdinalIgnoreCase)) return "Tablet";
        if (ua.Contains("Mobile", StringComparison.OrdinalIgnoreCase) || ua.Contains("iPhone", StringComparison.OrdinalIgnoreCase) || (os == "Android" && !ua.Contains("Tablet", StringComparison.OrdinalIgnoreCase))) return "Mobile";
        if (os is "Windows" or "macOS" or "Linux" or "Chrome OS") return "Desktop";
        return "Unknown";
    }

    private static string? ResolveLocation(string? ip)
    {
        if (string.IsNullOrWhiteSpace(ip)) return null;
        if (ip is "127.0.0.1" or "::1" or "localhost") return "Localhost / Internal";
        if (ip.StartsWith("192.168.") || ip.StartsWith("10.") || ip.StartsWith("172.16.")) return "Local Network";
        return "India";
    }
}
