import {
  Prisma,
  TaskPriority,
  TaskStatus,
  type TaskType,
} from "@/generated/prisma/client";

import { AppError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getThisWeekRangeUtc, getTodayRangeUtc } from "@/lib/utils/date-ranges";
import { isTaskOverdue } from "@/lib/utils/time";
import type { CreateTaskInput, TaskListQuery, UpdateTaskInput } from "@/lib/validators/tasks";

const priorityOrder: Record<TaskPriority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export function mapTask(task: {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  description: string | null;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date | null;
  estimatedTimeMinutes: number | null;
  notes: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  subject: {
    id: string;
    name: string;
    color: string;
    code: string | null;
  };
}) {
  return {
    id: task.id,
    subjectId: task.subjectId,
    title: task.title,
    description: task.description,
    type: task.type,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate,
    estimatedTimeMinutes: task.estimatedTimeMinutes,
    notes: task.notes,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    isOverdue: isTaskOverdue(task.dueDate, task.status),
    subject: {
      id: task.subject.id,
      name: task.subject.name,
      color: task.subject.color,
      code: task.subject.code,
    },
  };
}

async function assertSubjectOwnership(userId: string, subjectId: string) {
  const subject = await db.subject.findFirst({
    where: { id: subjectId, userId },
    select: { id: true },
  });

  if (!subject) {
    throw new AppError("NOT_FOUND", "Subject not found", 404);
  }
}

async function getOwnedTaskOrThrow(userId: string, taskId: string) {
  const task = await db.task.findFirst({
    where: { id: taskId, userId },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          color: true,
          code: true,
        },
      },
    },
  });

  if (!task) {
    throw new AppError("NOT_FOUND", "Task not found", 404);
  }

  return task;
}

function buildTaskWhere(userId: string, query: TaskListQuery): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = { userId };
  const andConditions: Prisma.TaskWhereInput[] = [];

  if (query.q) {
    andConditions.push({
      OR: [
        { title: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
      ],
    });
  }

  if (query.subjectId) {
    where.subjectId = query.subjectId;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.priority) {
    where.priority = query.priority;
  }

  if (query.type) {
    where.type = query.type;
  }

  if (query.completed === "true") {
    where.status = TaskStatus.COMPLETED;
  } else if (query.completed === "false") {
    where.status = { not: TaskStatus.COMPLETED };
  }

  if (query.dueBefore) {
    where.dueDate = {
      ...(where.dueDate as Prisma.DateTimeNullableFilter | undefined),
      lte: new Date(query.dueBefore),
    };
  }

  if (query.dueAfter) {
    where.dueDate = {
      ...(where.dueDate as Prisma.DateTimeNullableFilter | undefined),
      gte: new Date(query.dueAfter),
    };
  }

  const tzOffset = query.tzOffset ?? 0;

  if (query.dueToday === "true") {
    const { start, end } = getTodayRangeUtc(tzOffset);
    where.dueDate = {
      ...(where.dueDate as Prisma.DateTimeNullableFilter | undefined),
      gte: start,
      lte: end,
    };
  }

  if (query.dueThisWeek === "true") {
    const { start, end } = getThisWeekRangeUtc(tzOffset);
    where.dueDate = {
      ...(where.dueDate as Prisma.DateTimeNullableFilter | undefined),
      gte: start,
      lte: end,
    };
  }

  if (query.overdue === "true") {
    andConditions.push({
      dueDate: { lt: new Date() },
      status: { not: TaskStatus.COMPLETED },
    });
  } else if (query.overdue === "false") {
    andConditions.push({
      OR: [
        { dueDate: null },
        { dueDate: { gte: new Date() } },
        { status: TaskStatus.COMPLETED },
      ],
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  return where;
}

function buildTaskOrderBy(
  query: TaskListQuery,
): Prisma.TaskOrderByWithRelationInput | Prisma.TaskOrderByWithRelationInput[] {
  const direction = query.sortOrder;

  switch (query.sortBy) {
    case "priority":
      return [{ priority: direction }, { dueDate: "asc" }];
    case "createdAt":
      return { createdAt: direction };
    case "status":
      return [{ status: direction }, { dueDate: "asc" }];
    case "subject":
      return [{ subject: { name: direction } }, { dueDate: "asc" }];
    case "dueDate":
    default:
      return [{ dueDate: direction }, { createdAt: "desc" }];
  }
}

export async function listTasksForUser(userId: string, query: TaskListQuery) {
  const where = buildTaskWhere(userId, query);
  const skip = (query.page - 1) * query.limit;
  const taskInclude = {
    subject: {
      select: {
        id: true,
        name: true,
        color: true,
        code: true,
      },
    },
  } as const;

  // Priority ranking is not alphabetical; paginate after ranking so page order is correct.
  if (query.sortBy === "priority") {
    const ranked = await db.task.findMany({
      where,
      select: {
        id: true,
        priority: true,
        dueDate: true,
      },
    });

    ranked.sort((a, b) => {
      const diff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (diff !== 0) {
        return query.sortOrder === "asc" ? -diff : diff;
      }

      const aDue = a.dueDate ? a.dueDate.getTime() : Number.MAX_SAFE_INTEGER;
      const bDue = b.dueDate ? b.dueDate.getTime() : Number.MAX_SAFE_INTEGER;
      return aDue - bDue;
    });

    const total = ranked.length;
    const pageIds = ranked.slice(skip, skip + query.limit).map((task) => task.id);

    if (pageIds.length === 0) {
      return {
        items: [],
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / query.limit)),
        },
      };
    }

    const tasks = await db.task.findMany({
      where: { id: { in: pageIds } },
      include: taskInclude,
    });

    const byId = new Map(tasks.map((task) => [task.id, task]));
    const items = pageIds
      .map((id) => byId.get(id))
      .filter((task): task is NonNullable<typeof task> => Boolean(task))
      .map(mapTask);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  const [total, tasks] = await Promise.all([
    db.task.count({ where }),
    db.task.findMany({
      where,
      include: taskInclude,
      orderBy: buildTaskOrderBy(query),
      skip,
      take: query.limit,
    }),
  ]);

  return {
    items: tasks.map(mapTask),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getTaskForUser(userId: string, taskId: string) {
  const task = await getOwnedTaskOrThrow(userId, taskId);
  return mapTask(task);
}

export async function createTaskForUser(userId: string, input: CreateTaskInput) {
  await assertSubjectOwnership(userId, input.subjectId);

  const status = input.status;
  const isCompleted = status === TaskStatus.COMPLETED;

  const task = await db.task.create({
    data: {
      userId,
      subjectId: input.subjectId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      type: input.type,
      priority: input.priority,
      status,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      estimatedTimeMinutes: input.estimatedTimeMinutes ?? null,
      notes: input.notes?.trim() || null,
      completedAt: isCompleted ? new Date() : null,
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          color: true,
          code: true,
        },
      },
    },
  });

  return mapTask(task);
}

export async function updateTaskForUser(
  userId: string,
  taskId: string,
  input: UpdateTaskInput,
) {
  const existing = await getOwnedTaskOrThrow(userId, taskId);

  if (input.subjectId) {
    await assertSubjectOwnership(userId, input.subjectId);
  }

  let nextStatus = input.status ?? existing.status;
  let nextCompletedAt = existing.completedAt;

  if (input.status !== undefined) {
    if (input.status === TaskStatus.COMPLETED) {
      nextCompletedAt = existing.completedAt ?? new Date();
    } else {
      nextCompletedAt = null;
    }
  } else if (input.status === undefined && existing.status === TaskStatus.COMPLETED) {
    nextStatus = existing.status;
    nextCompletedAt = existing.completedAt;
  }

  const task = await db.task.update({
    where: { id: taskId },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description.trim() || null }
        : {}),
      ...(input.subjectId !== undefined ? { subjectId: input.subjectId } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.status !== undefined
        ? { status: nextStatus, completedAt: nextCompletedAt }
        : {}),
      ...(input.dueDate !== undefined
        ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
        : {}),
      ...(input.estimatedTimeMinutes !== undefined
        ? { estimatedTimeMinutes: input.estimatedTimeMinutes }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {}),
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          color: true,
          code: true,
        },
      },
    },
  });

  return mapTask(task);
}

export async function deleteTaskForUser(userId: string, taskId: string) {
  await getOwnedTaskOrThrow(userId, taskId);

  await db.task.delete({
    where: { id: taskId },
  });

  return { success: true };
}

export async function completeTaskForUser(userId: string, taskId: string) {
  const existing = await getOwnedTaskOrThrow(userId, taskId);

  if (existing.status === TaskStatus.COMPLETED) {
    return mapTask(existing);
  }

  const task = await db.task.update({
    where: { id: taskId },
    data: {
      status: TaskStatus.COMPLETED,
      completedAt: new Date(),
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          color: true,
          code: true,
        },
      },
    },
  });

  return mapTask(task);
}

export async function reopenTaskForUser(userId: string, taskId: string) {
  const existing = await getOwnedTaskOrThrow(userId, taskId);

  if (existing.status !== TaskStatus.COMPLETED) {
    return mapTask(existing);
  }

  const task = await db.task.update({
    where: { id: taskId },
    data: {
      status: TaskStatus.NOT_STARTED,
      completedAt: null,
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          color: true,
          code: true,
        },
      },
    },
  });

  return mapTask(task);
}
