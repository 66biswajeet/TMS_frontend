import type React from "react"
import Box from "@mui/material/Box"

export type MainSectionProps = {
  children: React.ReactNode
}

export function MainSection({ children }: MainSectionProps) {
  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        minHeight: 1,
        display: "flex",
        flexDirection: "column",
        py: `var(--layout-header-height)`,
        ...(true && {
          px: {
            lg: `var(--layout-nav-vertical-width)`,
          },
        }),
      }}
    >
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 3 }}>{children}</Box>
    </Box>
  )
}
