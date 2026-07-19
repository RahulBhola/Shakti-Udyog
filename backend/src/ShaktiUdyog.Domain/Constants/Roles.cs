namespace ShaktiUdyog.Domain.Constants;

/// <summary>
/// Application role names. These are seeded at startup and referenced by
/// authorization policies. Keep in sync with docs/shakti-udyog-requirements.md §13.
/// </summary>
public static class Roles
{
    public const string Admin = "Admin";
    public const string DataUpdater = "DataUpdater";
    public const string Customer = "Customer";

    public static readonly IReadOnlyList<string> All = [Admin, DataUpdater, Customer];
}
