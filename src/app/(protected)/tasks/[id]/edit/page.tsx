import { TaskEditView } from "@/components/tasks/task-edit-view";

type TaskEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TaskEditPage({ params }: TaskEditPageProps) {
  const { id } = await params;
  return <TaskEditView taskId={id} />;
}
