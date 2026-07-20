namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// General contact enquiry submitted from the public website (requirements
/// §10/§14). Follow-up workflow arrives with the internal portals.
/// </summary>
public class Enquiry
{
    public Guid Id { get; set; }
    public required string FullName { get; set; }
    public required string CompanyName { get; set; }
    public required string Email { get; set; }
    public required string Phone { get; set; }
    public string? City { get; set; }
    public required string Message { get; set; }
    public bool ConsentGiven { get; set; }
    public string Status { get; set; } = "New";
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public string? SubmittedByIp { get; set; }
}
