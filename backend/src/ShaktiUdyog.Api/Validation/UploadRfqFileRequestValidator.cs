using FluentValidation;

namespace ShaktiUdyog.Api.Validation;

public class UploadRfqFileRequestValidator : AbstractValidator<IFormFile>
{
    private static readonly string[] AllowedExtensions =
        [".pdf", ".dwg", ".dxf", ".step", ".stp", ".iges", ".igs", ".jpg", ".png", ".zip"];

    private const long MaxSizeBytes = 10 * 1024 * 1024;

    public UploadRfqFileRequestValidator()
    {
        RuleFor(x => x.Length).GreaterThan(0).WithMessage("File is empty.");
        RuleFor(x => x.Length).LessThanOrEqualTo(MaxSizeBytes).WithMessage("File exceeds 10 MB limit.");
        RuleFor(x => x.FileName)
            .Must(name => AllowedExtensions.Contains(Path.GetExtension(name).ToLowerInvariant()))
            .WithMessage("File type is not permitted.");
    }
}
