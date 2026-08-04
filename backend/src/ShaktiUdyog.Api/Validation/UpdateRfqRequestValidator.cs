using FluentValidation;
using ShaktiUdyog.Api.Contracts.Customer;

namespace ShaktiUdyog.Api.Validation;

public class UpdateEnquiryRequestValidator : AbstractValidator<UpdateEnquiryRequest>
{
    public UpdateEnquiryRequestValidator()
    {
        RuleFor(x => x.ProductType)
            .Must(v => string.IsNullOrEmpty(v) || Contracts.Public.EnquiryRequest.AllowedProductTypes.Contains(v))
            .WithMessage("Unknown requirement type.");
        RuleFor(x => x.Quantity).MaximumLength(100);
        RuleFor(x => x.RequirementDetails).MinimumLength(10).MaximumLength(8000);
        RuleFor(x => x.MaterialGrade).MaximumLength(200);
        RuleFor(x => x.DeliveryLocation).MaximumLength(300);
    }
}
