import {
  Customer,
  CreateCustomerSchema,
  UpdateCustomerSchema,
} from "../../domain/models/Customer";
import { customerRepository, CustomerRepository } from "../../repositories/CustomerRepository";
import { orderRepository, OrderRepository } from "../../repositories/OrderRepository";
import { returnRepository, ReturnRepository } from "../../repositories/ReturnRepository";
import { ValidationError, formatZodError } from "../../domain/errors/AppError";
import { QueryOptions } from "../../repositories/base/IRepository";
import { Order } from "../../domain/models/Order";
import { Return } from "../../domain/models/Return";

export class CustomerService {
  constructor(
    private repo: CustomerRepository = customerRepository,
    private orderRepo: OrderRepository = orderRepository,
    private returnRepo: ReturnRepository = returnRepository
  ) {}

  async getCustomers(tenantId?: string, options?: QueryOptions): Promise<Customer[]> {
    return this.repo.getAll(tenantId, options);
  }

  async getCustomerById(id: string, tenantId?: string): Promise<Customer | null> {
    if (!id) {
      throw new ValidationError("Customer ID is required");
    }
    return this.repo.getById(id, tenantId);
  }

  async createCustomer(input: unknown, tenantId?: string): Promise<Customer> {
    const parseResult = CreateCustomerSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Customer validation failed: ${errorMsg}`, parseResult.error.format());
    }

    return this.repo.create(parseResult.data, tenantId);
  }

  async updateCustomer(id: string, input: unknown, tenantId?: string): Promise<Customer> {
    if (!id) {
      throw new ValidationError("Customer ID is required for update");
    }

    const parseResult = UpdateCustomerSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Customer update validation failed: ${errorMsg}`, parseResult.error.format());
    }

    return this.repo.update(id, parseResult.data, tenantId);
  }

  async deactivateCustomer(id: string, tenantId?: string): Promise<Customer> {
    if (!id) {
      throw new ValidationError("Customer ID is required for deactivation");
    }
    return this.repo.update(id, { isActive: false, updatedAt: new Date().toISOString() }, tenantId);
  }

  async deleteCustomer(id: string, tenantId?: string): Promise<boolean> {
    if (!id) {
      throw new ValidationError("Customer ID is required for deletion");
    }
    return this.repo.delete(id, tenantId);
  }

  async getCustomerPurchaseHistory(customerId: string, tenantId?: string): Promise<Order[]> {
    if (!customerId) {
      throw new ValidationError("Customer ID is required");
    }
    const allOrders = await this.orderRepo.getAll(tenantId);
    return allOrders.filter((o) => o.customerId === customerId);
  }

  async getCustomerReturnHistory(customerId: string, tenantId?: string): Promise<Return[]> {
    if (!customerId) {
      throw new ValidationError("Customer ID is required");
    }
    const customerOrders = await this.getCustomerPurchaseHistory(customerId, tenantId);
    const orderIds = new Set(customerOrders.map((o) => o.id));

    const allReturns = await this.returnRepo.getAll(tenantId);
    return allReturns.filter((r) => orderIds.has(r.originalOrderId) || (r as any).customerId === customerId);
  }
}

export const customerService = new CustomerService();
