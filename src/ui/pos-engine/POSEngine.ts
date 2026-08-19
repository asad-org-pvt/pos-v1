import { createUseStyles } from "react-jss";
import { ThemeInterface } from "../../interfaces/theme";

export interface ComponentProps {
  label?: string;
  options?: { value: any; label: string | undefined }[];
  isLoading?: boolean;
  products?: any[];
  disabled?: boolean;
}

export const useStylesFromThemeFunction = createUseStyles(
  (theme: ThemeInterface) => {
    return {
      container: {
        width: "100%",
        height: "100vh",
        maxHeight: "100vh",
        display: "flex",
        flexDirection: "row",
        backgroundColor: "var(--bg-default, #f8fafc)",
        color: "var(--text-primary, #0f172a)",
        overflow: "hidden",
        boxSizing: "border-box",
        padding: "6px",
        gap: "6px",
      },
      innerContainerLeft: {
        flex: "1 1 60%",
        minWidth: "460px",
        height: "calc(100vh - 12px)",
        maxHeight: "calc(100vh - 12px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        padding: "10px",
        borderRadius: "10px",
        backgroundColor: "var(--bg-surface, #f1f5f9)",
        border: "1px solid var(--border-color, rgba(0,0,0,0.06))",
        gap: "8px",
        overflowY: "auto",
        boxSizing: "border-box",
      },
      innerContainerRight: {
        flex: "0 0 390px",
        width: "390px",
        maxWidth: "420px",
        height: "calc(100vh - 12px)",
        maxHeight: "calc(100vh - 12px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        padding: "0",
        borderRadius: "10px",
        boxSizing: "border-box",
      },
      productSearchContainer: {
        width: "100%",
        position: "relative",
        top: 0,
        left: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "5px",
        margin: "5px",
        borderRadius: "5px",
        backgroundColor: "var(--bg-paper, #ffffff)",
        border: "1px solid var(--border-color, rgba(0,0,0,0.06))",
      },
      productSuggestionContainer: {
        width: "100%",
        flex: "1 1 0",
        minHeight: "150px",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        padding: "8px",
        borderRadius: "8px",
        backgroundColor: "var(--bg-paper, #ffffff)",
        border: "1px solid var(--border-color, rgba(0,0,0,0.06))",
        overflowY: "auto",
        boxSizing: "border-box",
      },
      addedProductsContainer: {
        width: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "var(--bg-surface, #f1f5f9)",
      },
      totalBillContainer: {
        width: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: "5px",
        padding: "5px",
        backgroundColor: "var(--bg-paper, #ffffff)",
      },
      row: {
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        width: "100%",
      },
      column: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        width: "100%",
      },
      equallyDistantRow: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        width: "100%",
      },
      buttonsContainer: {
        width: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "row",
      },
      iconWrapper: {
        width: "20px",
        height: "20px",
        cursor: "pointer",
      },
      colorRed: {
        color: "var(--error, #dc2626)",
      },
      qualtityButtonWrapper: {
        width: "30px",
        height: "20px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
      },
      centeredRow: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "100%",
      },
    };
  }
);

interface CustomStyle {
  variant?: "primary" | "secondary";
  isFocus: boolean;
  isError: boolean;
  isTouched?: boolean;
}

export const customStyles = ({
  variant,
  isFocus,
  isError,
  isTouched,
}: CustomStyle) => {
  const color = () => {
    if (isTouched && !isError) {
      return "var(--success, #16a34a)";
    }
    if (isError) {
      return "var(--error, #dc2626)";
    }
    if (isFocus) {
      return "var(--primary-color, #0d6efd)";
    }

    return "var(--border-color, rgba(0,0,0,0.15))";
  };
  return {
    control: (base: any, state: { isFocused: any }) => ({
      ...base,
      background: variant === "primary" ? "var(--input-bg, #ffffff)" : "var(--bg-surface, #f1f5f9)",
      color: "var(--text-primary, #0f172a)",
      borderRadius: 10,
      height: 42,
      border: `1px solid ${color()}`,
      boxShadow: "none",
    }),
    menuList: (base: any) => ({
      ...base,
      padding: 0,
      borderRadius: 10,
      backgroundColor: "var(--bg-paper, #ffffff)",
      color: "var(--text-primary, #0f172a)",
      "&:focus": {
        outline: "0px",
        borderRadius: "10px",
        border: `var(--primary-color, #0d6efd) 1px solid`,
        backgroundColor: "var(--bg-paper, #ffffff)",
      },
    }),
    menu: (base: any) => ({
      ...base,
      borderRadius: 10,
      backgroundColor: "var(--bg-paper, #ffffff)",
      border: "1px solid var(--border-color, rgba(0,0,0,0.12))",
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: "var(--text-secondary, #64748b)",
      "&:hover": {
        color: "var(--text-primary, #0f172a)",
      },
    }),
    option: (base: any, state: { isSelected: any }) => ({
      ...base,
      backgroundColor: state.isSelected ? "var(--primary-color, #0d6efd)" : "transparent",
      color: state.isSelected ? "#ffffff" : "var(--text-primary, #0f172a)",
      "&:hover": { backgroundColor: !state.isSelected && "var(--bg-surface-hover, rgba(0,0,0,0.06))" },
      ":active": {
        ...base[":active"],
        backgroundColor: "var(--bg-surface-hover, rgba(0,0,0,0.06))",
      },
    }),
    valueContainer: (base: any) => ({
      ...base,
      color: "var(--text-primary, #0f172a)",
    }),
  };
};
