import {
  createAppTheme,
  resolveEffectiveThemeMode,
} from "../../../theme/AppTheme";
import {
  formatDate,
  formatTime,
  formatDateTime,
} from "../../../domain/formatting/DateTimeFormatter";
import { calculateSaleTotals } from "../../../domain/calculations/SaleCalculations";
import { SettingsService } from "../SettingsService";
import { SettingsRepository } from "../../../repositories/SettingsRepository";
import { OrganizationSettingsSchema } from "../../../domain/models/Settings";

describe("Milestone 15 Fix Cycle — Settings & Personalization Runtime Completion", () => {
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

  // =========================================================================
  // 1. DYNAMIC THEME SYSTEM TESTS (P0)
  // =========================================================================
  describe("1. Dynamic Theme System", () => {
    it("resolves explicit theme modes accurately", () => {
      expect(resolveEffectiveThemeMode("LIGHT")).toBe("light");
      expect(resolveEffectiveThemeMode("DARK")).toBe("dark");
    });

    it("creates dark mode theme with custom accent color and compact density", () => {
      const theme = createAppTheme("DARK", "#10b981", "COMPACT");
      expect(theme.palette.mode).toBe("dark");
      expect(theme.palette.primary.main).toBe("#10b981");
      expect(theme.palette.background.default).toBe("#121212");
      expect(theme.palette.background.paper).toBe("#1e1e1e");
      expect(theme.typography.fontSize).toBe(13);
    });

    it("creates light mode theme with custom accent color and comfortable density", () => {
      const theme = createAppTheme("LIGHT", "#f59e0b", "COMFORTABLE");
      expect(theme.palette.mode).toBe("light");
      expect(theme.palette.primary.main).toBe("#f59e0b");
      expect(theme.palette.background.default).toBe("#f8fafc");
      expect(theme.palette.background.paper).toBe("#ffffff");
      expect(theme.typography.fontSize).toBe(14);
    });
  });

  // =========================================================================
  // 2. CENTRALIZED DATE & TIME FORMATTING (P1)
  // =========================================================================
  describe("2. Centralized Date & Time Formatting", () => {
    const testTimestamp = "2026-08-19T14:30:00.000Z";

    it("formats dates using MM/DD/YYYY, DD/MM/YYYY, and YYYY-MM-DD", () => {
      const d = new Date(testTimestamp);
      expect(formatDate(d, { dateFormat: "MM/DD/YYYY" })).toBe(
        `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/2026`
      );
      expect(formatDate(d, { dateFormat: "DD/MM/YYYY" })).toBe(
        `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/2026`
      );
      expect(formatDate(d, { dateFormat: "YYYY-MM-DD" })).toBe(
        `2026-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      );
    });

    it("formats times using 12H and 24H formats", () => {
      const d = new Date("2026-08-19T14:30:00");
      expect(formatTime(d, { timeFormat: "24H" })).toBe("14:30");
      expect(formatTime(d, { timeFormat: "12H" })).toBe("02:30 PM");
    });

    it("formats combined datetime strings deterministically", () => {
      const d = new Date("2026-08-19T09:15:00");
      const formatted = formatDateTime(d, { dateFormat: "YYYY-MM-DD", timeFormat: "12H" });
      expect(formatted).toBe("2026-08-19 09:15 AM");
    });

    it("handles null and undefined dates gracefully", () => {
      expect(formatDate(null)).toBe("---");
      expect(formatTime(undefined)).toBe("---");
      expect(formatDateTime("")).toBe("---");
    });
  });

  // =========================================================================
  // 3. MAX DISCOUNT PERCENT ENFORCEMENT (P2)
  // =========================================================================
  describe("3. Max Discount Percent Enforcement", () => {
    const sampleItems = [{ id: "1", name: "Headphones", unitPrice: 100, quantity: 1 }];

    it("allows discounts that are within configured maxDiscountPercent limit", () => {
      // Subtotal = 100, Tax = 5%, Total = 105. Max Discount = 20% of 105 = 21.00
      const totals = calculateSaleTotals({
        items: sampleItems,
        taxRate: 0.05,
        discountRate: 0,
        specialDiscount: 15,
        maxDiscountPercent: 20,
      });

      expect(totals.specialDiscount).toBe(15);
      expect(totals.discount).toBe(15);
      expect(totals.amountDue).toBe(90); // 105 - 15 = 90
    });

    it("clamps special discount when it exceeds configured maxDiscountPercent limit", () => {
      // Subtotal = 100, Tax = 5%, Total = 105. Max Discount (20%) = 21.00
      // User attempts 50 special discount -> must be clamped to 21.00
      const totals = calculateSaleTotals({
        items: sampleItems,
        taxRate: 0.05,
        discountRate: 0,
        specialDiscount: 50,
        maxDiscountPercent: 20,
      });

      expect(totals.specialDiscount).toBe(21);
      expect(totals.discount).toBe(21);
      expect(totals.amountDue).toBe(84); // 105 - 21 = 84
    });
  });

  // =========================================================================
  // 4. POS BUSINESS POLICIES & QUICK CASH PRESETS (P1 & P2)
  // =========================================================================
  describe("4. POS Business Policies & Quick Cash Presets", () => {
    it("updates and validates quick cash preset amounts", async () => {
      const updated = await settingsService.updateOrganizationSettings(
        {
          quickCashPresets: [10, 50, 100, 500],
          allowNegativeStockSales: true,
          customerRequired: true,
          lowStockThreshold: 8,
          maxDiscountPercent: 25,
          defaultPaymentMethod: "CARD",
        },
        "tenant-gamma"
      );

      expect(updated.quickCashPresets).toEqual([10, 50, 100, 500]);
      expect(updated.allowNegativeStockSales).toBe(true);
      expect(updated.customerRequired).toBe(true);
      expect(updated.lowStockThreshold).toBe(8);
      expect(updated.maxDiscountPercent).toBe(25);
      expect(updated.defaultPaymentMethod).toBe("CARD");
    });

    it("validates organization schema constraints", () => {
      expect(() => {
        OrganizationSettingsSchema.parse({
          maxDiscountPercent: 150, // Exceeds max 100
        });
      }).toThrow();
    });
  });
});
