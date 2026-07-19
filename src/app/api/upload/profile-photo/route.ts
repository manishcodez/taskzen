import { apiSuccess, AppError, handleApiError } from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { toSafeUser } from "@/lib/auth/session";
import {
  deleteLocalProfilePhoto,
  saveProfilePhotoFile,
  validateProfilePhotoFile,
} from "@/lib/uploads/profile-photo";
import { updateProfileForUser } from "@/services/subject.service";

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const formData = await request.formData();
    const photo = formData.get("photo");

    if (!(photo instanceof File)) {
      throw new AppError("VALIDATION_ERROR", "Choose an image file to upload.", 400, {
        photo: ["Choose an image file to upload."],
      });
    }

    const validationError = validateProfilePhotoFile(photo);
    if (validationError) {
      throw new AppError("VALIDATION_ERROR", validationError, 400, {
        photo: [validationError],
      });
    }

    await deleteLocalProfilePhoto(user.profilePhotoUrl);

    const profilePhotoUrl = await saveProfilePhotoFile(photo, user.id);

    const updatedUser = await updateProfileForUser(user.id, {
      profilePhotoUrl,
    });

    return apiSuccess({ user: toSafeUser(updatedUser) });
  } catch (error) {
    return handleApiError(error);
  }
}
