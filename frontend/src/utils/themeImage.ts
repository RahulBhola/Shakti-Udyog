/**
 * Utility to resolve product images for Dark and Light theme modes.
 * Maps legacy seeded paths and single transparent assets seamlessly.
 */
export function getThemedImage(imagePath: string, _isLight?: boolean): string {
  if (!imagePath) return imagePath;

  // Already in products_transparent or external URL
  if (imagePath.startsWith("/images/products_transparent/") || imagePath.startsWith("http")) {
    return imagePath;
  }

  // Remove any legacy " light mode" suffix
  const cleanPath = imagePath
    .replace(" light mode.png", ".png")
    .replace(" light mode.jpg", ".jpg")
    .replace(" light mode.jpeg", ".jpeg");

  // Extract filename
  const filename = cleanPath.split("/").pop()?.split("\\").pop();
  if (filename) {
    // If it's a known product casting image, serve from transparent collection
    return `/images/products_transparent/${filename}`;
  }

  return cleanPath;
}


