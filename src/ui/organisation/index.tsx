import React, { useState } from "react";
import toast from "react-hot-toast";
import { addOneOrganisation } from "../../parser/organisation";
import OrganisationForm from "./organisation-form";
import OrganisationList from "./organisation-list";
import { Box, Typography, Paper, Button, Drawer } from "@mui/material";
import { Business, Add as AddIcon, Close } from "@mui/icons-material";

export const Organisation: React.FC = () => {
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddOrganisation = (values: any, { resetForm }: any) => {
    addOneOrganisation(values)
      .then(() => {
        toast.success(`${values.name} added successfully`);
        if (resetForm) resetForm();
        setShowAddDrawer(false);
        setRefreshKey((k) => k + 1);
      })
      .catch((err) => {
        toast.error(
          err.message || "Something went wrong with adding organization"
        );
      });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: "0 auto", width: "100%" }}>
      {/* Top Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 2,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Business color="primary" sx={{ fontSize: 36 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold" color="text.primary">
              Organizations & Branch Profiles
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage enterprise entities, subsidiaries, tax policies, and store credentials.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setShowAddDrawer(true)}
          sx={{ px: 3, py: 1, fontWeight: 700 }}
        >
          Add Organization
        </Button>
      </Paper>

      {/* Main List */}
      <OrganisationList key={refreshKey} />

      {/* Add Organization Drawer */}
      <Drawer
        anchor="right"
        open={showAddDrawer}
        onClose={() => setShowAddDrawer(false)}
        PaperProps={{
          sx: { width: { xs: "100%", sm: 600, md: 720 }, p: 3 },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Business color="primary" /> Add New Organization
          </Typography>
          <Button
            size="small"
            color="inherit"
            onClick={() => setShowAddDrawer(false)}
            startIcon={<Close />}
          >
            Close
          </Button>
        </Box>
        <OrganisationForm
          onSubmit={handleAddOrganisation}
          onCancel={() => setShowAddDrawer(false)}
        />
      </Drawer>
    </Box>
  );
};

export default Organisation;
