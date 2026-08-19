import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Avatar,
  Chip,
} from "@mui/material";
import { Person, LockReset, Logout, VerifiedUser, Security } from "@mui/icons-material";
import { useAuth, useTenant } from "../../../context/AuthTenantContext";
import { authService } from "../../../services/app/AuthService";
import { useNavigate } from "react-router-dom";
import { LOGIN_PATH } from "../../common/constants";
import toast from "react-hot-toast";

export const ProfileSettings: React.FC = () => {
  const { user, role, signOut } = useAuth();
  const { tenantId } = useTenant();
  const navigate = useNavigate();

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast.error("User email is not available");
      return;
    }
    try {
      await authService.resetPassword(user.email);
      toast.success(`Password reset email sent to ${user.email}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send password reset email");
    }
  };

  const handleSignout = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate(LOGIN_PATH);
    } catch (error: any) {
      toast.error(error.message || "Unable to sign out");
    }
  };

  return (
    <Card sx={{ maxWidth: 800, m: "0 auto", borderRadius: 2, boxShadow: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {user?.displayName || user?.email?.split("@")[0] || "Cashier User"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Box>

          <Chip
            icon={<VerifiedUser />}
            label={`Role: ${role || "CASHIER"}`}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {/* User Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="700" sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}>
              <Person fontSize="small" /> User & Tenant Identification
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Display Name"
              value={user?.displayName || "Cashier"}
              InputProps={{ readOnly: true }}
              helperText="Configured via organization administrator"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Email Address"
              value={user?.email || ""}
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Assigned Organization (Tenant ID)"
              value={tenantId || "default"}
              InputProps={{ readOnly: true }}
              helperText="Enforced by server security claims"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Security Access Level"
              value={role || "CASHIER"}
              InputProps={{ readOnly: true }}
              helperText="Enforced by Firebase custom claims"
            />
          </Grid>

          {/* Security & Password */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1" fontWeight="700" sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}>
              <Security fontSize="small" /> Security & Session Management
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<LockReset />}
                onClick={handlePasswordReset}
              >
                Send Password Reset Email
              </Button>

              <Button
                variant="contained"
                color="error"
                startIcon={<Logout />}
                onClick={handleSignout}
              >
                Sign Out
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;
