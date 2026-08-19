import { invoiceRepository, InvoiceRepository } from "../../repositories/InvoiceRepository";
import { generateNextInvoiceNumber } from "../../utils/utilFunctions";

export class InvoiceService {
  constructor(private repo: InvoiceRepository = invoiceRepository) {}

  async getNextInvoiceNumber(tenantId?: string): Promise<string> {
    const lastNumber = await this.repo.getLastInvoiceNumber(tenantId);
    const generator = generateNextInvoiceNumber(lastNumber || "AAA0000000");
    return generator();
  }

  async recordInvoiceNumber(invoiceNumber: string, tenantId?: string): Promise<void> {
    if (invoiceNumber) {
      await this.repo.setLastInvoiceNumber(invoiceNumber, tenantId);
    }
  }
}

export const invoiceService = new InvoiceService();
