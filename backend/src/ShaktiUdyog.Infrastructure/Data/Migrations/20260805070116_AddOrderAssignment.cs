using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShaktiUdyog.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AssignedToUserId",
                table: "Orders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "OrderAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssignedToUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssignedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    AssignedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UnassignedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderAssignments_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_AssignedToUserId",
                table: "Orders",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderAssignments_AssignedToUserId",
                table: "OrderAssignments",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderAssignments_OrderId_IsActive",
                table: "OrderAssignments",
                columns: new[] { "OrderId", "IsActive" });

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_AspNetUsers_AssignedToUserId",
                table: "Orders",
                column: "AssignedToUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_AspNetUsers_AssignedToUserId",
                table: "Orders");

            migrationBuilder.DropTable(
                name: "OrderAssignments");

            migrationBuilder.DropIndex(
                name: "IX_Orders_AssignedToUserId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "AssignedToUserId",
                table: "Orders");
        }
    }
}
