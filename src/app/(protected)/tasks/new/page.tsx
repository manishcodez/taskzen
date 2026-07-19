import { Suspense } from "react";

import { TaskCreateView } from "@/components/tasks/task-create-view";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

export default function NewTaskPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <TaskCreateView />
    </Suspense>
  );
}
