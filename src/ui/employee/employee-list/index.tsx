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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from "@mui/material";
import {
  Search,
  Refresh,
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
} from "@mui/icons-material";
import toast from "react-hot-toast";
import { getAllEmployees, editEmployee, deleteOneEmployee } from "../../../parser/employee";
import EmployeeForm from "../employee-form";

interface ComponentProps {
  employees?: any[];
  onAddEmployeeClick?: () => void;
}

const EmployeeList: React.FC<ComponentProps> = (props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>((props?.employees as any[]) || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Edit and Delete Modals
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<any>(null);

  const loadEmployees = () => {
    setIsLoading(true);
    getAllEmployees()
      .then((res) => {
        setEmployees(res || []);
      })
      .catch(() => {
        toast.error("Failed to load employees");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await deleteOneEmployee(deleteCandidate.id);
      toast.success(`Staff member "${deleteCandidate.name}" removed`);
      setDeleteCandidate(null);
      loadEmployees();
    } catch (e: any) {
      toast.error(e.message || "Error removing staff member");
    }
  };

  const handleUpdate = (updatedEmployee: any) => {
    editEmployee(updatedEmployee.id, updatedEmployee)
      .then(() => {
        toast.success(`Staff member "${updatedEmployee.name}" updated successfully`);
        setShowEditDialog(false);
        setSelectedEmployee(null);
        loadEmployees();
      })
      .catch((e: any) => {
        toast.error(e.message || "Error while updating employee");
      });
  };

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        !searchQuery.trim() ||
        emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept =
        departmentFilter === "ALL" ||
        emp.department?.toLowerCase() === departmentFilter.toLowerCase();

      const isActive = emp.isActive !== undefined ? emp.isActive : emp.active === "active" || emp.active === true;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && isActive) ||
        (statusFilter === "INACTIVE" && !isActive);

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchQuery, departmentFilter, statusFilter]);

  const displayedEmployees = useMemo(() => {
    return filteredEmployees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredEmployees, page, rowsPerPage]);

  return (
    <Box sx={{ width: "100%" }}>
      {/* SEARCH AND FILTERS BAR */}
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
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", flex: 1, minWidth: 280 }}>
          <TextField
            size="small"
            placeholder="Search staff by name, email, phone, role..."
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
            sx={{ minWidth: { xs: "100%", sm: 260 }, flex: 1 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="dept-filter-label">Department</InputLabel>
            <Select
              labelId="dept-filter-label"
              label="Department"
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="ALL">All Departments</MenuItem>
              <MenuItem value="Cash Counter">Cash Counter</MenuItem>
              <MenuItem value="Sales">Sales</MenuItem>
              <MenuItem value="Inventory">Inventory</MenuItem>
              <MenuItem value="Purchasing">Purchasing</MenuItem>
              <MenuItem value="Management">Management</MenuItem>
              <MenuItem value="Accounts">Accounts</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh employee list">
            <IconButton onClick={loadEmployees} disabled={isLoading} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* EMPLOYEES TABLE */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}
      >
        <Table size="medium">
          <TableHead sx={{ bgcolor: "action.hover" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Staff Member</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Role / Designation</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Department</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: "bold", textAlign: "right" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Loading staff members...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : displayedEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery || departmentFilter !== "ALL" || statusFilter !== "ALL"
                      ? "No staff members matching criteria."
                      : "No staff members registered yet."}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayedEmployees.map((emp) => {
                const isActive = emp.isActive !== undefined ? emp.isActive : emp.active === "active" || emp.active === true;
                const initials = emp.name
                  ? emp.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "E";

                const roleName = emp.role || (emp.isAdmin ? "ADMIN" : "EMPLOYEE");

                return (
                  <TableRow
                    key={emp.id}
                    hover
                    sx={{ "&:hover": { bgcolor: "action.hover" } }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          sx={{
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
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
                            {emp.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {emp.email || emp.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                        <Typography variant="body2" fontWeight="500" color="text.primary">
                          {emp.designation || emp.jobTitle || "Staff"}
                        </Typography>
                        <Box>
                          <Chip
                            size="small"
                            label={roleName}
                            color={roleName === "ADMIN" ? "error" : roleName === "ORGANISATION" ? "secondary" : "default"}
                            variant="outlined"
                            sx={{ fontSize: "0.7rem", height: 20 }}
                          />
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {emp.department || "Front Desk"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.primary">
                        {emp.phoneNumber || "-"}
                      </Typography>
                      {emp.city && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {emp.city}
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
                        <Tooltip title="Edit Staff Member">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setShowEditDialog(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Remove Staff Member">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteCandidate(emp)}
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
          count={filteredEmployees.length}
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
          Edit Staff Member: {selectedEmployee?.name}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedEmployee && (
            <EmployeeForm employee={selectedEmployee} onSubmit={handleUpdate} />
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
            Are you sure you want to remove staff member <strong>{deleteCandidate?.name}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteCandidate(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Remove Staff
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeList;
