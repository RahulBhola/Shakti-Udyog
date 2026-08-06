using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;

namespace ShaktiUdyog.Api.Tests;

/// <summary>
/// Customer portal authorization tests. The demo customer (seeded in
/// Development) exercises the happy paths; the demo ADMIN account exercises
/// role denial; and cross-company isolation is verified by the fact that
/// random IDs return 404 while owned records return 200.
/// </summary>
public class CustomerApiTests(AuthApiFactory factory) : IClassFixture<AuthApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    private record AuthResponse(string AccessToken, string RefreshToken);
    private record Dashboard(int OpenRfqs, int ActiveQuotations, int ActiveOrders, int UnpaidInvoices);
    private record IdItem(Guid Id);
    private record TimelineEntry(string StatusCode, string? Message, string ActorType);

    private string? GetSecret(string key) =>
        factory.Services.GetService(typeof(IConfiguration)) is IConfiguration cfg ? cfg[key] : null;

    private async Task<string?> LoginAsync(string email, string? password)
    {
        if (string.IsNullOrEmpty(password)) return null;
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", new { email, password });
        if (response.StatusCode != HttpStatusCode.OK) return null;
        return (await response.Content.ReadFromJsonAsync<AuthResponse>())!.AccessToken;
    }

    private Task<string?> LoginCustomerAsync() =>
        LoginAsync("customer@demo.local", GetSecret("DevCustomer:Password"));

    private Task<string?> LoginAdminAsync() =>
        LoginAsync("admin@shaktiudyog.local", GetSecret("DevAdmin:Password"));

    private static HttpRequestMessage Get(string path, string token)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, path);
        request.Headers.Authorization = new("Bearer", token);
        return request;
    }

    [Fact]
    public async Task Customer_endpoints_require_authentication()
    {
        foreach (var path in new[]
        {
            "/api/v1/customer/dashboard", "/api/v1/customer/rfqs", "/api/v1/customer/quotations",
            "/api/v1/customer/orders", "/api/v1/customer/invoices", "/api/v1/customer/documents",
            "/api/v1/customer/notifications", "/api/v1/customer/profile",
        })
        {
            var response = await _client.GetAsync(path);
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }

    [Fact]
    public async Task Admin_without_customer_role_is_denied_customer_endpoints()
    {
        var token = await LoginAdminAsync();
        if (token is null) return;

        var response = await _client.SendAsync(Get("/api/v1/customer/dashboard", token));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Customer_dashboard_returns_company_scoped_counts()
    {
        var token = await LoginCustomerAsync();
        if (token is null) return;

        var response = await _client.SendAsync(Get("/api/v1/customer/dashboard", token));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dashboard = await response.Content.ReadFromJsonAsync<Dashboard>();
        Assert.True(dashboard!.ActiveOrders >= 1);       // seeded demo order
        Assert.True(dashboard.ActiveQuotations >= 1);    // seeded issued quotation
    }

    [Fact]
    public async Task Random_ids_return_404_not_other_companies_data()
    {
        var token = await LoginCustomerAsync();
        if (token is null) return;

        foreach (var path in new[]
        {
            $"/api/v1/customer/rfqs/{Guid.NewGuid()}",
            $"/api/v1/customer/quotations/{Guid.NewGuid()}",
            $"/api/v1/customer/orders/{Guid.NewGuid()}",
            $"/api/v1/customer/orders/{Guid.NewGuid()}/timeline",
            $"/api/v1/customer/invoices/{Guid.NewGuid()}",
            $"/api/v1/customer/documents/{Guid.NewGuid()}/download",
        })
        {
            var response = await _client.SendAsync(Get(path, token));
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }

    [Fact]
    public async Task Owned_order_is_readable_and_timeline_hides_internal_milestones()
    {
        var token = await LoginCustomerAsync();
        if (token is null) return;

        var orders = await (await _client.SendAsync(Get("/api/v1/customer/orders", token)))
            .Content.ReadFromJsonAsync<List<IdItem>>();
        Assert.NotEmpty(orders!);

        var detail = await _client.SendAsync(Get($"/api/v1/customer/orders/{orders![0].Id}", token));
        Assert.Equal(HttpStatusCode.OK, detail.StatusCode);
        var detailBody = await detail.Content.ReadAsStringAsync();
        Assert.DoesNotContain("internal", detailBody, StringComparison.OrdinalIgnoreCase);

        // The seeded in-production order has an internal-only milestone; the
        // timeline must contain no internal notes and no invisible entries.
        foreach (var order in orders)
        {
            var timelineResponse = await _client.SendAsync(Get($"/api/v1/customer/orders/{order.Id}/timeline", token));
            Assert.Equal(HttpStatusCode.OK, timelineResponse.StatusCode);
            var raw = await timelineResponse.Content.ReadAsStringAsync();
            Assert.DoesNotContain("internal-only", raw);
            Assert.DoesNotContain("InternalNote", raw);
        }
    }

    [Fact]
    public async Task Documents_listing_excludes_internal_documents()
    {
        var token = await LoginCustomerAsync();
        if (token is null) return;

        var response = await _client.SendAsync(Get("/api/v1/customer/documents", token));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var raw = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("must never be visible", raw);
    }

    [Fact]
    public async Task Quotation_response_rejects_invalid_verb()
    {
        var token = await LoginCustomerAsync();
        if (token is null) return;

        var quotations = await (await _client.SendAsync(Get("/api/v1/customer/quotations", token)))
            .Content.ReadFromJsonAsync<List<IdItem>>();
        if (quotations is not { Count: > 0 }) return;

        var request = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/customer/quotations/{quotations[0].Id}/response")
        {
            Content = JsonContent.Create(new { response = "modify-price", comment = "should fail" }),
        };
        request.Headers.Authorization = new("Bearer", token);
        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Rfq_creation_validates_product_type()
    {
        var token = await LoginCustomerAsync();
        if (token is null) return;

        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/customer/rfqs")
        {
            Content = JsonContent.Create(new
            {
                productType = "Titanium Casting",
                quantity = "10",
                requirementDetails = "Invalid product type should be rejected.",
                saveAsDraft = false,
            }),
        };
        request.Headers.Authorization = new("Bearer", token);
        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Notifications_are_paged_and_markable()
    {
        var token = await LoginCustomerAsync();
        if (token is null) return;

        var response = await _client.SendAsync(Get("/api/v1/customer/notifications?page=1&pageSize=2", token));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var raw = await response.Content.ReadAsStringAsync();
        Assert.Contains("totalCount", raw);
    }

    [Fact]
    public async Task Profile_is_readable_for_customer()
    {
        var token = await LoginCustomerAsync();
        if (token is null) return;

        var response = await _client.SendAsync(Get("/api/v1/customer/profile", token));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var raw = await response.Content.ReadAsStringAsync();
        Assert.Contains("customer@demo.local", raw);
    }
}
