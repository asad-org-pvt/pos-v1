import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import {
  Box,
  Button,
  Typography,
  Chip,
  Paper,
  Grid,
  LinearProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from "@mui/material";
import {
  UploadFile,
  FileDownload,
  CheckCircle,
  ErrorOutline,
  Warning,
  Refresh,
} from "@mui/icons-material";
import toast from "react-hot-toast";
import {
  parseCsv,
  generateSampleProductCsv,
  generateErrorCsv,
} from "../../../utils/csvParser";
import {
  bulkProductImportService,
  ImportValidationSummary,
  ImportExecutionResult,
} from "../../../services/app/BulkProductImportService";
import { productService } from "../../../services/app/ProductService";
import { categoryService } from "../../../services/app/CategoryService";
import { supplierService } from "../../../services/app/SupplierService";
import { exportService } from "../../../services/app/ExportService";
import { useAuth, useTenant } from "../../../context/AuthTenantContext";
import { useSettings } from "../../../context/SettingsContext";

interface BulkProductImportModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess?: () => void;
}

type Step = "UPLOAD" | "PREVIEW" | "IMPORTING" | "RESULT";

export const BulkProductImportModal: React.FC<BulkProductImportModalProps> = ({
  show,
  onHide,
  onSuccess,
}) => {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const { formatCurrency } = useSettings();

  const [step, setStep] = useState<Step>("UPLOAD");
  const [fileName, setFileName] = useState<string>("");
  const [validationSummary, setValidationSummary] = useState<ImportValidationSummary | null>(null);
  const [importMode, setImportMode] = useState<"CREATE_ONLY" | "CREATE_AND_UPDATE">("CREATE_ONLY");
  const [previewFilter, setPreviewFilter] = useState<"ALL" | "VALID" | "INVALID" | "DUPLICATE">("ALL");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [executionResult, setExecutionResult] = useState<ImportExecutionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const resetState = () => {
    setStep("UPLOAD");
    setFileName("");
    setValidationSummary(null);
    setImportMode("CREATE_ONLY");
    setPreviewFilter("ALL");
    setProgressPercent(0);
    setExecutionResult(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetState();
    onHide();
  };

  const handleDownloadSampleCsv = () => {
    const csvContent = generateSampleProductCsv();
    exportService.triggerCsvDownload(csvContent, "sample-product-import-template.csv");
    toast.success("Sample CSV template downloaded");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a valid CSV file (.csv)");
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);

    try {
      const text = await file.text();
      const { rawRows, errors } = parseCsv(text);

      if (errors.length > 0 && rawRows.length === 0) {
        toast.error(errors[0]);
        setIsProcessing(false);
        return;
      }

      // Fetch tenant catalog, categories, suppliers in parallel for validation
      const [catalog, categories, suppliers] = await Promise.all([
        productService.getProducts(tenantId),
        categoryService.getCategories(tenantId),
        supplierService.getSuppliers(tenantId),
      ]);

      const summary = bulkProductImportService.validateImportData(
        rawRows,
        catalog,
        categories,
        suppliers
      );

      setValidationSummary(summary);
      setStep("PREVIEW");
    } catch (err: any) {
      toast.error(err.message || "Failed to parse CSV file");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!validationSummary) return;

    setStep("IMPORTING");
    setProgressPercent(0);
    setIsProcessing(true);

    try {
      const result = await bulkProductImportService.executeBulkImport(
        validationSummary.rowResults,
        tenantId,
        user,
        { mode: importMode },
        (percent) => setProgressPercent(percent)
      );

      setExecutionResult(result);
      setStep("RESULT");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Import execution failed");
      setStep("PREVIEW");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadErrorCsv = () => {
    if (!executionResult || executionResult.failedRows.length === 0) return;
    const csvContent = generateErrorCsv(executionResult.failedRows);
    exportService.triggerCsvDownload(csvContent, "import-failed-rows.csv");
    toast.success("Error report CSV downloaded");
  };

  const filteredRowResults = validationSummary?.rowResults.filter((r) => {
    if (previewFilter === "ALL") return true;
    return r.status === previewFilter;
  });

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <UploadFile color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Bulk Product CSV Import
            </Typography>
          </Box>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body sx={{ p: 3 }}>
        {/* STEP 1: UPLOAD */}
        {step === "UPLOAD" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, textAlign: "center", py: 2 }}>
            <Paper
              sx={{
                p: 4,
                border: "2px dashed",
                borderColor: "primary.main",
                bgcolor: "background.default",
                borderRadius: 2,
                cursor: "pointer",
                "&:hover": { bgcolor: "action.hover" },
              }}
              component="label"
            >
              <input type="file" accept=".csv" hidden onChange={handleFileUpload} />
              <UploadFile sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                Click or Drag & Drop Product CSV File Here
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Supports standard comma-separated UTF-8 CSV files
              </Typography>
            </Paper>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "background.default", p: 2, borderRadius: 1 }}>
              <Box sx={{ textAlign: "left" }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Need a starting template?
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Download our sample CSV file formatted with all supported columns
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<FileDownload />}
                onClick={handleDownloadSampleCsv}
              >
                Download Sample CSV Template
              </Button>
            </Box>

            <Alert severity="info" sx={{ textAlign: "left" }}>
              <strong>Expected CSV Columns:</strong> Name (required), SKU, Barcode, Selling Price (required), Cost Price, Units In Stock, Min Threshold, Category, Supplier, Description.
            </Alert>
          </Box>
        )}

        {/* STEP 2: PREVIEW */}
        {step === "PREVIEW" && validationSummary && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* KPI Summary */}
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 1.5, textAlign: "center", bgcolor: "info.light", borderLeft: "4px solid", borderColor: "info.main" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">TOTAL ROWS</Typography>
                  <Typography variant="h5" fontWeight="bold">{validationSummary.totalRows}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 1.5, textAlign: "center", bgcolor: "success.light", borderLeft: "4px solid", borderColor: "success.main" }}>
                  <Typography variant="caption" color="success.main" fontWeight="bold">VALID NEW ITEMS</Typography>
                  <Typography variant="h5" fontWeight="bold" color="success.main">{validationSummary.validCount}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 1.5, textAlign: "center", bgcolor: "warning.light", borderLeft: "4px solid", borderColor: "warning.main" }}>
                  <Typography variant="caption" color="warning.main" fontWeight="bold">DUPLICATES IN CATALOG</Typography>
                  <Typography variant="h5" fontWeight="bold" color="warning.main">{validationSummary.duplicateCount}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 1.5, textAlign: "center", bgcolor: "error.light", borderLeft: "4px solid", borderColor: "error.main" }}>
                  <Typography variant="caption" color="error.main" fontWeight="bold">INVALID ROWS</Typography>
                  <Typography variant="h5" fontWeight="bold" color="error.main">{validationSummary.invalidCount}</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Options & Filter Bar */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mt: 1 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ fontSize: "12px", fontWeight: "bold" }}>
                  DUPLICATE HANDLING MODE
                </FormLabel>
                <RadioGroup
                  row
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value as any)}
                >
                  <FormControlLabel
                    value="CREATE_ONLY"
                    control={<Radio size="small" />}
                    label="Create Only (Skip existing items)"
                  />
                  <FormControlLabel
                    value="CREATE_AND_UPDATE"
                    control={<Radio size="small" />}
                    label="Create & Update (Update matching catalog items)"
                  />
                </RadioGroup>
              </FormControl>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant={previewFilter === "ALL" ? "contained" : "outlined"}
                  onClick={() => setPreviewFilter("ALL")}
                >
                  All ({validationSummary.totalRows})
                </Button>
                <Button
                  size="small"
                  color="success"
                  variant={previewFilter === "VALID" ? "contained" : "outlined"}
                  onClick={() => setPreviewFilter("VALID")}
                >
                  Valid ({validationSummary.validCount})
                </Button>
                <Button
                  size="small"
                  color="warning"
                  variant={previewFilter === "DUPLICATE" ? "contained" : "outlined"}
                  onClick={() => setPreviewFilter("DUPLICATE")}
                >
                  Duplicates ({validationSummary.duplicateCount})
                </Button>
                <Button
                  size="small"
                  color="error"
                  variant={previewFilter === "INVALID" ? "contained" : "outlined"}
                  onClick={() => setPreviewFilter("INVALID")}
                >
                  Errors ({validationSummary.invalidCount})
                </Button>
              </Box>
            </Box>

            {/* Preview Table */}
            <TableContainer sx={{ maxHeight: 340, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Row #</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Product Name</strong></TableCell>
                    <TableCell><strong>SKU</strong></TableCell>
                    <TableCell><strong>Barcode</strong></TableCell>
                    <TableCell align="right"><strong>Selling Price</strong></TableCell>
                    <TableCell align="right"><strong>Stock</strong></TableCell>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>Notes / Issues</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRowResults?.map((r) => (
                    <TableRow
                      key={r.rowNumber}
                      sx={{
                        bgcolor:
                          r.status === "INVALID"
                            ? "error.light"
                            : r.status === "DUPLICATE"
                            ? "warning.light"
                            : "inherit",
                      }}
                    >
                      <TableCell>{r.rowNumber}</TableCell>
                      <TableCell>
                        {r.status === "VALID" && <Chip label="VALID" color="success" size="small" />}
                        {r.status === "DUPLICATE" && <Chip label="DUPLICATE" color="warning" size="small" />}
                        {r.status === "INVALID" && <Chip label="INVALID" color="error" size="small" />}
                      </TableCell>
                      <TableCell><strong>{r.productData.name || "-"}</strong></TableCell>
                      <TableCell>{r.productData.sku || "-"}</TableCell>
                      <TableCell>{r.productData.barcode || "-"}</TableCell>
                      <TableCell align="right">{formatCurrency(r.productData.unitPrice)}</TableCell>
                      <TableCell align="right">{r.productData.unitsInStock || 0}</TableCell>
                      <TableCell>{r.productData.category || "-"}</TableCell>
                      <TableCell>
                        {r.errors.length > 0 ? (
                          <Typography variant="caption" color="error.main" sx={{ display: "block", fontWeight: "bold" }}>
                            {r.errors.join("; ")}
                          </Typography>
                        ) : r.warnings.length > 0 ? (
                          <Typography variant="caption" color="warning.main" sx={{ display: "block" }}>
                            {r.warnings.join("; ")}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="success.main">
                            Ready to import
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* STEP 3: IMPORTING PROGRESS */}
        {step === "IMPORTING" && (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Importing Products to Catalog & Updating Stock Ledger...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Writing documents and generating opening balance movements in batched transactions.
            </Typography>
            <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 10, borderRadius: 5, mb: 1 }} />
            <Typography variant="subtitle2" fontWeight="bold">
              {progressPercent}% Complete
            </Typography>
          </Box>
        )}

        {/* STEP 4: RESULT */}
        {step === "RESULT" && executionResult && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, textAlign: "center", py: 2 }}>
            <Box>
              {executionResult.failed === 0 ? (
                <CheckCircle color="success" sx={{ fontSize: 56, mb: 1 }} />
              ) : (
                <Warning color="warning" sx={{ fontSize: 56, mb: 1 }} />
              )}
              <Typography variant="h5" fontWeight="bold">
                {executionResult.failed === 0 ? "Import Completed Successfully!" : "Import Completed with Some Errors"}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, bgcolor: "success.light" }}>
                  <Typography variant="caption" color="success.main" fontWeight="bold">CREATED</Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">{executionResult.created}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, bgcolor: "info.light" }}>
                  <Typography variant="caption" color="primary" fontWeight="bold">UPDATED</Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary">{executionResult.updated}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, bgcolor: "background.default" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">SKIPPED</Typography>
                  <Typography variant="h4" fontWeight="bold" color="text.secondary">{executionResult.skipped}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, bgcolor: "error.light" }}>
                  <Typography variant="caption" color="error.main" fontWeight="bold">FAILED</Typography>
                  <Typography variant="h4" fontWeight="bold" color="error.main">{executionResult.failed}</Typography>
                </Paper>
              </Grid>
            </Grid>

            {executionResult.failed > 0 && (
              <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<FileDownload />}
                  onClick={handleDownloadErrorCsv}
                >
                  Download Error CSV ({executionResult.failed} Failed Rows)
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Modal.Body>

      <Modal.Footer>
        {step === "PREVIEW" && (
          <>
            <Button variant="outlined" onClick={() => setStep("UPLOAD")} disabled={isProcessing}>
              Re-upload File
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={
                isProcessing ||
                (validationSummary?.validCount === 0 &&
                  (importMode === "CREATE_ONLY" || validationSummary?.duplicateCount === 0))
              }
              onClick={handleExecuteImport}
            >
              Confirm & Import ({importMode === "CREATE_ONLY" ? validationSummary?.validCount : (validationSummary?.validCount || 0) + (validationSummary?.duplicateCount || 0)} Products)
            </Button>
          </>
        )}

        {step === "RESULT" && (
          <Button variant="contained" color="primary" onClick={handleClose}>
            Done
          </Button>
        )}

        {step === "UPLOAD" && (
          <Button variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default BulkProductImportModal;
