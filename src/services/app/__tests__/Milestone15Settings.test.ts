import { SettingsService } from "../SettingsService";
import { SettingsRepository } from "../../../repositories/SettingsRepository";
import {
  OrganizationSettingsSchema,
  UserSettingsSchema,
  SystemSettingsSchema,
} from "../../../domain/models/Settings";
import {
  formatCurrency,
  deriveCurrencyFromCountry,
  SUPPORTED_CURRENCIES,
} from "../../../domain/formatting/CurrencyFormatter";
import { calculateSaleTotals } from "../../../domain/calculations/SaleCalculations";

describe("Milestone 15 — Settings & Personalization System", () => {
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
  // 1. ORGANIZATION SETTINGS & DEFAULTS
  // =========================================================================
  describe("1. Organization Settings & Tenant Defaults", () => {
    it("retrieves valid default organization settings for a tenant", async () => {
      const org = await settingsService.getOrganizationSettings("tenant-alpha");

      expect(org.tenantId).toBe("tenant-alpha");
      expect(org.currencyCode).toBe("USD");
      expect(org.currencySymbol).toBe("$");
      expect(org.taxEnabled).toBe(true);
      expect(org.defaultTaxRate).toBe(0.05);
      expect(org.discountsEnabled).toBe(true);
      expect(org.defaultDiscountRate).toBe(0.02);
      expect(org.returnWindowDays).toBe(30);
    });

    it("persists updated business policies and isolates by tenant", async () => {
      await settingsService.updateOrganizationSettings(
        {
          businessName: "Alpha Boutique",
          defaultTaxRate: 0.08,
          defaultDiscountRate: 0.05,
          returnWindowDays: 14,
        },
        "tenant-alpha"
      );

      const alphaOrg = await settingsService.getOrganizationSettings("tenant-alpha");
      const betaOrg = await settingsService.getOrganizationSettings("tenant-beta");

      expect(alphaOrg.businessName).toBe("Alpha Boutique");
      expect(alphaOrg.defaultTaxRate).toBe(0.08);
      expect(alphaOrg.returnWindowDays).toBe(14);

      // Verify tenant isolation
      expect(betaOrg.businessName).toBe("My POS Store");
      expect(betaOrg.defaultTaxRate).toBe(0.05);
    });

    it("rejects invalid organization settings via Zod schema", () => {
      expect(() => {
        OrganizationSettingsSchema.parse({
          businessName: "", // Min length 1
          defaultTaxRate: -0.5, // Non-negative
        });
      }).toThrow();
    });
  });

  // =========================================================================
  // 2. CURRENCY ENGINE & LOCATION DERIVATION
  // =========================================================================
  describe("2. Currency Engine & Location Derivation", () => {
    it("derives currency dynamically from country name or code", () => {
      expect(deriveCurrencyFromCountry("Pakistan").code).toBe("PKR");
      expect(deriveCurrencyFromCountry("PK").symbol).toBe("Rs. ");

      expect(deriveCurrencyFromCountry("United States").code).toBe("USD");
      expect(deriveCurrencyFromCountry("US").symbol).toBe("$");

      expect(deriveCurrencyFromCountry("United Kingdom").code).toBe("GBP");
      expect(deriveCurrencyFromCountry("GB").symbol).toBe("£");

      expect(deriveCurrencyFromCountry("Germany").code).toBe("EUR");
      expect(deriveCurrencyFromCountry("Canada").code).toBe("CAD");
      expect(deriveCurrencyFromCountry("Australia").code).toBe("AUD");
      expect(deriveCurrencyFromCountry("UAE").code).toBe("AED");
      expect(deriveCurrencyFromCountry("Saudi Arabia").code).toBe("SAR");
      expect(deriveCurrencyFromCountry("India").code).toBe("INR");
    });

    it("automatically updates currency denomination when currencyMode is AUTO", async () => {
      const updated = await settingsService.updateOrganizationSettings(
        {
          country: "Pakistan",
          currencyMode: "AUTO",
        },
        "tenant-pk"
      );

      expect(updated.currencyCode).toBe("PKR");
      expect(updated.currencySymbol).toBe("Rs. ");
    });

    it("preserves manual currency override when currencyMode is MANUAL", async () => {
      const updated = await settingsService.updateOrganizationSettings(
        {
          country: "Pakistan",
          currencyMode: "MANUAL",
          currencyCode: "EUR",
          currencySymbol: "€",
        },
        "tenant-pk"
      );

      expect(updated.currencyCode).toBe("EUR");
      expect(updated.currencySymbol).toBe("€");
    });
  });

  // =========================================================================
  // 3. DETERMINISTIC CURRENCY FORMATTING
  // =========================================================================
  describe("3. Deterministic Currency Formatting", () => {
    it("formats standard USD currency correctly", () => {
      const formatted = formatCurrency(1250.5, {
        currencySymbol: "$",
        symbolPosition: "BEFORE",
        decimalPrecision: 2,
      });
      expect(formatted).toBe("$1,250.50");
    });

    it("formats PKR with prefix spacing correctly", () => {
      const formatted = formatCurrency(5000, {
        currencySymbol: "Rs. ",
        symbolPosition: "BEFORE",
        decimalPrecision: 2,
      });
      expect(formatted).toBe("Rs. 5,000.00");
    });

    it("formats currency with symbol positioned AFTER amount", () => {
      const formatted = formatCurrency(45.99, {
        currencySymbol: "€",
        symbolPosition: "AFTER",
        decimalPrecision: 2,
      });
      expect(formatted).toBe("45.99 €");
    });

    it("formats negative currency values accurately without double signs", () => {
      const formattedUsd = formatCurrency(-35.5, {
        currencySymbol: "$",
        symbolPosition: "BEFORE",
        decimalPrecision: 2,
      });
      expect(formattedUsd).toBe("-$35.50");

      const formattedSuffix = formatCurrency(-50, {
        currencySymbol: "EUR",
        symbolPosition: "AFTER",
        decimalPrecision: 2,
      });
      expect(formattedSuffix).toBe("-50.00 EUR");
    });

    it("handles zero and zero-decimal currencies (like JPY)", () => {
      const formattedZero = formatCurrency(0, {
        currencySymbol: "$",
        decimalPrecision: 2,
      });
      expect(formattedZero).toBe("$0.00");

      const formattedJpy = formatCurrency(1500, {
        currencySymbol: "¥",
        decimalPrecision: 0,
      });
      expect(formattedJpy).toBe("¥1,500");
    });
  });

  // =========================================================================
  // 4. DYNAMIC CALCULATION INTEGRATION
  // =========================================================================
  describe("4. Dynamic Calculations Integration", () => {
    const sampleItems = [
      { id: "1", name: "Latte", unitPrice: 10, quantity: 2 },
    ];

    it("computes sale totals using dynamic organization tax and discount rates", () => {
      // 8% tax, 5% discount on $20 subtotal
      const totals = calculateSaleTotals({
        items: sampleItems,
        taxRate: 0.08,
        discountRate: 0.05,
      });

      expect(totals.subtotal).toBe(20);
      expect(totals.tax).toBe(1.6); // 20 * 0.08
      expect(totals.taxRate).toBe(0.08);
      expect(totals.discountRate).toBe(0.05);
    });

    it("respects tax disabled configuration (taxRate = 0)", () => {
      const totals = calculateSaleTotals({
        items: sampleItems,
        taxRate: 0,
        discountRate: 0.02,
      });

      expect(totals.subtotal).toBe(20);
      expect(totals.tax).toBe(0);
    });

    it("respects discount disabled configuration (discountRate = 0)", () => {
      const totals = calculateSaleTotals({
        items: sampleItems,
        taxRate: 0.05,
        discountRate: 0,
      });

      expect(totals.discount).toBe(0);
    });

    it("applies special discount in addition to general settings discount", () => {
      // Subtotal = 20, Tax (5%) = 1.00, Total before discount = 21.00
      // General discount (2%) = 0.42
      // Special discount = 3.00
      // Total discount = 3.42
      // Amount due = 21.00 - 3.42 = 17.58 -> rounded to 18
      const totals = calculateSaleTotals({
        items: sampleItems,
        taxRate: 0.05,
        discountRate: 0.02,
        specialDiscount: 3,
      });

      expect(totals.subtotal).toBe(20);
      expect(totals.tax).toBe(1.0);
      expect(totals.generalDiscount).toBe(0.42);
      expect(totals.specialDiscount).toBe(3.0);
      expect(totals.discount).toBe(3.42);
      expect(totals.amountDue).toBe(18);
    });

    it("applies special discount even when general discounts are disabled", () => {
      const totals = calculateSaleTotals({
        items: sampleItems,
        taxRate: 0.05,
        discountRate: 0,
        specialDiscount: 5,
      });

      expect(totals.generalDiscount).toBe(0);
      expect(totals.specialDiscount).toBe(5);
      expect(totals.discount).toBe(5);
      expect(totals.amountDue).toBe(16); // 21 - 5 = 16
    });
  });

  // =========================================================================
  // 5. USER SETTINGS & PERSONALIZATION
  // =========================================================================
  describe("5. User Settings & Appearance Personalization", () => {
    it("retrieves and updates user theme, accent color, and UI density", async () => {
      const initial = await settingsService.getUserSettings("user-101");
      expect(initial.themeMode).toBe("LIGHT");
      expect(initial.uiDensity).toBe("COMFORTABLE");

      const updated = await settingsService.updateUserSettings("user-101", {
        themeMode: "DARK",
        accentColor: "#10b981",
        uiDensity: "COMPACT",
      });

      expect(updated.themeMode).toBe("DARK");
      expect(updated.accentColor).toBe("#10b981");
      expect(updated.uiDensity).toBe("COMPACT");

      const retrieved = await settingsService.getUserSettings("user-101");
      expect(retrieved.themeMode).toBe("DARK");
    });

    it("isolates user personalization preferences between different users", async () => {
      await settingsService.updateUserSettings("user-alice", { themeMode: "DARK" });
      await settingsService.updateUserSettings("user-bob", { themeMode: "LIGHT" });

      const alice = await settingsService.getUserSettings("user-alice");
      const bob = await settingsService.getUserSettings("user-bob");

      expect(alice.themeMode).toBe("DARK");
      expect(bob.themeMode).toBe("LIGHT");
    });
  });

  // =========================================================================
  // 6. SYSTEM PREFERENCES & STORAGE SAFETY
  // =========================================================================
  describe("6. System Preferences & Cache Diagnostics", () => {
    it("updates date and time localization preferences", () => {
      const sys = settingsService.updateSystemSettings({
        dateFormat: "DD/MM/YYYY",
        timeFormat: "24H",
        language: "ur",
      });

      expect(sys.dateFormat).toBe("DD/MM/YYYY");
      expect(sys.timeFormat).toBe("24H");
      expect(sys.language).toBe("ur");

      const current = settingsService.getSystemSettings();
      expect(current.dateFormat).toBe("DD/MM/YYYY");
    });

    it("reports local storage usage diagnostics accurately", async () => {
      const diag = await settingsService.getStorageDiagnostics("tenant-alpha");
      expect(diag.hasPendingOutbox).toBe(false);
      expect(diag.pendingOutboxCount).toBe(0);
      expect(typeof diag.estimatedCacheSizeKb).toBe("number");
    });

    it("safely clears local cache without touching authoritative server data", async () => {
      localStorage.setItem("pos_offline_products_tenant-alpha", JSON.stringify([{ id: "1" }]));
      expect(localStorage.getItem("pos_offline_products_tenant-alpha")).toBeDefined();

      const res = await settingsService.clearLocalCache(false, "tenant-alpha");
      expect(res.success).toBe(true);
      expect(localStorage.getItem("pos_offline_products_tenant-alpha")).toBeNull();
    });
  });
});
