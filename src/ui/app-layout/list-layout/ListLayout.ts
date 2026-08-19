import { createUseStyles } from "react-jss";

export const useStylesFromThemeFunction = createUseStyles({
  root: {
    display: "flex",
    padding: "24px",
    margin: "24px",
    borderRadius: "8px",
    color: "var(--text-primary, #0f172a)",
  },
  title: {
    fontSize: "36px",
    fontWeight: "bold",
    lineHeight: "32px",
    fontFamily: "sans-serif",
    color: "var(--text-primary, #0f172a)",
  },
  addBtn: {
    fontSize: "22px",
    fontWeight: "bold",
    lineHeight: "24px",
    fontFamily: "sans-serif",
    color: "var(--primary-contrast, #ffffff)",
    border: "none",
  },
  headerWrapper: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  visibleConatiner: {
    display: "flex",
    width: "100%",
    flexDirection: "column",
    justifyContent: "flex-end",
    gap: "24px",
  },
  listContainer: {
    borderRadius: "8px",
    boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.08))",
    backgroundColor: "var(--bg-paper, #ffffff)",
  },
});
