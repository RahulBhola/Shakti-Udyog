using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShaktiUdyog.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddContactRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Rename the contact-form table Enquiries -> ContactRequests (data-preserving).
            // The PK/index constraint names are intentionally NOT renamed: EF queries by
            // column, not constraint name, so the app runs fine either way. Idempotent so it
            // also succeeds if a prior partial run already renamed the table.
            migrationBuilder.Sql("IF OBJECT_ID(N'Enquiries', N'U') IS NOT NULL EXEC sp_rename N'Enquiries', N'ContactRequests';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("IF OBJECT_ID(N'ContactRequests', N'U') IS NOT NULL EXEC sp_rename N'ContactRequests', N'Enquiries';");
        }
    }
}
