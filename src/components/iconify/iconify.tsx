import { Icon } from "@iconify/react"
import Box from "@mui/material/Box"

export type IconifyProps = {
  icon: string
  sx?: object
  width?: number | string
  height?: number | string
}

export function Iconify({ icon, sx, width = 24, height = 24, ...other }: IconifyProps) {
  return <Box component={Icon} icon={icon} sx={{ width, height, ...sx }} {...other} />
}
