using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShaktiUdyog.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUserBoardPreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserBoardPreferences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VisibleColumns = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    VisibleCardFields = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    CardSize = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DisplayMode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ColumnOrder = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserBoardPreferences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserBoardPreferences_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserBoardPreferences_UserId",
                table: "UserBoardPreferences",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserBoardPreferences");
        }
    }
}
