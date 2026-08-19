import { Order } from "../../domain/models/Order";
import { Return } from "../../domain/models/Return";
import {
  PrinterConfig,
  CreatePrinterConfigInput,
} from "../../domain/models/PrinterConfig";
import { escPosEncoder, EscPosEncoder } from "./EscPosEncoder";
import { TransportFactory } from "./transports/TransportFactory";
import { PrintResult } from "./transports/IPrinterTransport";
import {
  printerConfigRepository,
  PrinterConfigRepository,
} from "../../repositories/PrinterConfigRepository";

export interface PrintOptions {
  organizationName?: string;
  forceBrowserFallback?: boolean;
}

export class PrinterService {
  constructor(
    private configRepo: PrinterConfigRepository = printerConfigRepository,
    private encoder: EscPosEncoder = escPosEncoder
  ) {}

  /**
   * Get active printer configuration for tenant
   */
  async getConfig(tenantId?: string): Promise<PrinterConfig> {
    const config = await this.configRepo.getDefaultConfig(tenantId);
    return (
      config || {
        id: "default",
        tenantId: tenantId || "default",
        name: "Standard Receipt Printer",
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
      }
    );
  }

  /**
   * Save printer configuration
   */
  async saveConfig(input: CreatePrinterConfigInput, tenantId?: string): Promise<PrinterConfig> {
    return this.configRepo.saveConfig(input, tenantId);
  }

  /**
   * Generate raw ESC/POS byte sequence for an order
   */
  getRawReceiptBytes(
    order: Order,
    config: PrinterConfig,
    organizationName = "POS STORE"
  ): Uint8Array {
    return this.encoder.encodeReceipt(order, config, organizationName);
  }

  /**
   * Generate raw ESC/POS byte sequence for a refund receipt
   */
  getRawRefundBytes(
    returnRecord: Return,
    config: PrinterConfig,
    organizationName = "POS STORE"
  ): Uint8Array {
    return this.encoder.encodeRefundReceipt(returnRecord, config, organizationName);
  }

  /**
   * Print sales receipt directly or via fallback.
   * STRICT INVARIANT: Financial state is never modified or rolled back if printing fails.
   */
  async printReceipt(
    order: Order,
    options?: PrintOptions,
    tenantId?: string
  ): Promise<PrintResult> {
    try {
      const config = await this.getConfig(tenantId);

      if (!config.enabled) {
        return {
          success: false,
          transport: config.transport,
          printerName: config.name,
          error: "Printer is currently disabled in Settings.",
          fallbackAvailable: true,
        };
      }

      // Generate ESC/POS byte commands
      const rawData = this.getRawReceiptBytes(
        order,
        config,
        options?.organizationName || "POS STORE"
      );

      // Force browser fallback if requested or configured
      const transportType = options?.forceBrowserFallback ? "BROWSER" : config.transport;
      const transport = TransportFactory.getTransport(transportType);

      const result = await transport.send(rawData, config);
      return result;
    } catch (err: any) {
      // Hardware/network errors are caught cleanly so caller is never crashed
      return {
        success: false,
        transport: "BROWSER",
        error: err.message || "An unexpected error occurred while printing.",
        fallbackAvailable: true,
      };
    }
  }

  /**
   * Print customer refund receipt directly or via fallback.
   * STRICT INVARIANT: Financial state is never modified or rolled back if printing fails.
   */
  async printRefundReceipt(
    returnRecord: Return,
    options?: PrintOptions,
    tenantId?: string
  ): Promise<PrintResult> {
    try {
      const config = await this.getConfig(tenantId);

      if (!config.enabled) {
        return {
          success: false,
          transport: config.transport,
          printerName: config.name,
          error: "Printer is disabled in Settings.",
          fallbackAvailable: true,
        };
      }

      const rawData = this.getRawRefundBytes(
        returnRecord,
        config,
        options?.organizationName || "POS STORE"
      );

      const transportType = options?.forceBrowserFallback ? "BROWSER" : config.transport;
      const transport = TransportFactory.getTransport(transportType);

      const result = await transport.send(rawData, config);
      return result;
    } catch (err: any) {
      return {
        success: false,
        transport: "BROWSER",
        error: err.message || "An unexpected error occurred while printing refund.",
        fallbackAvailable: true,
      };
    }
  }

  /**
   * Perform printer diagnostic test print
   */
  async testPrint(config?: PrinterConfig, tenantId?: string): Promise<PrintResult> {
    try {
      const targetConfig = config || (await this.getConfig(tenantId));
      const rawData = this.encoder.encodeTestReceipt(targetConfig);

      const transport = TransportFactory.getTransport(targetConfig.transport);
      const result = await transport.send(rawData, targetConfig);
      return result;
    } catch (err: any) {
      return {
        success: false,
        transport: config?.transport || "BROWSER",
        error: err.message || "Diagnostic test print failed.",
        fallbackAvailable: true,
      };
    }
  }
}

export const printerService = new PrinterService();
