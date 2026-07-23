using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShaktiUdyog.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddJiraMappingFieldsNew : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Assignee",
                table: "JiraIssueMappings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssigneeAvatarUrl",
                table: "JiraIssueMappings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IssueType",
                table: "JiraIssueMappings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Labels",
                table: "JiraIssueMappings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ParentKey",
                table: "JiraIssueMappings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Priority",
                table: "JiraIssueMappings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StoryPoints",
                table: "JiraIssueMappings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "JiraIssueMappings",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
                name: "Labels",
                table: "JiraIssueMappings");

            migrationBuilder.DropColumn(
                name: "ParentKey",
                table: "JiraIssueMappings");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "JiraIssueMappings");

            migrationBuilder.DropColumn(
                name: "StoryPoints",
                table: "JiraIssueMappings");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "JiraIssueMappings");
        }
    }
}
