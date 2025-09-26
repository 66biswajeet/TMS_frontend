import { TaskDetails } from "@/components/tasks/task-details"

interface TaskDetailsPageProps {
  params: {
    id: string
  }
}

export default function TaskDetailsPage({ params }: TaskDetailsPageProps) {
  return <TaskDetails taskId={params.id} />
}
