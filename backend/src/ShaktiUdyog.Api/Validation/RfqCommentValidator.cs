using FluentValidation;

namespace ShaktiUdyog.Api.Validation;

public class RfqCommentValidator : AbstractValidator<RfqCommentRequest>
{
    public RfqCommentValidator()
    {
        RuleFor(x => x.Message).NotEmpty().MinimumLength(2).MaximumLength(4000);
    }
}

public record RfqCommentRequest(
    string Message,
    bool IsCustomerVisible = true);

public record RfqAssignmentRequest(Guid AssignedToUserId);
