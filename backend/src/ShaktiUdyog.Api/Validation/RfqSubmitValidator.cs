using FluentValidation;

namespace ShaktiUdyog.Api.Validation;

public class EnquirySubmitValidator : AbstractValidator<EnquirySubmitRequest>
{
    public EnquirySubmitValidator()
    {
        RuleFor(x => x.RequirementDetails).NotEmpty().MinimumLength(10).MaximumLength(8000);
    }
}

public record EnquirySubmitRequest(string RequirementDetails, string? DeliveryLocation);
