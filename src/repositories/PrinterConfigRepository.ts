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
        const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${tId}`);
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
    const parseResult = PrinterConfigSchema.safeParse({
      ...input,
      id: input.id || `printer_${Date.now()}`,
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

    // Save to Firestore tenant collection
    try {
      if (input.id) {
        await this.update(input.id, validConfig, tId);
      } else {
        await this.create(validConfig, tId);
      }
    } catch (_) {
      // Local storage cache serves as reliable local terminal config even if offline
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
