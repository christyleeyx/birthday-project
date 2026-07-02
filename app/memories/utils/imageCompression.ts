const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_WIDTH = 1200;
const QUALITY = 0.75;

export async function validateAndCompressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload image files only.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Each image must be 5MB or smaller.");
  }

  const imageBitmap = await createImageBitmap(file);

  const scale = Math.min(1, MAX_WIDTH / imageBitmap.width);
  const width = Math.round(imageBitmap.width * scale);
  const height = Math.round(imageBitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare image for upload.");
  }

  context.drawImage(imageBitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", QUALITY);
  });

  if (!blob) {
    throw new Error("Could not compress image.");
  }

  const fileNameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");

  return new File([blob], `${fileNameWithoutExtension}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
