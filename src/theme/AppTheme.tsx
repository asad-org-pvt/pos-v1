import React, { useMemo, useState, useEffect } from "react";
import { createTheme, Theme, ThemeProvider, CssBaseline } from "@mui/material";
import { ThemeMode, UiDensity } from "../domain/models/Settings";
import { useSettings } from "../context/SettingsContext";

export function resolveEffectiveThemeMode(themeMode: ThemeMode): "light" | "dark" {
  if (themeMode === "DARK") return "dark";
  if (themeMode === "LIGHT") return "light";
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

export function createAppTheme(
  themeMode: ThemeMode = "LIGHT",
  accentColor: string = "#0d6efd",
  uiDensity: UiDensity = "COMFORTABLE"
): Theme {
  const mode = resolveEffectiveThemeMode(themeMode);
  const isDark = mode === "dark";
  const isCompact = uiDensity === "COMPACT";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: accentColor || "#0d6efd",
        contrastText: "#ffffff",
      },
      secondary: {
        main: isDark ? "#38bdf8" : "#0284c7",
      },
      background: {
        default: isDark ? "#121212" : "#f8fafc",
        paper: isDark ? "#1e1e1e" : "#ffffff",
      },
      text: {
        primary: isDark ? "#f8fafc" : "#0f172a",
        secondary: isDark ? "#94a3b8" : "#64748b",
        disabled: isDark ? "#64748b" : "#94a3b8",
      },
      divider: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
      success: {
        main: isDark ? "#4ade80" : "#16a34a",
        light: isDark ? "rgba(74, 222, 128, 0.15)" : "#f0fdf4",
        contrastText: "#ffffff",
      },
      warning: {
        main: isDark ? "#fbbf24" : "#d97706",
        light: isDark ? "rgba(251, 191, 36, 0.15)" : "#fffbeb",
        contrastText: "#ffffff",
      },
      error: {
        main: isDark ? "#f87171" : "#dc2626",
        light: isDark ? "rgba(248, 113, 113, 0.15)" : "#fef2f2",
        contrastText: "#ffffff",
      },
      info: {
        main: isDark ? "#38bdf8" : "#0284c7",
        light: isDark ? "rgba(56, 189, 248, 0.15)" : "#f0f9ff",
        contrastText: "#ffffff",
      },
      action: {
        hover: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
        selected: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
        disabledBackground: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)",
        disabled: isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.26)",
      },
    },
    typography: {
      fontFamily: [
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        "Roboto",
        '"Helvetica Neue"',
        "Arial",
        "sans-serif",
      ].join(","),
      fontSize: isCompact ? 13 : 14,
    },
    spacing: isCompact ? 6 : 8,
    shape: {
      borderRadius: isCompact ? 6 : 8,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? "#121212" : "#f8fafc",
            color: isDark ? "#f8fafc" : "#0f172a",
            transition: "background-color 0.2s ease, color 0.2s ease",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)"}`,
            boxShadow: isDark
              ? "0 4px 6px -1px rgba(0, 0, 0, 0.5)"
              : "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
            color: isDark ? "#f8fafc" : "#0f172a",
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: isCompact ? "6px 10px" : "12px 16px",
            borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
            color: isDark ? "#f8fafc" : "#0f172a",
          },
          head: {
            fontWeight: 700,
            backgroundColor: isDark ? "#262626" : "#f1f5f9",
            color: isDark ? "#f8fafc" : "#334155",
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            "&:hover": {
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.04) !important" : "rgba(0, 0, 0, 0.02) !important",
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            padding: isCompact ? "4px 10px" : "6px 16px",
          },
          containedSecondary: {
            color: "#ffffff",
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "#262626" : "#ffffff",
            color: isDark ? "#f8fafc" : "#0f172a",
          },
          input: {
            "&::placeholder": {
              color: isDark ? "#94a3b8" : "#64748b",
              opacity: 1,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "#262626" : "#ffffff",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.23)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "rgba(255, 255, 255, 0.35)" : "rgba(0, 0, 0, 0.4)",
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
            color: isDark ? "#f8fafc" : "#0f172a",
            backgroundImage: "none",
            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
            color: isDark ? "#f8fafc" : "#0f172a",
            borderLeft: `1px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"}`,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? "#262626" : "#ffffff",
            color: isDark ? "#f8fafc" : "#0f172a",
            backgroundImage: "none",
            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"}`,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: isDark ? "#f8fafc" : "#0f172a",
            "&:hover": {
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
            },
            "&.Mui-selected": {
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.08)",
              "&:hover": {
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.12)",
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
          },
          outlined: {
            borderColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.15)",
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: isCompact ? 6 : 8,
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            color: isDark ? "#94a3b8" : "#64748b",
            borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.12)",
            "&.Mui-selected": {
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
              color: isDark ? "#f8fafc" : "#0f172a",
              "&:hover": {
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.12)",
              },
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"}`,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            color: isDark ? "#94a3b8" : "#64748b",
            "&.Mui-selected": {
              color: isDark ? "#f8fafc" : accentColor || "#0d6efd",
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? "#333333" : "#1e293b",
            color: "#ffffff",
            fontSize: "12px",
            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.15)" : "transparent"}`,
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
          },
        },
      },
    },
  });
}

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userSettings } = useSettings();
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const effectiveThemeMode = useMemo(() => {
    if (userSettings.themeMode === "SYSTEM") {
      return systemPrefersDark ? "DARK" : "LIGHT";
    }
    return userSettings.themeMode || "LIGHT";
  }, [userSettings.themeMode, systemPrefersDark]);

  const theme = useMemo(() => {
    return createAppTheme(
      effectiveThemeMode,
      userSettings.accentColor || "#0d6efd",
      userSettings.uiDensity || "COMFORTABLE"
    );
  }, [effectiveThemeMode, userSettings.accentColor, userSettings.uiDensity]);

  useEffect(() => {
    const resolved = effectiveThemeMode === "DARK" ? "dark" : "light";
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.setAttribute("data-theme", resolved);

      // Core Backgrounds
      root.style.setProperty("--bg-default", resolved === "dark" ? "#121212" : "#f8fafc");
      root.style.setProperty("--bg-paper", resolved === "dark" ? "#1e1e1e" : "#ffffff");
      root.style.setProperty("--bg-surface", resolved === "dark" ? "#262626" : "#f1f5f9");
      root.style.setProperty("--bg-surface-dim", resolved === "dark" ? "#181818" : "#eaedf2");
      root.style.setProperty("--bg-surface-hover", resolved === "dark" ? "#333333" : "#e2e8f0");
      root.style.setProperty("--bg-elevated", resolved === "dark" ? "#2a2a2a" : "#ffffff");

      // Text Colors
      root.style.setProperty("--text-primary", resolved === "dark" ? "#f8fafc" : "#0f172a");
      root.style.setProperty("--text-secondary", resolved === "dark" ? "#94a3b8" : "#64748b");
      root.style.setProperty("--text-disabled", resolved === "dark" ? "#64748b" : "#94a3b8");

      // Borders & Dividers
      root.style.setProperty(
        "--border-color",
        resolved === "dark" ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"
      );
      root.style.setProperty(
        "--border-subtle",
        resolved === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)"
      );
      root.style.setProperty(
        "--divider",
        resolved === "dark" ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"
      );

      // Primary & Brand Tokens
      const accent = userSettings.accentColor || "#0d6efd";
      root.style.setProperty("--primary-color", accent);
      root.style.setProperty("--primary-contrast", "#ffffff");
      root.style.setProperty("--secondary-color", resolved === "dark" ? "#38bdf8" : "#0284c7");

      // Inputs & Form Controls
      root.style.setProperty("--input-bg", resolved === "dark" ? "#262626" : "#ffffff");
      root.style.setProperty("--input-bg-subtle", resolved === "dark" ? "#1a1a1a" : "#f8fafc");
      root.style.setProperty(
        "--input-border",
        resolved === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.23)"
      );
      root.style.setProperty("--input-placeholder", resolved === "dark" ? "#94a3b8" : "#64748b");

      // Semantic Status Colors
      root.style.setProperty("--success", resolved === "dark" ? "#4ade80" : "#16a34a");
      root.style.setProperty("--success-bg", resolved === "dark" ? "rgba(74, 222, 128, 0.15)" : "#f0fdf4");
      root.style.setProperty("--success-border", resolved === "dark" ? "rgba(74, 222, 128, 0.3)" : "#bbf7d0");

      root.style.setProperty("--warning", resolved === "dark" ? "#fbbf24" : "#d97706");
      root.style.setProperty("--warning-bg", resolved === "dark" ? "rgba(251, 191, 36, 0.15)" : "#fffbeb");
      root.style.setProperty("--warning-border", resolved === "dark" ? "rgba(251, 191, 36, 0.3)" : "#fde68a");

      root.style.setProperty("--error", resolved === "dark" ? "#f87171" : "#dc2626");
      root.style.setProperty("--error-bg", resolved === "dark" ? "rgba(248, 113, 113, 0.15)" : "#fef2f2");
      root.style.setProperty("--error-border", resolved === "dark" ? "rgba(248, 113, 113, 0.3)" : "#fecaca");

      root.style.setProperty("--info", resolved === "dark" ? "#38bdf8" : "#0284c7");
      root.style.setProperty("--info-bg", resolved === "dark" ? "rgba(56, 189, 248, 0.15)" : "#f0f9ff");
      root.style.setProperty("--info-border", resolved === "dark" ? "rgba(56, 189, 248, 0.3)" : "#bae6fd");

      // Shadows & Overlays
      root.style.setProperty(
        "--shadow-sm",
        resolved === "dark" ? "0 1px 2px 0 rgba(0, 0, 0, 0.5)" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
      );
      root.style.setProperty(
        "--shadow-md",
        resolved === "dark"
          ? "0 4px 6px -1px rgba(0, 0, 0, 0.6)"
          : "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
      );
      root.style.setProperty(
        "--overlay",
        resolved === "dark" ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.5)"
      );
    }
  }, [effectiveThemeMode, userSettings.accentColor]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};
