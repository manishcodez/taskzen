"use client";

import { motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";
import {
  selectClassName,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  TASK_TYPE_OPTIONS,
} from "@/lib/tasks/labels";
import type { SubjectSummary, TaskListFilters } from "@/types";

type TaskFiltersProps = {
  filters: TaskListFilters;
  subjects: SubjectSummary[];
  onChange: (next: TaskListFilters) => void;
};

export function TaskFilters({ filters, subjects, onChange }: TaskFiltersProps) {
  const prefersReducedMotion = useReducedMotion();

  function updateFilter<K extends keyof TaskListFilters>(key: K, value: TaskListFilters[K]) {
    onChange({
      ...filters,
      [key]: value,
      page: 1,
    });
  }

  const quickFilters = [
    { key: "dueToday" as const, label: "Due today", active: Boolean(filters.dueToday) },
    { key: "dueThisWeek" as const, label: "Due this week", active: Boolean(filters.dueThisWeek) },
    { key: "overdue" as const, label: "Overdue", active: Boolean(filters.overdue) },
    { key: "completed" as const, label: "Completed", active: Boolean(filters.completed) },
  ];

  return (
    <motion.div
      className="bg-panel overflow-hidden"
      variants={fadeUp}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="show"
    >
      <div className="flex items-start gap-3 border-b border-border/50 px-5 py-4 md:px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <SlidersHorizontal className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-base font-semibold tracking-tight">Filter tasks</h2>
          <p className="text-xs text-muted-foreground">
            Narrow your list by subject, status, or due date.
          </p>
        </div>
      </div>

      <motion.div
        className="space-y-5 p-5 md:p-6"
        variants={staggerContainer(0.04, 0.02)}
        initial={prefersReducedMotion ? false : "hidden"}
        animate="show"
      >
        <motion.div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4" variants={fadeUp}>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="task-search">Search</Label>
            <Input
              id="task-search"
              placeholder="Search title or description"
              value={filters.q ?? ""}
              onChange={(event) => updateFilter("q", event.target.value || undefined)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject-filter">Subject</Label>
            <select
              id="subject-filter"
              className={selectClassName()}
              value={filters.subjectId ?? ""}
              onChange={(event) => updateFilter("subjectId", event.target.value || undefined)}
            >
              <option value="">All subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <select
              id="status-filter"
              className={selectClassName()}
              value={filters.status ?? ""}
              onChange={(event) => updateFilter("status", event.target.value || undefined)}
            >
              <option value="">All statuses</option>
              {TASK_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority-filter">Priority</Label>
            <select
              id="priority-filter"
              className={selectClassName()}
              value={filters.priority ?? ""}
              onChange={(event) => updateFilter("priority", event.target.value || undefined)}
            >
              <option value="">All priorities</option>
              {TASK_PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type-filter">Task type</Label>
            <select
              id="type-filter"
              className={selectClassName()}
              value={filters.type ?? ""}
              onChange={(event) => updateFilter("type", event.target.value || undefined)}
            >
              <option value="">All types</option>
              {TASK_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort-filter">Sort by</Label>
            <select
              id="sort-filter"
              className={selectClassName()}
              value={filters.sortBy ?? "dueDate"}
              onChange={(event) =>
                updateFilter("sortBy", event.target.value as TaskListFilters["sortBy"])
              }
            >
              <option value="dueDate">Due date</option>
              <option value="priority">Priority</option>
              <option value="createdAt">Creation date</option>
              <option value="status">Status</option>
              <option value="subject">Subject</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort-order">Sort order</Label>
            <select
              id="sort-order"
              className={selectClassName()}
              value={filters.sortOrder ?? "asc"}
              onChange={(event) =>
                updateFilter("sortOrder", event.target.value as TaskListFilters["sortOrder"])
              }
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </motion.div>

        <motion.div
          className="flex flex-wrap gap-2 border-t border-border/50 pt-4"
          variants={fadeUp}
        >
          {quickFilters.map((filter) => (
            <Button
              key={filter.key}
              type="button"
              size="sm"
              variant={filter.active ? "default" : "outline"}
              onClick={() => updateFilter(filter.key, filter.active ? undefined : true)}
            >
              {filter.label}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() =>
              onChange({
                page: 1,
                limit: filters.limit ?? 20,
                sortBy: "dueDate",
                sortOrder: "asc",
                tzOffset: filters.tzOffset,
              })
            }
          >
            Clear filters
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
