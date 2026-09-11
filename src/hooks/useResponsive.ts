import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

/**
 * Responsive breakpoint hook for consistent responsive decisions app-wide.
 *
 * Breakpoints (MUI defaults):
 *   xs:  0–599px    → phones
 *   sm:  600–899px  → large phones / small tablets
 *   md:  900–1199px → tablets / small laptops
 *   lg:  1200–1535px→ desktops
 *   xl:  1536px+    → wide desktops
 */
export function useResponsive() {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));       // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md")); // 600–899px
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));        // ≥ 900px
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up("lg"));   // ≥ 1200px

  // Convenience: "compact" = anything below md (phones + small tablets)
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));      // < 900px

  return {
    /** < 600px — phones in portrait */
    isMobile,
    /** 600–899px — large phones / small tablets */
    isTablet,
    /** ≥ 900px — tablets landscape and up */
    isDesktop,
    /** ≥ 1200px — full desktops */
    isLargeDesktop,
    /** < 900px — phones + tablets that need compact layouts */
    isCompact,
    /** MUI theme for manual breakpoint access */
    theme,
  };
}
