"use client"

import IconButton from "@mui/material/IconButton"
import { Iconify } from "../iconify/iconify"

export type MenuButtonProps = {
  onClick: () => void
  sx?: object
}

export function MenuButton({ onClick, sx }: MenuButtonProps) {
  return (
    <IconButton onClick={onClick} sx={sx}>
      <Iconify icon="solar:hamburger-menu-bold-duotone" />
    </IconButton>
  )
}
