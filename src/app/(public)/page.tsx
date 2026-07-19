"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckSquare,
  Sparkles,
} from "lucide-react";

import { TaskzenLogo } from "@/components/brand/taskzen-logo";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: CheckSquare,
    title: "Task intelligence",
    description: "Assignments, exams, and priorities in one calm workspace.",
  },
  {
    icon: CalendarDays,
    title: "Deadline clarity",
    description: "See what is due today, this week, and what needs attention now.",
  },
  {
    icon: BarChart3,
    title: "Progress insight",
    description: "Understand workload, completion trends, and subject balance.",
  },
] as const;

const previewCapabilities = [
  {
    icon: CheckSquare,
    title: "Academic tasks",
    description: "Track assignments, exams, and priorities in one place.",
  },
  {
    icon: BookOpen,
    title: "Subject organization",
    description: "Group tasks by course and keep every subject visible.",
  },
  {
    icon: CalendarDays,
    title: "Calendar deadlines",
    description: "See upcoming due dates and plan your week with clarity.",
  },
  {
    icon: BarChart3,
    title: "Progress tracking",
    description: "Review completion trends and workload balance over time.",
  },
] as const;

export default function LandingPage() {
  return (
    <main className="overflow-x-clip">
      <section className="relative mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3 py-1.5 text-xs font-medium text-primary shadow-soft backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Academic workload, reimagined
            </div>

            <h1 className="max-w-2xl font-display text-4xl leading-[1.08] font-semibold md:text-6xl">
              A completely new way to keep your{" "}
              <span className="inline-block min-h-[1.08em] text-gradient-brand">
                deadlines under control.
              </span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Taskzen is a premium academic command center for students who want clarity,
              momentum, and calm control over subjects, tasks, and deadlines.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" render={<Link href="/register" />}>
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/login" />}>
                Sign in
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-accent/15 via-transparent to-primary/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-panel-elevated p-6 shadow-float">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TaskzenLogo size="xs" showWordmark={false} variant="mark-only" />
                    <span className="label-caps text-accent">Dashboard preview</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">Sample workspace overview</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Representative product capabilities — not your personal account data.
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Demo
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {previewCapabilities.map(({ icon: Icon, title, description }) => (
                  <div
                    key={title}
                    className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4"
                  >
                    <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
                  </div>
                ))}
              </div>

              <p className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
                This is a preview of what Taskzen can do after you create an account and log in.
                Your own tasks, subjects, deadlines, and progress appear once you sign in.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-card/50">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-16 md:grid-cols-3 md:px-8">
          {features.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="surface-interactive rounded-[1.5rem] border border-border/70 bg-card p-6 shadow-soft"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-gradient-to-br from-primary/8 via-card to-accent/10 p-8 shadow-float md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="label-caps text-primary">Built for students</p>
              <h2 className="font-display text-3xl font-semibold md:text-4xl">
                Open Taskzen and feel in control on day one.
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                A distinctive academic productivity experience with meaningful motion, strong
                hierarchy, and a layout language that feels nothing like a generic dashboard.
              </p>
            </div>
            <Button size="lg" render={<Link href="/register" />}>
              Create your account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
