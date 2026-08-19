import {
  OrganizationSettings,
  UserSettings,
  SystemSettings,
} from "../../domain/models/Settings";
import { SettingsRepository, settingsRepository } from "../../repositories/SettingsRepository";
import { indexedDbOutboxRepository } from "../../repositories/IndexedDbOutboxRepository";
import { formatCurrency, deriveCurrencyFromCountry } from "../../domain/formatting/CurrencyFormatter";

export class SettingsService {
  constructor(private repo: SettingsRepository = settingsRepository) {}

  /**
   * Retrieve active organization settings
   */
  async getOrganizationSettings(tenantId?: string): Promise<OrganizationSettings> {
    return this.repo.getOrganizationSettings(tenantId);
  }

  /**
   * Update organization settings (admin only)
   */
  async updateOrganizationSettings(
    settings: Partial<OrganizationSettings>,
    tenantId?: string
  ): Promise<OrganizationSettings> {
    return this.repo.saveOrganizationSettings(settings, tenantId);
  }

  /**
   * Retrieve user personalization settings
   */
  async getUserSettings(userId: string): Promise<UserSettings> {
    return this.repo.getUserSettings(userId);
  }

  /**
   * Update user personalization settings
   */
  async updateUserSettings(
    userId: string,
    settings: Partial<UserSettings>
  ): Promise<UserSettings> {
    return this.repo.saveUserSettings(userId, settings);
  }

  /**
   * Retrieve system/device settings
   */
  getSystemSettings(): SystemSettings {
    return this.repo.getSystemSettings();
  }

  /**
   * Update system preferences
   */
  updateSystemSettings(settings: Partial<SystemSettings>): SystemSettings {
    return this.repo.saveSystemSettings(settings);
  }

  /**
   * Format any numeric amount based on organization currency settings
   */
  formatAmount(amount: number | string | undefined | null, settings?: Partial<OrganizationSettings>): string {
    return formatCurrency(amount, settings);
  }

  /**
   * Get currency details derived from a country name
   */
  getCurrencyFromCountry(country: string) {
    return deriveCurrencyFromCountry(country);
  }

  /**
   * Check local storage diagnostics and check if pending offline outbox items exist
   */
  async getStorageDiagnostics(tenantId?: string): Promise<{
    hasPendingOutbox: boolean;
    pendingOutboxCount: number;
    estimatedCacheSizeKb: number;
  }> {
    const pendingCount = await indexedDbOutboxRepository.countPending(tenantId);
    let totalBytes = 0;

    if (typeof localStorage !== "undefined") {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            totalBytes += (localStorage.getItem(key) || "").length * 2;
          }
        }
      } catch (_) {}
    }

    return {
      hasPendingOutbox: pendingCount > 0,
      pendingOutboxCount: pendingCount,
      estimatedCacheSizeKb: Math.round(totalBytes / 1024),
    };
  }

  /**
   * Clear local offline cache with verification of pending outbox protection
   */
  async clearLocalCache(force = false, tenantId?: string): Promise<{ success: boolean; message: string }> {
    const pendingCount = await indexedDbOutboxRepository.countPending(tenantId);
    if (pendingCount > 0 && !force) {
      return {
        success: false,
        message: `Cannot clear cache: ${pendingCount} offline transaction(s) are pending synchronization. Please sync outbox first or force clear.`,
      };
    }

    if (typeof localStorage !== "undefined") {
      try {
        // Clear cached catalogs and temporary view caches, preserve auth tokens
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith("pos_offline_products") || key.startsWith("pos_org_settings"))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch (_) {}
    }

    return {
      success: true,
      message: "Local cache cleared successfully.",
    };
  }
}

export const settingsService = new SettingsService();
