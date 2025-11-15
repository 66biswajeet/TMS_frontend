export interface TimeRemainingInfo {
  text: string;
  color: string;
}

export function formatTimeRemaining(
  deadline: string,
  status?: string
): TimeRemainingInfo {
  const date = new Date(deadline);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.ceil(diffMs / (1000 * 60));

  // Don't show remaining time if task is completed, submitted, or approved
  if (
    status &&
    ["completed", "submitted", "approved"].includes(status.toLowerCase())
  ) {
    return { text: `Task ${status}`, color: "text-green-600" };
  }

  if (diffMinutes < 0) {
    const absMinutes = Math.abs(diffMinutes);
    if (absMinutes < 60) {
      return { text: `Overdue by ${absMinutes}m`, color: "text-red-600" };
    } else if (absMinutes < 1440) {
      // Less than 24 hours
      const hours = Math.floor(absMinutes / 60);
      const minutes = absMinutes % 60;
      return {
        text: `Overdue by ${hours}h ${minutes}m`,
        color: "text-red-600",
      };
    } else {
      // More than 24 hours
      const days = Math.floor(absMinutes / 1440);
      return { text: `Overdue by ${days}d`, color: "text-red-600" };
    }
  } else {
    if (diffMinutes < 60) {
      return { text: `${diffMinutes}m remaining`, color: "text-red-600" };
    } else if (diffMinutes < 1440) {
      // Less than 24 hours
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return {
        text: `${hours}h ${minutes}m remaining`,
        color: "text-amber-600",
      };
    } else {
      // More than 24 hours
      const days = Math.floor(diffMinutes / 1440);
      return { text: `${days}d remaining`, color: "text-green-600" };
    }
  }
}
