import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"

export function Logo() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          bgcolor: "primary.main",
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h6" color="primary.contrastText">
          P
        </Typography>
      </Box>
      <Typography variant="h6" fontWeight="bold">
        Pharmacy TMS
      </Typography>
    </Box>
  )
}
