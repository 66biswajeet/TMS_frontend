import type React from "react"
import Box from "@mui/material/Box"

export type LayoutSectionProps = {
  children: React.ReactNode
  sx?: object
}

export function LayoutSection({ children, sx }: LayoutSectionProps) {
  return <Box sx={{ display: "flex", flexDirection: "column", ...sx }}>{children}</Box>
}
