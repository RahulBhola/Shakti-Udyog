using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShaktiUdyog.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddNewRfqFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AdditionalRequirements",
                table: "Rfqs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AnnualRequirement",
                table: "Rfqs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Application",
                table: "Rfqs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ApproxWeight",
                table: "Rfqs",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ExpectedDeliveryDate",
                table: "Rfqs",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Industry",
                table: "Rfqs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MachiningRequired",
                table: "Rfqs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MaterialStandard",
                table: "Rfqs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PartName",
                table: "Rfqs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PartNumber",
                table: "Rfqs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PatternAvailability",
                table: "Rfqs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreferredDeliveryTerms",
                table: "Rfqs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProductionQuantity",
                table: "Rfqs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PrototypeQuantity",
                table: "Rfqs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Remarks",
                table: "Rfqs",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AdditionalRequirements",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "AnnualRequirement",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "Application",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "ApproxWeight",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "ExpectedDeliveryDate",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "Industry",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "MachiningRequired",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "MaterialStandard",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "PartName",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "PartNumber",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "PatternAvailability",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "PreferredDeliveryTerms",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "ProductionQuantity",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "PrototypeQuantity",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "Remarks",
                table: "Rfqs");
        }
    }
}
