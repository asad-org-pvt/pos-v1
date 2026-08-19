import { z } from "zod";

// =========================================================================
// 1. ORGANIZATION SETTINGS (Tenant Scoped)
// =========================================================================

export const CurrencyModeEnum = z.enum(["AUTO", "MANUAL"]);
export type CurrencyMode = z.infer<typeof CurrencyModeEnum>;

export const SymbolPositionEnum = z.enum(["BEFORE", "AFTER"]);
export type SymbolPosition = z.infer<typeof SymbolPositionEnum>;

export const PaymentMethodDefaultEnum = z.enum(["CASH", "CARD", "OTHER"]);
export type PaymentMethodDefault = z.infer<typeof PaymentMethodDefaultEnum>;

export const OrganizationSettingsSchema = z.object({
  id: z.string().default("organization-settings"),
  tenantId: z.string().default("default"),

  // Business Information
  businessName: z.string().min(1, "Business name is required").default("My POS Store"),
  businessType: z.string().optional().default("Retail / Cafe"),
  email: z.string().email().optional().default("store@pos.local"),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  country: z.string().optional().default("United States"),
  countryCode: z.string().optional().default("US"),
  postalCode: z.string().optional().default(""),
  website: z.string().optional().default(""),
  taxRegistrationNumber: z.string().optional().default(""),
  logoUrl: z.string().optional().default(""),

  // Currency Settings
  currencyMode: CurrencyModeEnum.default("MANUAL"),
  currencyCode: z.string().default("USD"),
  currencySymbol: z.string().default("$"),
  decimalPrecision: z.coerce.number().min(0).max(4).default(2),
  symbolPosition: SymbolPositionEnum.default("BEFORE"),

  // Tax & Discount Settings
  taxEnabled: z.boolean().default(true),
  defaultTaxRate: z.coerce.number().min(0).max(1).default(0.05),
  taxInclusive: z.boolean().default(false),
  discountsEnabled: z.boolean().default(true),
  defaultDiscountRate: z.coerce.number().min(0).max(1).default(0.02),
  maxDiscountPercent: z.coerce.number().min(0).max(100).default(50),

  // POS & Checkout Defaults
  defaultPaymentMethod: PaymentMethodDefaultEnum.default("CASH"),
  customerRequired: z.boolean().default(false),
  autoClearCart: z.boolean().default(true),
  quickCashPresets: z.array(z.number()).default([20, 50, 100]),
  allowNegativeStockSales: z.boolean().default(false),
  lowStockThreshold: z.coerce.number().min(0).default(5),

  // Receipt Branding
  receiptHeader: z.string().optional().default("Official Sales Receipt"),
  receiptFooter: z.string().optional().default("Thank you for shopping with us!"),
  showCashierName: z.boolean().default(true),
  showCustomerInfo: z.boolean().default(true),
  showTaxBreakdown: z.boolean().default(true),

  // Return Policy
  returnWindowDays: z.coerce.number().min(0).max(365).default(30),
  returnReasonRequired: z.boolean().default(true),

  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type OrganizationSettings = z.infer<typeof OrganizationSettingsSchema>;

// =========================================================================
// 2. USER SETTINGS (User Scoped)
// =========================================================================

export const ThemeModeEnum = z.enum(["LIGHT", "DARK", "SYSTEM"]);
export type ThemeMode = z.infer<typeof ThemeModeEnum>;

export const UiDensityEnum = z.enum(["COMFORTABLE", "COMPACT"]);
export type UiDensity = z.infer<typeof UiDensityEnum>;

export const UserSettingsSchema = z.object({
  id: z.string().default("user-settings"),
  userId: z.string().min(1, "User ID is required"),
  themeMode: ThemeModeEnum.default("LIGHT"),
  accentColor: z.string().default("#0d6efd"),
  uiDensity: UiDensityEnum.default("COMFORTABLE"),
  sidebarCollapsed: z.boolean().default(false),
  notificationsEnabled: z.boolean().default(true),
  soundEffects: z.boolean().default(false),
  updatedAt: z.string().optional(),
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;

// =========================================================================
// 3. SYSTEM / DEVICE SETTINGS (Browser / Device Scoped)
// =========================================================================

export const DateFormatEnum = z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]);
export type DateFormat = z.infer<typeof DateFormatEnum>;

export const TimeFormatEnum = z.enum(["12H", "24H"]);
export type TimeFormat = z.infer<typeof TimeFormatEnum>;

export const SystemSettingsSchema = z.object({
  language: z.string().default("en"),
  dateFormat: DateFormatEnum.default("MM/DD/YYYY"),
  timeFormat: TimeFormatEnum.default("12H"),
  offlineSyncInterval: z.number().default(30),
});

export type SystemSettings = z.infer<typeof SystemSettingsSchema>;
