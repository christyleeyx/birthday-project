const PUBLIC_MEMORY_IMAGE_PATH = "/storage/v1/object/public/memories/";

export function getMemoryImageStoragePath(imageUrl: string) {
  try {
    const url = new URL(imageUrl);
    const pathStart = url.pathname.indexOf(PUBLIC_MEMORY_IMAGE_PATH);

    if (pathStart === -1) {
      return null;
    }

    const storagePath = url.pathname.slice(
      pathStart + PUBLIC_MEMORY_IMAGE_PATH.length,
    );

    return decodeURIComponent(storagePath);
  } catch {
    return null;
  }
}
