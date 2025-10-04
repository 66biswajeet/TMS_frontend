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
        style: {
          background: "#57CFB7",
          border: "1px solid #e2e8f0",
          color: "#1e293b",
          padding: "1rem",
          borderRadius: "0.75rem",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        },
      }}
    />
  );
}
