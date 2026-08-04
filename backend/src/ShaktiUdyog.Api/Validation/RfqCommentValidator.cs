using FluentValidation;

namespace ShaktiUdyog.Api.Validation;

public class EnquiryCommentValidator : AbstractValidator<EnquiryCommentRequest>
{
    public EnquiryCommentValidator()
    {
        RuleFor(x => x.Message).NotEmpty().MinimumLength(2).MaximumLength(4000);
    }
}

public record EnquiryCommentRequest(
    string Message,
    bool IsCustomerVisible = true);

public record EnquiryAssignmentRequest(Guid AssignedToUserId);
