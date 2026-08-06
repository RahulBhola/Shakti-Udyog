using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShaktiUdyog.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveJiraTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop the orphaned Jira tables (the Jira feature was retired; no
            // entities reference them and they are no longer part of the model).
            migrationBuilder.Sql("""
                DROP TABLE IF EXISTS [JiraConfigurations];
                DROP TABLE IF EXISTS [JiraIssueMappings];
                DROP TABLE IF EXISTS [JiraSyncJobs];
                DROP TABLE IF EXISTS [JiraWebhookLogs];
                DROP TABLE IF EXISTS [IssueTypeMappings];
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
