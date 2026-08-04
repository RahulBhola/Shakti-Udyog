using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShaktiUdyog.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEnquiryRename : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Rename the Rfq tables to Enquiry (data-preserving via sp_rename).
            migrationBuilder.Sql("EXEC sp_rename N'Rfqs', N'Enquiries';");
            migrationBuilder.Sql("EXEC sp_rename N'RfqFiles', N'EnquiryFiles';");
            migrationBuilder.Sql("EXEC sp_rename N'RfqItems', N'EnquiryItems';");
            migrationBuilder.Sql("EXEC sp_rename N'RfqStatusHistory', N'EnquiryStatusHistory';");
            migrationBuilder.Sql("EXEC sp_rename N'RfqComments', N'EnquiryComments';");
            migrationBuilder.Sql("EXEC sp_rename N'RfqAssignments', N'EnquiryAssignments';");

            // Rename the RfqId columns to EnquiryId.
            migrationBuilder.Sql("EXEC sp_rename N'EnquiryFiles.RfqId', N'EnquiryId', N'COLUMN';");
            migrationBuilder.Sql("EXEC sp_rename N'EnquiryItems.RfqId', N'EnquiryId', N'COLUMN';");
            migrationBuilder.Sql("EXEC sp_rename N'EnquiryStatusHistory.RfqId', N'EnquiryId', N'COLUMN';");
            migrationBuilder.Sql("EXEC sp_rename N'EnquiryComments.RfqId', N'EnquiryId', N'COLUMN';");
            migrationBuilder.Sql("EXEC sp_rename N'EnquiryAssignments.RfqId', N'EnquiryId', N'COLUMN';");
            migrationBuilder.Sql("EXEC sp_rename N'Quotations.RfqId', N'EnquiryId', N'COLUMN';");
            migrationBuilder.Sql("EXEC sp_rename N'ProductionJobs.RfqId', N'EnquiryId', N'COLUMN';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("EXEC sp_rename N'Quotations.EnquiryId', N'RfqId', N'COLUMN';");
            migrationBuilder.Sql("EXEC sp_rename N'ProductionJobs.EnquiryId', N'RfqId', N'COLUMN';");
            migrationBuilder.Sql("EXEC sp_rename N'EnquiryAssignments.EnquiryId', N'RfqId', N'COLUMN';");
            migrationBuilder.Sql("EXEC sp_rename N'EnquiryComments.EnquiryId', N'RfqId', N'COLUMN';");
            migrationBuilder.Sql("EXEC sp_rename N'EnquiryStatusHistory.EnquiryId', N'RfqId', N'COLUMN';");
            migrationBuilder.Sql("EXEC sp_rename N'EnquiryItems.EnquiryId', N'RfqId', N'COLUMN';");
            migrationBuilder.Sql("EXEC sp_rename N'EnquiryFiles.EnquiryId', N'RfqId', N'COLUMN';");

            migrationBuilder.Sql("EXEC sp_rename N'EnquiryAssignments', N'RfqAssignments';");
            migrationBuilder.Sql("EXEC sp_rename N'EnquiryComments', N'RfqComments';");
            migrationBuilder.Sql("EXEC sp_rename N'EnquiryStatusHistory', N'RfqStatusHistory';");
            migrationBuilder.Sql("EXEC sp_rename N'EnquiryItems', N'RfqItems';");
            migrationBuilder.Sql("EXEC sp_rename N'EnquiryFiles', N'RfqFiles';");
            migrationBuilder.Sql("EXEC sp_rename N'Enquiries', N'Rfqs';");
        }
    }
}
