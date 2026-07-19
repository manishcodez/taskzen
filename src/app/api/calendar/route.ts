import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { calendarQuerySchema } from "@/lib/validators/calendar";
import { getCalendarForUser } from "@/services/calendar.service";

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const { searchParams } = new URL(request.url);
    const query = calendarQuerySchema.parse(Object.fromEntries(searchParams.entries()));
    const calendar = await getCalendarForUser(
      user.id,
      query.year,
      query.month,
      query.tzOffset ?? 0,
    );
    return apiSuccess({ calendar });
  } catch (error) {
    return handleApiError(error);
  }
}
