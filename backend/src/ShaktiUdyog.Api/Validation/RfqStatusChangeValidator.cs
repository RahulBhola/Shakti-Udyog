using FluentValidation;

namespace ShaktiUdyog.Api.Validation;

public class EnquiryStatusChangeValidator : AbstractValidator<EnquiryStatusChangeRequest>
{
    private static readonly string[] ValidStatuses =
        ["Received", "Under Review", "Waiting for Customer", "Approved", "Rejected",
         "Quoted", "Accepted", "Declined", "Expired", "Cancelled"];

    public EnquiryStatusChangeValidator()
    {
        RuleFor(x => x.NewStatus)
            .NotEmpty()
            .Must(s => ValidStatuses.Contains(s))
            .WithMessage("Invalid target status.");
        RuleFor(x => x.Note).MaximumLength(2000);
    }
}

public record EnquiryStatusChangeRequest(string NewStatus, string? Note);
