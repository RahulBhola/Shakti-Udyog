using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShaktiUdyog.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCommentAuthorAndEditTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AuthorId",
                table: "ProductionComments",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "EditedAtUtc",
                table: "ProductionComments",
                type: "datetimeoffset",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AuthorId",
                table: "ProductionComments");

            migrationBuilder.DropColumn(
                name: "EditedAtUtc",
                table: "ProductionComments");

            migrationBuilder.CreateTable(
                name: "JiraConfigurations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApiToken = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(254)", maxLength: 254, nullable: false),
                    IsConnected = table.Column<bool>(type: "bit", nullable: false),
                    IssueTypeMappings = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    JiraUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    LastSyncAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ProjectKey = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    WebhookSecret = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JiraConfigurations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "JiraIssueMappings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Assignee = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssigneeAvatarUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    EntityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EntityType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IssueType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    JiraIssueKey = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    JiraIssueUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Labels = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LastSyncAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ParentKey = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Priority = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    StoryPoints = table.Column<int>(type: "int", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JiraIssueMappings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "JiraSyncJobs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompletedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ErrorMessage = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ItemsFailed = table.Column<int>(type: "int", nullable: false),
                    ItemsProcessed = table.Column<int>(type: "int", nullable: false),
                    JobType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    StartedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JiraSyncJobs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "JiraWebhookLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    EventType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Payload = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Processed = table.Column<bool>(type: "bit", nullable: false),
                    ReceivedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JiraWebhookLogs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_JiraIssueMappings_EntityType_EntityId",
                table: "JiraIssueMappings",
                columns: new[] { "EntityType", "EntityId" },
                unique: true);
        }
    }
}
