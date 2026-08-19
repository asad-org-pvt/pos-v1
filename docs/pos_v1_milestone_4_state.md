# PoS-v1 Milestone 4 State Assessment: Purchasing, Receiving, Inventory Adjustments, Cost Foundation & Management Reporting

> **Date:** 2026-08-18  
> **Milestone:** Milestone 4 — Purchasing, Receiving, Inventory Adjustments, Cost Foundation & Management Reporting  
> **Status:** COMPLETED & VALIDATED (9 Test Suites, 70 Tests Passing, Build Passing)

---

## A. What Was Actually Implemented

### 1. Purchase Orders & Supplier Procurement
- **`PurchaseOrder` Entity & Repository ([`src/domain/models/PurchaseOrder.ts`](file:///Users/home/Documents/GitHub/pos-v1/src/domain/models/PurchaseOrder.ts), [`src/repositories/PurchaseOrderRepository.ts`](file:///Users/home/Documents/GitHub/pos-v1/src/repositories/PurchaseOrderRepository.ts), [`src/services/app/PurchaseOrderService.ts`](file:///Users/home/Documents/GitHub/pos-v1/src/services/app/PurchaseOrderService.ts)):**
  - Full PO lifecycle (`DRAFT`, `ORDERED`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CANCELLED`).
  - Item-level ordered vs received quantity tracking with over-receiving prevention (`receivedNow <= ordered - alreadyReceived`).
  - PO Management UI ([`src/ui/purchasing/index.tsx`](file:///Users/home/Documents/GitHub/pos-v1/src/ui/purchasing/index.tsx)) supporting supplier selection, product line items, unit cost entry, status filtering, and PO cancellation.

### 2. Supplier Receiving Transaction & Cost Foundation
- **Atomic Receiving Transaction (`PurchaseOrderRepository.receiveItemsAtomic`):**
  - In a single Firestore `runTransaction`:
    1. Validates PO and product records.
    2. Increases product `unitsInStock`: $\text{newStock} = \text{currentStock} + \text{receivedNow}$.
    3. Updates product `costPrice` basis using a weighted-average cost formula:
       $$\text{newCostPrice} = \frac{(\text{currentStock} \times \text{currentCost}) + (\text{receivedNow} \times \text{unitCost})}{\text{newStock}}$$
    4. Creates immutable `RESTOCK` `StockMovement` records capturing unit cost, supplier, and PO reference.
    5. Updates PO items received quantities and transitions PO status (`RECEIVED` or `PARTIALLY_RECEIVED`).

### 3. Inventory Adjustments & Movement History
- **`InventoryAdjustment` Domain & Service ([`src/domain/models/InventoryAdjustment.ts`](file:///Users/home/Documents/GitHub/pos-v1/src/domain/models/InventoryAdjustment.ts), [`src/services/app/StockMovementService.ts`](file:///Users/home/Documents/GitHub/pos-v1/src/services/app/StockMovementService.ts)):**
  - Controlled stock adjustments with categorized reasons (`COUNT_CORRECTION`, `DAMAGE`, `SPOILAGE`, `SHRINKAGE`, `OTHER`).
  - Negative-stock prevention: Rejects adjustments that would drive stock below zero.
  - Updates product `unitsInStock` and appends `ADJUSTMENT` `StockMovement` records atomically.
- **Stock Movement History View ([`src/ui/inventory/stock-movements/index.tsx`](file:///Users/home/Documents/GitHub/pos-v1/src/ui/inventory/stock-movements/index.tsx)):**
  - Full audit ledger table with type filters (`SALE`, `RETURN`, `RESTOCK`, `ADJUSTMENT`), delta badges, unit cost tracking, reason strings, and "Adjust Stock" modal.

### 4. Management Reporting & Analytics Engine
- **`ReportingService` ([`src/services/app/ReportingService.ts`](file:///Users/home/Documents/GitHub/pos-v1/src/services/app/ReportingService.ts)):**
  - Preset date range filtering (`today`, `yesterday`, `last7days`, `last30days`, `all`, `custom`).
  - **Sales Summary KPI:** Gross sales, refunds, net sales, transaction count, average ticket size, cash/card/other breakdown.
  - **Estimated Gross Profitability:** Revenue, Estimated COGS, Gross Profit, and Gross Margin %.
  - **Product Performance Rankings:** Units sold, units returned, net units, net revenue, estimated product profit.
  - **Cashier Sales Summary:** Transactions count, gross/refund/net sales per cashier.
  - **Inventory Valuation:** Total retail valuation, total cost basis valuation, potential profit, low-stock alerts.
- **Reports Dashboard UI ([`src/ui/reports/index.tsx`](file:///Users/home/Documents/GitHub/pos-v1/src/ui/reports/index.tsx)):**
  - Integrated KPI cards, payment tender breakdowns, top-selling products table, cashier rankings, and date picker.

### 5. Data Export Engine
- **`ExportService` ([`src/services/app/ExportService.ts`](file:///Users/home/Documents/GitHub/pos-v1/src/services/app/ExportService.ts)):**
  - Standard RFC 4180 compliant CSV export with automatic browser download for Sales, Inventory, Stock Movements, Purchase Orders, and Cashier Shifts.

---

## B. Current Supply-Chain Flow

```
1. Supplier Management: Supplier registered in tenant directory
                               ↓
2. Purchase Order Created: Manager selects supplier & products with ordered quantities & unit costs
                               ↓
3. PO Ordered (Status: ORDERED)
                               ↓
4. Supplier Receiving (Full or Partial):
   ├─ Verifies: receivedNow <= remaining
   ├─ In Single Atomic Transaction:
   │  ├─ Increments product.unitsInStock
   │  ├─ Updates product.costPrice (Weighted-Average Cost)
   │  ├─ Appends RESTOCK StockMovement (delta > 0, unitCost, supplierId, poNumber)
   │  └─ Updates PO receivedQuantity & status (PARTIALLY_RECEIVED or RECEIVED)
                               ↓
5. Sales & Inventory Decrement:
   ├─ POS Checkout decrements unitsInStock
   └─ Appends SALE StockMovement (delta < 0)
                               ↓
6. Returns & Inventory Restoration:
   ├─ Return checkout restores unitsInStock
   └─ Appends RETURN StockMovement (delta > 0)
                               ↓
7. Management Reporting & Export:
   └─ ReportingService aggregates sales, refunds, net COGS, gross margin, and exports CSVs
```

---

## C. Current Inventory Lifecycle

Every inventory change in PoS-v1 is strictly paired with an immutable `StockMovement` record in the SAME atomic transaction:

| Operational Event | Product Stock Change | Movement Type | Movement Delta | Attributed Reference |
|---|---|---|---|---|
| **PO Receiving** | $\text{Stock} + \text{Received}$ | `RESTOCK` | $+Q$ | PO Number & Supplier |
| **POS Sale Checkout** | $\text{Stock} - \text{Quantity}$ | `SALE` | $-Q$ | Sales Invoice Number |
| **Customer Return** | $\text{Stock} + \text{Returned}$ | `RETURN` | $+Q$ | Return Invoice Number |
| **Inventory Adjustment** | $\text{Stock} + \text{Delta}$ | `ADJUSTMENT` | $\pm Q$ | Reason (Damage, Spoilage, Recount) |

---

## D. Current Cost Model

1. **Current Product Cost Basis:** Each product holds a `costPrice` representing its current acquisition cost.
2. **Weighted-Average Cost Update:** Upon receiving inventory against a Purchase Order:
   $$\text{New Cost Price} = \frac{(\text{Current Stock} \times \text{Current Cost}) + (\text{Received Qty} \times \text{Unit Cost})}{\text{Current Stock} + \text{Received Qty}}$$
3. **Cost History Preservation:** Historical unit costs are permanently preserved inside `PurchaseOrderItem` records and `StockMovement` records.
4. **Estimated COGS & Gross Profit:**
   - $\text{Estimated COGS} = \sum (\text{Sold Qty} - \text{Returned Qty}) \times \text{Product Cost Price}$
   - $\text{Gross Profit} = \text{Net Sales} - \text{Estimated COGS}$
   - $\text{Gross Margin \%} = \frac{\text{Gross Profit}}{\text{Net Sales}} \times 100$
   - *Note: Clearly labeled as an operational estimate rather than accounting-grade FIFO/LIFO ledger.*

---

## E. Reporting Architecture & Scalability

```
React UI (ReportsView / PurchasingView / Inventory)
                       ↓
Application Services (ReportingService / PurchaseOrderService / ExportService)
                       ↓
Repositories (OrderRepository, ProductRepository, StockMovementRepository)
                       ↓
Firestore Tenant Collections (${tenantId}-orders, ${tenantId}-products, ${tenantId}-stock_movements)
```

**Scalability Limitations & Considerations:**
- In the current Firestore architecture, reporting performs tenant-scoped queries with in-memory aggregation. For high-volume enterprise stores (>100k sales/year), date-partitioned indexing or Cloud Functions pre-aggregated daily summaries (`daily_sales_summaries`) will be recommended.
- Current client-side CSV generation is fast and reliable for tens of thousands of rows using `Blob` URLs.

---

## F. Current POS Capability Status (35 Areas)

| # | Capability Area | Status | Milestone 4 Assessment |
|---|---|---|---|
| 1 | Sales & Checkout | **COMPLETE** | Barcode scanning, customer linking, atomic checkout, change calculation |
| 2 | Product Management | **COMPLETE** | Full CRUD, category mapping, barcode/SKU indexing, cost price tracking |
| 3 | Inventory Management | **COMPLETE** | Atomic stock updates, threshold alerts, movements ledger, adjustments |
| 4 | Customer Management | **COMPLETE** | Full CRUD, walk-in support, sale linkage |
| 5 | Payments | **COMPLETE** | Cash, Card, Other payment tracking, cash change calculations |
| 6 | Employees & Roles | **COMPLETE** | Employee CRUD, cashier attribution on shifts, sales, and returns |
| 7 | Registers & Terminals | **COMPLETE** | Register stations CRUD, status management, active register lookup |
| 8 | Multi-store & Multi-location | **FOUNDATION ONLY** | Tenant isolation in place; multi-store inventory transfers pending |
| 9 | Purchasing & Suppliers | **COMPLETE** | Supplier CRUD, Purchase Orders, atomic supplier receiving, restock ledger |
| 10 | Sales & Business Reporting | **COMPLETE** | Date range sales KPI, product rankings, cashier sales, inventory valuation |
| 11 | Tax & Accounting | **PARTIAL** | Authoritative tax calculations on sales, drawer cash reconciliation |
| 12 | Pricing & Promotions | **PARTIAL** | Percentage discount engine on sales; complex promotion rule engine pending |
| 13 | Returns, Refunds & Exchanges | **COMPLETE** | Full/partial item returns, stock restoration, atomic refund receipts |
| 14 | Offline Operation & Sync | **FOUNDATION ONLY** | RxDB installed; mutation queue & replication adapter pending |
| 15 | Security & Audit Logs | **COMPLETE** | Authenticated security rules, append-only movement ledger, audit logs |
| 16 | Hardware Integrations | **COMPLETE** (M4 Scope) | USB barcode keyboard scanner input, 80mm thermal receipt & report CSS |
| 17 | Notifications | **COMPLETE** | Decoupled EmailJS notifications for inventory alerts and receipts |
| 18 | Barcode Scanning & Labeling | **COMPLETE** (M4 Scope) | Fast barcode / SKU input with auto-add and duplicate quantity increment |
| 19 | Cash Drawer & Float Management | **COMPLETE** | Opening float, cash sales, cash refunds, expected cash calculation, closing reconciliation |
| 20 | Customer Loyalty & Rewards | **NOT IMPLEMENTED** | CRM points / rewards engine out of scope |
| 21 | Gift Cards & Store Credit | **NOT IMPLEMENTED** | Stored-value ledger out of scope |
| 22 | Delivery & Order Tracking | **FOUNDATION ONLY** | Sales routes / towns CRUD present |
| 23 | E-commerce Synchronization | **NOT IMPLEMENTED** | Out of scope |
| 24 | Mobile POS / Tablet Mode | **PARTIAL** | Responsive layout in place |
| 25 | Shift & Time Tracking | **COMPLETE** | Shift sessions, float tracking, closing cash reconciliation, Z-Reports |
| 26 | Stock Transfers | **NOT IMPLEMENTED** | Multi-store inventory transfers out of scope |
| 27 | Purchase Orders | **COMPLETE** | PO creation, line items, status progression, full & partial receiving |
| 28 | Vendor Management | **COMPLETE** | Supplier entity and CRUD complete, PO supplier linking |
| 29 | Expense Tracking | **NOT IMPLEMENTED** | Out of scope |
| 30 | End-of-Day / Z-Reports | **COMPLETE** | End-of-Day Z-Report generation, reconciliation, and thermal printing |
| 31 | Data Portability & Export | **COMPLETE** | Standard CSV export for sales, inventory, movements, POs, and shifts |
| 32 | Third-Party API & Webhooks | **NOT IMPLEMENTED** | Out of scope |
| 33 | User Preferences & Theming | **PARTIAL** | Theming and profile management active |
| 34 | Multi-Currency Support | **FOUNDATION ONLY** | Currency code on Organization schema |
| 35 | Audit Trail & Compliance | **COMPLETE** | Append-only stock ledger, shift logs, sale audit events |

---

## G. Remaining Architectural Problems

1. **Offline Sync & Continuous Replication:** The POS requires internet connectivity for Firestore transactions. An offline transaction queueing adapter with local conflict resolution will complete the resilience story.
2. **Promotions & Rule Engine:** Discounts currently operate via default percentage or manual adjustment rather than automated rule-based promotions (e.g. BOGO, happy hour, item category discounts).
3. **Advanced Customer CRM & Loyalty:** Customers can be associated with orders, but loyalty points, purchase history tiers, and store credit are not yet active.

---

## H. Next Milestone Recommendation

### Recommended Milestone 5: **Offline Resilience, Synchronization & Automated Promotions Engine**

With the full core retail loop (Purchasing $\rightarrow$ Receiving $\rightarrow$ Inventory $\rightarrow$ Sales $\rightarrow$ Shifts $\rightarrow$ Returns $\rightarrow$ Reporting) now fully operational, Milestone 5 should focus on:
1. **Offline Sales Resilience & RxDB Sync:** Offline checkout queueing when network drops, local cache fallback, and background replay when connection restores.
2. **Automated Discounts & Promotions Engine:** Configurable promotional rules (Buy X Get Y, Category Discounts, Happy Hour time-based pricing, Minimum Spend discounts).
3. **Customer Purchase History & Insights:** View past orders directly on Customer profile, export customer statements, and calculate lifetime customer value.
