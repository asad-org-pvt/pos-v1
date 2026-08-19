import { createUseStyles } from "react-jss";

export const useStyles = createUseStyles({
  iconWrapper: {
    height: 64,
    width: 64,
    borderRadius: 4,
    border: "1px solid var(--primary-color, #0d6efd)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--primary-color, #0d6efd)",
    borderColor: "var(--primary-color, #0d6efd)",
    "& svg path": {
      fill: "#ffffff",
    },
  },
  status: {
    borderRadius: 100,
    minWidth: "auto",
    fontSize: 14,
    height: 30,
  },
  statusBadge: {
    margin: "0 0 24px 88px",
  },
  row: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 24,
  },
  row1: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  root: {
    "& .MuiBackdrop-root": {
      backgroundColor: "var(--overlay, rgba(0, 0, 0, 0.5))",
    },
  },
  formRoot: {
    "& .MuiDrawer-paper": {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "stretch",
      backgroundColor: "var(--bg-paper, #ffffff)",
      color: "var(--text-primary, #0f172a)",
    },
  },
  vertical: {
    "& .MuiDrawer-paper": {
      boxShadow: "var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))",
      width: "90%",
      maxWidth: 590,
      height: "100%",
      backgroundColor: "var(--bg-paper, #ffffff)",
      color: "var(--text-primary, #0f172a)",
    },
  },
  horizontal: {
    "& .MuiDrawer-paper": {
      boxShadow: "var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))",
      width: "100%",
      maxHeight: 390,
      height: "90%",
      backgroundColor: "var(--bg-paper, #ffffff)",
      color: "var(--text-primary, #0f172a)",
    },
  },

  drawerHeader: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--border-color, rgba(0, 0, 0, 0.08))",
    height: 80,
    padding: 24,
    backgroundColor: "var(--bg-paper, #ffffff)",
    color: "var(--text-primary, #0f172a)",
  },
  bigDrawerHeader: {
    height: 108,
  },
  biggerDrawerHeader: {
    height: 152,
  },
  drawerFooter: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid var(--border-color, rgba(0, 0, 0, 0.08))",
    height: 80,
    padding: 24,
    backgroundColor: "var(--bg-paper, #ffffff)",
  },
  closeIcon: {
    width: 24,
    height: 24,
    color: "var(--primary-color, #0d6efd)",
    cursor: "pointer",
  },
  drawerCancelBtn: {
    padding: 0,
    color: "var(--text-secondary, #64748b)",
    fontSize: 14,
    fontWeight: 700,
    minWidth: 48,
    height: 48,
  },
  drawerUpdateBtn: {
    height: 48,
    padding: "12px 20px",
    minWidth: 97,
  },
  drawerBody: {
    padding: 40,
    backgroundColor: "var(--bg-paper, #ffffff)",
    color: "var(--text-primary, #0f172a)",
  },
  headSubTitle: {
    marginTop: 4,
    lineHeight: "24px",
    color: "var(--text-secondary, #64748b)",
    display: "inline-block",
  },
  headTitle: {
    margin: 0,
    lineHeight: "32px",
    color: "var(--text-primary, #0f172a)",
  },
  headTitleSmall: {
    margin: 0,
    lineHeight: "32px",
    color: "var(--text-primary, #0f172a)",
    fontSize: "18px",
  },
  topContentWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    marginTop: 24,
  },
  topContentWrapper1: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  topContentWrapperfortitle: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  subtitleComponent: {
    marginTop: 16,
  },
  narrowHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
});
