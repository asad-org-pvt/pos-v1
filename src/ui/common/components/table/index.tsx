import LoadingSpinner from "../loading-spinner";
import React, { FC } from "react";
import { ThemeInterface } from "../../../../interfaces/theme";
import { createUseStyles } from "react-jss";

const useStylesFromThemeFunction = createUseStyles((theme: ThemeInterface) => {
  return {
    scrollWrapper: {
      width: "100%",
      maxWidth: "100%",
      minWidth: 0,
      display: "block",
      overflowX: "auto",
      overflowY: "hidden",
      WebkitOverflowScrolling: "touch",
      boxSizing: "border-box",
      "&::-webkit-scrollbar": {
        height: 6,
      },
      "&::-webkit-scrollbar-thumb": {
        backgroundColor: "var(--border-color, #cbd5e1)",
        borderRadius: 3,
      },
    },
    klaimTable: {
      borderCollapse: "collapse",
      position: "relative",
      width: "100%",
      minWidth: "700px",
      backgroundColor: "var(--bg-paper, #ffffff)",
      color: "var(--text-primary, #0f172a)",
      borderRadius: "8px",
      "@media (max-width: 899px)": {
        fontSize: "13px",
        minWidth: "650px",
      },
      "@media (max-width: 599px)": {
        fontSize: "12px",
        minWidth: "600px",
      },
    },
    klaimTableLoader: {
      alignItems: "center",
      display: "flex",
      justifyContent: "center",
      paddingTop: 20,
      paddingBottom: 20,
      width: "100%",
    },
    klaimTbody: {
      "& td": {
        "&:first-child": {
          paddingLeft: 22,
        },
        height: 52,
        padding: "0",
        color: "var(--text-primary, #0f172a)",
        "@media (max-width: 899px)": {
          height: 44,
          paddingLeft: "8px",
          paddingRight: "8px",
          "&:first-child": {
            paddingLeft: 12,
          },
        },
      },
      "& tr": {
        boxShadow: "0px -1px 0px var(--border-color, rgba(0, 0, 0, 0.08)) inset",
        height: 52,
        MozBoxShadow: "0px -1px 0px var(--border-color, rgba(0, 0, 0, 0.08)) inset",
        WebkitBoxShadow: "0px -1px 0px var(--border-color, rgba(0, 0, 0, 0.08)) inset",
        "&:hover": {
          backgroundColor: "var(--bg-surface-hover, rgba(0, 0, 0, 0.02))",
        },
        "@media (max-width: 899px)": {
          height: 44,
        },
      },
    },
    klaimTd: {
      height: 52,
      padding: 0,
      color: "var(--text-primary, #0f172a)",
    },
    klaimTh: {
      "&:first-child": {
        paddingLeft: 22,
      },
      fontSize: 14,
      fontWeight: 700,
      paddingBottom: 16,
      paddingTop: 16,
      textAlign: "left",
      color: "var(--text-secondary, #64748b)",
      whiteSpace: "nowrap",
      "@media (max-width: 899px)": {
        fontSize: 12,
        paddingBottom: 10,
        paddingTop: 10,
        paddingLeft: 8,
        paddingRight: 8,
        "&:first-child": {
          paddingLeft: 12,
        },
      },
    },
    klaimThead: {
      borderBottom: "1px solid var(--border-color, rgba(0, 0, 0, 0.08))",
      backgroundColor: "var(--bg-surface, #f1f5f9)",
      "& td": {
        boxShadow: "-1px 0px 0px var(--border-color, rgba(0, 0, 0, 0.08)) inset",
        height: 52,
        MozBoxShadow: "-1px 0px 0px var(--border-color, rgba(0, 0, 0, 0.08)) inset",
        WebkitBoxShadow: "-1px 0px 0px var(--border-color, rgba(0, 0, 0, 0.08)) inset",
      },
    },
  };
});

interface ComponentProps {
  tableHeadings: String[];
  renderBody: any;
  loading?: boolean;
}

const Table: FC<ComponentProps> = ({
  tableHeadings,
  renderBody = null,
  loading,
}) => {
  const classes = useStylesFromThemeFunction();
  return (
    <div className={classes.scrollWrapper}>
      <table className={classes.klaimTable}>
        <thead className={classes.klaimThead}>
          <tr>
            {tableHeadings.map((title, index) => (
              <th key={index} className={classes.klaimTh}>
                {title}
              </th>
            ))}
          </tr>
        </thead>
        {loading ? (
          <tbody>
            <tr>
              <td colSpan={tableHeadings.length} style={{ textAlign: "center", padding: "30px 0" }}>
                <div className={classes.klaimTableLoader}>
                  <LoadingSpinner />
                </div>
              </td>
            </tr>
          </tbody>
        ) : (
          <tbody className={classes.klaimTbody}>
            {renderBody ? renderBody : ""}
          </tbody>
        )}
      </table>
    </div>
  );
};

export default Table;
