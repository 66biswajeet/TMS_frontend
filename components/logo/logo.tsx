"use client"

import Link from "next/link"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { useTheme } from "@mui/material/styles"

// ----------------------------------------------------------------------

export type LogoProps = {
  href?: string
  sx?: object
}

export function Logo({ href = "/", sx }: LogoProps) {
  const theme = useTheme()

  const logo = (
    <Box
      component="div"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        ...sx,
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 700,
          fontSize: 16,
        }}
      >
        P
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: theme.palette.text.primary,
        }}
      >
        Pharmacy TMS
      </Typography>
    </Box>
  )

  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      {logo}
    </Link>
  )
}
