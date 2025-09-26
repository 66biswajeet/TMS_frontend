"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Users, Building } from "lucide-react"

interface ReviewDialogProps {
  isOpen: boolean
  onClose: () => void
  task: {
    id: number
    title: string
    description: string
    branch: string
    assignees: string[]
    submittedBy: string
    submittedAt: string
    priority: "low" | "medium" | "high"
    checklistProgress: { completed: number; total: number }
  } | null
  action: "approve" | "reject" | null
  onSubmit: (action: "approve" | "reject", reason: string) => void
}

export function ReviewDialog({ isOpen, onClose, task, action, onSubmit }: ReviewDialogProps) {
  const [reason, setReason] = useState("")

  const handleSubmit = () => {
    if (!action) return
    if (action === "reject" && reason.trim() === "") return

    onSubmit(action, reason)
    setReason("")
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffHours < 1) {
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffMinutes}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else {
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ago`
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  if (!task || !action) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === "approve" ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Approve Task
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                Reject Task
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {action === "approve"
              ? "Confirm approval of this task. You can add optional comments."
              : "Provide a reason for rejecting this task. This will be sent to the assignees."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-lg">{task.title}</h4>
              <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                {task.priority}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">{task.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>{task.branch}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>
                  {task.assignees.length} assignee{task.assignees.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formatTimeAgo(task.submittedAt)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Submitted by <span className="font-medium">{task.submittedBy}</span>
              </span>
              <span className="text-sm text-muted-foreground">
                Progress: {task.checklistProgress.completed}/{task.checklistProgress.total} completed
              </span>
            </div>
          </div>

          {/* Review Form */}
          <div className="space-y-3">
            <Label htmlFor="review-reason">{action === "approve" ? "Comments (optional)" : "Rejection Reason *"}</Label>
            <Textarea
              id="review-reason"
              placeholder={
                action === "approve"
                  ? "Add any comments about this approval..."
                  : "Explain why this task is being rejected..."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className={action === "reject" && reason.trim() === "" ? "border-red-300" : ""}
            />
            {action === "reject" && reason.trim() === "" && (
              <p className="text-sm text-red-600">Please provide a reason for rejection</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              variant={action === "reject" ? "destructive" : "default"}
              disabled={action === "reject" && reason.trim() === ""}
            >
              {action === "approve" ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Task
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Task
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
