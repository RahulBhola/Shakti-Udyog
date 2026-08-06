using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShaktiUdyog.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProductMaster : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProductMasters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductCode = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ProductName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CastingType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Material = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    MaterialGrade = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Weight = table.Column<decimal>(type: "decimal(18,3)", precision: 18, scale: 3, nullable: true),
                    Tolerance = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Density = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Hardness = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    HeatTreatment = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SurfaceFinish = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Length = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    Width = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    Height = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    Diameter = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    DrawingNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Revision = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    PatternNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CoreRequired = table.Column<bool>(type: "bit", nullable: false),
                    MachineRequired = table.Column<bool>(type: "bit", nullable: false),
                    InspectionRequired = table.Column<bool>(type: "bit", nullable: false),
                    MachiningRequired = table.Column<bool>(type: "bit", nullable: false),
                    CycleTimeMinutes = table.Column<int>(type: "int", nullable: true),
                    StandardCost = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    SellingPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    GstPercent = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    HsnCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    IsArchived = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductMasters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductMasters_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProductMasters_AspNetUsers_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProductMasters_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ProductMasterAttachments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductMasterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(127)", maxLength: 127, nullable: false),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    StorageKey = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    UploadedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UploadedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductMasterAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductMasterAttachments_ProductMasters_ProductMasterId",
                        column: x => x.ProductMasterId,
                        principalTable: "ProductMasters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductMasterAttachments_ProductMasterId",
                table: "ProductMasterAttachments",
                column: "ProductMasterId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductMasterAttachments_StorageKey",
                table: "ProductMasterAttachments",
                column: "StorageKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductMasters_CategoryId",
                table: "ProductMasters",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductMasters_CreatedByUserId",
                table: "ProductMasters",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductMasters_ProductCode",
                table: "ProductMasters",
                column: "ProductCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductMasters_ProductName",
                table: "ProductMasters",
                column: "ProductName");

            migrationBuilder.CreateIndex(
                name: "IX_ProductMasters_Status",
                table: "ProductMasters",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ProductMasters_UpdatedByUserId",
                table: "ProductMasters",
                column: "UpdatedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductMasterAttachments");

            migrationBuilder.DropTable(
                name: "ProductMasters");
        }
    }
}
