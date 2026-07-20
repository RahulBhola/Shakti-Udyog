using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Infrastructure.Data;

/// <summary>
/// Primary application DbContext. Identity tables plus the audit log for now;
/// business entities (companies, RFQs, quotations, orders, ...) arrive in
/// later milestones as separate migrations.
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>(options)
{
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<UserCompany> UserCompanies => Set<UserCompany>();
    public DbSet<Enquiry> Enquiries => Set<Enquiry>();
    public DbSet<Rfq> Rfqs => Set<Rfq>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("RefreshTokens");
            entity.Property(t => t.TokenHash).HasMaxLength(88).IsRequired();
            entity.Property(t => t.ReplacedByTokenHash).HasMaxLength(88);
            entity.Property(t => t.CreatedByIp).HasMaxLength(64);
            entity.Property(t => t.RevokedByIp).HasMaxLength(64);
            entity.Property(t => t.RevocationReason).HasMaxLength(200);
            entity.HasIndex(t => t.TokenHash).IsUnique();
            entity.HasIndex(t => t.UserId);
            entity.HasOne(t => t.User)
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PasswordResetToken>(entity =>
        {
            entity.ToTable("PasswordResetTokens");
            entity.Property(t => t.TokenHash).HasMaxLength(88).IsRequired();
            entity.Property(t => t.RequestedByIp).HasMaxLength(64);
            entity.HasIndex(t => t.TokenHash).IsUnique();
            entity.HasIndex(t => t.UserId);
            entity.HasOne(t => t.User)
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<UserCompany>(entity =>
        {
            entity.ToTable("UserCompanies");
            entity.HasIndex(uc => new { uc.UserId, uc.CompanyId }).IsUnique();
            entity.HasOne(uc => uc.User)
                .WithMany()
                .HasForeignKey(uc => uc.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Enquiry>(entity =>
        {
            entity.ToTable("Enquiries");
            entity.Property(e => e.FullName).HasMaxLength(150).IsRequired();
            entity.Property(e => e.CompanyName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(254).IsRequired();
            entity.Property(e => e.Phone).HasMaxLength(30).IsRequired();
            entity.Property(e => e.City).HasMaxLength(150);
            entity.Property(e => e.Message).HasMaxLength(4000).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.SubmittedByIp).HasMaxLength(64);
            entity.HasIndex(e => e.CreatedAtUtc);
        });

        builder.Entity<Rfq>(entity =>
        {
            entity.ToTable("Rfqs");
            entity.Property(r => r.FullName).HasMaxLength(150).IsRequired();
            entity.Property(r => r.CompanyName).HasMaxLength(200).IsRequired();
            entity.Property(r => r.Email).HasMaxLength(254).IsRequired();
            entity.Property(r => r.Phone).HasMaxLength(30).IsRequired();
            entity.Property(r => r.ProductType).HasMaxLength(100).IsRequired();
            entity.Property(r => r.MaterialGrade).HasMaxLength(200);
            entity.Property(r => r.Quantity).HasMaxLength(100).IsRequired();
            entity.Property(r => r.DeliveryLocation).HasMaxLength(300);
            entity.Property(r => r.RequirementDetails).HasMaxLength(8000).IsRequired();
            entity.Property(r => r.Status).HasMaxLength(50);
            entity.Property(r => r.SubmittedByIp).HasMaxLength(64);
            entity.HasIndex(r => r.CreatedAtUtc);
        });

        builder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("AuditLogs");
            entity.Property(a => a.Action).HasMaxLength(200).IsRequired();
            entity.Property(a => a.EntityType).HasMaxLength(200);
            entity.Property(a => a.EntityId).HasMaxLength(100);
            entity.Property(a => a.IpAddress).HasMaxLength(64);
            entity.Property(a => a.UserAgent).HasMaxLength(512);
            entity.HasIndex(a => a.OccurredAtUtc);
            entity.HasIndex(a => new { a.EntityType, a.EntityId });
        });
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        GuardAuditLogImmutability();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        GuardAuditLogImmutability();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void GuardAuditLogImmutability()
    {
        var tampered = ChangeTracker.Entries<AuditLog>()
            .Any(e => e.State is EntityState.Modified or EntityState.Deleted);
        if (tampered)
        {
            throw new InvalidOperationException("Audit log entries are immutable and cannot be modified or deleted.");
        }
    }
}
