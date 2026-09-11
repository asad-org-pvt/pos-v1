import { createUseStyles } from "react-jss";
import { ThemeInterface } from "../../interfaces/theme";

export interface ComponentProps {}
export const useStylesFromThemeFunction = createUseStyles(
  (theme: ThemeInterface) => {
    return {
      /* =================================================================
         Sidebar — desktop only (≥ 900px), hidden on mobile
         ================================================================= */
      tabs: {
        display: "flex",
        flexDirection: "column",
        width: "30px",
        height: "100%",
        position: "fixed",
        justifyContent: "flex-end",
        alignContent: "center",
        left: "0px",
        top: "0px",
        fontSize: "22px",
        fontFamily: "sans-serif",
        color: "var(--text-primary, #0f172a)",
        backgroundColor: "var(--bg-paper, #ffffff)",
        borderRight: "1px solid var(--border-color, rgba(0,0,0,0.08))",
        "@media (max-width: 899px)": {
          display: "none",
        },
      },
      tabsOnAuth: {
        width: "0px",
        height: "100%",
        position: "fixed",
        left: "0px",
        top: "0px",
      },
      tabsWithSidebar: {
        display: "flex",
        flexDirection: "column",
        width: "200px",
        height: "100%",
        position: "fixed",
        justifyContent: "flex-end",
        alignContent: "center",
        left: "0px",
        top: "0px",
        backgroundColor: "var(--bg-paper, #ffffff)",
        borderRight: "1px solid var(--border-color, rgba(0,0,0,0.08))",
        color: "var(--text-primary, #0f172a)",
        "@media (max-width: 899px)": {
          display: "none",
        },
      },
      tabsStyle: {
        display: "flex",
        flexDirection: "column",
        width: "200px",
        height: "100%",
        position: "fixed",
        justifyContent: "flex-start",
        alignContent: "center",
        left: "0px",
        top: "0px",
        fontSize: "22px",
        fontFamily: "sans-serif",
        backgroundColor: "var(--bg-paper, #ffffff)",
        color: "var(--text-primary, #0f172a)",
        "@media (max-width: 899px)": {
          display: "none",
        },
      },

      /* =================================================================
         Main Content Panel — responsive margins
         ================================================================= */
      contentPanWithSidebar: {
        display: "flex",
        flexDirection: "column",
        marginLeft: "200px",
        width: "calc(100% - 200px)",
        maxWidth: "calc(100% - 200px)",
        minWidth: 0,
        height: "100dvh",
        maxHeight: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        boxSizing: "border-box",
        backgroundColor: "var(--bg-default, #f8fafc)",
        color: "var(--text-primary, #0f172a)",
        "@media (max-width: 899px)": {
          marginLeft: "0",
          width: "100%",
          maxWidth: "100%",
          paddingTop: "56px",     // space for mobile top bar
          paddingBottom: "60px",  // space for bottom nav
        },
      },
      contentPan: {
        display: "flex",
        flexDirection: "column",
        marginLeft: "30px",
        width: "calc(100% - 30px)",
        maxWidth: "calc(100% - 30px)",
        minWidth: 0,
        height: "100vh",
        maxHeight: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        boxSizing: "border-box",
        backgroundColor: "var(--bg-default, #f8fafc)",
        color: "var(--text-primary, #0f172a)",
        "@media (max-width: 899px)": {
          marginLeft: "0",
          width: "100%",
          maxWidth: "100%",
          paddingTop: "56px",
          paddingBottom: "60px",
        },
      },
      contentPanOnAuth: {
        marginLeft: "0px",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        height: "100vh",
        maxHeight: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        boxSizing: "border-box",
        backgroundColor: "var(--bg-default, #f8fafc)",
        color: "var(--text-primary, #0f172a)",
      },

      /* =================================================================
         Sidebar Toggle Arrow — hidden on mobile
         ================================================================= */
      SidebarArrow: {
        position: "absolute",
        "@media (max-width: 899px)": {
          display: "none",
        },
      },

      /* =================================================================
         Common utility classes
         ================================================================= */
      link: {
        cursor: "pointer",
      },
      userIcon: {
        width: 30,
        height: 30,
      },
      menuLabel: {
        color: "var(--text-primary, #0f172a)",
      },
      profileMenuOption: {
        display: "flex",
        flexDirection: "row",
        gap: 8,
        justifyContent: "center",
        alignItems: "center",
      },
      profileTabWrapper: {
        display: "flex",
        flexDirection: "row",
        gap: 8,
        justifyContent: "start",
        alignItems: "center",
        color: "var(--text-primary, #0f172a)",
        fontSize: 20,
        fontWeight: 450,
        cursor: "pointer",
        paddingLeft: 5,
      },
      tabsContainer: {
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        gap: 650,
      },

      /* =================================================================
         Mobile-specific classes
         ================================================================= */
      mobileDrawerNav: {
        width: "280px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-paper, #ffffff)",
        color: "var(--text-primary, #0f172a)",
      },
      mobileDrawerHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        borderBottom: "1px solid var(--border-color, rgba(0,0,0,0.08))",
        minHeight: "64px",
      },
      mobileDrawerList: {
        flex: 1,
        overflowY: "auto",
        padding: "8px 0",
      },
      mobileDrawerItem: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 20px",
        fontSize: "15px",
        fontWeight: 500,
        cursor: "pointer",
        color: "var(--text-primary, #0f172a)",
        transition: "background-color 0.15s ease",
        "&:hover": {
          backgroundColor: "var(--bg-surface-hover, rgba(0,0,0,0.04))",
        },
      },
      mobileDrawerItemActive: {
        backgroundColor: "var(--bg-surface-hover, rgba(0,0,0,0.06))",
        color: "var(--primary-color, #0d6efd)",
        fontWeight: 600,
      },
    };
  }
);
