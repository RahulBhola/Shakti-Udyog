using FluentValidation;

namespace ShaktiUdyog.Api.Validation;

public class RfqStatusChangeValidator : AbstractValidator<RfqStatusChangeRequest>
{
    private static readonly string[] ValidStatuses =
        ["Received", "Under Review", "Waiting for Customer", "Approved", "Rejected",
         "Quoted", "Accepted", "Declined", "Expired", "Cancelled"];

    public RfqStatusChangeValidator()
    {
        RuleFor(x => x.NewStatus)
            .NotEmpty()
            .Must(s => ValidStatuses.Contains(s))
            .WithMessage("Invalid target status.");
        RuleFor(x => x.Note).MaximumLength(2000);
    }
}

public record RfqStatusChangeRequest(string NewStatus, string? Note);
