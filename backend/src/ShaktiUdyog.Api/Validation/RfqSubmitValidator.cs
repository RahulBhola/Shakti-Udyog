using FluentValidation;

namespace ShaktiUdyog.Api.Validation;

public class RfqSubmitValidator : AbstractValidator<RfqSubmitRequest>
{
    public RfqSubmitValidator()
    {
        RuleFor(x => x.RequirementDetails).NotEmpty().MinimumLength(10).MaximumLength(8000);
    }
}

public record RfqSubmitRequest(string RequirementDetails, string? DeliveryLocation);
