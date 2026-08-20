import { FirestoreBaseRepository } from "./base/FirestoreBaseRepository";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getRuntimeTenantId } from "../context/tenantRuntime";
import {
  OrganizationSettings,
  OrganizationSettingsSchema,
  UserSettings,
  UserSettingsSchema,
  SystemSettings,
  SystemSettingsSchema,
} from "../domain/models/Settings";
import { deriveCurrencyFromCountry } from "../domain/formatting/CurrencyFormatter";

const LOCAL_STORAGE_ORG_KEY = "pos_org_settings_";
const LOCAL_STORAGE_USER_KEY = "pos_user_settings_";
const LOCAL_STORAGE_SYSTEM_KEY = "pos_system_settings";

export class SettingsRepository extends FirestoreBaseRepository<
  OrganizationSettings,
  OrganizationSettings,
  Partial<OrganizationSettings>
> {
  constructor() {
    super("settings");
  }

  /**
   * Get active organization settings for tenant
   */
  async getOrganizationSettings(tenantId?: string): Promise<OrganizationSettings> {
    const tId = this.resolveTenant(tenantId);

    // 1. Try local storage cache for instant offline retrieval
    if (typeof localStorage !== "undefined") {
      try {
        const cached = localStorage.getItem(`${LOCAL_STORAGE_ORG_KEY}${tId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          const val = OrganizationSettingsSchema.safeParse(parsed);
          if (val.success) return val.data;
        }
      } catch (_) {}
    }

    // 2. Query Firestore collection if in online browser environment
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.onLine) {
      try {
        const docData = await this.getById("organization", tId);
        if (docData) {
          this.cacheLocalOrgSettings(docData, tId);
          return docData;
        }
      } catch (_) {}
    }

    // 3. Fallback default settings
    const fallback: OrganizationSettings = {
      id: "organization-settings",
      tenantId: tId,
      businessName: "My POS Store",
      businessType: "Retail / Cafe",
      email: "store@pos.local",
      phone: "",
      address: "",
      city: "",
      country: "United States",
      countryCode: "US",
      postalCode: "",
      website: "",
      taxRegistrationNumber: "",
      logoUrl: "",
      currencyMode: "MANUAL",
      currencyCode: "USD",
      currencySymbol: "$",
      decimalPrecision: 2,
      symbolPosition: "BEFORE",
      taxEnabled: true,
      defaultTaxRate: 0.05,
      taxInclusive: false,
      discountsEnabled: true,
      defaultDiscountRate: 0.02,
      maxDiscountPercent: 50,
      defaultPaymentMethod: "CASH",
      customerRequired: false,
      autoClearCart: true,
      quickCashPresets: [20, 50, 100],
      allowNegativeStockSales: false,
      lowStockThreshold: 5,
      receiptHeader: "Official Sales Receipt",
      receiptFooter: "Thank you for shopping with us!",
      showCashierName: true,
      showCustomerInfo: true,
      showTaxBreakdown: true,
      returnWindowDays: 30,
      returnReasonRequired: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return fallback;
  }

  /**
   * Save organization settings
   */
  async saveOrganizationSettings(
    settings: Partial<OrganizationSettings>,
    tenantId?: string
  ): Promise<OrganizationSettings> {
    const tId = this.resolveTenant(tenantId);
    const existing = await this.getOrganizationSettings(tId);

    let updatedData = {
      ...existing,
      ...settings,
      tenantId: tId,
      updatedAt: new Date().toISOString(),
    };

    // If currency mode is AUTO, re-derive from country
    if (updatedData.currencyMode === "AUTO" && updatedData.country) {
      const derived = deriveCurrencyFromCountry(updatedData.country);
      updatedData.currencyCode = derived.code;
      updatedData.currencySymbol = derived.symbol;
      updatedData.symbolPosition = derived.symbolPosition;
      updatedData.decimalPrecision = derived.decimalPrecision;
    }

    const validated = OrganizationSettingsSchema.parse(updatedData);

    this.cacheLocalOrgSettings(validated, tId);

    // Persist to Firestore asynchronously / resiliently if in online browser environment
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.onLine) {
      try {
        const docRef = doc(this.getDb(), this.getCollectionName(tId), "organization");
        setDoc(docRef, validated, { merge: true }).catch(() => {});
      } catch (_) {
        // Local storage cache serves as reliable offline cache
      }
    }

    return validated;
  }

  /**
   * Get user personalization settings
   */
  async getUserSettings(userId: string, tenantId?: string): Promise<UserSettings> {
    if (!userId || userId === "anonymous") {
      if (typeof localStorage !== "undefined") {
        try {
          const cached = localStorage.getItem(`${LOCAL_STORAGE_USER_KEY}anonymous`);
          if (cached) {
            const parsed = JSON.parse(cached);
            const val = UserSettingsSchema.safeParse(parsed);
            if (val.success) return val.data;
          }
        } catch (_) {}
      }
      return UserSettingsSchema.parse({ userId: "anonymous" });
    }

    const tId = this.resolveTenant(tenantId);

    // 1. Try local storage cache for instant retrieval
    if (typeof localStorage !== "undefined") {
      try {
        const cached = localStorage.getItem(`${LOCAL_STORAGE_USER_KEY}${userId}`);
        if (cached) {
          const val = UserSettingsSchema.safeParse(JSON.parse(cached));
          if (val.success) return val.data;
        }
      } catch (_) {}
    }

    // 2. Query Firestore database if in online browser environment
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.onLine) {
      try {
        const docData = await this.getById(`user_${userId}`, tId);
        if (docData) {
          const val = UserSettingsSchema.safeParse(docData);
          if (val.success) {
            this.cacheLocalUserSettings(val.data, userId);
            return val.data;
          }
        }
      } catch (_) {}
    }

    return UserSettingsSchema.parse({ userId });
  }

  /**
   * Save user personalization settings to Firestore database and local cache
   */
  async saveUserSettings(
    userId: string,
    settings: Partial<UserSettings>,
    tenantId?: string
  ): Promise<UserSettings> {
    const tId = this.resolveTenant(tenantId);
    const existing = await this.getUserSettings(userId, tId);
    const updated = UserSettingsSchema.parse({
      ...existing,
      ...settings,
      userId: userId || "anonymous",
      updatedAt: new Date().toISOString(),
    });

    // 1. Cache to local storage immediately
    this.cacheLocalUserSettings(updated, userId || "anonymous");

    // 2. Persist to Firestore DB asynchronously if online and authenticated user
    if (userId && userId !== "anonymous" && typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.onLine) {
      try {
        // Persist to tenant settings collection: doc id "user_" + userId
        const docRef = doc(this.getDb(), this.getCollectionName(tId), `user_${userId}`);
        setDoc(docRef, updated, { merge: true }).catch(() => {});

        // Also persist to /users/${userId} document for profile consistency
        const userDocRef = doc(this.getDb(), "users", userId);
        setDoc(userDocRef, { userSettings: updated, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      } catch (_) {}
    }

    return updated;
  }

  /**
   * Get system/device preferences
   */
  getSystemSettings(): SystemSettings {
    if (typeof localStorage !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_SYSTEM_KEY);
        if (cached) {
          const val = SystemSettingsSchema.safeParse(JSON.parse(cached));
          if (val.success) return val.data;
        }
      } catch (_) {}
    }

    return SystemSettingsSchema.parse({});
  }

  /**
   * Save system preferences
   */
  saveSystemSettings(settings: Partial<SystemSettings>): SystemSettings {
    const existing = this.getSystemSettings();
    const updated = SystemSettingsSchema.parse({
      ...existing,
      ...settings,
    });

    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(LOCAL_STORAGE_SYSTEM_KEY, JSON.stringify(updated));
      } catch (_) {}
    }

    return updated;
  }

  private cacheLocalOrgSettings(settings: OrganizationSettings, tenantId: string): void {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(`${LOCAL_STORAGE_ORG_KEY}${tenantId}`, JSON.stringify(settings));
      } catch (_) {}
    }
  }

  private cacheLocalUserSettings(settings: UserSettings, userId: string): void {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(`${LOCAL_STORAGE_USER_KEY}${userId}`, JSON.stringify(settings));
      } catch (_) {}
    }
  }
}

export const settingsRepository = new SettingsRepository();
