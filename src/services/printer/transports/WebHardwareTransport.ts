import { IPrinterTransport, PrintResult } from "./IPrinterTransport";
import { PrinterConfig, PrinterTransportType } from "../../../domain/models/PrinterConfig";

export class WebHardwareTransport implements IPrinterTransport {
  constructor(public readonly type: PrinterTransportType) {}

  isSupported(): boolean {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return false;
    }

    if (this.type === "USB") {
      return "usb" in navigator && typeof (navigator as any).usb?.requestDevice === "function";
    }

    if (this.type === "SERIAL") {
      return "serial" in navigator && typeof (navigator as any).serial?.requestPort === "function";
    }

    if (this.type === "NETWORK") {
      // Network ESC/POS is supported via direct raw TCP / WebSocket bridge or HTTP print server
      return typeof fetch === "function";
    }

    return false;
  }

  async connect(config: PrinterConfig): Promise<void> {
    if (!this.isSupported()) {
      throw new Error(
        `Hardware transport '${this.type}' is not supported by your current browser environment.`
      );
    }
  }

  async send(data: Uint8Array, config?: PrinterConfig): Promise<PrintResult> {
    if (!this.isSupported()) {
      return {
        success: false,
        transport: this.type,
        printerName: config?.name,
        error: `Browser does not support '${this.type}' hardware printing. Please use Chrome/Edge or select Browser Fallback.`,
        fallbackAvailable: true,
        rawData: data,
      };
    }

    try {
      if (this.type === "USB") {
        const navUsb = (navigator as any).usb;
        if (!navUsb) {
          throw new Error("WebUSB interface unavailable.");
        }
        // In browser contexts, direct USB requires prior user gesture permission
        // If device is not yet paired, return graceful fallback notification
        const devices = await navUsb.getDevices();
        if (devices.length === 0) {
          return {
            success: false,
            transport: "USB",
            printerName: config?.name,
            error: "No paired USB thermal printer found. Please pair device or use Browser print.",
            fallbackAvailable: true,
            rawData: data,
          };
        }

        const device = devices[0];
        await device.open();
        if (device.configuration === null) {
          await device.selectConfiguration(1);
        }
        await device.claimInterface(0);
        // Transfer raw ESC/POS endpoint
        await device.transferOut(1, data);
        await device.close();

        return {
          success: true,
          transport: "USB",
          printerName: config?.name || device.productName || "USB Thermal Printer",
          rawData: data,
        };
      }

      if (this.type === "SERIAL") {
        const navSerial = (navigator as any).serial;
        const ports = await navSerial.getPorts();
        if (ports.length === 0) {
          return {
            success: false,
            transport: "SERIAL",
            printerName: config?.name,
            error: "No paired Serial/COM printer found. Please pair port in Settings or use Browser print.",
            fallbackAvailable: true,
            rawData: data,
          };
        }

        const port = ports[0];
        await port.open({ baudRate: config?.baudRate || 9600 });
        const writer = port.writable.getWriter();
        await writer.write(data);
        writer.releaseLock();
        await port.close();

        return {
          success: true,
          transport: "SERIAL",
          printerName: config?.name || "Serial Thermal Printer",
          rawData: data,
        };
      }

      if (this.type === "NETWORK") {
        if (!config?.ipAddress) {
          return {
            success: false,
            transport: "NETWORK",
            printerName: config?.name,
            error: "Printer IP address is not configured.",
            fallbackAvailable: true,
            rawData: data,
          };
        }

        // Direct HTTP/TCP bridge call
        const response = await fetch(`http://${config.ipAddress}:${config.port || 9100}/print`, {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: data,
        });

        if (!response.ok) {
          throw new Error(`Network printer responded with status: ${response.statusText}`);
        }

        return {
          success: true,
          transport: "NETWORK",
          printerName: config.name || `Network Printer (${config.ipAddress})`,
          rawData: data,
        };
      }

      return {
        success: false,
        transport: this.type,
        error: `Unsupported transport type: ${this.type}`,
        fallbackAvailable: true,
        rawData: data,
      };
    } catch (err: any) {
      return {
        success: false,
        transport: this.type,
        printerName: config?.name,
        error: err.message || `Failed to communicate with ${this.type} thermal printer.`,
        fallbackAvailable: true,
        rawData: data,
      };
    }
  }

  async disconnect(): Promise<void> {
    return Promise.resolve();
  }
}
