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
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<RfqFile> RfqFiles => Set<RfqFile>();
    public DbSet<Quotation> Quotations => Set<Quotation>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderMilestone> OrderMilestones => Set<OrderMilestone>();
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<SupportRequest> SupportRequests => Set<SupportRequest>();
    public DbSet<RfqStatusHistory> RfqStatusHistories => Set<RfqStatusHistory>();
    public DbSet<RfqComment> RfqComments => Set<RfqComment>();
    public DbSet<RfqItem> RfqItems => Set<RfqItem>();
    public DbSet<RfqAssignment> RfqAssignments => Set<RfqAssignment>();
    public DbSet<QuotationItem> QuotationItems => Set<QuotationItem>();
    public DbSet<QuotationRevision> QuotationRevisions => Set<QuotationRevision>();
    public DbSet<QuotationComment> QuotationComments => Set<QuotationComment>();
    public DbSet<QuotationAttachment> QuotationAttachments => Set<QuotationAttachment>();
    public DbSet<QuotationStatusHistory> QuotationStatusHistories => Set<QuotationStatusHistory>();
    public DbSet<QuotationApproval> QuotationApprovals => Set<QuotationApproval>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductMedia> ProductMedias => Set<ProductMedia>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Industry> Industries => Set<Industry>();
    public DbSet<Resource> Resources => Set<Resource>();
    public DbSet<Faq> Faqs => Set<Faq>();
    public DbSet<GalleryItem> GalleryItems => Set<GalleryItem>();
    public DbSet<DocumentFolder> DocumentFolders => Set<DocumentFolder>();
    public DbSet<DocumentVersion> DocumentVersions => Set<DocumentVersion>();
    public DbSet<ShipmentTrackingEvent> ShipmentTrackingEvents => Set<ShipmentTrackingEvent>();
    public DbSet<OrderComment> OrderComments => Set<OrderComment>();
    public DbSet<OrderStatusHistory> OrderStatusHistories => Set<OrderStatusHistory>();

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

        builder.Entity<Company>(entity =>
        {
            entity.ToTable("Companies");
            entity.Property(c => c.Name).HasMaxLength(200).IsRequired();
            entity.Property(c => c.AddressLine1).HasMaxLength(300);
            entity.Property(c => c.City).HasMaxLength(150);
            entity.Property(c => c.State).HasMaxLength(150);
            entity.Property(c => c.PostalCode).HasMaxLength(20);
            entity.Property(c => c.Country).HasMaxLength(100);
            entity.Property(c => c.GstNumber).HasMaxLength(30);
            entity.Property(c => c.DeliveryAddresses).HasMaxLength(4000);
        });

        builder.Entity<RfqFile>(entity =>
        {
            entity.ToTable("RfqFiles");
            entity.Property(f => f.FileName).HasMaxLength(255).IsRequired();
            entity.Property(f => f.ContentType).HasMaxLength(127).IsRequired();
            entity.Property(f => f.StorageKey).HasMaxLength(200).IsRequired();
            entity.HasIndex(f => f.StorageKey).IsUnique();
            entity.HasOne(f => f.Rfq).WithMany(r => r.Files)
                .HasForeignKey(f => f.RfqId).OnDelete(DeleteBehavior.Cascade);
            entity.HasQueryFilter(f => !f.Rfq.IsDeleted);
        });

        builder.Entity<Quotation>(entity =>
        {
            entity.ToTable("Quotations");
            entity.Property(q => q.QuotationNumber).HasMaxLength(40).IsRequired();
            entity.HasIndex(q => q.QuotationNumber).IsUnique();
            entity.Property(q => q.Subtotal).HasPrecision(18, 2);
            entity.Property(q => q.Tax).HasPrecision(18, 2);
            entity.Property(q => q.Discount).HasPrecision(18, 2);
            entity.Property(q => q.Total).HasPrecision(18, 2);
            entity.Property(q => q.Currency).HasMaxLength(3);
            entity.Property(q => q.PaymentTerms).HasMaxLength(500);
            entity.Property(q => q.DeliveryTerms).HasMaxLength(500);
            entity.Property(q => q.Freight).HasMaxLength(500);
            entity.Property(q => q.Packing).HasMaxLength(500);
            entity.Property(q => q.Remarks).HasMaxLength(2000);
            entity.Property(q => q.Status).HasMaxLength(30);
            entity.Property(q => q.CustomerResponseComment).HasMaxLength(2000);
            entity.Property(q => q.RowVersion).IsRowVersion();
            entity.HasQueryFilter(q => !q.IsDeleted);
            entity.HasIndex(q => q.CompanyId);
            entity.HasOne(q => q.Rfq).WithMany()
                .HasForeignKey(q => q.RfqId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(q => q.Company).WithMany()
                .HasForeignKey(q => q.CompanyId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<QuotationItem>(entity =>
        {
            entity.ToTable("QuotationItems");
            entity.Property(i => i.PartNumber).HasMaxLength(100).IsRequired();
            entity.Property(i => i.Description).HasMaxLength(500).IsRequired();
            entity.Property(i => i.MaterialGrade).HasMaxLength(100);
            entity.Property(i => i.Unit).HasMaxLength(20);
            entity.Property(i => i.UnitPrice).HasPrecision(18, 2);
            entity.Property(i => i.TaxPercent).HasPrecision(5, 2);
            entity.Property(i => i.LineTotal).HasPrecision(18, 2);
            entity.HasOne(i => i.Quotation).WithMany(q => q.Items)
                .HasForeignKey(i => i.QuotationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasQueryFilter(i => !i.Quotation.IsDeleted);
        });

        builder.Entity<QuotationStatusHistory>(entity =>
        {
            entity.ToTable("QuotationStatusHistory");
            entity.Property(h => h.FromStatus).HasMaxLength(30).IsRequired();
            entity.Property(h => h.ToStatus).HasMaxLength(30).IsRequired();
            entity.Property(h => h.ChangedByRole).HasMaxLength(30);
            entity.Property(h => h.Note).HasMaxLength(2000);
            entity.HasIndex(h => new { h.QuotationId, h.CreatedAtUtc });
            entity.HasOne(h => h.Quotation).WithMany(q => q.StatusHistory)
                .HasForeignKey(h => h.QuotationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasQueryFilter(h => !h.Quotation.IsDeleted);
        });

        builder.Entity<QuotationComment>(entity =>
        {
            entity.ToTable("QuotationComments");
            entity.Property(c => c.AuthorRole).HasMaxLength(30);
            entity.Property(c => c.Message).HasMaxLength(4000).IsRequired();
            entity.HasOne(c => c.Quotation).WithMany(q => q.Comments)
                .HasForeignKey(c => c.QuotationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasQueryFilter(c => !c.Quotation.IsDeleted);
        });

        builder.Entity<QuotationAttachment>(entity =>
        {
            entity.ToTable("QuotationAttachments");
            entity.Property(a => a.FileName).HasMaxLength(255).IsRequired();
            entity.Property(a => a.ContentType).HasMaxLength(127).IsRequired();
            entity.Property(a => a.StorageKey).HasMaxLength(200).IsRequired();
            entity.Property(a => a.Description).HasMaxLength(500);
            entity.HasIndex(a => a.StorageKey).IsUnique();
            entity.HasOne(a => a.Quotation).WithMany(q => q.Attachments)
                .HasForeignKey(a => a.QuotationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasQueryFilter(a => !a.Quotation.IsDeleted);
        });

        builder.Entity<QuotationRevision>(entity =>
        {
            entity.ToTable("QuotationRevisions");
            entity.Property(r => r.ChangeNotes).HasMaxLength(2000);
            entity.Property(r => r.PreviousTotal).HasPrecision(18, 2);
            entity.Property(r => r.NewTotal).HasPrecision(18, 2);
            entity.HasOne(r => r.Quotation).WithMany(q => q.Revisions)
                .HasForeignKey(r => r.QuotationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasQueryFilter(r => !r.Quotation.IsDeleted);
        });

        builder.Entity<QuotationApproval>(entity =>
        {
            entity.ToTable("QuotationApprovals");
            entity.Property(a => a.Action).HasMaxLength(20).IsRequired();
            entity.Property(a => a.Comment).HasMaxLength(2000);
            entity.HasOne(a => a.Quotation).WithMany(q => q.Approvals)
                .HasForeignKey(a => a.QuotationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasQueryFilter(a => !a.Quotation.IsDeleted);
        });

        builder.Entity<Product>(entity =>
        {
            entity.ToTable("Products");
            entity.Property(p => p.Title).HasMaxLength(255).IsRequired();
            entity.Property(p => p.Slug).HasMaxLength(255).IsRequired();
            entity.HasIndex(p => p.Slug).IsUnique();
            entity.Property(p => p.Summary).HasMaxLength(500).IsRequired();
            entity.Property(p => p.Description).HasMaxLength(4000);
            entity.Property(p => p.TypicalApplications).HasMaxLength(2000);
            entity.Property(p => p.CommonGrades).HasMaxLength(500);
            entity.Property(p => p.CastingWeightRange).HasMaxLength(200);
            entity.Property(p => p.AvailableFinish).HasMaxLength(500);
            entity.Property(p => p.MaterialGrades).HasMaxLength(500);
            entity.Property(p => p.SeoTitle).HasMaxLength(255);
            entity.Property(p => p.SeoDescription).HasMaxLength(500);
            entity.Property(p => p.RowVersion).IsRowVersion();
        });

        builder.Entity<ProductMedia>(entity =>
        {
            entity.ToTable("ProductMedias");
            entity.Property(m => m.FileName).HasMaxLength(255).IsRequired();
            entity.Property(m => m.ContentType).HasMaxLength(127).IsRequired();
            entity.Property(m => m.StorageKey).HasMaxLength(200).IsRequired();
            entity.Property(m => m.AltText).HasMaxLength(500);
            entity.HasIndex(m => m.StorageKey).IsUnique();
            entity.HasOne(m => m.Product).WithMany(p => p.Media)
                .HasForeignKey(m => m.ProductId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Category>(entity =>
        {
            entity.ToTable("Categories");
            entity.Property(c => c.Name).HasMaxLength(200).IsRequired();
            entity.Property(c => c.Slug).HasMaxLength(255);
            entity.Property(c => c.Description).HasMaxLength(1000);
            entity.HasOne(c => c.Parent).WithMany(c => c.Children)
                .HasForeignKey(c => c.ParentId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Industry>(entity =>
        {
            entity.ToTable("Industries");
            entity.Property(i => i.Name).HasMaxLength(200).IsRequired();
            entity.Property(i => i.Description).HasMaxLength(1000);
            entity.Property(i => i.ExampleComponents).HasMaxLength(1000);
        });

        builder.Entity<Resource>(entity =>
        {
            entity.ToTable("Resources");
            entity.Property(r => r.Title).HasMaxLength(255).IsRequired();
            entity.Property(r => r.Slug).HasMaxLength(255).IsRequired();
            entity.HasIndex(r => r.Slug).IsUnique();
            entity.Property(r => r.Summary).HasMaxLength(500).IsRequired();
            entity.Property(r => r.Body).HasColumnType("nvarchar(max)");
            entity.Property(r => r.Category).HasMaxLength(50);
            entity.Property(r => r.SeoTitle).HasMaxLength(255);
            entity.Property(r => r.SeoDescription).HasMaxLength(500);
        });

        builder.Entity<Faq>(entity =>
        {
            entity.ToTable("Faqs");
            entity.Property(f => f.Question).HasMaxLength(500).IsRequired();
            entity.Property(f => f.Answer).HasMaxLength(4000).IsRequired();
            entity.Property(f => f.Category).HasMaxLength(100);
        });

        builder.Entity<GalleryItem>(entity =>
        {
            entity.ToTable("GalleryItems");
            entity.Property(g => g.FileName).HasMaxLength(255).IsRequired();
            entity.Property(g => g.ContentType).HasMaxLength(127).IsRequired();
            entity.Property(g => g.StorageKey).HasMaxLength(200).IsRequired();
            entity.HasIndex(g => g.StorageKey).IsUnique();
            entity.Property(g => g.Caption).HasMaxLength(500);
            entity.Property(g => g.AltText).HasMaxLength(500);
            entity.Property(g => g.Album).HasMaxLength(200);
        });

        builder.Entity<Order>(entity =>
        {
            entity.ToTable("Orders");
            entity.Property(o => o.OrderNumber).HasMaxLength(40).IsRequired();
            entity.HasIndex(o => o.OrderNumber).IsUnique();
            entity.Property(o => o.PurchaseOrderReference).HasMaxLength(100);
            entity.Property(o => o.Status).HasMaxLength(30);
            entity.Property(o => o.DeliveryAddress).HasMaxLength(500);
            entity.HasIndex(o => o.CompanyId);
            entity.HasOne(o => o.Company).WithMany()
                .HasForeignKey(o => o.CompanyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(o => o.Quotation).WithMany()
                .HasForeignKey(o => o.QuotationId).OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("OrderItems");
            entity.Property(i => i.PartNumber).HasMaxLength(100).IsRequired();
            entity.Property(i => i.Description).HasMaxLength(500).IsRequired();
            entity.Property(i => i.MaterialGrade).HasMaxLength(100);
            entity.Property(i => i.DrawingRevision).HasMaxLength(50);
            entity.Property(i => i.Unit).HasMaxLength(20);
            entity.Property(i => i.UnitRate).HasPrecision(18, 2);
            entity.HasOne(i => i.Order).WithMany(o => o.Items)
                .HasForeignKey(i => i.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<OrderMilestone>(entity =>
        {
            entity.ToTable("OrderMilestones");
            entity.Property(m => m.StatusCode).HasMaxLength(30).IsRequired();
            entity.Property(m => m.CustomerMessage).HasMaxLength(1000);
            entity.Property(m => m.InternalNote).HasMaxLength(2000);
            entity.Property(m => m.ActorType).HasMaxLength(30);
            entity.HasIndex(m => new { m.OrderId, m.OccurredAtUtc });
            entity.HasOne(m => m.Order).WithMany(o => o.Milestones)
                .HasForeignKey(m => m.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Shipment>(entity =>
        {
            entity.ToTable("Shipments");
            entity.Property(s => s.Transporter).HasMaxLength(200);
            entity.Property(s => s.TrackingNumber).HasMaxLength(100);
            entity.HasOne(s => s.Order).WithMany(o => o.Shipments)
                .HasForeignKey(s => s.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ShipmentTrackingEvent>(entity =>
        {
            entity.ToTable("ShipmentTrackingEvents");
            entity.Property(e => e.Location).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(1000).IsRequired();
            entity.HasOne(e => e.Shipment).WithMany()
                .HasForeignKey(e => e.ShipmentId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<OrderComment>(entity =>
        {
            entity.ToTable("OrderComments");
            entity.Property(c => c.AuthorRole).HasMaxLength(30);
            entity.Property(c => c.Message).HasMaxLength(4000).IsRequired();
            entity.HasOne(c => c.Order).WithMany()
                .HasForeignKey(c => c.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<OrderStatusHistory>(entity =>
        {
            entity.ToTable("OrderStatusHistory");
            entity.Property(h => h.FromStatus).HasMaxLength(30).IsRequired();
            entity.Property(h => h.ToStatus).HasMaxLength(30).IsRequired();
            entity.Property(h => h.ChangedByRole).HasMaxLength(30);
            entity.Property(h => h.Note).HasMaxLength(2000);
            entity.HasOne(h => h.Order).WithMany()
                .HasForeignKey(h => h.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Invoice>(entity =>
        {
            entity.ToTable("Invoices");
            entity.Property(i => i.InvoiceNumber).HasMaxLength(40).IsRequired();
            entity.HasIndex(i => i.InvoiceNumber).IsUnique();
            entity.Property(i => i.Subtotal).HasPrecision(18, 2);
            entity.Property(i => i.Tax).HasPrecision(18, 2);
            entity.Property(i => i.Total).HasPrecision(18, 2);
            entity.Property(i => i.AmountPaid).HasPrecision(18, 2);
            entity.Property(i => i.BalanceDue).HasPrecision(18, 2);
            entity.Property(i => i.Currency).HasMaxLength(3);
            entity.Property(i => i.Status).HasMaxLength(30);
            entity.HasIndex(i => i.CompanyId);
            entity.HasOne(i => i.Company).WithMany()
                .HasForeignKey(i => i.CompanyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(i => i.Order).WithMany()
                .HasForeignKey(i => i.OrderId).OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<Payment>(entity =>
        {
            entity.ToTable("Payments");
            entity.Property(p => p.PaymentReference).HasMaxLength(100).IsRequired();
            entity.Property(p => p.Method).HasMaxLength(50);
            entity.Property(p => p.Amount).HasPrecision(18, 2);
            entity.Property(p => p.Status).HasMaxLength(30);
            entity.Property(p => p.VerificationNote).HasMaxLength(1000);
            entity.HasIndex(p => p.CompanyId);
            entity.HasOne(p => p.Company).WithMany()
                .HasForeignKey(p => p.CompanyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(p => p.Invoice).WithMany()
                .HasForeignKey(p => p.InvoiceId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Document>(entity =>
        {
            entity.ToTable("Documents");
            entity.Property(d => d.Title).HasMaxLength(255).IsRequired();
            entity.Property(d => d.Category).HasMaxLength(50).IsRequired();
            entity.Property(d => d.FileName).HasMaxLength(255).IsRequired();
            entity.Property(d => d.ContentType).HasMaxLength(127).IsRequired();
            entity.Property(d => d.StorageKey).HasMaxLength(200).IsRequired();
            entity.Property(d => d.Status).HasMaxLength(30);
            entity.Property(d => d.Tags).HasMaxLength(500);
            entity.HasIndex(d => d.StorageKey).IsUnique();
            entity.HasIndex(d => new { d.CompanyId, d.Category });
            entity.HasOne(d => d.Company).WithMany()
                .HasForeignKey(d => d.CompanyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(d => d.Folder).WithMany()
                .HasForeignKey(d => d.FolderId).OnDelete(DeleteBehavior.SetNull);
            entity.HasQueryFilter(d => !d.IsDeleted);
        });

        builder.Entity<DocumentFolder>(entity =>
        {
            entity.ToTable("DocumentFolders");
            entity.Property(f => f.Name).HasMaxLength(200).IsRequired();
            entity.HasOne(f => f.Parent).WithMany(f => f.Children)
                .HasForeignKey(f => f.ParentId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<DocumentVersion>(entity =>
        {
            entity.ToTable("DocumentVersions");
            entity.Property(v => v.FileName).HasMaxLength(255).IsRequired();
            entity.Property(v => v.ContentType).HasMaxLength(127).IsRequired();
            entity.Property(v => v.StorageKey).HasMaxLength(200).IsRequired();
            entity.Property(v => v.Comment).HasMaxLength(500);
            entity.HasIndex(v => v.StorageKey).IsUnique();
            entity.HasOne(v => v.Document).WithMany(d => d.Versions)
                .HasForeignKey(v => v.DocumentId).OnDelete(DeleteBehavior.Cascade);
            entity.HasQueryFilter(v => !v.Document.IsDeleted);
        });

        builder.Entity<Notification>(entity =>
        {
            entity.ToTable("Notifications");
            entity.Property(n => n.Type).HasMaxLength(30);
            entity.Property(n => n.Title).HasMaxLength(200).IsRequired();
            entity.Property(n => n.Body).HasMaxLength(1000);
            entity.Property(n => n.LinkPath).HasMaxLength(300);
            entity.HasIndex(n => new { n.UserId, n.IsRead });
            entity.HasOne(n => n.User).WithMany()
                .HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<SupportRequest>(entity =>
        {
            entity.ToTable("SupportRequests");
            entity.Property(s => s.Subject).HasMaxLength(200).IsRequired();
            entity.Property(s => s.Message).HasMaxLength(4000).IsRequired();
            entity.Property(s => s.Status).HasMaxLength(30);
            entity.HasIndex(s => s.CompanyId);
            entity.HasOne(s => s.Company).WithMany()
                .HasForeignKey(s => s.CompanyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(s => s.Order).WithMany()
                .HasForeignKey(s => s.OrderId).OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<RfqStatusHistory>(entity =>
        {
            entity.ToTable("RfqStatusHistory");
            entity.Property(h => h.FromStatus).HasMaxLength(30).IsRequired();
            entity.Property(h => h.ToStatus).HasMaxLength(30).IsRequired();
            entity.Property(h => h.ChangedByRole).HasMaxLength(30);
            entity.Property(h => h.Note).HasMaxLength(2000);
            entity.HasIndex(h => new { h.RfqId, h.CreatedAtUtc });
            entity.HasOne(h => h.Rfq).WithMany(r => r.StatusHistory)
                .HasForeignKey(h => h.RfqId).OnDelete(DeleteBehavior.Cascade);
            entity.HasQueryFilter(h => !h.Rfq.IsDeleted);
        });

        builder.Entity<RfqComment>(entity =>
        {
            entity.ToTable("RfqComments");
            entity.Property(c => c.AuthorRole).HasMaxLength(30);
            entity.Property(c => c.Message).HasMaxLength(4000).IsRequired();
            entity.HasIndex(c => new { c.RfqId, c.CreatedAtUtc });
            entity.HasOne(c => c.Rfq).WithMany(r => r.Comments)
                .HasForeignKey(c => c.RfqId).OnDelete(DeleteBehavior.Cascade);
            entity.HasQueryFilter(c => !c.Rfq.IsDeleted);
        });

        builder.Entity<RfqAssignment>(entity =>
        {
            entity.ToTable("RfqAssignments");
            entity.HasIndex(a => new { a.RfqId, a.IsActive });
            entity.HasOne(a => a.Rfq).WithMany(r => r.Assignments)
                .HasForeignKey(a => a.RfqId).OnDelete(DeleteBehavior.Cascade);
            entity.HasQueryFilter(a => !a.Rfq.IsDeleted);
        });

        builder.Entity<RfqItem>(entity =>
        {
            entity.ToTable("RfqItems");
            entity.Property(i => i.PartNumber).HasMaxLength(100).IsRequired();
            entity.Property(i => i.Description).HasMaxLength(500).IsRequired();
            entity.Property(i => i.MaterialGrade).HasMaxLength(100);
            entity.Property(i => i.Unit).HasMaxLength(20);
            entity.Property(i => i.DrawingRevision).HasMaxLength(50);
            entity.HasOne(i => i.Rfq).WithMany(r => r.Items)
                .HasForeignKey(i => i.RfqId).OnDelete(DeleteBehavior.Cascade);
            entity.HasQueryFilter(i => !i.Rfq.IsDeleted);
        });

        builder.Entity<Rfq>(entity =>
        {
            entity.HasOne(r => r.Company).WithMany()
                .HasForeignKey(r => r.CompanyId).OnDelete(DeleteBehavior.SetNull);
            entity.Property(r => r.RowVersion).IsRowVersion();
            entity.HasQueryFilter(r => !r.IsDeleted);
        });

        builder.Entity<UserCompany>(entity =>
        {
            entity.HasOne(uc => uc.Company).WithMany()
                .HasForeignKey(uc => uc.CompanyId).OnDelete(DeleteBehavior.Cascade);
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
