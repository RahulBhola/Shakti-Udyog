using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShaktiUdyog.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddJiraIssueTypeMappings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IssueTypeMappings",
                table: "JiraConfigurations",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IssueTypeMappings",
                table: "JiraConfigurations");
        }
    }
}
