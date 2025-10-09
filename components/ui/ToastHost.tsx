"use client";

import React from "react";
import { Toaster } from "sonner";

export function ToastHost() {
  return (
    <Toaster
      position="top-right"
      expand={true}
      richColors={true}
      closeButton={true}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: "toast-elegant",
          title: "toast-title",
          description: "toast-description",
          success: "toast-success",
          error: "toast-error",
          warning: "toast-warning",
          info: "toast-info",
        },
        style: {
          background: "#57CFB7",
          border: "none",
          color: "#ffffff",
          padding: "1.25rem 1.5rem",
          borderRadius: "1rem",
          boxShadow:
            "0 10px 40px rgba(102, 126, 234, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset",
          backdropFilter: "blur(10px)",
          fontSize: "0.95rem",
          fontWeight: "500",
          minWidth: "320px",
        },
      }}
    />
  );
}
