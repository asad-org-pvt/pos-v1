import React from "react";
import { createUseStyles } from "react-jss";
import { ThemeInterface } from "../../../../interfaces/theme";
import { btnType } from "./ButtonComponent.types";
import LoadingSpinner from "../loading-spinner";

export enum btnSize {
  S = "S",
  M = "M",
  L = "L",
  VARIABLE = "V",
}
interface ComponentProps {
  children?: any;
  variant?: btnType;
  onClick?: () => void;
  isLoading?: boolean;
  size?: btnSize;
  type?: "button" | "submit";
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
}

const useStylesFromThemeFunction = createUseStyles((theme: ThemeInterface) => {
  return {
    btnContent: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    btnLoader: {
      alignItems: "center",
      display: "flex",
      justifyContent: "center",
    },
    default: {
      padding: "8px",
      paddingTop: 5,
      minWidth: 5,
      minHeight: 5,
      borderRadius: 6,
      marginLeft: 4,
      marginRight: 4,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      transition: "all 0.2s ease",
      "&:hover": {
        cursor: "pointer",
        opacity: 0.9,
      },
    },
    small: {
      width: "fit-content",
      height: 30,
      fontWeight: 500,
      fontSize: "14px",
    },
    medium: {
      width: 100,
      height: 40,
      fontWeight: 500,
      fontSize: "15px",
    },
    large: {
      width: 200,
      height: 45,
      fontWeight: 600,
      fontSize: "16px",
    },
    variable: {
      width: "100%",
      height: 40,
      fontWeight: 500,
      fontSize: "15px",
    },
    primary: {
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: "var(--primary-color, #0d6efd)",
      backgroundColor: "var(--primary-color, #0d6efd)",
      color: "#ffffff",
    },
    primaryOutline: {
      borderWidth: 1,
      borderStyle: "solid",
      backgroundColor: "transparent",
      borderColor: "var(--primary-color, #0d6efd)",
      color: "var(--primary-color, #0d6efd)",
    },
    secondary: {
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: "var(--border-color, rgba(0, 0, 0, 0.12))",
      color: "var(--text-primary, #0f172a)",
      backgroundColor: "var(--bg-surface, #f1f5f9)",
    },
    disable: {
      "&:hover": {
        cursor: "not-allowed",
        opacity: 1,
      },
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: "transparent",
      backgroundColor: "var(--bg-surface-dim, #e2e8f0)",
      color: "var(--text-disabled, #94a3b8)",
    },
  };
});

const ButtonComponent: React.FC<ComponentProps> = ({
  children,
  onClick,
  type = "button",
  isLoading = false,
  variant = btnType.PRIMARY,
  size = btnSize.M,
  style,
  className,
  disabled = false,
}) => {
  const classes = useStylesFromThemeFunction();
  const handleVariant = () => {
    if (disabled) {
      return classes.disable;
    }
    switch (variant) {
      case btnType.OUTLINE: {
        return classes.primaryOutline;
      }
      case btnType.SECONDARY: {
        return classes.secondary;
      }
      default:
        return classes.primary;
    }
  };
  const handleSize = () => {
    switch (size) {
      case btnSize.S: {
        return classes.small;
      }
      case btnSize.L: {
        return classes.large;
      }
      case btnSize.VARIABLE: {
        return classes.variable;
      }
      default:
        return classes.medium;
    }
  };
  return (
    <button
      style={style}
      type={type}
      className={`${className} ${handleVariant()} ${handleSize()} ${
        classes.default
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className={classes.btnContent}>
        {isLoading ? (
          <div className={classes.btnLoader}>
            <LoadingSpinner />
          </div>
        ) : (
          children
        )}
      </div>
    </button>
  );
};

export default ButtonComponent;
