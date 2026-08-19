import LoadingSpinner from "../loading-spinner";
import React, { FC, ReactElement } from "react";
import { ThemeInterface } from "../../../../interfaces/theme";
import { createUseStyles } from "react-jss";

const useStylesFromThemeFunction = createUseStyles((theme: ThemeInterface) => {
  return {
    klaimTable: {
      borderCollapse: "collapse",
      position: "relative",
      width: "100%",
      backgroundColor: "var(--bg-paper, #ffffff)",
      color: "var(--text-primary, #0f172a)",
      borderRadius: "8px",
      overflow: "hidden",
    },
    klaimTableLoader: {
      alignItems: "center",
      display: "flex",
      justifyContent: "center",
      left: "0",
      paddingTop: 40,
      position: "absolute",
      right: "0",
    },
    klaimTbody: {
      "& td": {
        "&:first-child": {
          paddingLeft: 22,
        },
        height: 52,
        padding: "0",
        color: "var(--text-primary, #0f172a)",
      },
      "& tr": {
        boxShadow: "0px -1px 0px var(--border-color, rgba(0, 0, 0, 0.08)) inset",
        height: 52,
        MozBoxShadow: "0px -1px 0px var(--border-color, rgba(0, 0, 0, 0.08)) inset",
        WebkitBoxShadow: "0px -1px 0px var(--border-color, rgba(0, 0, 0, 0.08)) inset",
        "&:hover": {
          backgroundColor: "var(--bg-surface-hover, rgba(0, 0, 0, 0.02))",
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
        <div className={classes.klaimTableLoader}>
          <LoadingSpinner />
        </div>
      ) : (
        <tbody className={classes.klaimTbody}>
          {renderBody ? renderBody : ""}
        </tbody>
      )}
    </table>
  );
};

export default Table;
