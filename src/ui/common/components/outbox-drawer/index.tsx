import React, { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  Sync as SyncIcon,
  CheckCircle,
  ErrorOutline,
  WarningAmber,
  DeleteOutline,
  Refresh,
  CloudOff,
  CloudDone,
} from "@mui/icons-material";
import { OutboxOperation, OutboxStatus } from "../../../../domain/models/OutboxOperation";
import { indexedDbOutboxRepository } from "../../../../repositories/IndexedDbOutboxRepository";
import { outboxSyncEngine } from "../../../../services/app/OutboxSyncEngine";
import { useSettings } from "../../../../context/SettingsContext";
import toast from "react-hot-toast";

export interface OutboxDrawerProps {
  open: boolean;
  onClose: () => void;
  tenantId: string;
}

export const OutboxDrawer: React.FC<OutboxDrawerProps> = ({ open, onClose, tenantId }) => {
  const { formatCurrency } = useSettings();
  const [operations, setOperations] = useState<OutboxOperation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);

  const loadOperations = async () => {
    setLoading(true);
    try {
      const items = await indexedDbOutboxRepository.getAll(tenantId);
      setOperations(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (_) {
      toast.error("Failed to load outbox operations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadOperations();
    }
  }, [open, tenantId]);

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const summary = await outboxSyncEngine.syncQueue(tenantId);
      toast.success(`Sync finished: ${summary.synced} synced, ${summary.conflicts + summary.failed} failed`);
      await loadOperations();
    } catch (e: any) {
      toast.error(e.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleRetrySingle = async (op: OutboxOperation) => {
    setSyncing(true);
    try {
      await outboxSyncEngine.retryOperation(op.operationId, tenantId);
      toast.success(`Retried ${op.localInvoiceNumber}`);
      await loadOperations();
    } catch (e: any) {
      toast.error(e.message || "Retry failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleDiscard = async (op: OutboxOperation) => {
    try {
      await indexedDbOutboxRepository.remove(op.operationId, tenantId);
      toast.success(`Discarded ${op.localInvoiceNumber}`);
      await loadOperations();
    } catch (_) {
      toast.error("Failed to discard operation");
    }
  };

  const handleClearSynced = async () => {
    try {
      const cleared = await indexedDbOutboxRepository.clearSynced(tenantId);
      toast.success(`Cleared ${cleared} synced operations`);
      await loadOperations();
    } catch (_) {
      toast.error("Failed to clear synced operations");
    }
  };

  const getStatusChip = (status: OutboxStatus) => {
    switch (status) {
      case "SYNCED":
        return <Chip size="small" icon={<CheckCircle />} label="Synced" color="success" />;
      case "SYNCING":
        return <Chip size="small" icon={<CircularProgress size={12} />} label="Syncing" color="info" />;
      case "CONFLICT":
        return <Chip size="small" icon={<WarningAmber />} label="Conflict" color="warning" />;
      case "FAILED":
      case "BLOCKED":
        return <Chip size="small" icon={<ErrorOutline />} label={status} color="error" />;
      default:
        return <Chip size="small" label="Pending Sync" color="default" />;
    }
  };

  const pendingCount = operations.filter((o) => o.status === "PENDING_SYNC" || o.status === "SYNCING").length;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: "100vw", sm: 460 }, p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
            <CloudDone color="primary" /> Offline Outbox Queue
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Durable queue of transactions saved locally while offline.
        </Typography>

        {/* Action Controls */}
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
            disabled={syncing || pendingCount === 0}
            onClick={handleSyncAll}
            fullWidth
          >
            {syncing ? "Syncing..." : `Sync Queue (${pendingCount})`}
          </Button>
          <Button variant="outlined" color="inherit" onClick={handleClearSynced} size="small">
            Clear Synced
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Operations List */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : operations.length === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, color: "text.secondary" }}>
            <CloudDone sx={{ fontSize: 48, mb: 1, color: "success.main" }} />
            <Typography variant="subtitle1" fontWeight="600">All Operations Synced</Typography>
            <Typography variant="body2">No pending offline transactions.</Typography>
          </Box>
        ) : (
          <List sx={{ flex: 1, overflowY: "auto", p: 0 }}>
            {operations.map((op) => (
              <ListItem
                key={op.operationId}
                sx={{
                  flexDirection: "column",
                  alignItems: "stretch",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  mb: 1.5,
                  p: 1.5,
                  backgroundColor: op.status === "CONFLICT" ? "warning.light" : op.status === "FAILED" ? "error.light" : "background.default",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight="700">
                    {op.localInvoiceNumber}
                  </Typography>
                  {getStatusChip(op.status)}
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Total: {formatCurrency(op.payload?.total || 0)} • Items: {op.payload?.products?.length || 0} • {new Date(op.createdAt).toLocaleTimeString()}
                </Typography>

                {op.conflictReason && (
                  <Alert severity="warning" sx={{ mt: 1, py: 0, px: 1, fontSize: "11px" }}>
                    <strong>Conflict:</strong> {op.conflictReason}
                  </Alert>
                )}

                {op.lastError && !op.conflictReason && (
                  <Alert severity="error" sx={{ mt: 1, py: 0, px: 1, fontSize: "11px" }}>
                    {op.lastError} (Attempt {op.attemptCount}/{op.maxRetries})
                  </Alert>
                )}

                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1 }}>
                  {(op.status === "FAILED" || op.status === "CONFLICT" || op.status === "PENDING_SYNC") && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<Refresh />}
                      onClick={() => handleRetrySingle(op)}
                      disabled={syncing}
                    >
                      Retry
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="text"
                    color="error"
                    startIcon={<DeleteOutline />}
                    onClick={() => handleDiscard(op)}
                  >
                    Discard
                  </Button>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
};

export default OutboxDrawer;
