using System.Net;
using System.Net.Http.Json;

namespace ShaktiUdyog.Api.Tests;

public class PublicApiTests(AuthApiFactory factory) : IClassFixture<AuthApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    private record Product(string Slug, string Title, string CommonGrades);
    private record Resource(string Slug, string Title);
    private record Accepted(Guid? Id, string Message);

    private static object ValidEnquiry(string? website = null) => new
    {
        fullName = "Test Person",
        companyName = "Test Engineering Co",
        email = "test@example.com",
        phone = "+911234567890",
        city = "Ludhiana",
        message = "Please contact us about a casting requirement for testing.",
        consentGiven = true,
        website,
    };

    [Fact]
    public async Task Products_endpoint_returns_all_four_families_with_placeholder_grades()
    {
        var products = await _client.GetFromJsonAsync<List<Product>>("/api/v1/public/products");

        Assert.NotNull(products);
        Assert.Equal(4, products!.Count);
        var grey = products.Single(p => p.Slug == "grey-iron-castings");
        // Unverified data must remain a labelled placeholder, never invented.
        Assert.Contains("to be confirmed", grey.CommonGrades);
    }

    [Fact]
    public async Task Product_detail_returns_200_for_known_and_404_for_unknown_slug()
    {
        var known = await _client.GetAsync("/api/v1/public/products/ductile-iron-castings");
        var unknown = await _client.GetAsync("/api/v1/public/products/titanium-castings");

        Assert.Equal(HttpStatusCode.OK, known.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, unknown.StatusCode);
    }

    [Fact]
    public async Task Resources_endpoints_return_listing_and_detail()
    {
        var resources = await _client.GetFromJsonAsync<List<Resource>>("/api/v1/public/resources");
        Assert.Equal(3, resources!.Count);

        var detail = await _client.GetAsync("/api/v1/public/resources/how-to-prepare-a-casting-rfq");
        Assert.Equal(HttpStatusCode.OK, detail.StatusCode);
    }

    [Fact]
    public async Task Enquiry_with_valid_payload_is_accepted_and_returns_id()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/public/enquiries", ValidEnquiry());

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<Accepted>();
        Assert.NotNull(body!.Id);
    }

    [Fact]
    public async Task Enquiry_honeypot_returns_fake_success_without_persisting()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/public/enquiries", ValidEnquiry(website: "http://spam.example"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<Accepted>();
        Assert.Null(body!.Id); // discarded, but indistinguishable message for the bot
    }

    [Fact]
    public async Task Enquiry_with_invalid_email_returns_400()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/public/enquiries", new
        {
            fullName = "Test Person",
            companyName = "Test Co",
            email = "not-an-email",
            phone = "+911234567890",
            message = "A valid-length test message.",
            consentGiven = true,
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Enquiry_without_consent_returns_400()
    {
        var payload = new
        {
            fullName = "Test Person",
            companyName = "Test Co",
            email = "test@example.com",
            phone = "+911234567890",
            message = "A valid-length test message.",
            consentGiven = false,
        };
        var response = await _client.PostAsJsonAsync("/api/v1/public/enquiries", payload);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Rfq_with_valid_payload_is_accepted()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/public/rfqs", new
        {
            fullName = "Test Person",
            companyName = "Test Engineering Co",
            email = "test@example.com",
            phone = "+911234567890",
            productType = "Grey Iron Casting",
            quantity = "500 pcs",
            requirementDetails = "Pump body casting per attached drawing for testing.",
            consentGiven = true,
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<Accepted>();
        Assert.NotNull(body!.Id);
    }

    [Fact]
    public async Task Rfq_with_unknown_product_type_returns_400()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/public/rfqs", new
        {
            fullName = "Test Person",
            companyName = "Test Co",
            email = "test@example.com",
            phone = "+911234567890",
            productType = "Aluminium Casting",
            quantity = "10",
            requirementDetails = "A valid-length requirement description.",
            consentGiven = true,
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
