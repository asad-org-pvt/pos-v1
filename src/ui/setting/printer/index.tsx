import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  RadioGroup,
  Radio,
  FormLabel,
} from "@mui/material";
import {
  Print as PrintIcon,
  Save as SaveIcon,
  CheckCircle,
  ErrorOutline,
  Usb,
  Cable,
  Language,
  Web,
} from "@mui/icons-material";
import { printerService } from "../../../services/printer/PrinterService";
import { PrinterConfig, PrinterTransportType } from "../../../domain/models/PrinterConfig";
import { useTenant } from "../../../context/AuthTenantContext";
import toast from "react-hot-toast";

export const PrinterSettings: React.FC = () => {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [config, setConfig] = useState<PrinterConfig>({
    id: "default",
    tenantId: tenantId || "default",
    name: "Counter Thermal Printer",
    type: "THERMAL",
    transport: "BROWSER",
    paperWidth: 80,
    characterWidth: 42,
    autoCut: true,
    openCashDrawer: false,
    ipAddress: "",
    port: 9100,
    baudRate: 9600,
    enabled: true,
    isDefault: true,
    headerText: "",
    footerText: "Thank you for your business!",
  });

  useEffect(() => {
    loadConfig();
  }, [tenantId]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const active = await printerService.getConfig(tenantId);
      if (active) {
        setConfig(active);
      }
    } catch (e: any) {
      toast.error("Failed to load printer settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await printerService.saveConfig(config, tenantId);
      toast.success("Printer configuration saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save printer configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrint = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await printerService.testPrint(config, tenantId);
      if (result.success) {
        setTestResult({
          success: true,
          message: `Test print completed successfully via ${result.transport}.`,
        });
        toast.success("Test print sent!");
      } else {
        setTestResult({
          success: false,
          message: result.error || "Direct test print failed.",
        });
        toast.error(result.error || "Test print failed");
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Test print encountered an error.",
      });
      toast.error("Test print failed");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card sx={{ maxWidth: 800, m: 2, borderRadius: 2, boxShadow: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
            <PrintIcon color="primary" /> Thermal Printer Configuration
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                color="primary"
              />
            }
            label={config.enabled ? "Printer Enabled" : "Printer Disabled"}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        <form onSubmit={handleSave}>
          <Grid container spacing={2.5}>
            {/* Printer Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Printer Name"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                required
              />
            </Grid>

            {/* Transport Method */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="transport-select-label">Connection Transport</InputLabel>
                <Select
                  labelId="transport-select-label"
                  value={config.transport}
                  label="Connection Transport"
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      transport: e.target.value as PrinterTransportType,
                    })
                  }
                >
                  <MenuItem value="BROWSER">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Web fontSize="small" /> Browser Print (Default Fallback)
                    </Box>
                  </MenuItem>
                  <MenuItem value="USB">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Usb fontSize="small" /> Direct USB (WebUSB Thermal)
                    </Box>
                  </MenuItem>
                  <MenuItem value="SERIAL">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Cable fontSize="small" /> Serial / COM Port (WebSerial)
                    </Box>
                  </MenuItem>
                  <MenuItem value="NETWORK">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Language fontSize="small" /> Network / Ethernet (Raw TCP/IP)
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Paper Width */}
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ fontSize: "12px" }}>Paper Width</FormLabel>
                <RadioGroup
                  row
                  value={config.paperWidth}
                  onChange={(e) => {
                    const width = parseInt(e.target.value, 10) as 58 | 80;
                    setConfig({
                      ...config,
                      paperWidth: width,
                      characterWidth: width === 58 ? 32 : 42,
                    });
                  }}
                >
                  <FormControlLabel value={80} control={<Radio size="small" />} label="80mm (Standard)" />
                  <FormControlLabel value={58} control={<Radio size="small" />} label="58mm (Compact)" />
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Character Width (Columns) */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Characters Per Line"
                type="number"
                value={config.characterWidth}
                onChange={(e) => setConfig({ ...config, characterWidth: parseInt(e.target.value, 10) || 42 })}
                helperText={`Standard: 42/48 chars (80mm) or 32 chars (58mm)`}
              />
            </Grid>

            {/* Network Transport specifics */}
            {config.transport === "NETWORK" && (
              <>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Printer IP Address"
                    value={config.ipAddress || ""}
                    placeholder="192.168.1.100"
                    onChange={(e) => setConfig({ ...config, ipAddress: e.target.value })}
                    required={config.transport === "NETWORK"}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Port"
                    type="number"
                    value={config.port || 9100}
                    onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value, 10) || 9100 })}
                  />
                </Grid>
              </>
            )}

            {/* Serial Transport specifics */}
            {config.transport === "SERIAL" && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Baud Rate"
                  type="number"
                  value={config.baudRate || 9600}
                  onChange={(e) => setConfig({ ...config, baudRate: parseInt(e.target.value, 10) || 9600 })}
                />
              </Grid>
            )}

            {/* Toggles */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.autoCut}
                    onChange={(e) => setConfig({ ...config, autoCut: e.target.checked })}
                    color="primary"
                  />
                }
                label="Auto-Cut Paper"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.openCashDrawer}
                    onChange={(e) => setConfig({ ...config, openCashDrawer: e.target.checked })}
                    color="primary"
                  />
                }
                label="Kick Cash Drawer on Print"
              />
            </Grid>

            {/* Header & Footer Custom Text */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Receipt Header Subtitle"
                value={config.headerText || ""}
                placeholder="e.g. VAT #123456789"
                onChange={(e) => setConfig({ ...config, headerText: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Receipt Footer Message"
                value={config.footerText || ""}
                placeholder="Thank you for your business!"
                onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
              />
            </Grid>

            {/* Diagnostic Test Feedback Alert */}
            {testResult && (
              <Grid item xs={12}>
                <Alert
                  severity={testResult.success ? "success" : "warning"}
                  icon={testResult.success ? <CheckCircle /> : <ErrorOutline />}
                >
                  {testResult.message}
                </Alert>
              </Grid>
            )}

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 1 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<PrintIcon />}
                  disabled={testing || saving}
                  onClick={handleTestPrint}
                >
                  {testing ? "Testing..." : "Test Print"}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={saving || testing}
                >
                  {saving ? "Saving..." : "Save Configuration"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default PrinterSettings;
