using FluentValidation;
using ShaktiUdyog.Api.Contracts.Public;

namespace ShaktiUdyog.Api.Validation;

public class PublicRfqRequestValidator : AbstractValidator<RfqRequest>
{
    public PublicRfqRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.CompanyName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(254);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(30);
        RuleFor(x => x.ProductType)
            .NotEmpty()
            .Must(v => RfqRequest.AllowedProductTypes.Contains(v))
            .WithMessage("Unknown requirement type.");
        RuleFor(x => x.Quantity).NotEmpty().MaximumLength(100);
        RuleFor(x => x.RequirementDetails).NotEmpty().MinimumLength(10).MaximumLength(8000);
        RuleFor(x => x.ConsentGiven).Equal(true).WithMessage("Consent is required.");
    }
}
