import { createUseStyles } from "react-jss";

export const useStylesFromThemeFunction = createUseStyles({
  root: {
    display: "flex",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    overflow: "hidden",
    padding: "24px",
    margin: "24px 0",
    borderRadius: "8px",
    color: "var(--text-primary, #0f172a)",
    "@media (max-width: 899px)": {
      padding: "12px 8px",
      margin: "12px 0",
    },
    "@media (max-width: 599px)": {
      padding: "8px 4px",
      margin: "8px 0",
    },
  },
  title: {
    fontSize: "36px",
    fontWeight: "bold",
    lineHeight: "32px",
    fontFamily: "sans-serif",
    color: "var(--text-primary, #0f172a)",
    "@media (max-width: 899px)": {
      fontSize: "24px",
      lineHeight: "28px",
    },
    "@media (max-width: 599px)": {
      fontSize: "20px",
      lineHeight: "24px",
    },
  },
  addBtn: {
    fontSize: "22px",
    fontWeight: "bold",
    lineHeight: "24px",
    fontFamily: "sans-serif",
    color: "var(--primary-contrast, #ffffff)",
    border: "none",
    "@media (max-width: 899px)": {
      fontSize: "16px",
      lineHeight: "20px",
    },
    "@media (max-width: 599px)": {
      fontSize: "14px",
    },
  },
  headerWrapper: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    "@media (max-width: 599px)": {
      flexDirection: "column",
      alignItems: "stretch",
      gap: "12px",
    },
  },
  visibleConatiner: {
    display: "flex",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    overflow: "hidden",
    flexDirection: "column",
    justifyContent: "flex-end",
    gap: "24px",
    "@media (max-width: 899px)": {
      gap: "16px",
    },
  },
  listContainer: {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    borderRadius: "8px",
    boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.08))",
    backgroundColor: "var(--bg-paper, #ffffff)",
    overflow: "hidden",
  },
});
