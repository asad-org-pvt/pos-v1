import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Edit as EditIcon,
  DeleteOutline as RemoveIcon,
  Search,
  Business,
  WarningAmber,
  Email,
  Phone,
  LocationOn,
} from "@mui/icons-material";
import Table from "../../common/components/table";
import toast from "react-hot-toast";
import {
  getAllOrganisations,
  editOrganisation,
  deleteOneOrganisation,
} from "../../../parser/organisation";
import OrganisationForm from "../organisation-form";

interface ComponentProps {
  organisations?: any[];
}

const OrganisationList: React.FC<ComponentProps> = (props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [organisations, setOrganisations] = useState<any[]>((props?.organisations as any[]) || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrganisation, setSelectedOrganisation] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const loadOrganisations = () => {
    setIsLoading(true);
    getAllOrganisations()
      .then((res) => {
        setOrganisations(res || []);
      })
      .catch(() => {
        toast.error("Failed to load organizations");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadOrganisations();
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteOneOrganisation(deleteTarget.id);
      toast.success(`${deleteTarget.name} removed successfully`);
      setDeleteTarget(null);
      loadOrganisations();
    } catch (e: any) {
      toast.error(e.message || "Error while removing organization");
    }
  };

  const handleEdit = (org: any) => {
    setSelectedOrganisation(org);
    setShowEditDialog(true);
  };

  const handleUpdate = (updatedOrg: any) => {
    editOrganisation(updatedOrg.id, updatedOrg)
      .then(() => {
        toast.success(`${updatedOrg.name} updated successfully`);
        setShowEditDialog(false);
        setSelectedOrganisation(null);
        loadOrganisations();
      })
      .catch((e: any) => {
        toast.error(e.message || "Error while updating organization");
      });
  };

  const filteredOrganisations = useMemo(() => {
    if (!searchQuery.trim()) return organisations;
    const q = searchQuery.toLowerCase();
    return organisations.filter(
      (o) =>
        o.name?.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q) ||
        o.type?.toLowerCase().includes(q) ||
        o.city?.toLowerCase().includes(q)
    );
  }, [organisations, searchQuery]);

  const renderTableData = useMemo(() => {
    return filteredOrganisations.map((org) => {
      return (
        <tr key={org.id} onDoubleClick={() => handleEdit(org)}>
          <td>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Business fontSize="small" color="primary" />
              <Typography variant="body2" fontWeight="700" color="text.primary">
                {org.name}
              </Typography>
            </Box>
          </td>
          <td>
            <Chip
              label={org.type || "General"}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </td>
          <td>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
              {org.email && (
                <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.primary" }}>
                  <Email sx={{ fontSize: 13, color: "text.secondary" }} /> {org.email}
                </Typography>
              )}
              {org.phone && (
                <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
                  <Phone sx={{ fontSize: 13 }} /> {org.phone}
                </Typography>
              )}
              {!org.email && !org.phone && "-"}
            </Box>
          </td>
          <td>
            {org.city || org.country ? (
              <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.primary" }}>
                <LocationOn sx={{ fontSize: 15, color: "text.secondary" }} />
                {[org.city, org.country].filter(Boolean).join(", ")}
              </Typography>
            ) : (
              "-"
            )}
          </td>
          <td>{org.currency || "PKR"}</td>
          <td>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip title="Edit Organization">
                <IconButton size="small" color="primary" onClick={() => handleEdit(org)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove Organization">
                <IconButton size="small" color="error" onClick={() => setDeleteTarget(org)}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </td>
        </tr>
      );
    });
  }, [filteredOrganisations]);

  const tableHeadings = [
    "Organization Name",
    "Business Type",
    "Contact Details",
    "Location",
    "Currency",
    "Actions",
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Control / Search Toolbar */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search organizations by name, email, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 320 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />
          <Typography variant="body2" color="text.secondary">
            Showing <strong>{filteredOrganisations.length}</strong> of <strong>{organisations.length}</strong> organizations
          </Typography>
        </Box>
      </Paper>

      {/* Table Container */}
      <Table
        tableHeadings={tableHeadings}
        renderBody={renderTableData}
        loading={isLoading}
      />

      {/* Edit Organization Modal Dialog */}
      <Dialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
          <Business color="primary" /> Edit Organization: {selectedOrganisation?.name}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          {selectedOrganisation && (
            <OrganisationForm
              organisation={selectedOrganisation}
              onSubmit={handleUpdate}
              onCancel={() => setShowEditDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmber color="error" /> Confirm Removal
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently remove organization <strong>"{deleteTarget?.name}"</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            Delete Organization
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrganisationList;
