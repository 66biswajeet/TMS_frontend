// import { TaskDetails } from "@/components/tasks/task-details"

// interface TaskDetailsPageProps {
//   params: {
//     id: string
//   }
// }

// export default function TaskDetailsPage({ params }: TaskDetailsPageProps) {
//   return <TaskDetails taskId={params.id} />
// }
import { TaskDetails } from "@/components/tasks/task-details";

interface TaskDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailsPage({
  params,
}: TaskDetailsPageProps) {
  const resolvedParams = await params;
  return <TaskDetails taskId={resolvedParams.id} />;
}
