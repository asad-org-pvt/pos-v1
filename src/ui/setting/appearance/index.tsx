import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  FormControlLabel,
  Switch,
  Button,
  Grid,
  Divider,
  RadioGroup,
  Radio,
  FormLabel,
  Paper,
} from "@mui/material";
import {
  Palette,
  LightMode,
  DarkMode,
  SettingsBrightness,
  Save as SaveIcon,
  DensityMedium,
  DensitySmall,
} from "@mui/icons-material";
import { useSettings } from "../../../context/SettingsContext";
import toast from "react-hot-toast";

const ACCENT_COLORS = [
  { name: "Ocean Blue", hex: "#0d6efd" },
  { name: "Emerald Green", hex: "#10b981" },
  { name: "Indigo Purple", hex: "#6366f1" },
  { name: "Amber Orange", hex: "#f59e0b" },
  { name: "Rose Pink", hex: "#ec4899" },
  { name: "Slate Gray", hex: "#475569" },
];

export const AppearanceSettings: React.FC = () => {
  const { userSettings, updateUserSettings } = useSettings();
  const [formData, setFormData] = useState(userSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(userSettings);
  }, [userSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserSettings(formData);
      toast.success("Appearance preferences saved!");
    } catch (err: any) {
      toast.error("Failed to save appearance settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 800, m: "0 auto", borderRadius: 2, boxShadow: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Palette color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Appearance & Personalization
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <form onSubmit={handleSave}>
          <Grid container spacing={3}>
            {/* 1. THEME MODE */}
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ fontWeight: "700", mb: 1.5, color: "text.primary" }}>
                  Interface Theme
                </FormLabel>
                <RadioGroup
                  row
                  value={formData.themeMode}
                  onChange={(e) => setFormData({ ...formData, themeMode: e.target.value as any })}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      mr: 2,
                      display: "flex",
                      alignItems: "center",
                      borderRadius: 2,
                      borderColor: formData.themeMode === "LIGHT" ? "primary.main" : "divider",
                      backgroundColor: formData.themeMode === "LIGHT" ? "action.selected" : "background.paper",
                    }}
                  >
                    <FormControlLabel
                      value="LIGHT"
                      control={<Radio size="small" />}
                      label={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <LightMode fontSize="small" color="warning" /> Light Mode
                        </Box>
                      }
                    />
                  </Paper>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      mr: 2,
                      display: "flex",
                      alignItems: "center",
                      borderRadius: 2,
                      borderColor: formData.themeMode === "DARK" ? "primary.main" : "divider",
                      backgroundColor: formData.themeMode === "DARK" ? "action.selected" : "background.paper",
                    }}
                  >
                    <FormControlLabel
                      value="DARK"
                      control={<Radio size="small" />}
                      label={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <DarkMode fontSize="small" color="primary" /> Dark Mode
                        </Box>
                      }
                    />
                  </Paper>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      display: "flex",
                      alignItems: "center",
                      borderRadius: 2,
                      borderColor: formData.themeMode === "SYSTEM" ? "primary.main" : "divider",
                      backgroundColor: formData.themeMode === "SYSTEM" ? "action.selected" : "background.paper",
                    }}
                  >
                    <FormControlLabel
                      value="SYSTEM"
                      control={<Radio size="small" />}
                      label={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <SettingsBrightness fontSize="small" color="action" /> Follow System
                        </Box>
                      }
                    />
                  </Paper>
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* 2. ACCENT COLOR PALETTE */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <FormLabel component="legend" sx={{ fontWeight: "700", mb: 1.5, color: "text.primary" }}>
                Brand Accent Color
              </FormLabel>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {ACCENT_COLORS.map((accent) => (
                  <Box
                    key={accent.hex}
                    onClick={() => setFormData({ ...formData, accentColor: accent.hex })}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      p: 1,
                      px: 2,
                      borderRadius: 2,
                      border: "2px solid",
                      borderColor: formData.accentColor === accent.hex ? accent.hex : "divider",
                      cursor: "pointer",
                      backgroundColor: formData.accentColor === accent.hex ? `${accent.hex}15` : "transparent",
                      transition: "all 0.2s",
                    }}
                  >
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        backgroundColor: accent.hex,
                      }}
                    />
                    <Typography variant="body2" fontWeight="600">
                      {accent.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>

            {/* 3. UI DENSITY */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ fontWeight: "700", mb: 1.5, color: "text.primary" }}>
                  Layout Spacing & Density
                </FormLabel>
                <RadioGroup
                  row
                  value={formData.uiDensity}
                  onChange={(e) => setFormData({ ...formData, uiDensity: e.target.value as any })}
                >
                  <FormControlLabel
                    value="COMFORTABLE"
                    control={<Radio size="small" />}
                    label={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <DensityMedium fontSize="small" /> Comfortable
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="COMPACT"
                    control={<Radio size="small" />}
                    label={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <DensitySmall fontSize="small" /> Compact (High Information Density)
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* 4. BEHAVIOR TOGGLES */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notificationsEnabled}
                    onChange={(e) => setFormData({ ...formData, notificationsEnabled: e.target.checked })}
                    color="primary"
                  />
                }
                label="Enable Notification Toasts"
              />
            </Grid>

            {/* Submit */}
            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Appearance"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default AppearanceSettings;
