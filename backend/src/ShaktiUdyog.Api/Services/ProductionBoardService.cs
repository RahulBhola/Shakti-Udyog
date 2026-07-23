using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Production;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public interface IProductionBoardService
{
    Task<IReadOnlyList<StageDto>> GetStagesAsync();
    Task<IReadOnlyList<DepartmentDto>> GetDepartmentsAsync();
    Task<IReadOnlyList<MachineDto>> GetMachinesAsync();
    Task<IReadOnlyList<ProductionJobListItemDto>> GetBoardJobsAsync(string? search, string? stage, string? priority, string? status);
    Task<ProductionJobDetailDto?> GetJobAsync(Guid id);
    Task<ProductionJobDetailDto> CreateJobAsync(CreateProductionJobRequest request, Guid userId, string? ip);
    Task<bool> UpdateJobAsync(Guid id, UpdateProductionJobRequest request, Guid userId, string? ip);
    Task<bool> MoveStageAsync(Guid id, MoveStageRequest request, Guid userId, string? ip);
    Task<bool> UpdateQualityAsync(Guid id, UpdateQualityRequest request, Guid userId, string? ip);
    Task<CommentDto> AddCommentAsync(Guid id, AddProductionCommentRequest request, Guid userId, string? ip);
    Task<CommentDto?> UpdateCommentAsync(Guid jobId, Guid commentId, UpdateCommentRequest request, Guid userId);
    Task<bool> DeleteCommentAsync(Guid jobId, Guid commentId, Guid userId);
    Task<bool> DeleteJobAsync(Guid id, Guid userId, string? ip);
    Task<ProductionDashboardDto> GetDashboardAsync();
    Task<BoardPreferenceDto?> GetPreferencesAsync(Guid userId);
    Task<BoardPreferenceDto> SavePreferencesAsync(Guid userId, SaveBoardPreferenceRequest request);
}

public class ProductionBoardService(AppDbContext db, IAuditWriter audit) : IProductionBoardService
{
    public async Task<IReadOnlyList<StageDto>> GetStagesAsync()
    {
        // Return all 25 workflow stages from the database, or fall back to the constants
        var dbStages = await db.ProductionStages
            .Where(s => s.IsActive)
            .OrderBy(s => s.SortOrder)
            .Select(s => new StageDto(s.Id, s.Name, s.SortOrder, s.Color, s.IsActive))
            .ToListAsync();

        if (dbStages.Count > 0) return dbStages;

        // Fallback: return stages from constants
        return ProductionStageNames.Workflow.Select((name, index) =>
            new StageDto(Guid.Empty, name, index, ProductionStageNames.Colors.GetValueOrDefault(name, "#6b7280"), true)
        ).ToList();
    }

    public async Task<IReadOnlyList<DepartmentDto>> GetDepartmentsAsync()
    {
        return await db.ProductionDepartments
            .Where(d => d.IsActive)
            .OrderBy(d => d.Name)
            .Select(d => new DepartmentDto(d.Id, d.Name))
            .ToListAsync();
    }

    public async Task<IReadOnlyList<MachineDto>> GetMachinesAsync()
    {
        return await db.ProductionMachines
            .Where(m => m.IsActive)
            .OrderBy(m => m.Name)
            .Select(m => new MachineDto(m.Id, m.Name, m.Department, m.Status))
            .ToListAsync();
    }

    public async Task<IReadOnlyList<ProductionJobListItemDto>> GetBoardJobsAsync(
        string? search, string? stage, string? priority, string? status)
    {
        var query = db.ProductionJobs
            .Where(j => !j.IsDeleted)
            .Include(j => j.Company)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(j =>
                j.JobNumber.ToLower().Contains(s) ||
                j.CastingName.ToLower().Contains(s) ||
                (j.PartNumber != null && j.PartNumber.ToLower().Contains(s)) ||
                j.Company.Name.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(stage))
            query = query.Where(j => j.CurrentStage == stage);

        if (!string.IsNullOrWhiteSpace(priority))
            query = query.Where(j => j.Priority == priority);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(j => j.Status == status);

        // Materialize first, then sort in memory (SortOrder dictionary can't translate to SQL)
        var raw = await query
            .Select(j => new { j.Id, j.JobNumber, j.CastingName, j.CurrentStage,
                j.Priority, j.PartNumber, j.DrawingNumber, j.MaterialGrade,
                j.CastingWeight, j.Quantity,
                CompanyName = j.Company.Name, j.TargetDispatchDateUtc, j.ProgressPercent,
                j.Status, j.IsBlocked, j.AssignedEngineer, j.AssignedSupervisor,
                j.CreatedAtUtc })
            .ToListAsync();

        return raw
            .OrderBy(j => ProductionStageNames.SortOrder.GetValueOrDefault(j.CurrentStage, 99))
            .ThenBy(j => j.CreatedAtUtc)
            .Select(j => new ProductionJobListItemDto(
                j.Id, j.JobNumber, j.CastingName, j.CurrentStage,
                ProductionStageNames.SortOrder.GetValueOrDefault(j.CurrentStage, 99),
                j.Priority, j.PartNumber, j.DrawingNumber, j.MaterialGrade,
                j.CastingWeight, j.Quantity,
                j.CompanyName, j.TargetDispatchDateUtc, j.ProgressPercent,
                j.Status, j.IsBlocked, j.AssignedEngineer, j.AssignedSupervisor,
                j.CreatedAtUtc))
            .ToList();
    }

    public async Task<ProductionJobDetailDto?> GetJobAsync(Guid id)
    {
        return await db.ProductionJobs
            .Where(j => j.Id == id && !j.IsDeleted)
            .Include(j => j.Company)
            .Include(j => j.StageHistory).ThenInclude(h => h.Job)
            .Include(j => j.QualityInspections)
            .Include(j => j.Comments)
            .Include(j => j.Timeline)
            .Select(j => new ProductionJobDetailDto(
                j.Id, j.JobNumber, j.CastingName, j.CurrentStage,
                j.Priority, j.PartNumber, j.DrawingNumber, j.PatternNumber,
                j.MaterialGrade, j.CastingWeight, j.Quantity, j.ProgressPercent,
                j.ProductionBatch, j.TargetDispatchDateUtc, j.EstimatedCompletionUtc,
                j.CurrentMachine, j.CurrentOperator,
                j.AssignedEngineer, j.AssignedSupervisor, j.Department,
                j.Status, j.IsBlocked, j.BlockReason,
                j.CompanyId, j.Company.Name,
                j.OrderId, j.Order != null ? j.Order.OrderNumber : null,
                j.RfqId, j.Rfq != null ? j.Rfq.ProductType : null,
                j.QuotationId, j.Quotation != null ? j.Quotation.QuotationNumber : null,
                j.CreatedAtUtc, j.UpdatedAtUtc,
                j.StageHistory.OrderByDescending(h => h.OccurredAtUtc).Select(h =>
                    new StageHistoryDto(h.Id, h.FromStage, h.ToStage, h.ChangedByName, h.Remarks, h.OccurredAtUtc)).ToList(),
                j.QualityInspections.OrderByDescending(q => q.CreatedAtUtc).Select(q =>
                    new QualityDto(q.Id, q.InspectionStatus, q.AcceptedQuantity, q.RejectedQuantity, q.ReworkQuantity,
                        q.HardnessTest, q.ChemicalAnalysis, q.DimensionalInspection, q.VisualInspection,
                        q.NdtResult, q.Inspector, q.InspectionDateUtc, q.Remarks, q.CreatedAtUtc)).ToList(),
                j.Comments.OrderByDescending(c => c.CreatedAtUtc).Select(c =>
                    new CommentDto(c.Id, c.AuthorId, c.AuthorName, c.AuthorRole, c.Message, c.CommentType, c.CreatedAtUtc, c.EditedAtUtc)).ToList(),
                j.Timeline.OrderByDescending(t => t.OccurredAtUtc).Select(t =>
                    new TimelineDto(t.Id, t.Event, t.Details, t.ActorName, t.OccurredAtUtc)).ToList()))
            .SingleOrDefaultAsync();
    }

    public async Task<ProductionJobDetailDto> CreateJobAsync(CreateProductionJobRequest request, Guid userId, string? ip)
    {
        var jobNumber = $"PJ-{DateTimeOffset.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";

        var job = new ProductionJob
        {
            Id = Guid.NewGuid(),
            JobNumber = jobNumber,
            CompanyId = request.CompanyId,
            CastingName = request.CastingName,
            Quantity = request.Quantity,
            OrderId = request.OrderId,
            RfqId = request.RfqId,
            QuotationId = request.QuotationId,
            PartNumber = request.PartNumber,
            DrawingNumber = request.DrawingNumber,
            PatternNumber = request.PatternNumber,
            MaterialGrade = request.MaterialGrade,
            CastingWeight = request.CastingWeight,
            Priority = request.Priority ?? JobPriorities.Medium,
            TargetDispatchDateUtc = request.TargetDispatchDateUtc,
            AssignedEngineer = request.AssignedEngineer,
            AssignedSupervisor = request.AssignedSupervisor,
            Department = request.Department,
            ProductionBatch = request.ProductionBatch,
            CurrentStage = ProductionStageNames.NewRfqs,
            Status = ProductionJobStatuses.Active,
        };

        db.ProductionJobs.Add(job);

        // Initial stage history
        db.ProductionStageHistories.Add(new ProductionStageHistory
        {
            Id = Guid.NewGuid(),
            JobId = job.Id,
            FromStage = "—",
            ToStage = ProductionStageNames.NewRfqs,
            ChangedByUserId = userId.ToString(),
            ChangedByName = null,
            Remarks = request.Notes,
            OccurredAtUtc = DateTimeOffset.UtcNow,
        });

        // Initial timeline entry
        db.ProductionTimelines.Add(new ProductionTimeline
        {
            Id = Guid.NewGuid(),
            JobId = job.Id,
            Event = "Job Created",
            Details = $"Production job {jobNumber} created for {request.CastingName}",
            ActorName = null,
            OccurredAtUtc = DateTimeOffset.UtcNow,
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.production.job.created", userId, "ProductionJob", job.Id.ToString(), ip);

        return (await GetJobAsync(job.Id))!;
    }

    public async Task<bool> UpdateJobAsync(Guid id, UpdateProductionJobRequest request, Guid userId, string? ip)
    {
        var job = await db.ProductionJobs.FirstOrDefaultAsync(j => j.Id == id && !j.IsDeleted);
        if (job is null) return false;

        if (request.CastingName is not null) job.CastingName = request.CastingName;
        if (request.Quantity.HasValue) job.Quantity = request.Quantity.Value;
        if (request.PartNumber is not null) job.PartNumber = request.PartNumber;
        if (request.DrawingNumber is not null) job.DrawingNumber = request.DrawingNumber;
        if (request.PatternNumber is not null) job.PatternNumber = request.PatternNumber;
        if (request.MaterialGrade is not null) job.MaterialGrade = request.MaterialGrade;
        if (request.CastingWeight.HasValue) job.CastingWeight = request.CastingWeight;
        if (request.Priority is not null) job.Priority = request.Priority;
        if (request.TargetDispatchDateUtc.HasValue) job.TargetDispatchDateUtc = request.TargetDispatchDateUtc;
        if (request.AssignedEngineer is not null) job.AssignedEngineer = request.AssignedEngineer;
        if (request.AssignedSupervisor is not null) job.AssignedSupervisor = request.AssignedSupervisor;
        if (request.Department is not null) job.Department = request.Department;
        if (request.ProductionBatch is not null) job.ProductionBatch = request.ProductionBatch;
        if (request.Status is not null) job.Status = request.Status;
        if (request.ProgressPercent.HasValue) job.ProgressPercent = request.ProgressPercent.Value;
        if (request.CurrentMachine is not null) job.CurrentMachine = request.CurrentMachine;
        if (request.CurrentOperator is not null) job.CurrentOperator = request.CurrentOperator;

        job.UpdatedAtUtc = DateTimeOffset.UtcNow;

        db.ProductionTimelines.Add(new ProductionTimeline
        {
            Id = Guid.NewGuid(),
            JobId = job.Id,
            Event = "Job Updated",
            Details = "Job details were updated",
            ActorName = null,
            OccurredAtUtc = DateTimeOffset.UtcNow,
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.production.job.updated", userId, "ProductionJob", job.Id.ToString(), ip);
        return true;
    }

    public async Task<bool> MoveStageAsync(Guid id, MoveStageRequest request, Guid userId, string? ip)
    {
        var job = await db.ProductionJobs.FirstOrDefaultAsync(j => j.Id == id && !j.IsDeleted);
        if (job is null) return false;

        var fromStage = job.CurrentStage;

        // Validate the target stage exists in our workflow
        if (!ProductionStageNames.Workflow.Contains(request.ToStage))
            return false;

        job.CurrentStage = request.ToStage;
        job.ProgressPercent = (int)((ProductionStageNames.SortOrder.GetValueOrDefault(request.ToStage, 0) + 1) * 100.0 / ProductionStageNames.Workflow.Count);
        job.UpdatedAtUtc = DateTimeOffset.UtcNow;

        // If moved to Dispatched, mark as completed
        if (request.ToStage == ProductionStageNames.Dispatched)
        {
            job.Status = ProductionJobStatuses.Completed;
        }

        // Record stage history
        db.ProductionStageHistories.Add(new ProductionStageHistory
        {
            Id = Guid.NewGuid(),
            JobId = job.Id,
            FromStage = fromStage,
            ToStage = request.ToStage,
            ChangedByUserId = userId.ToString(),
            ChangedByName = null,
            Remarks = request.Remarks,
            OccurredAtUtc = DateTimeOffset.UtcNow,
        });

        // Record timeline
        db.ProductionTimelines.Add(new ProductionTimeline
        {
            Id = Guid.NewGuid(),
            JobId = job.Id,
            Event = "Stage Changed",
            Details = $"Moved from \"{fromStage}\" to \"{request.ToStage}\"",
            ActorName = null,
            OccurredAtUtc = DateTimeOffset.UtcNow,
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.production.job.stage_changed", userId, "ProductionJob", job.Id.ToString(), ip);
        return true;
    }

    public async Task<bool> UpdateQualityAsync(Guid id, UpdateQualityRequest request, Guid userId, string? ip)
    {
        var job = await db.ProductionJobs.FirstOrDefaultAsync(j => j.Id == id && !j.IsDeleted);
        if (job is null) return false;

        var quality = new ProductionQuality
        {
            Id = Guid.NewGuid(),
            JobId = job.Id,
            InspectionStatus = request.InspectionStatus,
            AcceptedQuantity = request.AcceptedQuantity,
            RejectedQuantity = request.RejectedQuantity,
            ReworkQuantity = request.ReworkQuantity,
            HardnessTest = request.HardnessTest,
            ChemicalAnalysis = request.ChemicalAnalysis,
            DimensionalInspection = request.DimensionalInspection,
            VisualInspection = request.VisualInspection,
            NdtResult = request.NdtResult,
            Inspector = request.Inspector,
            InspectionDateUtc = DateTimeOffset.UtcNow,
            Remarks = request.Remarks,
        };

        db.ProductionQualities.Add(quality);

        db.ProductionTimelines.Add(new ProductionTimeline
        {
            Id = Guid.NewGuid(),
            JobId = job.Id,
            Event = "Quality Inspection",
            Details = $"Quality check: {request.InspectionStatus} — Accepted: {request.AcceptedQuantity}, Rejected: {request.RejectedQuantity}",
            ActorName = request.Inspector,
            OccurredAtUtc = DateTimeOffset.UtcNow,
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.production.job.quality_updated", userId, "ProductionJob", job.Id.ToString(), ip);
        return true;
    }

    public async Task<CommentDto> AddCommentAsync(Guid id, AddProductionCommentRequest request, Guid userId, string? ip)
    {
        var job = await db.ProductionJobs.FirstOrDefaultAsync(j => j.Id == id && !j.IsDeleted)
            ?? throw new InvalidOperationException("Job not found.");

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        var authorName = user?.FullName ?? user?.Email ?? "Unknown";
        var authorRole = await db.UserRoles
            .Where(ur => ur.UserId == userId)
            .Join(db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
            .FirstOrDefaultAsync() ?? "User";

        var comment = new ProductionComment
        {
            Id = Guid.NewGuid(),
            JobId = job.Id,
            AuthorId = userId,
            AuthorName = authorName,
            AuthorRole = authorRole,
            Message = request.Message,
            CommentType = request.CommentType,
        };

        db.ProductionComments.Add(comment);

        db.ProductionTimelines.Add(new ProductionTimeline
        {
            Id = Guid.NewGuid(),
            JobId = job.Id,
            Event = "Comment Added",
            Details = request.Message,
            ActorName = authorName,
            OccurredAtUtc = DateTimeOffset.UtcNow,
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.production.job.commented", userId, "ProductionJob", job.Id.ToString(), ip);

        return new CommentDto(comment.Id, comment.AuthorId, comment.AuthorName, comment.AuthorRole, comment.Message, comment.CommentType, comment.CreatedAtUtc, comment.EditedAtUtc);
    }

    public async Task<CommentDto?> UpdateCommentAsync(Guid jobId, Guid commentId, UpdateCommentRequest request, Guid userId)
    {
        var comment = await db.ProductionComments.FirstOrDefaultAsync(c => c.Id == commentId && c.JobId == jobId)
            ?? throw new InvalidOperationException("Comment not found.");
        if (comment.AuthorId != userId) throw new InvalidOperationException("You can only edit your own comments.");

        comment.Message = request.Message;
        comment.EditedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();

        return new CommentDto(comment.Id, comment.AuthorId, comment.AuthorName, comment.AuthorRole, comment.Message, comment.CommentType, comment.CreatedAtUtc, comment.EditedAtUtc);
    }

    public async Task<bool> DeleteCommentAsync(Guid jobId, Guid commentId, Guid userId)
    {
        var comment = await db.ProductionComments.FirstOrDefaultAsync(c => c.Id == commentId && c.JobId == jobId)
            ?? throw new InvalidOperationException("Comment not found.");
        if (comment.AuthorId != userId) throw new InvalidOperationException("You can only delete your own comments.");

        db.ProductionComments.Remove(comment);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteJobAsync(Guid id, Guid userId, string? ip)
    {
        var job = await db.ProductionJobs.FirstOrDefaultAsync(j => j.Id == id && !j.IsDeleted);
        if (job is null) return false;

        job.IsDeleted = true;
        job.DeletedAtUtc = DateTimeOffset.UtcNow;
        job.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.production.job.deleted", userId, "ProductionJob", job.Id.ToString(), ip);
        return true;
    }

    public async Task<ProductionDashboardDto> GetDashboardAsync()
    {
        var now = DateTimeOffset.UtcNow;
        var startOfMonth = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var endOfWeek = now.AddDays(7 - (int)now.DayOfWeek);

        var activeJobs = await db.ProductionJobs.Where(j => !j.IsDeleted && j.Status == ProductionJobStatuses.Active).ToListAsync();

        var totalActive = activeJobs.Count;
        var jobsInProduction = activeJobs.Count(j =>
            j.CurrentStage != ProductionStageNames.NewRfqs &&
            j.CurrentStage != ProductionStageNames.Dispatched &&
            j.CurrentStage != ProductionStageNames.ReadyForDispatch);
        var delayedJobs = activeJobs.Count(j =>
            j.TargetDispatchDateUtc.HasValue && j.TargetDispatchDateUtc < now);
        var jobsDueThisWeek = activeJobs.Count(j =>
            j.TargetDispatchDateUtc.HasValue && j.TargetDispatchDateUtc <= endOfWeek);

        var completedThisMonth = await db.ProductionJobs
            .CountAsync(j => !j.IsDeleted && j.Status == ProductionJobStatuses.Completed && j.UpdatedAtUtc >= startOfMonth);

        var totalInspections = await db.ProductionQualities.CountAsync();
        var passedInspections = await db.ProductionQualities.CountAsync(q => q.InspectionStatus == QualityResults.Pass);
        var passRate = totalInspections > 0 ? Math.Round((decimal)passedInspections / totalInspections * 100, 1) : 0m;

        var jobsByStage = activeJobs
            .GroupBy(j => j.CurrentStage)
            .Select(g => new StageCountDto(g.Key, g.Count()))
            .OrderByDescending(s => s.Count)
            .ToList();

        var jobsByPriority = activeJobs
            .GroupBy(j => j.Priority ?? JobPriorities.Medium)
            .Select(g => new PriorityCountDto(g.Key, g.Count()))
            .ToList();

        return new ProductionDashboardDto(
            totalActive, jobsInProduction, delayedJobs, jobsDueThisWeek,
            completedThisMonth, passRate, jobsByStage, jobsByPriority);
    }

    public async Task<BoardPreferenceDto?> GetPreferencesAsync(Guid userId)
    {
        var pref = await db.UserBoardPreferences.FirstOrDefaultAsync(p => p.UserId == userId);
        if (pref is null) return null;
        return new BoardPreferenceDto(pref.VisibleColumns, pref.VisibleCardFields, pref.CardSize, pref.DisplayMode, pref.ColumnOrder);
    }

    public async Task<BoardPreferenceDto> SavePreferencesAsync(Guid userId, SaveBoardPreferenceRequest request)
    {
        var pref = await db.UserBoardPreferences.FirstOrDefaultAsync(p => p.UserId == userId);
        if (pref is null)
        {
            pref = new UserBoardPreference
            {
                Id = Guid.NewGuid(),
                UserId = userId,
            };
            db.UserBoardPreferences.Add(pref);
        }

        if (request.VisibleColumns is not null) pref.VisibleColumns = request.VisibleColumns;
        if (request.VisibleCardFields is not null) pref.VisibleCardFields = request.VisibleCardFields;
        if (request.CardSize is not null) pref.CardSize = request.CardSize;
        if (request.DisplayMode is not null) pref.DisplayMode = request.DisplayMode;
        if (request.ColumnOrder is not null) pref.ColumnOrder = request.ColumnOrder;
        pref.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        return new BoardPreferenceDto(pref.VisibleColumns, pref.VisibleCardFields, pref.CardSize, pref.DisplayMode, pref.ColumnOrder);
    }
}
