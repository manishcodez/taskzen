"use client";

import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeUp, scaleIn } from "@/lib/motion";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={scaleIn}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="show"
    >
      <Card className="relative overflow-hidden border-destructive/25 bg-gradient-to-br from-destructive/8 via-card to-muted/20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-destructive/60" />
        <CardHeader>
          <motion.div
            className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20"
            variants={fadeUp}
          >
            <AlertCircle className="h-5 w-5 text-destructive" />
          </motion.div>
          <CardTitle className="font-display">{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        {onRetry ? (
          <CardContent>
            <Button onClick={onRetry} variant="outline">
              Try again
            </Button>
          </CardContent>
        ) : null}
      </Card>
    </motion.div>
  );
}
