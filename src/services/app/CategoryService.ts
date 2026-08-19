import {
  Category,
  CreateCategorySchema,
  UpdateCategorySchema,
} from "../../domain/models/Category";
import { categoryRepository, CategoryRepository } from "../../repositories/CategoryRepository";
import { ValidationError, formatZodError } from "../../domain/errors/AppError";
import { QueryOptions } from "../../repositories/base/IRepository";

export class CategoryService {
  constructor(private repo: CategoryRepository = categoryRepository) {}

  async getCategories(tenantId?: string, options?: QueryOptions): Promise<Category[]> {
    return this.repo.getAll(tenantId, options);
  }

  async getCategoryById(id: string, tenantId?: string): Promise<Category | null> {
    if (!id) {
      throw new ValidationError("Category ID is required");
    }
    return this.repo.getById(id, tenantId);
  }

  async createCategory(input: unknown, tenantId?: string): Promise<Category> {
    const parseResult = CreateCategorySchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Category validation failed: ${errorMsg}`, parseResult.error.format());
    }

    return this.repo.create(parseResult.data, tenantId);
  }

  async updateCategory(id: string, input: unknown, tenantId?: string): Promise<Category> {
    if (!id) {
      throw new ValidationError("Category ID is required for update");
    }

    const parseResult = UpdateCategorySchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Category update validation failed: ${errorMsg}`, parseResult.error.format());
    }

    return this.repo.update(id, parseResult.data, tenantId);
  }

  async deleteCategory(id: string, tenantId?: string): Promise<boolean> {
    if (!id) {
      throw new ValidationError("Category ID is required for deletion");
    }
    return this.repo.delete(id, tenantId);
  }
}

export const categoryService = new CategoryService();
