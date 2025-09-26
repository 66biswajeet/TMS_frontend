import { toast } from "sonner"

export interface ToastOptions {
  title?: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export const toastService = {
  success: (message: string, options?: ToastOptions) => {
    const duration = options?.duration || 4000
    return toast.success(message, {
      description: options?.description,
      duration,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  },

  error: (message: string, options?: ToastOptions) => {
    const duration = options?.duration || 8000
    return toast.error(message, {
      description: options?.description,
      duration,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  },

  warning: (message: string, options?: ToastOptions) => {
    const duration = options?.duration || 6000
    return toast.warning(message, {
      description: options?.description,
      duration,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  },

  info: (message: string, options?: ToastOptions) => {
    const duration = options?.duration || 4000
    return toast.info(message, {
      description: options?.description,
      duration,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  },

  dismiss: (id?: string | number) => toast.dismiss(id),
  promise: toast.promise,
  loading: toast.loading,
}

// Convenience exports
export const showSuccess = toastService.success
export const showError = toastService.error
export const showWarning = toastService.warning
export const showInfo = toastService.info
export const dismissToast = toastService.dismiss