"use client"

import React from "react"
import { Toaster } from "sonner"

export function ToastHost() {
  return (
    <Toaster
      position="top-right"
      expand={true}
      richColors={true}
      closeButton={true}
      toastOptions={{
        duration: 4000,
        style: {
          background: "white",
          border: "1px solid #e2e8f0",
          color: "#1e293b",
        },
      }}
    />
  )
}