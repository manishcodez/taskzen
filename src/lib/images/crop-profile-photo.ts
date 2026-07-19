type CropTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

type CropImageOptions = {
  image: HTMLImageElement;
  viewportSize: number;
  transform: CropTransform;
  outputSize?: number;
  mimeType?: string;
  fileName?: string;
};

export async function cropProfilePhotoToFile({
  image,
  viewportSize,
  transform,
  outputSize = 512,
  mimeType = "image/jpeg",
  fileName = "profile-photo.jpg",
}: CropImageOptions): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to prepare image crop.");
  }

  const baseScale = Math.max(viewportSize / image.naturalWidth, viewportSize / image.naturalHeight);
  const drawScale = baseScale * transform.scale;
  const drawWidth = image.naturalWidth * drawScale;
  const drawHeight = image.naturalHeight * drawScale;
  const drawX = (viewportSize - drawWidth) / 2 + transform.offsetX;
  const drawY = (viewportSize - drawHeight) / 2 + transform.offsetY;
  const scaleFactor = outputSize / viewportSize;

  context.fillStyle = "#111827";
  context.fillRect(0, 0, outputSize, outputSize);
  context.drawImage(
    image,
    drawX * scaleFactor,
    drawY * scaleFactor,
    drawWidth * scaleFactor,
    drawHeight * scaleFactor,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Unable to create cropped image."));
          return;
        }

        resolve(result);
      },
      mimeType,
      0.92,
    );
  });

  return new File([blob], fileName, { type: mimeType });
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to load selected image."));
    };

    image.src = objectUrl;
  });
}

export function createPreviewUrl(file: File) {
  return URL.createObjectURL(file);
}

export function revokePreviewUrl(url: string | null) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}
