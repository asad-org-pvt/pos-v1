import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  WhereFilterOp,
} from "firebase/firestore";
import { firebaseFirestore } from "../../services";
import { getRuntimeTenantId } from "../../context/tenantRuntime";
import {
  AppError,
  NotFoundError,
  PersistenceError,
  UnauthorizedError,
  ValidationError,
} from "../../domain/errors/AppError";
import { IRepository, QueryOptions } from "./IRepository";

export abstract class FirestoreBaseRepository<T extends { id: string }, TCreate = Omit<T, "id">, TUpdate = Partial<T>>
  implements IRepository<T, TCreate, TUpdate>
{
  protected readonly collectionPrefix: string;

  constructor(collectionPrefix: string) {
    this.collectionPrefix = collectionPrefix;
  }

  protected getDb() {
    return firebaseFirestore.getInstance();
  }

  /**
   * Resolves the active tenant ID.
   */
  public resolveTenantId(tenantId?: string): string {
    const activeTenant = tenantId || getRuntimeTenantId();
    return activeTenant && activeTenant !== "default" ? activeTenant : "default";
  }

  public resolveTenant(tenantId?: string): string {
    return this.resolveTenantId(tenantId);
  }

  /**
   * Resolves the collection path scoped to the tenant.
   * If tenantId is provided, uses that; otherwise falls back to runtime tenant.
   */
  public getCollectionName(tenantId?: string): string {
    const activeTenant = tenantId || getRuntimeTenantId();
    if (!activeTenant || activeTenant === "default") {
      return this.collectionPrefix;
    }
    return `${activeTenant}-${this.collectionPrefix}`;
  }

  protected mapDoc(docSnapshot: any): T {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      ...data,
    } as T;
  }

  protected handleError(error: any, operation: string, entityId?: string): never {
    if (error instanceof AppError) {
      throw error;
    }

    const code = error?.code || "";
    const message = error?.message || "Unknown database error";

    if (code === "permission-denied") {
      throw new UnauthorizedError(`Permission denied during ${operation}`, { original: error });
    }
    if (code === "not-found") {
      throw new NotFoundError(this.collectionPrefix, entityId, { original: error });
    }
    if (code === "invalid-argument") {
      throw new ValidationError(`Invalid data provided for ${operation}: ${message}`, { original: error });
    }

    throw new PersistenceError(`Database error during ${operation} on ${this.collectionPrefix}: ${message}`, {
      original: error,
    });
  }

  async getById(id: string, tenantId?: string): Promise<T | null> {
    try {
      const collName = this.getCollectionName(tenantId);
      const docRef = doc(this.getDb(), collName, id);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }
      return this.mapDoc(snapshot);
    } catch (err) {
      this.handleError(err, "getById", id);
    }
  }

  async getAll(tenantId?: string, options?: QueryOptions): Promise<T[]> {
    try {
      const collName = this.getCollectionName(tenantId);
      let q = collection(this.getDb(), collName) as any;

      const constraints: any[] = [];
      if (options?.whereField && options?.whereOp && options?.whereValue !== undefined) {
        constraints.push(where(options.whereField, options.whereOp as WhereFilterOp, options.whereValue));
      }
      if (options?.orderByField) {
        constraints.push(orderBy(options.orderByField, options.orderDirection || "asc"));
      }
      if (options?.limit && options.limit > 0) {
        constraints.push(firestoreLimit(options.limit));
      }

      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => this.mapDoc(docSnap));
    } catch (err) {
      this.handleError(err, "getAll");
    }
  }

  async create(data: TCreate, tenantId?: string): Promise<T> {
    try {
      const collName = this.getCollectionName(tenantId);
      const generatedId = (data as any)?.id || `${this.collectionPrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      const payload = {
        ...data,
        id: generatedId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = doc(this.getDb(), collName, generatedId);
      await setDoc(docRef, payload);

      return payload as unknown as T;
    } catch (err) {
      this.handleError(err, "create");
    }
  }

  async update(id: string, data: TUpdate, tenantId?: string): Promise<T> {
    try {
      const collName = this.getCollectionName(tenantId);
      const docRef = doc(this.getDb(), collName, id);

      const payload = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(docRef, payload as any);
      const updated = await this.getById(id, tenantId);
      if (!updated) {
        throw new NotFoundError(this.collectionPrefix, id);
      }
      return updated;
    } catch (err) {
      this.handleError(err, "update", id);
    }
  }

  async delete(id: string, tenantId?: string): Promise<boolean> {
    try {
      const collName = this.getCollectionName(tenantId);
      const docRef = doc(this.getDb(), collName, id);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      this.handleError(err, "delete", id);
    }
  }
}
