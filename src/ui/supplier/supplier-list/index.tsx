import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Chip,
  Typography,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
} from "@mui/material";
import {
  Search,
  Refresh,
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
} from "@mui/icons-material";
import toast from "react-hot-toast";
import { getAllSuppliers, editSupplier, deleteOneSupplier } from "../../../parser/supplier";
import SupplierForm from "../supplier-form";

interface ComponentProps {
  suppliers?: any[];
  onAddSupplierClick?: () => void;
}

const SupplierList: React.FC<ComponentProps> = (props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>((props?.suppliers as any[]) || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Edit and Delete Modals
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<any>(null);

  const loadSuppliers = () => {
    setIsLoading(true);
    getAllSuppliers()
      .then((res) => {
        setSuppliers(res || []);
      })
      .catch(() => {
        toast.error("Failed to load suppliers");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await deleteOneSupplier(deleteCandidate.id);
      toast.success(`Supplier "${deleteCandidate.name}" removed successfully`);
      setDeleteCandidate(null);
      loadSuppliers();
    } catch (e: any) {
      toast.error(e.message || "Error while removing supplier");
    }
  };

  const handleUpdate = (updatedSupplier: any) => {
    editSupplier(updatedSupplier.id, updatedSupplier)
      .then(() => {
        toast.success(`Supplier "${updatedSupplier.name}" updated successfully`);
        setShowEditDialog(false);
        setSelectedSupplier(null);
        loadSuppliers();
      })
      .catch((e: any) => {
        toast.error(e.message || "Error while updating supplier");
      });
  };

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((sup) => {
      const q = searchQuery.toLowerCase();
      return (
        !searchQuery.trim() ||
        sup.name?.toLowerCase().includes(q) ||
        sup.companyName?.toLowerCase().includes(q) ||
        sup.email?.toLowerCase().includes(q) ||
        sup.companyEmail?.toLowerCase().includes(q) ||
        sup.mainContactName?.toLowerCase().includes(q) ||
        sup.phoneNumber?.toLowerCase().includes(q) ||
        sup.companyPhoneNumber?.toLowerCase().includes(q) ||
        sup.industry?.toLowerCase().includes(q) ||
        sup.country?.toLowerCase().includes(q)
      );
    });
  }, [suppliers, searchQuery]);

  const displayedSuppliers = useMemo(() => {
    return filteredSuppliers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredSuppliers, page, rowsPerPage]);

  return (
    <Box sx={{ width: "100%" }}>
      {/* SEARCH BAR */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
          justifyContent: "space-between",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        <TextField
          size="small"
          placeholder="Search suppliers by vendor name, contact person, industry, email..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: { xs: "100%", sm: 340 }, flex: 1 }}
        />

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh supplier list">
            <IconButton onClick={loadSuppliers} disabled={isLoading} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* SUPPLIERS TABLE */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}
      >
        <Table size="medium">
          <TableHead sx={{ bgcolor: "action.hover" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Vendor / Company</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Primary Contact</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Industry / Category</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Location</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "right" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Loading suppliers...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : displayedSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery ? "No suppliers matching search criteria." : "No suppliers registered yet."}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayedSuppliers.map((sup) => {
                const initials = sup.name
                  ? sup.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "S";

                const isActive = sup.isActive !== undefined ? sup.isActive : true;

                return (
                  <TableRow
                    key={sup.id}
                    hover
                    sx={{ "&:hover": { bgcolor: "action.hover" } }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          sx={{
                            bgcolor: "secondary.main",
                            color: "secondary.contrastText",
                            width: 38,
                            height: 38,
                            fontSize: "0.875rem",
                            fontWeight: "bold",
                          }}
                        >
                          {initials}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                            {sup.name || sup.companyName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {sup.companyEmail || sup.email || sup.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight="500" color="text.primary">
                        {sup.mainContactName || "General Contact"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {sup.mainContactPhoneNumber || sup.companyPhoneNumber || sup.phoneNumber || "-"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={sup.industry || "Retail Wholesale"}
                        variant="outlined"
                        sx={{ fontSize: "0.75rem" }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.primary">
                        {sup.city ? `${sup.city}, ` : ""}{sup.country || "-"}
                      </Typography>
                      {sup.address && (
                        <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 180 }}>
                          {sup.address}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={isActive ? "Active" : "Inactive"}
                        color={isActive ? "success" : "default"}
                        sx={{ fontWeight: "600" }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                        <Tooltip title="Edit Supplier">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setSelectedSupplier(sup);
                              setShowEditDialog(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Remove Supplier">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteCandidate(sup)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredSuppliers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* EDIT MODAL DIALOG */}
      <Dialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold", borderBottom: "1px solid", borderColor: "divider" }}>
          Edit Supplier: {selectedSupplier?.name || selectedSupplier?.companyName}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedSupplier && (
            <SupplierForm supplier={selectedSupplier} onSubmit={handleUpdate} />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={() => setShowEditDialog(false)} color="inherit">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog
        open={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>Confirm Removal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove supplier <strong>{deleteCandidate?.name}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteCandidate(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Remove Supplier
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupplierList;
