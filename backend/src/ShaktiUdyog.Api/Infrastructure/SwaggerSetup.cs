using Microsoft.OpenApi.Models;

namespace ShaktiUdyog.Api.Infrastructure;

public static class SwaggerSetup
{
    /// <summary>
    /// Swagger/OpenAPI generation with JWT Bearer support so staff can test
    /// protected endpoints once authentication ships in Milestone 2.
    /// Swagger UI itself is mapped only in the Development environment.
    /// </summary>
    public static IServiceCollection AddSwaggerDocumentation(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Shakti Udyog API",
                Version = "v1",
                Description = "REST API for the Shakti Udyog iron-casting business platform. "
                    + "Do not include live customer data or secrets in examples.",
            });

            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "JWT access token. Authentication endpoints arrive in Milestone 2.",
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer",
                        },
                    },
                    Array.Empty<string>()
                },
            });
        });

        return services;
    }
}
