import { doc, writeBatch } from "firebase/firestore";
import { Product, CreateProductSchema } from "../../domain/models/Product";
import { StockMovement } from "../../domain/models/StockMovement";
import { Category } from "../../domain/models/Category";
import { Supplier } from "../../domain/models/Supplier";
import { firestore } from "../cloud/firebase";
import { addLog } from "../cloud/firebase/logging";

export interface RowValidationResult {
  rowNumber: number;
  raw: Record<string, string>;
  productData: Partial<Product>;
  status: "VALID" | "INVALID" | "DUPLICATE";
  isExistingInCatalog: boolean;
  existingProductId?: string;
  errors: string[];
  warnings: string[];
}

export interface ImportValidationSummary {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  newProductCount: number;
  existingProductCount: number;
  rowResults: RowValidationResult[];
}

export interface ImportExecutionResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  failedRows: Array<{ rowNumber: number; data: Record<string, string>; errors: string[] }>;
}

export class BulkProductImportService {
  private getDb() {
    return firestore.getInstance();
  }

  private normalizeKey(key: string): string {
    return key.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  private extractField(row: Record<string, string>, possibleKeys: string[]): string {
    const normalizedMap: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      normalizedMap[this.normalizeKey(k)] = v;
    }

    for (const pk of possibleKeys) {
      const norm = this.normalizeKey(pk);
      if (normalizedMap[norm] !== undefined && normalizedMap[norm] !== "") {
        return normalizedMap[norm].trim();
      }
    }
    return "";
  }

  /**
   * Validates raw CSV rows against domain constraints, tenant categories,
   * tenant suppliers, and existing catalog items.
   */
  validateImportData(
    rawRows: Array<Record<string, string>>,
    tenantCatalog: Product[],
    tenantCategories: Category[],
    tenantSuppliers: Supplier[]
  ): ImportValidationSummary {
    const rowResults: RowValidationResult[] = [];
    const seenSkus = new Map<string, number>();
    const seenBarcodes = new Map<string, number>();

    // Build lookup maps for existing catalog
    const catalogBySku = new Map<string, Product>();
    const catalogByBarcode = new Map<string, Product>();
    const catalogById = new Map<string, Product>();

    tenantCatalog.forEach((p) => {
      if (p.sku) catalogBySku.set(p.sku.toLowerCase(), p);
      if (p.barcode) catalogByBarcode.set(p.barcode.toLowerCase(), p);
      if (p.id) catalogById.set(p.id.toLowerCase(), p);
    });

    // Build category and supplier lookup maps
    const categoryByName = new Map<string, string>();
    tenantCategories.forEach((c) => {
      categoryByName.set(c.name.toLowerCase(), c.name);
      if (c.id) categoryByName.set(c.id.toLowerCase(), c.name);
    });

    const supplierByName = new Map<string, Supplier>();
    tenantSuppliers.forEach((s) => {
      supplierByName.set(s.name.toLowerCase(), s);
      if (s.id) supplierByName.set(s.id.toLowerCase(), s);
    });

    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;
    let newProductCount = 0;
    let existingProductCount = 0;

    rawRows.forEach((row, idx) => {
      const rowNumber = idx + 2; // +1 for 1-based index, +1 for header row
      const errors: string[] = [];
      const warnings: string[] = [];

      // Extract fields with flexible header matching
      const name = this.extractField(row, ["name", "productname", "title", "itemname", "product"]);
      const sku = this.extractField(row, ["sku", "skucode", "itemsku", "itemcode"]);
      const barcode = this.extractField(row, ["barcode", "barcodeid", "id", "upc", "ean"]);
      const rawPrice = this.extractField(row, ["sellingprice", "unitprice", "price", "saleprice"]);
      const rawCost = this.extractField(row, ["costprice", "cost", "supplyprice", "unitcost", "buyprice"]);
      const rawStock = this.extractField(row, ["unitsinstock", "stock", "initialstock", "quantity", "qty"]);
      const rawMin = this.extractField(row, ["minthreshold", "reorderlevel", "minimumthreshold", "minstock"]);
      const rawCategory = this.extractField(row, ["category", "categoryname", "categoryid"]);
      const rawSupplier = this.extractField(row, ["supplier", "suppliername", "supplierid"]);
      const description = this.extractField(row, ["description", "desc", "notes"]);
      const rawTax = this.extractField(row, ["taxperunit", "tax", "vat"]);

      // 1. Mandatory Field Validation
      if (!name) {
        errors.push("Product name is required.");
      }

      if (!rawPrice) {
        errors.push("Selling price is required.");
      }

      const unitPrice = parseFloat(rawPrice);
      if (isNaN(unitPrice) || unitPrice < 0) {
        errors.push(`Selling price must be a non-negative number (got: "${rawPrice}").`);
      }

      const costPrice = rawCost ? parseFloat(rawCost) : 0;
      if (isNaN(costPrice) || costPrice < 0) {
        errors.push(`Cost price must be a non-negative number (got: "${rawCost}").`);
      }

      const unitsInStock = rawStock ? parseInt(rawStock, 10) : 0;
      if (isNaN(unitsInStock) || unitsInStock < 0 || String(rawStock || "0").includes(".")) {
        errors.push(`Units in stock must be a non-negative integer (got: "${rawStock}").`);
      }

      const minThreshold = rawMin ? parseInt(rawMin, 10) : 5;
      if (isNaN(minThreshold) || minThreshold < 0) {
        errors.push(`Min threshold must be a non-negative integer (got: "${rawMin}").`);
      }

      const taxPerUnit = rawTax ? parseFloat(rawTax) : 0;
      if (isNaN(taxPerUnit) || taxPerUnit < 0) {
        errors.push(`Tax per unit must be a non-negative number (got: "${rawTax}").`);
      }

      // 2. Category Resolution
      let resolvedCategory = rawCategory;
      if (rawCategory) {
        const matched = categoryByName.get(rawCategory.toLowerCase());
        if (matched) {
          resolvedCategory = matched;
        } else {
          warnings.push(`Category "${rawCategory}" is not an existing tenant category.`);
        }
      }

      // 3. Supplier Resolution
      let resolvedSupplierId = "";
      let resolvedSupplierName = "";
      if (rawSupplier) {
        const matchedSup = supplierByName.get(rawSupplier.toLowerCase());
        if (matchedSup) {
          resolvedSupplierId = matchedSup.id;
          resolvedSupplierName = matchedSup.name;
        } else {
          warnings.push(`Supplier "${rawSupplier}" was not found in registered suppliers.`);
        }
      }

      // 4. Intra-File Duplicate Detection
      if (sku) {
        const lowerSku = sku.toLowerCase();
        if (seenSkus.has(lowerSku)) {
          const prevRow = seenSkus.get(lowerSku);
          errors.push(`Duplicate SKU "${sku}" already appeared on row ${prevRow}.`);
        } else {
          seenSkus.set(lowerSku, rowNumber);
        }
      }

      if (barcode) {
        const lowerBarcode = barcode.toLowerCase();
        if (seenBarcodes.has(lowerBarcode)) {
          const prevRow = seenBarcodes.get(lowerBarcode);
          errors.push(`Duplicate Barcode "${barcode}" already appeared on row ${prevRow}.`);
        } else {
          seenBarcodes.set(lowerBarcode, rowNumber);
        }
      }

      // 5. Existing Catalog Matching
      let isExistingInCatalog = false;
      let existingProductId: string | undefined = undefined;

      if (sku && catalogBySku.has(sku.toLowerCase())) {
        isExistingInCatalog = true;
        existingProductId = catalogBySku.get(sku.toLowerCase())?.id;
      } else if (barcode && catalogByBarcode.has(barcode.toLowerCase())) {
        isExistingInCatalog = true;
        existingProductId = catalogByBarcode.get(barcode.toLowerCase())?.id;
      } else if (barcode && catalogById.has(barcode.toLowerCase())) {
        isExistingInCatalog = true;
        existingProductId = catalogById.get(barcode.toLowerCase())?.id;
      }

      let status: "VALID" | "INVALID" | "DUPLICATE" = "VALID";
      if (errors.length > 0) {
        status = "INVALID";
        invalidCount++;
      } else if (isExistingInCatalog) {
        status = "DUPLICATE";
        duplicateCount++;
        existingProductCount++;
      } else {
        status = "VALID";
        validCount++;
        newProductCount++;
      }

      const productData: Partial<Product> = {
        name,
        sku: sku || undefined,
        barcode: barcode || undefined,
        unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
        costPrice: isNaN(costPrice) ? 0 : costPrice,
        unitsInStock: isNaN(unitsInStock) ? 0 : unitsInStock,
        minThreshold: isNaN(minThreshold) ? 5 : minThreshold,
        reorderLevel: isNaN(minThreshold) ? 5 : minThreshold,
        category: resolvedCategory || "",
        supplierId: resolvedSupplierId || undefined,
        supplierName: resolvedSupplierName || undefined,
        description: description || "",
        taxPerUnit: isNaN(taxPerUnit) ? 0 : taxPerUnit,
        status: (unitsInStock || 0) > 0 ? "AVAILABLE" : "OUT_OF_STOCK",
      };

      rowResults.push({
        rowNumber,
        raw: row,
        productData,
        status,
        isExistingInCatalog,
        existingProductId,
        errors,
        warnings,
      });
    });

    return {
      totalRows: rawRows.length,
      validCount,
      invalidCount,
      duplicateCount,
      newProductCount,
      existingProductCount,
      rowResults,
    };
  }

  /**
   * Commits validated items to Firestore in batches of 50 items.
   * Atomically generates OPENING_BALANCE StockMovement ledger entries
   * for items with unitsInStock > 0.
   */
  async executeBulkImport(
    rowResults: RowValidationResult[],
    tenantId: string,
    user: { uid?: string; displayName?: string; email?: string } | null,
    options: { mode: "CREATE_ONLY" | "CREATE_AND_UPDATE" } = { mode: "CREATE_ONLY" },
    onProgress?: (progressPercent: number) => void
  ): Promise<ImportExecutionResult> {
    const productsColl = `${tenantId}-products`;
    const movementsColl = `${tenantId}-stock_movements`;
    const now = new Date().toISOString();
    const operatorId = user?.uid || "SYSTEM";
    const operatorName = user?.displayName || user?.email?.split("@")[0] || "Manager";

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const failedRows: ImportExecutionResult["failedRows"] = [];

    // Filter items to process based on mode
    const itemsToProcess = rowResults.filter((r) => {
      if (r.status === "INVALID") {
        skipped++;
        return false;
      }
      if (r.status === "DUPLICATE") {
        if (options.mode === "CREATE_ONLY") {
          skipped++;
          return false;
        }
        return true; // CREATE_AND_UPDATE mode
      }
      return true;
    });

    if (itemsToProcess.length === 0) {
      return { total: rowResults.length, created: 0, updated: 0, skipped, failed: 0, failedRows: [] };
    }

    const BATCH_SIZE = 50;
    const totalBatches = Math.ceil(itemsToProcess.length / BATCH_SIZE);

    for (let b = 0; b < totalBatches; b++) {
      const batchItems = itemsToProcess.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
      const batch = writeBatch(this.getDb());

      const batchSummary: Array<{ type: "CREATE" | "UPDATE"; row: RowValidationResult }> = [];

      for (const item of batchItems) {
        try {
          if (item.isExistingInCatalog && options.mode === "CREATE_AND_UPDATE" && item.existingProductId) {
            // Update existing product metadata (protect unitsInStock from direct overwrite)
            const prodRef = doc(this.getDb(), productsColl, item.existingProductId);
            const updatePayload: Record<string, any> = {
              name: item.productData.name,
              unitPrice: item.productData.unitPrice,
              costPrice: item.productData.costPrice,
              minThreshold: item.productData.minThreshold,
              reorderLevel: item.productData.reorderLevel,
              category: item.productData.category || "",
              description: item.productData.description || "",
              taxPerUnit: item.productData.taxPerUnit || 0,
              updatedAt: now,
            };
            if (item.productData.sku) updatePayload.sku = item.productData.sku;
            if (item.productData.barcode) updatePayload.barcode = item.productData.barcode;
            if (item.productData.supplierId) updatePayload.supplierId = item.productData.supplierId;
            if (item.productData.supplierName) updatePayload.supplierName = item.productData.supplierName;

            batch.update(prodRef, updatePayload);
            batchSummary.push({ type: "UPDATE", row: item });
          } else {
            // Create new product
            const productId =
              item.productData.barcode ||
              `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const prodRef = doc(this.getDb(), productsColl, productId);

            const initialStock = Number(item.productData.unitsInStock) || 0;
            const productPayload: Product = {
              ...(item.productData as any),
              id: productId,
              tenantId,
              unitsInStock: initialStock,
              status: initialStock > 0 ? "AVAILABLE" : "OUT_OF_STOCK",
              createdAt: now,
              updatedAt: now,
            };

            batch.set(prodRef, productPayload);

            // Atomically create opening stock movement if stock > 0
            if (initialStock > 0) {
              const movementId = `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
              const movRef = doc(this.getDb(), movementsColl, movementId);

              const openingMovement: StockMovement = {
                id: movementId,
                tenantId,
                productId,
                productName: item.productData.name || "Product",
                type: "ADJUSTMENT",
                quantityDelta: initialStock,
                quantityBefore: 0,
                quantityAfter: initialStock,
                unitCost: Number(item.productData.costPrice) || 0,
                reason: "BULK_IMPORT_OPENING_BALANCE",
                performedBy: operatorId,
                performedByName: operatorName,
                timestamp: now,
                createdAt: now,
              };

              batch.set(movRef, openingMovement);
            }

            batchSummary.push({ type: "CREATE", row: item });
          }
        } catch (err: any) {
          failed++;
          failedRows.push({
            rowNumber: item.rowNumber,
            data: item.raw,
            errors: [err.message || "Failed to prepare batch operation"],
          });
        }
      }

      // Commit the batch to Firestore
      try {
        await batch.commit();
        batchSummary.forEach((s) => {
          if (s.type === "CREATE") created++;
          else if (s.type === "UPDATE") updated++;
        });
      } catch (err: any) {
        failed += batchSummary.length;
        batchSummary.forEach((s) => {
          failedRows.push({
            rowNumber: s.row.rowNumber,
            data: s.row.raw,
            errors: [`Firestore batch commit failed: ${err.message || "Network error"}`],
          });
        });
      }

      if (onProgress) {
        const percent = Math.round(((b + 1) / totalBatches) * 100);
        onProgress(percent);
      }
    }

    // Audit logging (non-blocking)
    addLog({
      message: `Bulk product CSV import completed: ${created} created, ${updated} updated, ${skipped} skipped, ${failed} failed`,
      type: failed > 0 ? "warn" : "info",
      path: "BulkProductImportService.executeBulkImport",
    }).catch((err) => console.warn("Audit log failed", err));

    return {
      total: rowResults.length,
      created,
      updated,
      skipped,
      failed,
      failedRows,
    };
  }
}

export const bulkProductImportService = new BulkProductImportService();
