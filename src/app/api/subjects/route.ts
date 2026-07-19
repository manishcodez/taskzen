import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { createSubjectSchema } from "@/lib/validators/subjects";
import { createSubjectForUser, listSubjectsForUser } from "@/services/subject.service";

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    const subjects = await listSubjectsForUser(user.id);
    return apiSuccess({ subjects });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const body = await request.json();
    const data = createSubjectSchema.parse(body);
    const subject = await createSubjectForUser(user.id, data);
    return apiSuccess({ subject }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
