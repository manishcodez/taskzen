"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckSquare,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
} from "lucide-react";
import { useState } from "react";

import { TaskzenLogo } from "@/components/brand/taskzen-logo";
import { SiteFooter } from "@/components/layout/site-footer";
import { markPostLogoutNavigation } from "@/components/auth/prepare-public-back-navigation";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { SafeUser } from "@/lib/auth/constants";

const baseNavItems = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Dash", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", shortLabel: "Tasks", icon: CheckSquare },
  { href: "/subjects", label: "Subjects", shortLabel: "Subjects", icon: BookOpen },
  { href: "/calendar", label: "Calendar", shortLabel: "Cal", icon: CalendarDays },
  { href: "/analytics", label: "Analytics", shortLabel: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Settings", shortLabel: "Settings", icon: Settings },
] as const;

const adminNavItem = {
  href: "/admin",
  label: "Admin",
  shortLabel: "Admin",
  icon: Shield,
} as const;

function getNavItems(isAdmin: boolean) {
  return isAdmin ? [...baseNavItems, adminNavItem] : baseNavItems;
}

type AppShellProps = {
  user: SafeUser;
  children: React.ReactNode;
};

function DesktopRail({ pathname, isAdmin }: { pathname: string; isAdmin: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  const navItems = getNavItems(isAdmin);

  return (
    <aside className="fixed top-1/2 left-3 z-40 hidden -translate-y-1/2 md:block lg:left-4">
      <div className="flex w-[5.25rem] flex-col items-center gap-2 rounded-[1.75rem] border border-border/80 bg-card/95 p-2 shadow-float backdrop-blur-md lg:w-[5.75rem]">
        <Link
          href="/dashboard"
          className="mb-1 flex flex-col items-center gap-1 p-1 transition-opacity hover:opacity-85"
          aria-label="Taskzen dashboard"
        >
          <TaskzenLogo size="xs" showWordmark={false} variant="mark-only" />
        </Link>

        <nav className="flex w-full flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group relative flex min-h-[4.25rem] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-center transition-all duration-200",
                  isActive
                    ? "rail-active"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                {!prefersReducedMotion && isActive ? (
                  <motion.span
                    layoutId="rail-active"
                    className="absolute inset-0 rounded-2xl bg-accent"
                    transition={motionTransition.spring}
                  />
                ) : null}
                <Icon
                  className={cn(
                    "relative z-10 h-[1.05rem] w-[1.05rem] shrink-0",
                    isActive && "text-accent-foreground",
                  )}
                />
                <span
                  className={cn(
                    "relative z-10 max-w-full truncate px-0.5 text-[10px] leading-tight font-medium",
                    isActive ? "text-accent-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

function MobileTabBar({ pathname, isAdmin }: { pathname: string; isAdmin: boolean }) {
  const navItems = getNavItems(isAdmin);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/95 px-1 py-1.5 shadow-float backdrop-blur-md md:hidden">
      <div
        className={cn(
          "mx-auto grid max-w-lg gap-0.5",
          isAdmin ? "grid-cols-7" : "grid-cols-6",
        )}
      >
        {navItems.map(({ href, label, shortLabel, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-center transition-colors",
                isActive ? "text-accent" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                  isActive ? "bg-accent/15 text-accent" : "bg-transparent",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span
                className="max-w-full truncate text-[9px] leading-none font-medium sm:text-[10px]"
                title={label}
              >
                {shortLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: liveUser } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const displayUser = liveUser ?? user;
  const isAdmin = displayUser.isAdmin;

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      queryClient.clear();
      markPostLogoutNavigation();
    } finally {
      window.location.replace("/login?from=logout");
    }
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-atelier">
      <DesktopRail pathname={pathname} isAdmin={isAdmin} />
      <MobileTabBar pathname={pathname} isAdmin={isAdmin} />

      <div className="mx-auto min-h-screen max-w-[1400px] md:pl-[6.75rem] lg:pl-[7.25rem]">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
            <Link href="/dashboard" className="min-w-0 shrink-0 transition-opacity hover:opacity-90">
              <TaskzenLogo size="sm" />
            </Link>

            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="hidden min-w-0 text-right sm:block">
                <p className="truncate text-sm font-medium">{displayUser.name || "Student"}</p>
                <p className="max-w-[180px] truncate text-xs text-muted-foreground">
                  {displayUser.email}
                </p>
              </div>
              <UserAvatar
                name={displayUser.name}
                email={displayUser.email}
                photoUrl={displayUser.profilePhotoUrl}
                size="sm"
              />
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={handleLogout}
                disabled={isLoggingOut}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 pb-[5.5rem] md:px-6 md:pb-8 lg:px-8">
          {children}
          <SiteFooter className="-mx-4 mt-8 md:-mx-6 lg:-mx-8" />
        </main>
      </div>
    </div>
  );
}
