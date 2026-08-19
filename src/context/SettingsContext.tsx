import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  OrganizationSettings,
  OrganizationSettingsSchema,
  UserSettings,
  UserSettingsSchema,
  SystemSettings,
  SystemSettingsSchema,
} from "../domain/models/Settings";
import { settingsService } from "../services/app/SettingsService";
import { formatCurrency as formatCurrencyUtil } from "../domain/formatting/CurrencyFormatter";
import {
  formatDate as formatDateUtil,
  formatTime as formatTimeUtil,
  formatDateTime as formatDateTimeUtil,
} from "../domain/formatting/DateTimeFormatter";
import { useAuth, useTenant } from "./AuthTenantContext";

export interface SettingsContextType {
  organizationSettings: OrganizationSettings;
  userSettings: UserSettings;
  systemSettings: SystemSettings;
  isLoading: boolean;
  updateOrganizationSettings: (settings: Partial<OrganizationSettings>) => Promise<OrganizationSettings>;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<UserSettings>;
  updateSystemSettings: (settings: Partial<SystemSettings>) => SystemSettings;
  formatCurrency: (amount: number | string | undefined | null) => string;
  formatDate: (date: string | number | Date | null | undefined) => string;
  formatTime: (date: string | number | Date | null | undefined) => string;
  formatDateTime: (date: string | number | Date | null | undefined) => string;
  refreshSettings: () => Promise<void>;
}

const defaultOrgSettings = OrganizationSettingsSchema.parse({
  id: "organization-settings",
  tenantId: "default",
  businessName: "My POS Store",
});

const defaultUserSettings = UserSettingsSchema.parse({
  userId: "anonymous",
});

const defaultSystemSettings = SystemSettingsSchema.parse({});

const SettingsContext = createContext<SettingsContextType>({
  organizationSettings: defaultOrgSettings,
  userSettings: defaultUserSettings,
  systemSettings: defaultSystemSettings,
  isLoading: false,
  updateOrganizationSettings: async () => defaultOrgSettings,
  updateUserSettings: async () => defaultUserSettings,
  updateSystemSettings: () => defaultSystemSettings,
  formatCurrency: (amt) => formatCurrencyUtil(amt, defaultOrgSettings),
  formatDate: (d) => formatDateUtil(d, defaultSystemSettings),
  formatTime: (d) => formatTimeUtil(d, defaultSystemSettings),
  formatDateTime: (d) => formatDateTimeUtil(d, defaultSystemSettings),
  refreshSettings: async () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenantId } = useTenant();
  const { user } = useAuth();

  const [organizationSettings, setOrganizationSettings] = useState<OrganizationSettings>(defaultOrgSettings);
  const [userSettings, setUserSettings] = useState<UserSettings>(defaultUserSettings);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(defaultSystemSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const org = await settingsService.getOrganizationSettings(tenantId);
      setOrganizationSettings(org);

      if (user?.uid) {
        const u = await settingsService.getUserSettings(user.uid);
        setUserSettings(u);
      }

      const sys = settingsService.getSystemSettings();
      setSystemSettings(sys);
    } catch (_) {
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, user?.uid]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateOrganizationSettings = async (
    settings: Partial<OrganizationSettings>
  ): Promise<OrganizationSettings> => {
    const updated = await settingsService.updateOrganizationSettings(settings, tenantId);
    setOrganizationSettings(updated);
    return updated;
  };

  const updateUserSettings = async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    if (!user?.uid) return userSettings;
    const updated = await settingsService.updateUserSettings(user.uid, settings);
    setUserSettings(updated);
    return updated;
  };

  const updateSystemSettings = (settings: Partial<SystemSettings>): SystemSettings => {
    const updated = settingsService.updateSystemSettings(settings);
    setSystemSettings(updated);
    return updated;
  };

  const formatCurrency = useCallback(
    (amount: number | string | undefined | null): string => {
      return formatCurrencyUtil(amount, organizationSettings);
    },
    [organizationSettings]
  );

  const formatDate = useCallback(
    (date: string | number | Date | null | undefined): string => {
      return formatDateUtil(date, systemSettings);
    },
    [systemSettings]
  );

  const formatTime = useCallback(
    (date: string | number | Date | null | undefined): string => {
      return formatTimeUtil(date, systemSettings);
    },
    [systemSettings]
  );

  const formatDateTime = useCallback(
    (date: string | number | Date | null | undefined): string => {
      return formatDateTimeUtil(date, systemSettings);
    },
    [systemSettings]
  );

  return (
    <SettingsContext.Provider
      value={{
        organizationSettings,
        userSettings,
        systemSettings,
        isLoading,
        updateOrganizationSettings,
        updateUserSettings,
        updateSystemSettings,
        formatCurrency,
        formatDate,
        formatTime,
        formatDateTime,
        refreshSettings: loadSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  return useContext(SettingsContext);
};
