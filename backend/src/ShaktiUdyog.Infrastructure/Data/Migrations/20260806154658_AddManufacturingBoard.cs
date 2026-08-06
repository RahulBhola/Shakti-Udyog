using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShaktiUdyog.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddManufacturingBoard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "VerifiedAtUtc",
                table: "Payments",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VerifiedByUserId",
                table: "Payments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AssignedEngineerId",
                table: "Orders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ManufacturingStage",
                table: "Orders",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "StageUpdatedAt",
                table: "Orders",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_AssignedEngineerId",
                table: "Orders",
                column: "AssignedEngineerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_AspNetUsers_AssignedEngineerId",
                table: "Orders",
                column: "AssignedEngineerId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_AspNetUsers_AssignedEngineerId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_AssignedEngineerId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "VerifiedAtUtc",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "VerifiedByUserId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "AssignedEngineerId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ManufacturingStage",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "StageUpdatedAt",
                table: "Orders");
        }
    }
}
