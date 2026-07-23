using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShaktiUdyog.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddKanbanTaskFix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "KanbanTasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssignedTo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Column = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Position = table.Column<int>(type: "int", nullable: false),
                    Priority = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KanbanTasks", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "KanbanTasks");
        }
    }
}
