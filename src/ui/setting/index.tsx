import React, { useState } from "react";
import { Box, Typography, Paper, Tabs, Tab } from "@mui/material";
import {
  Settings as SettingsIcon,
  PointOfSale,
  Business,
  Print,
  Palette,
  Computer,
  Person,
} from "@mui/icons-material";
import PosBusinessSettings from "./pos-business";
import GeneralSettings from "./general";
import PrinterSettings from "./printer";
import AppearanceSettings from "./appearance";
import SystemPreferences from "./system-preferences";
import ProfileSettings from "./profile";

export const Setting: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("pos");

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: { xs: "100%", md: 1200 },
        margin: "0 auto",
        p: { xs: 1, sm: 2, md: 3 },
        boxSizing: "border-box",
        overflowX: "hidden",
        pb: 12,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 2 },
          mb: { xs: 2, md: 3 },
          borderRadius: 2,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          boxSizing: "border-box",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <SettingsIcon color="primary" sx={{ fontSize: { xs: 24, md: 32 } }} />
          <Box>
            <Typography
              variant="h5"
              fontWeight="bold"
              color="text.primary"
              sx={{ fontSize: { xs: "1.1rem", md: "1.5rem" } }}
            >
              POS Configuration & Personalization
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              Configure POS business policies, store profile, thermal hardware, system preferences, and appearance.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Fully responsive touch-scrollable tabs header */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "background.paper",
          mb: { xs: 2, md: 3 },
          overflow: "hidden",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: { xs: 44, sm: 48 },
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: { xs: "12px", sm: "14px" },
              minHeight: { xs: 44, sm: 48 },
              py: 1,
              px: { xs: 1.5, sm: 2.5 },
              minWidth: "auto",
            },
          }}
        >
          <Tab icon={<PointOfSale fontSize="small" />} iconPosition="start" label="POS & Business" value="pos" />
          <Tab icon={<Business fontSize="small" />} iconPosition="start" label="Org Profile" value="organization" />
          <Tab icon={<Print fontSize="small" />} iconPosition="start" label="Hardware" value="hardware" />
          <Tab icon={<Palette fontSize="small" />} iconPosition="start" label="Themes" value="appearance" />
          <Tab icon={<Computer fontSize="small" />} iconPosition="start" label="System" value="system" />
          <Tab icon={<Person fontSize="small" />} iconPosition="start" label="Profile" value="profile" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <Box sx={{ width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" }}>
        {activeTab === "pos" && <PosBusinessSettings />}
        {activeTab === "organization" && <GeneralSettings />}
        {activeTab === "hardware" && <PrinterSettings />}
        {activeTab === "appearance" && <AppearanceSettings />}
        {activeTab === "system" && <SystemPreferences />}
        {activeTab === "profile" && <ProfileSettings />}
      </Box>
    </Box>
  );
};

export default Setting;
