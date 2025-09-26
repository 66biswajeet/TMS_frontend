"use client"

import { Icon } from "@iconify/react"
import Box from "@mui/material/Box"

// ----------------------------------------------------------------------

export type IconifyProps = {
  icon: string
  width?: number | string
  height?: number | string
  sx?: object
}

export function Iconify({ icon, width = 20, height, sx, ...other }: IconifyProps) {
  return (
    <Box
      component={Icon}
      icon={icon}
      sx={{
        width,
        height: height || width,
        ...sx,
      }}
      {...other}
    />
  )
}
