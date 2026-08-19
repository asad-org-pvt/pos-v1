import {
  Order,
  CreateOrderSchema,
  UpdateOrderSchema,
} from "../../domain/models/Order";
import { PaymentMethod } from "../../domain/models/Payment";
import { orderRepository, OrderRepository } from "../../repositories/OrderRepository";
import { ValidationError, formatZodError } from "../../domain/errors/AppError";
import { QueryOptions } from "../../repositories/base/IRepository";
import {
  calculateSaleTotals,
  SaleCalculationInput,
  SaleCalculatedTotals,
  PaymentAllocation,
} from "../../domain/calculations/SaleCalculations";
import { addLog } from "../cloud/firebase/logging";

export interface CompleteSaleInput {
  invoiceNumber: string;
  idempotencyKey?: string;
  items: Array<{
    id?: string;
    productId?: string;
    name: string;
    unitPrice: number | string;
    quantity: number | string;
    category?: string;
    unitsInStock?: number;
  }>;
  taxRate?: number;
  discountRate?: number;
  specialDiscount?: number | string;
  paymentMethod?: PaymentMethod;
  amountTendered?: number;
  paymentReference?: string;
  payments?: PaymentAllocation[];
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  registerId?: string;
  shiftId?: string;
  employeeId?: string;
  employeeName?: string;
  dateTime?: string;
}

export class OrderService {
  constructor(private repo: OrderRepository = orderRepository) {}

  async getOrders(tenantId?: string, options?: QueryOptions): Promise<Order[]> {
    return this.repo.getAll(tenantId, options);
  }

  async getOrderById(id: string, tenantId?: string): Promise<Order | null> {
    if (!id) {
      throw new ValidationError("Order ID is required");
    }
    return this.repo.getById(id, tenantId);
  }

  /**
   * Helper to perform authoritative sale calculation previews for UI.
   */
  calculateTotals(input: SaleCalculationInput): SaleCalculatedTotals {
    return calculateSaleTotals(input);
  }

  /**
   * Completes a POS sale with authoritative calculations, validation, and atomic transaction.
   * Supports single tender and multi-tender split payment allocations.
   */
  async completeSale(input: CompleteSaleInput, tenantId?: string): Promise<Order> {
    if (!input.invoiceNumber) {
      throw new ValidationError("Invoice number is required for sale completion");
    }
    if (!input.items || input.items.length === 0) {
      throw new ValidationError("At least one product item is required for checkout");
    }

    // 1. Authoritative calculation
    const calculated = calculateSaleTotals({
      items: input.items,
      taxRate: input.taxRate,
      discountRate: input.discountRate,
      specialDiscount: input.specialDiscount,
      paymentMethod: input.paymentMethod || "CASH",
      amountTendered: input.amountTendered,
      payments: input.payments,
    });

    // 2. Validate payment sufficiency
    if (!calculated.isFullyPaid) {
      throw new ValidationError(
        `Underpayment: Amount allocated (${calculated.amountPaid}) is less than amount due (${calculated.amountDue})`
      );
    }

    // 3. Assemble validated payload
    const orderPayload = {
      invoiceNumber: input.invoiceNumber,
      idempotencyKey: input.idempotencyKey || `idem-${input.invoiceNumber}`,
      tenantId: tenantId || "default",
      registerId: input.registerId || "",
      shiftId: input.shiftId || "",
      products: calculated.products,
      subtotal: calculated.subtotal,
      tax: calculated.tax,
      taxRate: calculated.taxRate,
      discount: calculated.discount,
      discountRate: calculated.discountRate,
      specialDiscount: calculated.specialDiscount,
      total: calculated.total,
      amountDue: calculated.amountDue,
      amountPaid: calculated.amountPaid,
      change: calculated.change,
      paymentMethod: calculated.paymentMethod,
      payments: calculated.payments as any,
      customerId: input.customerId || "",
      customerName: input.customerName || "Walk-in Customer",
      customerPhone: input.customerPhone || "",
      customerEmail: input.customerEmail || "",
      employeeId: input.employeeId || "",
      employeeName: input.employeeName || "",
      status: "COMPLETED" as const,
      type: "SALES" as const,
      dateTime: input.dateTime || new Date().toISOString(),
      amountTendered: input.amountTendered,
      paymentReference: input.paymentReference,
    };

    const parseResult = CreateOrderSchema.safeParse(orderPayload);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Order validation failed: ${errorMsg}`, parseResult.error.format());
    }

    // 4. Execute atomic transaction in repository
    const completedOrder = await this.repo.completeSale(parseResult.data, tenantId);

    // 5. Asynchronous Audit Logging (non-blocking)
    addLog({
      message: `Sale completed: Invoice ${completedOrder.invoiceNumber} - Total: ${completedOrder.total} (${completedOrder.paymentMethod})`,
      type: "info",
      path: "OrderService.completeSale",
    }).catch((err) => console.warn("Could not write audit log", err));

    return completedOrder;
  }

  /**
   * Standard createOrder adapter for backward compatibility.
   */
  async createOrder(input: unknown, tenantId?: string): Promise<Order> {
    const rawData = input as any;

    const items = rawData?.products || [];
    return this.completeSale(
      {
        invoiceNumber: rawData?.invoiceNumber,
        idempotencyKey: rawData?.idempotencyKey,
        items,
        taxRate: rawData?.taxRate,
        discountRate: rawData?.discountRate,
        paymentMethod: rawData?.paymentMethod || "CASH",
        amountTendered: rawData?.amountTendered ?? rawData?.amountPaid ?? rawData?.amountDue,
        payments: rawData?.payments,
        customerId: rawData?.customerId,
        customerName: rawData?.customerName,
        customerPhone: rawData?.customerPhone,
        customerEmail: rawData?.customerEmail,
        employeeId: rawData?.employeeId,
        employeeName: rawData?.employeeName,
        dateTime: rawData?.dateTime,
        paymentReference: rawData?.paymentReference,
      },
      tenantId
    );
  }

  async updateOrder(id: string, input: unknown, tenantId?: string): Promise<Order> {
    if (!id) {
      throw new ValidationError("Order ID is required for update");
    }

    const parseResult = UpdateOrderSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Order update validation failed: ${errorMsg}`, parseResult.error.format());
    }

    return this.repo.update(id, parseResult.data, tenantId);
  }

  async deleteOrder(id: string, tenantId?: string): Promise<boolean> {
    if (!id) {
      throw new ValidationError("Order ID is required for deletion");
    }
    return this.repo.delete(id, tenantId);
  }

  async searchOrders(queryText: string, tenantId?: string): Promise<Order[]> {
    const all = await this.getOrders(tenantId);
    if (!queryText || queryText.trim() === "") return all;

    const q = queryText.toLowerCase().trim();
    return all.filter(
      (order) =>
        order.invoiceNumber?.toLowerCase().includes(q) ||
        order.customerName?.toLowerCase().includes(q) ||
        order.employeeName?.toLowerCase().includes(q) ||
        order.paymentMethod?.toLowerCase().includes(q) ||
        order.status?.toLowerCase().includes(q)
    );
  }
}

export const orderService = new OrderService();
