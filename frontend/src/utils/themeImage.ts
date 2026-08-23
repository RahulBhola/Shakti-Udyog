/**
 * Utility to resolve product images for Dark and Light theme modes.
 * With the transparent background architecture, the single isolated asset
 * renders seamlessly across both dark and light modes with dynamic theme drop-shadows.
 */
export function getThemedImage(imagePath: string, _isLight?: boolean): string {
  if (!imagePath) return imagePath;
  return imagePath;
}

