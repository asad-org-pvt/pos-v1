import React from "react";
import { Tab, Tabs } from "react-bootstrap";
import { Box, Typography, Paper } from "@mui/material";
import { Settings as SettingsIcon } from "@mui/icons-material";
import PosBusinessSettings from "./pos-business";
import GeneralSettings from "./general";
import PrinterSettings from "./printer";
import AppearanceSettings from "./appearance";
import SystemPreferences from "./system-preferences";
import ProfileSettings from "./profile";

export const Setting: React.FC = () => {
  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: "0 auto" }}>
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <SettingsIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold" color="text.primary">
              POS Configuration & Personalization
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure POS business policies, store profile, thermal hardware, system preferences, and appearance.
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Tabs defaultActiveKey="pos" id="pos-settings-tabs" className="mb-3" fill>
        <Tab eventKey="pos" title="POS & Business">
          <PosBusinessSettings />
        </Tab>
        <Tab eventKey="organization" title="Organization Profile">
          <GeneralSettings />
        </Tab>
        <Tab eventKey="hardware" title="Hardware & Printers">
          <PrinterSettings />
        </Tab>
        <Tab eventKey="appearance" title="Appearance & Themes">
          <AppearanceSettings />
        </Tab>
        <Tab eventKey="system" title="System Preferences">
          <SystemPreferences />
        </Tab>
        <Tab eventKey="profile" title="Profile & Security">
          <ProfileSettings />
        </Tab>
      </Tabs>
    </Box>
  );
};

export default Setting;
