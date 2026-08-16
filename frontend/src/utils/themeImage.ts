/**
 * Utility to switch product images seamlessly between Dark and Light theme modes.
 * In Light mode, automatically resolves to the dedicated studio ' light mode.png' image.
 */
export function getThemedImage(imagePath: string, isLight: boolean): string {
  if (!imagePath) return imagePath;
  
  if (!isLight) {
    // Dark mode: ensure base image path without ' light mode' suffix
    return imagePath
      .replace(' light mode.png', '.png')
      .replace(' light mode.jpg', '.jpg')
      .replace(' light mode.jpeg', '.jpeg');
  }

  // Light mode: add ' light mode.png' suffix if not already present
  if (imagePath.includes(' light mode.')) return imagePath;

  return imagePath
    .replace(/\.png$/i, ' light mode.png')
    .replace(/\.jpg$/i, ' light mode.png')
    .replace(/\.jpeg$/i, ' light mode.png');
}
