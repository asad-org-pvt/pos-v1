import { IPrinterTransport } from "./IPrinterTransport";
import { BrowserPrintTransport } from "./BrowserPrintTransport";
import { WebHardwareTransport } from "./WebHardwareTransport";
import { PrinterTransportType } from "../../../domain/models/PrinterConfig";

export class TransportFactory {
  private static transports: Map<PrinterTransportType, IPrinterTransport> = new Map();

  static getTransport(type: PrinterTransportType): IPrinterTransport {
    if (!this.transports.has(type)) {
      if (type === "BROWSER") {
        this.transports.set("BROWSER", new BrowserPrintTransport());
      } else {
        this.transports.set(type, new WebHardwareTransport(type));
      }
    }
    return this.transports.get(type)!;
  }
}
