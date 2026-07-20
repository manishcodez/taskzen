import { unlink, writeFile, mkdir } from "fs/promises";
import path from "path";

export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/** Soft cap for DB-backed data URLs (cropped uploads are typically far smaller). */
export const PROFILE_PHOTO_DATA_URL_MAX_BYTES = 750 * 1024;

export const PROFILE_PHOTO_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const EXTENSION_BY_TYPE: Record<(typeof PROFILE_PHOTO_ALLOWED_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function getProfilePhotoUploadDir() {
  return path.join(process.cwd(), "public", "uploads", "profile-photos");
}

export function isLocalProfilePhotoUrl(url: string | null | undefined) {
  return Boolean(url?.startsWith("/uploads/profile-photos/"));
}

export function isDataUrlProfilePhoto(url: string | null | undefined) {
  return Boolean(url?.startsWith("data:image/"));
}

function shouldPersistProfilePhotoInDatabase() {
  // Vercel (and similar serverless hosts) have ephemeral filesystems.
  // Persist cropped photos as data URLs so they survive deploys/restarts.
  return process.env.VERCEL === "1" || process.env.TASKZEN_PROFILE_PHOTO_DATA_URL === "1";
}

export function validateProfilePhotoFile(file: File) {
  if (!file || file.size === 0) {
    return "Choose an image file to upload.";
  }

  if (!PROFILE_PHOTO_ALLOWED_TYPES.includes(file.type as (typeof PROFILE_PHOTO_ALLOWED_TYPES)[number])) {
    return "Upload a JPG, PNG, WEBP, or GIF image.";
  }

  if (file.size > PROFILE_PHOTO_MAX_BYTES) {
    return "Image must be 5 MB or smaller.";
  }

  return null;
}

async function saveProfilePhotoAsDataUrl(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.length > PROFILE_PHOTO_DATA_URL_MAX_BYTES) {
    throw new Error("PROFILE_PHOTO_TOO_LARGE_FOR_STORAGE");
  }

  const mime = PROFILE_PHOTO_ALLOWED_TYPES.includes(
    file.type as (typeof PROFILE_PHOTO_ALLOWED_TYPES)[number],
  )
    ? file.type
    : "image/jpeg";

  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export async function saveProfilePhotoFile(file: File, userId: string) {
  if (shouldPersistProfilePhotoInDatabase()) {
    return saveProfilePhotoAsDataUrl(file);
  }

  const uploadDir = getProfilePhotoUploadDir();
  await mkdir(uploadDir, { recursive: true });

  const extension =
    EXTENSION_BY_TYPE[file.type as (typeof PROFILE_PHOTO_ALLOWED_TYPES)[number]] ?? "jpg";
  const filename = `${userId}-${Date.now()}.${extension}`;
  const filePath = path.join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return `/uploads/profile-photos/${filename}`;
}

export async function deleteLocalProfilePhoto(url: string | null | undefined) {
  if (isDataUrlProfilePhoto(url) || !isLocalProfilePhotoUrl(url)) {
    return;
  }

  const filePath = path.join(process.cwd(), "public", url!.slice(1));

  try {
    await unlink(filePath);
  } catch {
    // Ignore missing files from previous uploads.
  }
}
