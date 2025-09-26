"use client"

import type React from "react"
import Box from "@mui/material/Box"
import { styled } from "@mui/material/styles"

export type ScrollbarProps = {
  children: React.ReactNode
  sx?: object
}

export function Scrollbar({ children, sx }: ScrollbarProps) {
  return <ScrollbarRoot sx={sx}>{children}</ScrollbarRoot>
}

const ScrollbarRoot = styled(Box)(({ theme }) => ({
  overflow: "auto",
  "&::-webkit-scrollbar": {
    width: 6,
    height: 6,
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.divider,
    borderRadius: 3,
  },
  "&::-webkit-scrollbar-thumb:hover": {
    backgroundColor: theme.palette.text.disabled,
  },
}))
