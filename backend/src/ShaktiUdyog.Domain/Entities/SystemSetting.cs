namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// A single key/value application setting used by the admin Settings module.
/// Values are stored as strings; the admin UI groups keys into sections and
/// types (text, number, boolean, comma-separated list). Extensible — new
/// settings are added as new keys, no schema migration required.
/// </summary>
public class SystemSetting
{
    /// <summary>Unique setting key, e.g. "company.name". Also the primary key.</summary>
    public string Key { get; set; } = "";

    public string? Value { get; set; }

    public Guid? UpdatedByUserId { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
