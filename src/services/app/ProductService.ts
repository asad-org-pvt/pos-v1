import {
  Product,
  CreateProductSchema,
  UpdateProductSchema,
} from "../../domain/models/Product";
import { productRepository, ProductRepository } from "../../repositories/ProductRepository";
import { stockMovementRepository, StockMovementRepository } from "../../repositories/StockMovementRepository";
import { ValidationError, formatZodError } from "../../domain/errors/AppError";
import { QueryOptions } from "../../repositories/base/IRepository";

export class ProductService {
  constructor(
    private repo: ProductRepository = productRepository,
    private stockMovementRepo: StockMovementRepository = stockMovementRepository
  ) {}

  async getProducts(tenantId?: string, options?: QueryOptions): Promise<Product[]> {
    return this.repo.getAll(tenantId, options);
  }

  async getProductById(id: string, tenantId?: string): Promise<Product | null> {
    if (!id) {
      throw new ValidationError("Product ID is required");
    }
    return this.repo.getById(id, tenantId);
  }

  async createProduct(input: unknown, tenantId?: string): Promise<Product> {
    const parseResult = CreateProductSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Product validation failed: ${errorMsg}`, parseResult.error.format());
    }

    return this.repo.create(parseResult.data, tenantId);
  }

  /**
   * Updates product metadata. Direct mutations to unitsInStock are stripped
   * to guarantee that all inventory changes pass through controlled StockMovements.
   */
  async updateProduct(id: string, input: any, tenantId?: string): Promise<Product> {
    if (!id) {
      throw new ValidationError("Product ID is required for update");
    }

    const sanitized = { ...input };
    // Protect stock integrity from direct overwrite
    if ("unitsInStock" in sanitized) {
      delete sanitized.unitsInStock;
    }

    const parseResult = UpdateProductSchema.safeParse(sanitized);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Product update validation failed: ${errorMsg}`, parseResult.error.format());
    }

    return this.repo.update(id, parseResult.data, tenantId);
  }

  async deleteProduct(id: string, tenantId?: string): Promise<boolean> {
    if (!id) {
      throw new ValidationError("Product ID is required for deletion");
    }
    return this.repo.delete(id, tenantId);
  }

  /**
   * Adjusts stock via the atomic StockMovement audit ledger.
   */
  async updateStock(id: string, newQty: number, tenantId?: string): Promise<Product> {
    if (!id) {
      throw new ValidationError("Product ID is required for stock update");
    }
    if (newQty < 0) {
      throw new ValidationError("Stock quantity cannot be negative");
    }
    return this.stockMovementRepo.adjustStockAtomic(
      id,
      newQty,
      "MANUAL_ADJUSTMENT",
      "SYSTEM",
      "Manual stock adjustment",
      tenantId
    );
  }
}

export const productService = new ProductService();
