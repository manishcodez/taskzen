"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { DayTaskPanel, MonthCalendar } from "@/components/calendar/month-calendar";
import { PageHeader } from "@/components/layout/page-header";
import { MotionDiv } from "@/components/motion/motion-div";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { getClientTimezoneOffset } from "@/lib/utils/date-ranges";
import { useCalendar } from "@/hooks/use-calendar";
import { fadeUp, motionTransition, staggerContainer } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

function getCurrentMonthState() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function CalendarView() {
  const prefersReducedMotion = useReducedMotion();
  const initial = getCurrentMonthState();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    toDateKey(initial.year, initial.month, new Date().getDate()),
  );

  const tzOffset = getClientTimezoneOffset();
  const { data, isLoading, isFetching, isError, error, refetch } = useCalendar(
    year,
    month,
    tzOffset,
  );

  const tasksByDate = useMemo(() => data?.tasksByDate ?? {}, [data?.tasksByDate]);
  const selectedTasks = useMemo(
    () => (selectedDate ? tasksByDate[selectedDate] ?? [] : []),
    [selectedDate, tasksByDate],
  );

  function goToPreviousMonth() {
    if (month === 1) {
      setYear((current) => current - 1);
      setMonth(12);
      return;
    }

    setMonth((current) => current - 1);
  }

  function goToNextMonth() {
    if (month === 12) {
      setYear((current) => current + 1);
      setMonth(1);
      return;
    }

    setMonth((current) => current + 1);
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Unable to load calendar."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <MotionDiv
      initial={prefersReducedMotion ? false : "hidden"}
      animate="show"
      variants={staggerContainer(0.08, 0.04)}
      className="space-y-6"
    >
      <motion.div variants={fadeUp}>
        <PageHeader
          eyebrow="Calendar"
          title="Your schedule"
          description="View tasks by due date and plan around upcoming deadlines."
          action={
            <Button render={<Link href="/tasks/new" />} className="shadow-soft">
              <Plus className="h-4 w-4" />
              Add task
            </Button>
          }
        />
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <MotionDiv variants={fadeUp} className="bg-panel overflow-hidden">
          <div className="border-b border-border/60 bg-gradient-to-r from-primary/8 via-accent/5 to-transparent px-6 py-4">
            <p className="label-caps text-primary">Monthly overview</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap a day to inspect deadlines and workload.
            </p>
          </div>
          <div className="p-6">
            <MonthCalendar
              year={year}
              month={month}
              tasksByDate={tasksByDate}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onPreviousMonth={goToPreviousMonth}
              onNextMonth={goToNextMonth}
              isFetching={isFetching}
            />
          </div>
        </MotionDiv>

        <MotionDiv
          variants={fadeUp}
          transition={motionTransition.slow}
          className="xl:sticky xl:top-6 xl:self-start"
        >
          <DayTaskPanel dateKey={selectedDate} tasks={selectedTasks} />
        </MotionDiv>
      </div>
    </MotionDiv>
  );
}
