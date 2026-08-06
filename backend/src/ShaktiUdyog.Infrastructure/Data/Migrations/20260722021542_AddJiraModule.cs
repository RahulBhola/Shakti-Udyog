using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShaktiUdyog.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddJiraModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JiraConfigurations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JiraUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ProjectKey = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ApiToken = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(254)", maxLength: 254, nullable: false),
                    WebhookSecret = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    IsConnected = table.Column<bool>(type: "bit", nullable: false),
                    LastSyncAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
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
                    EntityType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    EntityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JiraIssueKey = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    JiraIssueUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    LastSyncAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
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
                    JobType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ItemsProcessed = table.Column<int>(type: "int", nullable: false),
                    ItemsFailed = table.Column<int>(type: "int", nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    StartedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CompletedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
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
                    EventType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Payload = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Processed = table.Column<bool>(type: "bit", nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JiraConfigurations");

            migrationBuilder.DropTable(
                name: "JiraIssueMappings");

            migrationBuilder.DropTable(
                name: "JiraSyncJobs");

            migrationBuilder.DropTable(
                name: "JiraWebhookLogs");
        }
    }
}
