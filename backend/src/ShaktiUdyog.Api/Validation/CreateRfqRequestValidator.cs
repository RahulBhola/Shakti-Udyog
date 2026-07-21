using FluentValidation;
using ShaktiUdyog.Api.Contracts.Customer;

namespace ShaktiUdyog.Api.Validation;

public class CreateRfqRequestValidator : AbstractValidator<CreateRfqRequest>
{
    public CreateRfqRequestValidator()
    {
        RuleFor(x => x.ProductType)
            .NotEmpty()
            .Must(v => Contracts.Public.RfqRequest.AllowedProductTypes.Contains(v))
            .WithMessage("Unknown requirement type.");
        RuleFor(x => x.Quantity).NotEmpty().MaximumLength(100);
        RuleFor(x => x.RequirementDetails).NotEmpty().MinimumLength(10).MaximumLength(8000);
        RuleFor(x => x.MaterialGrade).MaximumLength(200);
        RuleFor(x => x.DeliveryLocation).MaximumLength(300);
    }
}
