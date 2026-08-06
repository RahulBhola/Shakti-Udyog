const fs = require('fs');
let c = fs.readFileSync('ShaktiUdyog.Api/Controllers/AdminController.cs', 'utf8');

const chartIdx = c.indexOf('// ---- Charts');
if (chartIdx < 0) { console.log('FAIL: Charts section not found'); process.exit(1); }

const endpoints = `
    // ---- Orders from Quotations ---------------------------------------------

    [HttpPost("quotations/{quotationId:guid}/create-order")]
    public async Task<IActionResult> CreateOrderFromQuotation(Guid quotationId)
    {
        var result = await adminService.CreateOrderFromQuotationAsync(quotationId, UserId, ClientIp);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPatch("orders/{orderId:guid}/verify-advance")]
    public async Task<IActionResult> VerifyAdvancePayment(Guid orderId)
    {
        var result = await adminService.VerifyAdvancePaymentAsync(orderId, UserId, ClientIp);
        return result switch { null => NotFound(), false => BadRequest(new { message = "Cannot verify in current state." }), _ => Ok(new { message = "Payment verified. Production can start." }) };
    }

    [HttpPatch("orders/{orderId:guid}/stage")]
    public async Task<IActionResult> UpdateOrderStage(Guid orderId, [FromBody] UpdateStageRequest request)
    {
        var result = await adminService.UpdateOrderStageAsync(orderId, request.StatusCode, request.Note, UserId, ClientIp);
        return result switch { null => NotFound(), false => BadRequest(new { message = "Invalid stage transition." }), _ => Ok(new { message = "Stage updated." }) };
    }

`;

c = c.slice(0, chartIdx) + endpoints + c.slice(chartIdx);
// Add UpdateStageRequest record at end of file
c = c.replace('public record OverrideStatusRequest', 'public record UpdateStageRequest(string StatusCode, string? Note);\n\npublic record OverrideStatusRequest');

fs.writeFileSync('ShaktiUdyog.Api/Controllers/AdminController.cs', c);
console.log('SUCCESS: Endpoints and UpdateStageRequest added');
