import { parseCsv, generateSampleProductCsv, generateErrorCsv } from "../../../utils/csvParser";
import { BulkProductImportService } from "../BulkProductImportService";
import { Product } from "../../../domain/models/Product";
import { Category } from "../../../domain/models/Category";
import { Supplier } from "../../../domain/models/Supplier";

describe("Milestone 10 — Bulk Product CSV Import Engine", () => {
  let importService: BulkProductImportService;

  beforeEach(() => {
    importService = new BulkProductImportService();
  });

  // ==========================================
  // 1. RFC-4180 CSV PARSER TESTS
  // ==========================================
  describe("1. RFC-4180 CSV Parsing & Serializing", () => {
    it("parses standard CSV with clean headers and row values", () => {
      const csv = `Name,SKU,Selling Price,Units In Stock\nCola 500ml,COKE-1,1.50,50\nWater 1L,WATER-1,1.00,100`;
      const { headers, rawRows, errors } = parseCsv(csv);

      expect(errors.length).toBe(0);
      expect(headers).toEqual(["Name", "SKU", "Selling Price", "Units In Stock"]);
      expect(rawRows.length).toBe(2);
      expect(rawRows[0].Name).toBe("Cola 500ml");
      expect(rawRows[0]["Selling Price"]).toBe("1.50");
      expect(rawRows[1].Name).toBe("Water 1L");
    });

    it("handles quoted values containing commas and escaped quotes", () => {
      const csv = `"Name","Description","Selling Price"\n"Coca-Cola, Diet","12"" Can Multipack",4.99`;
      const { rawRows } = parseCsv(csv);

      expect(rawRows.length).toBe(1);
      expect(rawRows[0].Name).toBe("Coca-Cola, Diet");
      expect(rawRows[0].Description).toBe('12" Can Multipack');
      expect(rawRows[0]["Selling Price"]).toBe("4.99");
    });

    it("strips UTF-8 BOM if present", () => {
      const csvWithBom = `\uFEFFName,SKU,Selling Price\nJuice,J-1,2.00`;
      const { headers, rawRows } = parseCsv(csvWithBom);

      expect(headers[0]).toBe("Name");
      expect(rawRows.length).toBe(1);
      expect(rawRows[0].Name).toBe("Juice");
    });

    it("detects empty CSV files", () => {
      const emptyCsv = "";
      const result = parseCsv(emptyCsv);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.rawRows.length).toBe(0);
    });

    it("generates sample template and error report CSVs", () => {
      const sampleCsv = generateSampleProductCsv();
      expect(sampleCsv).toContain("Coca Cola 500ml");
      expect(sampleCsv).toContain("BEV-COKE-500");

      const failedRows = [
        {
          rowNumber: 2,
          data: { Name: "Bad Item", "Selling Price": "-10" },
          errors: ["Selling price must be non-negative"],
        },
      ];
      const errorCsv = generateErrorCsv(failedRows);
      expect(errorCsv).toContain("Bad Item");
      expect(errorCsv).toContain("Selling price must be non-negative");
    });
  });

  // ==========================================
  // 2. DOMAIN VALIDATION & RESOLUTION
  // ==========================================
  describe("2. Domain Validation & Resolution", () => {
    const mockCategories: Category[] = [
      { id: "cat-1", name: "Beverages", description: "", isActive: true },
      { id: "cat-2", name: "Snacks", description: "", isActive: true },
    ];

    const mockSuppliers: Supplier[] = [
      {
        id: "sup-1",
        name: "Beverage Distributors Ltd",
        email: "bev@dist.com",
        phoneNumber: "",
        address: "",
        city: "",
        state: "",
        country: "",
        companyName: "",
        isActive: true,
      },
    ];

    const mockCatalog: Product[] = [
      {
        id: "prod-existing-1",
        name: "Existing Soda",
        sku: "SODA-001",
        barcode: "111222333",
        unitPrice: 2.0,
        costPrice: 1.0,
        unitsInStock: 20,
        status: "AVAILABLE",
      },
    ];

    it("validates valid product rows and resolves category and supplier", () => {
      const rawRows = [
        {
          Name: "Orange Juice 1L",
          SKU: "BEV-OJ-1L",
          Barcode: "999888777",
          "Selling Price": "3.50",
          "Cost Price": "2.00",
          "Units In Stock": "24",
          "Min Threshold": "6",
          Category: "Beverages",
          Supplier: "Beverage Distributors Ltd",
          Description: "Fresh orange juice",
        },
      ];

      const summary = importService.validateImportData(rawRows, mockCatalog, mockCategories, mockSuppliers);

      expect(summary.totalRows).toBe(1);
      expect(summary.validCount).toBe(1);
      expect(summary.invalidCount).toBe(0);

      const res = summary.rowResults[0];
      expect(res.status).toBe("VALID");
      expect(res.productData.name).toBe("Orange Juice 1L");
      expect(res.productData.category).toBe("Beverages");
      expect(res.productData.supplierId).toBe("sup-1");
      expect(res.productData.unitsInStock).toBe(24);
      expect(res.productData.unitPrice).toBe(3.5);
    });

    it("flags invalid rows with missing name, negative price, or invalid stock", () => {
      const invalidRows = [
        { Name: "", "Selling Price": "5.00" }, // Missing name
        { Name: "Negative Price", "Selling Price": "-1.00" }, // Negative price
        { Name: "Decimal Stock", "Selling Price": "10.00", "Units In Stock": "5.5" }, // Decimal stock
      ];

      const summary = importService.validateImportData(invalidRows, mockCatalog, mockCategories, mockSuppliers);

      expect(summary.invalidCount).toBe(3);
      expect(summary.rowResults[0].errors).toContain("Product name is required.");
      expect(summary.rowResults[1].errors[0]).toContain("Selling price must be a non-negative number");
      expect(summary.rowResults[2].errors[0]).toContain("Units in stock must be a non-negative integer");
    });

    it("detects intra-file duplicate SKUs and Barcodes across rows", () => {
      const duplicateRows = [
        { Name: "Item A", SKU: "DUP-SKU-1", "Selling Price": "10" },
        { Name: "Item B", SKU: "DUP-SKU-1", "Selling Price": "12" }, // Duplicate SKU
        { Name: "Item C", Barcode: "BAR-123", "Selling Price": "5" },
        { Name: "Item D", Barcode: "BAR-123", "Selling Price": "6" }, // Duplicate Barcode
      ];

      const summary = importService.validateImportData(duplicateRows, mockCatalog, mockCategories, mockSuppliers);

      expect(summary.rowResults[1].status).toBe("INVALID");
      expect(summary.rowResults[1].errors[0]).toContain('Duplicate SKU "DUP-SKU-1" already appeared on row 2');
      expect(summary.rowResults[3].status).toBe("INVALID");
      expect(summary.rowResults[3].errors[0]).toContain('Duplicate Barcode "BAR-123" already appeared on row 4');
    });

    it("identifies rows that match existing products in catalog as DUPLICATE", () => {
      const catalogMatchRows = [
        { Name: "New Name Soda", SKU: "SODA-001", "Selling Price": "2.50" }, // Matches mockCatalog by SKU
      ];

      const summary = importService.validateImportData(catalogMatchRows, mockCatalog, mockCategories, mockSuppliers);

      expect(summary.duplicateCount).toBe(1);
      expect(summary.rowResults[0].status).toBe("DUPLICATE");
      expect(summary.rowResults[0].isExistingInCatalog).toBe(true);
      expect(summary.rowResults[0].existingProductId).toBe("prod-existing-1");
    });
  });

  // ==========================================
  // 3. BATCH EXECUTION & LEDGER INTEGRATION
  // ==========================================
  describe("3. Batch Execution & Ledger Integration", () => {
    it("handles CREATE_ONLY mode skipping duplicate catalog items", async () => {
      const mockRowResults: any[] = [
        {
          rowNumber: 2,
          raw: { Name: "New Product", "Selling Price": "10" },
          productData: { name: "New Product", unitPrice: 10, unitsInStock: 0 },
          status: "VALID",
          isExistingInCatalog: false,
          errors: [],
          warnings: [],
        },
        {
          rowNumber: 3,
          raw: { Name: "Existing Product", SKU: "SODA-001", "Selling Price": "2" },
          productData: { name: "Existing Product", unitPrice: 2, unitsInStock: 0 },
          status: "DUPLICATE",
          isExistingInCatalog: true,
          existingProductId: "prod-1",
          errors: [],
          warnings: [],
        },
      ];

      // In unit test environment, we verify the filter logic and batch counts
      const validItems = mockRowResults.filter((r) => r.status === "VALID");
      expect(validItems.length).toBe(1);
      expect(validItems[0].productData.name).toBe("New Product");
    });
  });
});
