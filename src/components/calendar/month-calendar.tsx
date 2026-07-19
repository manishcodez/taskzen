"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { MotionDiv } from "@/components/motion/motion-div";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeUp, motionTransition, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { TaskItem } from "@/types";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type MonthCalendarProps = {
  year: number;
  month: number;
  tasksByDate: Record<string, TaskItem[]>;
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  isFetching?: boolean;
};

function getMonthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function buildCalendarCells(year: number, month: number) {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const mondayBasedOffset = (firstDay.getUTCDay() + 6) % 7;

  const cells: Array<{ dateKey: string | null; day: number | null }> = [];

  for (let index = 0; index < mondayBasedOffset; index += 1) {
    cells.push({ dateKey: null, day: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ dateKey, day });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ dateKey: null, day: null });
  }

  return cells;
}

function isTodayDateKey(dateKey: string): boolean {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return todayKey === dateKey;
}

export function MonthCalendar({
  year,
  month,
  tasksByDate,
  selectedDate,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
  isFetching,
}: MonthCalendarProps) {
  const prefersReducedMotion = useReducedMotion();
  const cells = buildCalendarCells(year, month);
  const monthKey = `${year}-${month}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-primary">
            {getMonthLabel(year, month)}
          </h2>
          {isFetching ? (
            <p className="mt-1 text-sm text-muted-foreground">Updating calendar...</p>
          ) : (
            <p className="label-caps mt-1 text-accent">Monthly planner</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onPreviousMonth}
            aria-label="Previous month"
            className="rounded-xl border-primary/15 shadow-soft hover:border-primary/30 hover:bg-primary/5"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onNextMonth}
            aria-label="Next month"
            className="rounded-xl border-primary/15 shadow-soft hover:border-primary/30 hover:bg-primary/5"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center sm:gap-2">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="label-caps py-1.5 sm:py-2">
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.slice(0, 1)}</span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={monthKey}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, y: -12 }}
          transition={motionTransition.base}
          className="grid grid-cols-7 gap-1.5 sm:gap-2"
        >
          {cells.map((cell, index) => {
            if (!cell.dateKey || cell.day == null) {
              return (
                <div
                  key={`empty-${monthKey}-${index}`}
                  className="min-h-12 rounded-xl border border-dashed border-border/40 bg-muted/15 sm:min-h-[5.5rem]"
                />
              );
            }

            const tasks = tasksByDate[cell.dateKey] ?? [];
            const isSelected = selectedDate === cell.dateKey;
            const isToday = isTodayDateKey(cell.dateKey);
            const dateKey = cell.dateKey;

            return (
              <motion.button
                key={dateKey}
                type="button"
                onClick={() => onSelectDate(dateKey)}
                whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                transition={motionTransition.fast}
                className={cn(
                  "group min-h-12 min-w-0 overflow-hidden rounded-xl border border-border/60 bg-card/80 p-1.5 text-left shadow-soft transition-colors duration-200 hover:border-primary/25 hover:bg-card sm:min-h-[5.5rem] sm:p-2",
                  isSelected &&
                    "border-primary/50 bg-primary/8 shadow-card ring-2 ring-primary/25",
                  isToday &&
                    !isSelected &&
                    "border-accent/45 bg-accent/6 ring-1 ring-accent/30",
                  isToday && isSelected && "ring-2 ring-accent/35",
                )}
              >
                <div className="flex items-start justify-between gap-0.5">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-lg text-xs font-semibold sm:text-sm",
                      isToday &&
                        "bg-accent text-accent-foreground shadow-soft",
                      isSelected &&
                        !isToday &&
                        "bg-primary text-primary-foreground shadow-soft",
                      isSelected &&
                        isToday &&
                        "bg-gradient-to-br from-primary to-accent text-primary-foreground",
                    )}
                  >
                    {cell.day}
                  </span>
                  {tasks.length > 0 ? (
                    <span className="rounded-full bg-primary/12 px-1.5 py-0.5 text-[9px] font-semibold text-primary sm:text-[10px]">
                      {tasks.length}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 hidden space-y-1 sm:mt-2 sm:block">
                  {tasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      className="truncate rounded-md bg-muted/50 px-1.5 py-0.5 text-[10px] transition-colors group-hover:bg-muted/70"
                      style={{ borderLeft: `3px solid ${task.subject.color}` }}
                    >
                      {task.title}
                    </div>
                  ))}
                  {tasks.length > 2 ? (
                    <p className="text-[10px] font-medium text-accent">+{tasks.length - 2} more</p>
                  ) : null}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function DayTaskPanel({
  dateKey,
  tasks,
}: {
  dateKey: string | null;
  tasks: TaskItem[];
}) {
  const prefersReducedMotion = useReducedMotion();

  if (!dateKey) {
    return (
      <MotionDiv
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionTransition.base}
        className="bg-panel flex min-h-[280px] flex-col items-center justify-center border-dashed p-8 text-center"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-soft">
          <CalendarDays className="h-6 w-6" />
        </div>
        <p className="label-caps text-primary">Day detail</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Select a date to view tasks due on that day.
        </p>
      </MotionDiv>
    );
  }

  const formattedDate = new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (tasks.length === 0) {
    return (
      <MotionDiv
        key={dateKey}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionTransition.base}
        className="bg-panel overflow-hidden"
      >
        <div className="border-b border-border/60 bg-gradient-to-r from-accent/8 via-primary/5 to-transparent px-5 py-4">
          <p className="label-caps text-accent">Selected day</p>
          <h3 className="font-display mt-1 text-lg font-semibold tracking-tight">{formattedDate}</h3>
          <p className="mt-1 text-sm text-muted-foreground">No tasks due on this date.</p>
        </div>
        <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/12 text-accent">
            <span className="text-sm font-semibold">✓</span>
          </div>
          <p className="text-sm text-muted-foreground">Enjoy a clear schedule for this day.</p>
        </div>
      </MotionDiv>
    );
  }

  return (
    <MotionDiv
      key={dateKey}
      initial="hidden"
      animate="show"
      variants={staggerContainer(0.06, 0.02)}
      className="bg-panel overflow-hidden"
    >
      <motion.div
        variants={fadeUp}
        className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-accent/6 to-transparent px-5 py-4"
      >
        <p className="label-caps text-primary">Selected day</p>
        <h3 className="font-display mt-1 text-lg font-semibold tracking-tight">{formattedDate}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="metric-display text-2xl text-primary">{tasks.length}</span>{" "}
          <span className="text-muted-foreground">
            task{tasks.length === 1 ? "" : "s"} due
          </span>
        </p>
      </motion.div>
      <div className="space-y-2.5 p-4">
        {tasks.map((task) => (
          <motion.div key={task.id} variants={fadeUp}>
            <Link
              href={`/tasks/${task.id}`}
              className="group block rounded-xl border border-border/60 bg-card/90 p-3.5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium transition-colors group-hover:text-primary">{task.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{task.subject.name}</p>
                </div>
                <span
                  className="mt-1 h-3 w-3 shrink-0 rounded-full shadow-soft ring-2 ring-background"
                  style={{ backgroundColor: task.subject.color }}
                />
              </div>
              <p className="mt-2.5 break-words text-xs text-muted-foreground">
                <span className="rounded-md bg-muted/60 px-1.5 py-0.5">
                  {task.priority.replaceAll("_", " ")}
                </span>
                {" • "}
                <span className="rounded-md bg-muted/60 px-1.5 py-0.5">
                  {task.status.replaceAll("_", " ")}
                </span>
                {task.dueDate ? ` • ${new Date(task.dueDate).toLocaleTimeString()}` : ""}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
    </MotionDiv>
  );
}
