/**
 * Compresses an image file using canvas before upload.
 * - Resizes to maxWidth if larger (preserving aspect ratio)
 * - Re-encodes as WebP at the given quality (0–1)
 * - Returns original file unchanged if it's not an image or compression fails
 */
export async function compressImage(
  file: File,
  maxWidth = 1920,
  quality = 0.85,
): Promise<File> {
  // Only compress images
  if (!file.type.startsWith("image/")) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => {
          if (!blob) { resolve(file); return; }
          // Keep original filename but with .webp extension
          const name = file.name.replace(/\.[^.]+$/, ".webp");
          resolve(new File([blob], name, { type: "image/webp", lastModified: Date.now() }));
        },
        "image/webp",
        quality,
      );
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}
