import { PrinterConfig, PrinterTransportType } from "../../../domain/models/PrinterConfig";

export interface PrintResult {
  success: boolean;
  transport: PrinterTransportType;
  printerName?: string;
  error?: string;
  fallbackAvailable?: boolean;
  rawData?: Uint8Array;
}

export interface IPrinterTransport {
  readonly type: PrinterTransportType;
  isSupported(): boolean;
  connect(config: PrinterConfig): Promise<void>;
  send(data: Uint8Array, config?: PrinterConfig): Promise<PrintResult>;
  disconnect(): Promise<void>;
}
