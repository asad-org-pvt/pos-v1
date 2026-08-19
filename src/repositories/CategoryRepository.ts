import { Category, CreateCategoryInput, UpdateCategoryInput } from "../domain/models/Category";
import { FirestoreBaseRepository } from "./base/FirestoreBaseRepository";

export class CategoryRepository extends FirestoreBaseRepository<Category, CreateCategoryInput, UpdateCategoryInput> {
  constructor() {
    super("categories");
  }

  async getCategoriesByType(categoryType: string, tenantId?: string): Promise<Category[]> {
    // Legacy support where categories were partitioned by type name
    return this.getAll(tenantId, {
      whereField: "type",
      whereOp: "==",
      whereValue: categoryType,
    });
  }
}

export const categoryRepository = new CategoryRepository();
