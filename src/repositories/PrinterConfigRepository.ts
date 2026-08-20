import { doc, setDoc, getDoc } from "firebase/firestore";
import { FirestoreBaseRepository } from "./base/FirestoreBaseRepository";
import {
  PrinterConfig,
  PrinterConfigSchema,
  CreatePrinterConfigInput,
  UpdatePrinterConfigInput,
} from "../domain/models/PrinterConfig";
import { ValidationError, formatZodError } from "../domain/errors/AppError";

const LOCAL_STORAGE_KEY_PREFIX = "pos_printer_config_";

export class PrinterConfigRepository extends FirestoreBaseRepository<
  PrinterConfig,
  CreatePrinterConfigInput,
  UpdatePrinterConfigInput
> {
  constructor() {
    super("printer_configs");
  }

  /**
   * Get active printer configuration for the given tenant
   */
  async getDefaultConfig(tenantId?: string): Promise<PrinterConfig | null> {
    const tId = this.resolveTenantId(tenantId);

    // 1. Try local storage cache for terminal-specific hardware setup
    if (typeof localStorage !== "undefined") {
      try {
        const cached =
          localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${tId}`) ||
          localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}default`) ||
          localStorage.getItem("pos_printer_config");
        if (cached) {
          const parsed = JSON.parse(cached);
          const validation = PrinterConfigSchema.safeParse(parsed);
          if (validation.success) {
            return validation.data;
          }
        }
      } catch (_) {}
    }

    // 2. Query tenant repository
    try {
      const all = await this.getAll(tId);
      if (all && all.length > 0) {
        const defaultOne = all.find((p) => p.isDefault) || all[0];
        this.cacheLocalConfig(defaultOne, tId);
        return defaultOne;
      }

      // Check /users/${userId}
      const userId = typeof localStorage !== "undefined" ? localStorage.getItem("uid") : undefined;
      if (userId) {
        const userDocRef = doc(this.getDb(), "users", userId);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data?.printerConfig) {
            const val = PrinterConfigSchema.safeParse(data.printerConfig);
            if (val.success) {
              this.cacheLocalConfig(val.data, tId);
              return val.data;
            }
          }
        }
      }
    } catch (_) {}

    // 3. Fallback default config
    const fallback: PrinterConfig = {
      id: "default-printer",
      tenantId: tId,
      name: "Default Thermal Printer",
      type: "THERMAL",
      transport: "BROWSER",
      paperWidth: 80,
      characterWidth: 42,
      autoCut: true,
      openCashDrawer: false,
      ipAddress: "",
      port: 9100,
      baudRate: 9600,
      enabled: true,
      isDefault: true,
      headerText: "",
      footerText: "Thank you for your business!",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return fallback;
  }

  /**
   * Save or update printer configuration
   */
  async saveConfig(input: CreatePrinterConfigInput, tenantId?: string): Promise<PrinterConfig> {
    const tId = this.resolveTenantId(tenantId);
    const targetId = input.id || "default-printer";
    const parseResult = PrinterConfigSchema.safeParse({
      ...input,
      id: targetId,
      tenantId: tId,
      createdAt: input.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (!parseResult.success) {
      throw new ValidationError(
        `Printer configuration validation failed: ${formatZodError(parseResult.error)}`
      );
    }

    const validConfig = parseResult.data;

    // Cache locally
    this.cacheLocalConfig(validConfig, tId);

    // Save to Firestore tenant collection and user profile
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.onLine) {
      try {
        const docRef = doc(this.getDb(), this.getCollectionName(tId), targetId);
        setDoc(docRef, validConfig, { merge: true }).catch(() => {});

        const userId = typeof localStorage !== "undefined" ? localStorage.getItem("uid") : undefined;
        if (userId) {
          const userDocRef = doc(this.getDb(), "users", userId);
          setDoc(userDocRef, { printerConfig: validConfig, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
        }
      } catch (_) {
        // Local storage cache serves as reliable local terminal config even if offline
      }
    }

    return validConfig;
  }

  private cacheLocalConfig(config: PrinterConfig, tenantId: string): void {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${tenantId}`, JSON.stringify(config));
      } catch (_) {}
    }
  }
}

export const printerConfigRepository = new PrinterConfigRepository();
