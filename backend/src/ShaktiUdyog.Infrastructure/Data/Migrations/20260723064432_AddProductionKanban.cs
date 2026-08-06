using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShaktiUdyog.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProductionKanban : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProductionDepartments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductionDepartments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProductionJobs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JobNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RfqId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    QuotationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CastingName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PartNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DrawingNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PatternNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    MaterialGrade = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CastingWeight = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    CurrentStage = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Priority = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ProductionBatch = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ProgressPercent = table.Column<int>(type: "int", nullable: false),
                    TargetDispatchDateUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    EstimatedCompletionUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    CurrentMachine = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CurrentOperator = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    AssignedEngineer = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    AssignedSupervisor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Department = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    IsBlocked = table.Column<bool>(type: "bit", nullable: false),
                    BlockReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductionJobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductionJobs_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductionJobs_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ProductionJobs_Quotations_QuotationId",
                        column: x => x.QuotationId,
                        principalTable: "Quotations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ProductionJobs_Rfqs_RfqId",
                        column: x => x.RfqId,
                        principalTable: "Rfqs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ProductionMachines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Department = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductionMachines", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProductionStages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Color = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Icon = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductionStages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProductionComments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JobId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AuthorName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    AuthorRole = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Message = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    CommentType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductionComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductionComments_ProductionJobs_JobId",
                        column: x => x.JobId,
                        principalTable: "ProductionJobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductionQualities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JobId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InspectionStatus = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    AcceptedQuantity = table.Column<int>(type: "int", nullable: false),
                    RejectedQuantity = table.Column<int>(type: "int", nullable: false),
                    ReworkQuantity = table.Column<int>(type: "int", nullable: false),
                    HardnessTest = table.Column<bool>(type: "bit", nullable: false),
                    ChemicalAnalysis = table.Column<bool>(type: "bit", nullable: false),
                    DimensionalInspection = table.Column<bool>(type: "bit", nullable: false),
                    VisualInspection = table.Column<bool>(type: "bit", nullable: false),
                    NdtResult = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Inspector = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    InspectionDateUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductionQualities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductionQualities_ProductionJobs_JobId",
                        column: x => x.JobId,
                        principalTable: "ProductionJobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductionStageHistory",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JobId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FromStage = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ToStage = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ChangedByUserId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ChangedByName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    OccurredAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductionStageHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductionStageHistory_ProductionJobs_JobId",
                        column: x => x.JobId,
                        principalTable: "ProductionJobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductionTimelines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JobId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Event = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Details = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ActorName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    OccurredAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductionTimelines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductionTimelines_ProductionJobs_JobId",
                        column: x => x.JobId,
                        principalTable: "ProductionJobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductionComments_JobId_CreatedAtUtc",
                table: "ProductionComments",
                columns: new[] { "JobId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ProductionDepartments_Name",
                table: "ProductionDepartments",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductionJobs_CompanyId",
                table: "ProductionJobs",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionJobs_CurrentStage",
                table: "ProductionJobs",
                column: "CurrentStage");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionJobs_JobNumber",
                table: "ProductionJobs",
                column: "JobNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductionJobs_OrderId",
                table: "ProductionJobs",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionJobs_Priority",
                table: "ProductionJobs",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionJobs_QuotationId",
                table: "ProductionJobs",
                column: "QuotationId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionJobs_RfqId",
                table: "ProductionJobs",
                column: "RfqId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionJobs_Status",
                table: "ProductionJobs",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionMachines_Department",
                table: "ProductionMachines",
                column: "Department");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionQualities_JobId",
                table: "ProductionQualities",
                column: "JobId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionStageHistory_JobId_OccurredAtUtc",
                table: "ProductionStageHistory",
                columns: new[] { "JobId", "OccurredAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ProductionStages_Name",
                table: "ProductionStages",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductionStages_SortOrder",
                table: "ProductionStages",
                column: "SortOrder");

            migrationBuilder.CreateIndex(
                name: "IX_ProductionTimelines_JobId_OccurredAtUtc",
                table: "ProductionTimelines",
                columns: new[] { "JobId", "OccurredAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductionComments");

            migrationBuilder.DropTable(
                name: "ProductionDepartments");

            migrationBuilder.DropTable(
                name: "ProductionMachines");

            migrationBuilder.DropTable(
                name: "ProductionQualities");

            migrationBuilder.DropTable(
                name: "ProductionStageHistory");

            migrationBuilder.DropTable(
                name: "ProductionStages");

            migrationBuilder.DropTable(
                name: "ProductionTimelines");

            migrationBuilder.DropTable(
                name: "ProductionJobs");
        }
    }
}
