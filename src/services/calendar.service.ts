import { db } from "@/lib/db";
import { getMonthRangeUtc, toLocalDateKey } from "@/lib/utils/date-ranges";
import { mapTask } from "@/services/task.service";

const taskWithSubjectInclude = {
  subject: {
    select: {
      id: true,
      name: true,
      color: true,
      code: true,
    },
  },
} as const;

export async function getCalendarForUser(
  userId: string,
  year: number,
  month: number,
  tzOffset = 0,
) {
  const { start, end } = getMonthRangeUtc(year, month, tzOffset);

  const tasks = await db.task.findMany({
    where: {
      userId,
      dueDate: {
        gte: start,
        lte: end,
      },
    },
    include: taskWithSubjectInclude,
    orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
  });

  const tasksByDate: Record<string, ReturnType<typeof mapTask>[]> = {};

  for (const task of tasks) {
    if (!task.dueDate) {
      continue;
    }

    const dateKey = toLocalDateKey(task.dueDate, tzOffset);
    const mappedTask = mapTask(task);

    if (!tasksByDate[dateKey]) {
      tasksByDate[dateKey] = [];
    }

    tasksByDate[dateKey].push(mappedTask);
  }

  return {
    year,
    month,
    tasksByDate,
  };
}
