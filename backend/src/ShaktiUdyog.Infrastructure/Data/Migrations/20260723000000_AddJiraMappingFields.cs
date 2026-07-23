using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShaktiUdyog.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddJiraMappingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "JiraIssueMappings",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StoryPoints",
                table: "JiraIssueMappings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Priority",
                table: "JiraIssueMappings",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Assignee",
                table: "JiraIssueMappings",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssigneeAvatarUrl",
                table: "JiraIssueMappings",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IssueType",
                table: "JiraIssueMappings",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ParentKey",
                table: "JiraIssueMappings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Labels",
                table: "JiraIssueMappings",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Title",
                table: "JiraIssueMappings");

            migrationBuilder.DropColumn(
                name: "StoryPoints",
                table: "JiraIssueMappings");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "JiraIssueMappings");

            migrationBuilder.DropColumn(
                name: "Assignee",
                table: "JiraIssueMappings");

            migrationBuilder.DropColumn(
                name: "AssigneeAvatarUrl",
                table: "JiraIssueMappings");

            migrationBuilder.DropColumn(
                name: "IssueType",
                table: "JiraIssueMappings");

            migrationBuilder.DropColumn(
                name: "ParentKey",
                table: "JiraIssueMappings");

            migrationBuilder.DropColumn(
                name: "Labels",
                table: "JiraIssueMappings");
        }
    }
}
