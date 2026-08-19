import { createUseStyles } from "react-jss";
import { ThemeInterface } from "../../../../interfaces/theme";

export const useStylesFromThemeFunction = createUseStyles(
  (theme: ThemeInterface) => {
    return {
      container: {
        display: "flex",
      },
      label: {
        fontSize: 13,
        fontWeight: 600,
        color: "var(--text-secondary, #64748b)",
      },
      value: {
        fontSize: 75,
        fontWeight: 150,
        marginTop: -25,
        color: "var(--primary-color, #0d6efd)",
      },
      containerColumn: {
        flexDirection: "column",
      },
      containerRow: {
        alignItems: "center",
      },
      labelRow: {
        marginRight: 8,
      },
    };
  }
);
