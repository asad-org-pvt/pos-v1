export interface QueryOptions {
  limit?: number;
  orderByField?: string;
  orderDirection?: "asc" | "desc";
  whereField?: string;
  whereOp?: "<" | "<=" | "==" | "!=" | ">=" | ">" | "array-contains";
  whereValue?: unknown;
}

export interface IRepository<T, TCreateInput = Omit<T, "id">, TUpdateInput = Partial<T>> {
  getById(id: string, tenantId?: string): Promise<T | null>;
  getAll(tenantId?: string, options?: QueryOptions): Promise<T[]>;
  create(data: TCreateInput, tenantId?: string): Promise<T>;
  update(id: string, data: TUpdateInput, tenantId?: string): Promise<T>;
  delete(id: string, tenantId?: string): Promise<boolean>;
}
