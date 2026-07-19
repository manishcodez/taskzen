import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { updateTaskSchema } from "@/lib/validators/tasks";
import {
  deleteTaskForUser,
  getTaskForUser,
  updateTaskForUser,
} from "@/services/task.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireAuthenticatedUser();
    const { id } = await context.params;
    const task = await getTaskForUser(user.id, id);
    return apiSuccess({ task });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireAuthenticatedUser();
    const { id } = await context.params;
    const body = await request.json();
    const data = updateTaskSchema.parse(body);
    const task = await updateTaskForUser(user.id, id, data);
    return apiSuccess({ task });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireAuthenticatedUser();
    const { id } = await context.params;
    const result = await deleteTaskForUser(user.id, id);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
