"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { TaskzenLogo } from "@/components/brand/taskzen-logo";
import { Button } from "@/components/ui/button";

export function PublicSiteHeader() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
        <Link href="/" className="transition-opacity hover:opacity-85">
          <TaskzenLogo size="md" />
        </Link>

        <div className="flex items-center gap-2">
          {isAuthPage ? (
            <Button variant="outline" size="sm" render={<Link href="/" />}>
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                Sign in
              </Button>
              <Button size="sm" render={<Link href="/register" />}>
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
