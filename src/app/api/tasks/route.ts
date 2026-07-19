import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { createTaskSchema, taskListQuerySchema } from "@/lib/validators/tasks";
import { createTaskForUser, listTasksForUser } from "@/services/task.service";

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const { searchParams } = new URL(request.url);
    const query = taskListQuerySchema.parse(Object.fromEntries(searchParams.entries()));
    const result = await listTasksForUser(user.id, query);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const body = await request.json();
    const data = createTaskSchema.parse(body);
    const task = await createTaskForUser(user.id, data);
    return apiSuccess({ task }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
