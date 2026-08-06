using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShaktiUdyog.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyNameToAspNetUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The model snapshot already contained ApplicationUser.CompanyName
            // when the original 20260722193854_AddCompanyNameToUser migration was
            // generated, so that migration was empty and the column was never
            // created. Add the column now to match the current model
            // (string? CompanyName, no MaxLength => nvarchar(max), nullable).
            migrationBuilder.AddColumn<string>(
                name: "CompanyName",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompanyName",
                table: "AspNetUsers");
        }
    }
}
