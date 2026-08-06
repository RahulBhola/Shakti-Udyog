using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShaktiUdyog.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderPaymentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AdvanceAmount",
                table: "Orders",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "AdvancePaid",
                table: "Orders",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "AdvancePaidAtUtc",
                table: "Orders",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AdvancePaymentRef",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AdvancePercent",
                table: "Orders",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "AdvanceVerifiedAtUtc",
                table: "Orders",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AdvanceVerifiedById",
                table: "Orders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentProofFileName",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentTerms",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "QuotationTotal",
                table: "Orders",
                type: "decimal(18,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AdvanceAmount",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "AdvancePaid",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "AdvancePaidAtUtc",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "AdvancePaymentRef",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "AdvancePercent",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "AdvanceVerifiedAtUtc",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "AdvanceVerifiedById",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PaymentProofFileName",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PaymentTerms",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "QuotationTotal",
                table: "Orders");
        }
    }
}
