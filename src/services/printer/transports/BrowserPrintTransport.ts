import { IPrinterTransport, PrintResult } from "./IPrinterTransport";
import { PrinterConfig } from "../../../domain/models/PrinterConfig";

export class BrowserPrintTransport implements IPrinterTransport {
  readonly type = "BROWSER" as const;

  isSupported(): boolean {
    return typeof window !== "undefined" && typeof window.print === "function";
  }

  async connect(_config: PrinterConfig): Promise<void> {
    // Browser print does not require connection lifecycle
    return Promise.resolve();
  }

  async send(data: Uint8Array, config?: PrinterConfig): Promise<PrintResult> {
    if (!this.isSupported()) {
      return {
        success: false,
        transport: "BROWSER",
        error: "Browser printing is not available in this environment.",
        fallbackAvailable: false,
        rawData: data,
      };
    }

    try {
      // Trigger standard browser print
      window.print();
      return {
        success: true,
        transport: "BROWSER",
        printerName: config?.name || "System Default (Browser)",
        fallbackAvailable: true,
        rawData: data,
      };
    } catch (err: any) {
      return {
        success: false,
        transport: "BROWSER",
        error: err.message || "Browser print dialog failed to open.",
        fallbackAvailable: false,
        rawData: data,
      };
    }
  }

  async disconnect(): Promise<void> {
    return Promise.resolve();
  }
}
