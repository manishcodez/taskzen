import { Prisma } from "@/generated/prisma/client";

import { AppError } from "@/lib/api-response";
import { db } from "@/lib/db";
import type { CreateSubjectInput, UpdateSubjectInput } from "@/lib/validators/subjects";

function mapSubjectWithCounts(subject: {
  id: string;
  userId: string;
  name: string;
  code: string | null;
  color: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { tasks: number };
}) {
  return {
    id: subject.id,
    name: subject.name,
    code: subject.code,
    color: subject.color,
    description: subject.description,
    taskCount: subject._count.tasks,
    createdAt: subject.createdAt,
    updatedAt: subject.updatedAt,
  };
}

function mapTaskSummary(task: {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  type: string;
}) {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    type: task.type,
  };
}

export async function listSubjectsForUser(userId: string) {
  const subjects = await db.subject.findMany({
    where: { userId },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return subjects.map(mapSubjectWithCounts);
}

export async function getSubjectForUser(userId: string, subjectId: string) {
  const subject = await db.subject.findFirst({
    where: {
      id: subjectId,
      userId,
    },
    include: {
      _count: {
        select: { tasks: true },
      },
      tasks: {
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          type: true,
        },
      },
    },
  });

  if (!subject) {
    throw new AppError("NOT_FOUND", "Subject not found", 404);
  }

  return {
    ...mapSubjectWithCounts(subject),
    tasks: subject.tasks.map(mapTaskSummary),
  };
}

export async function createSubjectForUser(userId: string, input: CreateSubjectInput) {
  try {
    const subject = await db.subject.create({
      data: {
        userId,
        name: input.name.trim(),
        code: input.code?.trim() || null,
        color: input.color,
        description: input.description?.trim() || null,
      },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    return mapSubjectWithCounts(subject);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(
        "SUBJECT_NAME_EXISTS",
        "You already have a subject with this name",
        409,
      );
    }

    throw error;
  }
}

export async function updateSubjectForUser(
  userId: string,
  subjectId: string,
  input: UpdateSubjectInput,
) {
  const existing = await db.subject.findFirst({
    where: { id: subjectId, userId },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError("NOT_FOUND", "Subject not found", 404);
  }

  try {
    const subject = await db.subject.update({
      where: { id: subjectId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.code !== undefined ? { code: input.code.trim() || null } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
        ...(input.description !== undefined
          ? { description: input.description.trim() || null }
          : {}),
      },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    return mapSubjectWithCounts(subject);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(
        "SUBJECT_NAME_EXISTS",
        "You already have a subject with this name",
        409,
      );
    }

    throw error;
  }
}

export async function deleteSubjectForUser(userId: string, subjectId: string) {
  const subject = await db.subject.findFirst({
    where: { id: subjectId, userId },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
  });

  if (!subject) {
    throw new AppError("NOT_FOUND", "Subject not found", 404);
  }

  if (subject._count.tasks > 0) {
    throw new AppError(
      "SUBJECT_HAS_TASKS",
      "This subject still has tasks. Delete or reassign those tasks before deleting the subject.",
      409,
    );
  }

  await db.subject.delete({
    where: { id: subjectId },
  });

  return { success: true };
}

export async function updateProfileForUser(
  userId: string,
  input: {
    name?: string;
    course?: string;
    college?: string;
    semester?: string;
    academicYear?: string;
    profilePhotoUrl?: string;
  },
) {
  const user = await db.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() || null } : {}),
      ...(input.course !== undefined ? { course: input.course.trim() || null } : {}),
      ...(input.college !== undefined ? { college: input.college.trim() || null } : {}),
      ...(input.semester !== undefined ? { semester: input.semester.trim() || null } : {}),
      ...(input.academicYear !== undefined
        ? { academicYear: input.academicYear.trim() || null }
        : {}),
      ...(input.profilePhotoUrl !== undefined
        ? { profilePhotoUrl: input.profilePhotoUrl.trim() || null }
        : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      profilePhotoUrl: true,
      course: true,
      college: true,
      semester: true,
      academicYear: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

export async function updatePasswordForUser(userId: string, passwordHash: string) {
  await db.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
