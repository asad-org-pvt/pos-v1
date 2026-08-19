import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Computer,
  Storage,
  Language,
  Save as SaveIcon,
  DeleteForever,
  WarningAmber,
} from "@mui/icons-material";
import { useSettings } from "../../../context/SettingsContext";
import { settingsService } from "../../../services/app/SettingsService";
import toast from "react-hot-toast";

export const SystemPreferences: React.FC = () => {
  const { systemSettings, updateSystemSettings } = useSettings();
  const [formData, setFormData] = useState(systemSettings);
  const [diagnostics, setDiagnostics] = useState<{
    hasPendingOutbox: boolean;
    pendingOutboxCount: number;
    estimatedCacheSizeKb: number;
  }>({ hasPendingOutbox: false, pendingOutboxCount: 0, estimatedCacheSizeKb: 0 });

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    setFormData(systemSettings);
    loadDiagnostics();
  }, [systemSettings]);

  const loadDiagnostics = async () => {
    const diag = await settingsService.getStorageDiagnostics();
    setDiagnostics(diag);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings(formData);
    toast.success("System preferences updated!");
  };

  const handleClearCache = async (force: boolean) => {
    setClearing(true);
    try {
      const res = await settingsService.clearLocalCache(force);
      if (res.success) {
        toast.success(res.message);
        setConfirmDialogOpen(false);
        await loadDiagnostics();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error("Failed to clear cache");
    } finally {
      setClearing(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 800, m: "0 auto", borderRadius: 2, boxShadow: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Computer color="primary" />
          <Typography variant="h6" fontWeight="bold">
            System & Storage Preferences
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <form onSubmit={handleSave}>
          <Grid container spacing={3}>
            {/* 1. LOCALIZATION */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="700" sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}>
                <Language fontSize="small" /> Date & Time Localization
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="lang-select-label">Language</InputLabel>
                <Select
                  labelId="lang-select-label"
                  label="Language"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                >
                  <MenuItem value="en">English (US)</MenuItem>
                  <MenuItem value="ur">Urdu (اردو)</MenuItem>
                  <MenuItem value="ar">Arabic (العربية)</MenuItem>
                  <MenuItem value="es">Spanish (Español)</MenuItem>
                  <MenuItem value="fr">French (Français)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="date-format-label">Date Format</InputLabel>
                <Select
                  labelId="date-format-label"
                  label="Date Format"
                  value={formData.dateFormat}
                  onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value as any })}
                >
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</MenuItem>
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2026)</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="time-format-label">Time Format</InputLabel>
                <Select
                  labelId="time-format-label"
                  label="Time Format"
                  value={formData.timeFormat}
                  onChange={(e) => setFormData({ ...formData, timeFormat: e.target.value as any })}
                >
                  <MenuItem value="12H">12-Hour (02:30 PM)</MenuItem>
                  <MenuItem value="24H">24-Hour (14:30)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* 2. LOCAL STORAGE & OFFLINE CACHE */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" fontWeight="700" sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}>
                <Storage fontSize="small" /> Local Storage & Cache Diagnostics
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: "background.default", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • Estimated Local Cache Size: <strong>{diagnostics.estimatedCacheSizeKb} KB</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • Pending Offline Outbox Items: <strong>{diagnostics.pendingOutboxCount}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Storage Status: <strong>{diagnostics.hasPendingOutbox ? "Outbox Transactions Active" : "Clean & Synced"}</strong>
                </Typography>
              </Box>
            </Grid>

            {diagnostics.hasPendingOutbox && (
              <Grid item xs={12}>
                <Alert severity="warning" icon={<WarningAmber />}>
                  You have <strong>{diagnostics.pendingOutboxCount}</strong> offline transaction(s) pending synchronization. Clearing cache without syncing will require confirmation.
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteForever />}
                  onClick={() => setConfirmDialogOpen(true)}
                >
                  Clear Local Cache
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                >
                  Save System Preferences
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>

        {/* Confirmation Modal */}
        <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
          <DialogTitle sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
            <WarningAmber color="warning" /> Confirm Cache Clearing
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {diagnostics.hasPendingOutbox ? (
                <span style={{ color: "var(--error, #dc2626)", fontWeight: "bold" }}>
                  WARNING: You have {diagnostics.pendingOutboxCount} unsynced offline transaction(s)! Force clearing will remove local cache. Are you sure?
                </span>
              ) : (
                "Are you sure you want to clear the local temporary product and UI cache? Authoritative server data in Firestore will NOT be affected."
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={() => handleClearCache(diagnostics.hasPendingOutbox)}
              color="error"
              variant="contained"
              disabled={clearing}
            >
              {clearing ? "Clearing..." : "Confirm & Clear"}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SystemPreferences;
