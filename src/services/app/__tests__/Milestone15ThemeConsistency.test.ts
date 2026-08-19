import {
  createAppTheme,
  resolveEffectiveThemeMode,
} from "../../../theme/AppTheme";
import { SettingsService } from "../SettingsService";
import { SettingsRepository } from "../../../repositories/SettingsRepository";

describe("M15.1 — Global Theme Consistency & Complete UI Theme Application", () => {
  let settingsRepo: SettingsRepository;
  let settingsService: SettingsService;

  beforeEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
    settingsRepo = new SettingsRepository();
    jest.spyOn(settingsRepo, "getById").mockResolvedValue(null);
    jest.spyOn(settingsRepo, "update").mockImplementation(async (_id: any, data: any) => data as any);
    jest.spyOn(settingsRepo, "create").mockImplementation(async (data: any) => data as any);
    settingsService = new SettingsService(settingsRepo);
  });

  describe("1. Theme Resolution & Creation", () => {
    it("correctly resolves LIGHT and DARK theme modes", () => {
      expect(resolveEffectiveThemeMode("LIGHT")).toBe("light");
      expect(resolveEffectiveThemeMode("DARK")).toBe("dark");
    });

    it("creates full light mode theme with complete semantic tokens", () => {
      const theme = createAppTheme("LIGHT", "#0d6efd", "COMFORTABLE");
      expect(theme.palette.mode).toBe("light");
      expect(theme.palette.primary.main).toBe("#0d6efd");
      expect(theme.palette.background.default).toBe("#f8fafc");
      expect(theme.palette.background.paper).toBe("#ffffff");
      expect(theme.palette.text.primary).toBe("#0f172a");
      expect(theme.palette.text.secondary).toBe("#64748b");
      expect(theme.palette.success.main).toBe("#16a34a");
      expect(theme.palette.warning.main).toBe("#d97706");
      expect(theme.palette.error.main).toBe("#dc2626");
      expect(theme.palette.info.main).toBe("#0284c7");
      expect(theme.typography.fontSize).toBe(14);
      expect(theme.shape.borderRadius).toBe(8);
    });

    it("creates full dark mode theme with complete semantic tokens", () => {
      const theme = createAppTheme("DARK", "#10b981", "COMPACT");
      expect(theme.palette.mode).toBe("dark");
      expect(theme.palette.primary.main).toBe("#10b981");
      expect(theme.palette.background.default).toBe("#121212");
      expect(theme.palette.background.paper).toBe("#1e1e1e");
      expect(theme.palette.text.primary).toBe("#f8fafc");
      expect(theme.palette.text.secondary).toBe("#94a3b8");
      expect(theme.palette.success.main).toBe("#4ade80");
      expect(theme.palette.warning.main).toBe("#fbbf24");
      expect(theme.palette.error.main).toBe("#f87171");
      expect(theme.palette.info.main).toBe("#38bdf8");
      expect(theme.typography.fontSize).toBe(13);
      expect(theme.shape.borderRadius).toBe(6);
    });
  });

  describe("2. MUI Component Overrides", () => {
    it("has comprehensive component overrides configured for dark mode", () => {
      const darkTheme = createAppTheme("DARK", "#6366f1", "COMFORTABLE");
      const overrides = darkTheme.components;
      expect(overrides?.MuiCard).toBeDefined();
      expect(overrides?.MuiPaper).toBeDefined();
      expect(overrides?.MuiTableCell).toBeDefined();
      expect(overrides?.MuiTableRow).toBeDefined();
      expect(overrides?.MuiDialog).toBeDefined();
      expect(overrides?.MuiDrawer).toBeDefined();
      expect(overrides?.MuiMenu).toBeDefined();
      expect(overrides?.MuiMenuItem).toBeDefined();
      expect(overrides?.MuiChip).toBeDefined();
      expect(overrides?.MuiAlert).toBeDefined();
      expect(overrides?.MuiToggleButton).toBeDefined();
      expect(overrides?.MuiTabs).toBeDefined();
      expect(overrides?.MuiTab).toBeDefined();
      expect(overrides?.MuiTooltip).toBeDefined();
      expect(overrides?.MuiDivider).toBeDefined();
    });

    it("has comprehensive component overrides configured for light mode", () => {
      const lightTheme = createAppTheme("LIGHT", "#0d6efd", "COMFORTABLE");
      const overrides = lightTheme.components;
      expect(overrides?.MuiCard).toBeDefined();
      expect(overrides?.MuiTableCell).toBeDefined();
      expect(overrides?.MuiOutlinedInput).toBeDefined();
    });
  });

  describe("3. Theme Settings Persistence", () => {
    it("persists and retrieves user theme preferences across sessions", async () => {
      const userId = "test-cashier-1";

      const saved = await settingsService.updateUserSettings(userId, {
        themeMode: "DARK",
        accentColor: "#ec4899",
        uiDensity: "COMPACT",
      });

      expect(saved.themeMode).toBe("DARK");
      expect(saved.accentColor).toBe("#ec4899");
      expect(saved.uiDensity).toBe("COMPACT");

      const reloaded = await settingsService.getUserSettings(userId);
      expect(reloaded.themeMode).toBe("DARK");
      expect(reloaded.accentColor).toBe("#ec4899");
      expect(reloaded.uiDensity).toBe("COMPACT");
    });
  });
});
