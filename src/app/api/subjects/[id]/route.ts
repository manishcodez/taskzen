import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { updateSubjectSchema } from "@/lib/validators/subjects";
import {
  deleteSubjectForUser,
  getSubjectForUser,
  updateSubjectForUser,
} from "@/services/subject.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireAuthenticatedUser();
    const { id } = await context.params;
    const subject = await getSubjectForUser(user.id, id);
    return apiSuccess({ subject });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireAuthenticatedUser();
    const { id } = await context.params;
    const body = await request.json();
    const data = updateSubjectSchema.parse(body);
    const subject = await updateSubjectForUser(user.id, id, data);
    return apiSuccess({ subject });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireAuthenticatedUser();
    const { id } = await context.params;
    const result = await deleteSubjectForUser(user.id, id);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
