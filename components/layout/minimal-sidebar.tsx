"use client"

import { useState } from "react"
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Collapse,
  Avatar,
  Chip,
} from "@mui/material"
import {
  Dashboard,
  Assignment,
  Reviews,
  AdminPanelSettings,
  ExpandLess,
  ExpandMore,
  Template,
  Analytics,
} from "@mui/icons-material"
import { motion, AnimatePresence } from "framer-motion"

const DRAWER_WIDTH = 280

interface SidebarProps {
  open: boolean
  onClose: () => void
  userRole: string
}

export function MinimalSidebar({ open, onClose, userRole }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (item: string) => {
    setExpandedItems((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]))
  }

  const menuItems = [
    {
      title: "Dashboard",
      icon: <Dashboard />,
      path: "/",
      roles: ["all"],
    },
    {
      title: "Tasks",
      icon: <Assignment />,
      path: "/tasks",
      roles: ["all"],
      children: [
        { title: "All Tasks", path: "/tasks" },
        { title: "My Tasks", path: "/tasks/my" },
        { title: "Create Task", path: "/tasks/create" },
      ],
    },
    {
      title: "Templates",
      icon: <Template />,
      path: "/templates",
      roles: ["branch_manager", "area_manager", "auditor", "management", "admin"],
    },
    {
      title: "Reviews",
      icon: <Reviews />,
      path: "/reviews",
      roles: ["branch_manager", "area_manager", "auditor", "management", "admin"],
    },
    {
      title: "Analytics",
      icon: <Analytics />,
      path: "/analytics",
      roles: ["area_manager", "auditor", "management", "admin"],
    },
    {
      title: "Administration",
      icon: <AdminPanelSettings />,
      roles: ["management", "admin"],
      children: [
        { title: "Users", path: "/users" },
        { title: "Roles", path: "/roles" },
        { title: "Branches", path: "/branches" },
      ],
    },
  ]

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes("all") || item.roles.includes(userRole))

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          borderRight: "1px solid rgba(145, 158, 171, 0.12)",
          boxShadow: "none",
        },
      }}
    >
      {/* Logo & User Info */}
      <Box sx={{ p: 3, borderBottom: "1px solid rgba(145, 158, 171, 0.12)" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Pharmacy TMS
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: "primary.main" }}>JD</Avatar>
          <Box>
            <Typography variant="subtitle2">John Doe</Typography>
            <Chip label={userRole.replace("_", " ")} size="small" color="primary" variant="outlined" />
          </Box>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ px: 2, py: 1 }}>
        {filteredMenuItems.map((item) => (
          <Box key={item.title}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => (item.children ? toggleExpanded(item.title) : undefined)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  "&:hover": {
                    bgcolor: "rgba(145, 158, 171, 0.08)",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: 500,
                  }}
                />
                {item.children && (expandedItems.includes(item.title) ? <ExpandLess /> : <ExpandMore />)}
              </ListItemButton>
            </ListItem>

            {/* Submenu */}
            {item.children && (
              <AnimatePresence>
                <Collapse in={expandedItems.includes(item.title)} timeout="auto">
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <motion.div
                        key={child.title}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                      >
                        <ListItem disablePadding>
                          <ListItemButton
                            sx={{
                              pl: 6,
                              borderRadius: 1,
                              mb: 0.5,
                              "&:hover": {
                                bgcolor: "rgba(145, 158, 171, 0.08)",
                              },
                            }}
                          >
                            <ListItemText
                              primary={child.title}
                              primaryTypographyProps={{
                                variant: "body2",
                                color: "text.secondary",
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      </motion.div>
                    ))}
                  </List>
                </Collapse>
              </AnimatePresence>
            )}
          </Box>
        ))}
      </List>
    </Drawer>
  )
}
