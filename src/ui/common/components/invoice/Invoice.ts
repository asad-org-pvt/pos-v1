import { createUseStyles } from "react-jss";
import { ThemeInterface } from "../../../../interfaces/theme";

export interface ComponentProps {
  label?: string;
  options?: { value: any; label: string | undefined }[];
  isLoading?: boolean;
  products: any[];
  handleCancel?: () => void;
  handleConfirm?: () => void;
  handlePrint?: () => void;
  disabled?: boolean;
  invoiceNumber?: string;
}

export const useStylesFromThemeFunction = createUseStyles(
  (theme: ThemeInterface) => {
    return {
      totalBillContainer: {
        width: "100%",
        height: "100%",
        maxHeight: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: "8px",
        borderRadius: "10px",
        padding: "12px",
        backgroundColor: "var(--bg-paper, #ffffff)",
        color: "var(--text-primary, #0f172a)",
        boxShadow: "var(--shadow-sm, 0 2px 10px rgba(0, 0, 0, 0.05))",
        border: "1px solid var(--border-color, rgba(0, 0, 0, 0.08))",
        boxSizing: "border-box",
        overflow: "hidden",
      },
      headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: "4px",
        borderBottom: "1px solid var(--divider, rgba(0, 0, 0, 0.08))",
      },
      title: {
        fontSize: "18px",
        fontWeight: "700",
        margin: 0,
        color: "var(--text-primary, #0f172a)",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      },
      title2: {
        color: "var(--primary-color, #0d6efd)",
        fontSize: "14px",
        fontWeight: "600",
      },
      productsList: {
        flex: "1 1 0",
        minHeight: "100px",
        overflowY: "auto",
        width: "100%",
        borderRadius: "6px",
        border: "1px solid var(--border-color, rgba(0, 0, 0, 0.08))",
        backgroundColor: "var(--bg-surface, #f8fafc)",
      },
      noData: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        padding: "24px 0",
        justifyContent: "center",
        alignItems: "center",
        color: "var(--text-secondary, #94a3b8)",
        fontSize: "13px",
      },
      amountHero: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        backgroundColor: "var(--bg-surface, #f8fafc)",
        borderRadius: "8px",
        border: "1px solid var(--border-color, rgba(0, 0, 0, 0.08))",
      },
      amountLabel: {
        fontSize: "13px",
        fontWeight: "600",
        color: "var(--text-secondary, #64748b)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      },
      amountValue: {
        fontSize: "24px",
        fontWeight: "800",
        color: "var(--text-primary, #0f172a)",
      },
      breakdownBox: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        padding: "10px 12px",
        backgroundColor: "var(--bg-surface, #f8fafc)",
        borderRadius: "8px",
        border: "1px solid var(--border-color, rgba(0, 0, 0, 0.08))",
      },
      breakdownRow: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "13px",
        color: "var(--text-secondary, #64748b)",
      },
      breakdownRowBold: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "14px",
        fontWeight: "700",
        color: "var(--text-primary, #0f172a)",
        borderTop: "1px dashed var(--divider, rgba(0, 0, 0, 0.12))",
        paddingTop: "6px",
        marginTop: "2px",
      },
      buttonsContainer: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1.5fr",
        gap: "8px",
        marginTop: "auto",
        paddingTop: "6px",
      },
    };
  }
);
