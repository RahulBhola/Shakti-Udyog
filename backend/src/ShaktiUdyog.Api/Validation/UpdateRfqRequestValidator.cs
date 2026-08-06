using FluentValidation;
using ShaktiUdyog.Api.Contracts.Customer;

namespace ShaktiUdyog.Api.Validation;

public class UpdateRfqRequestValidator : AbstractValidator<UpdateRfqRequest>
{
    public UpdateRfqRequestValidator()
    {
        RuleFor(x => x.ProductType)
            .Must(v => string.IsNullOrEmpty(v) || Contracts.Public.RfqRequest.AllowedProductTypes.Contains(v))
            .WithMessage("Unknown requirement type.");
        RuleFor(x => x.Quantity).MaximumLength(100);
        RuleFor(x => x.RequirementDetails).MinimumLength(10).MaximumLength(8000);
        RuleFor(x => x.MaterialGrade).MaximumLength(200);
        RuleFor(x => x.DeliveryLocation).MaximumLength(300);
    }
}
