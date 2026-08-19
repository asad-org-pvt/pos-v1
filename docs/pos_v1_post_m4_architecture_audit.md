# PoS-v1 Post-Milestone 4 Comprehensive Architectural Audit

> **Date:** 2026-08-18  
> **Auditor:** Independent Principal Architecture & Systems Audit  
> **Scope:** Full repository inspection (`src/`, `docs/`, `firestore.rules`, `database.rules.json`, tests, domain models, services, repositories, UI)  
> **Constraint:** Pure investigative audit. No implementation or source code modifications.

---

## A. Executive Summary

Milestone 4 succeeded in establishing the functional end-to-end retail loop: Supplier management, Purchase Orders, Supplier Receiving, weighted-average Cost tracking, controlled Inventory Adjustments, Stock Movement Ledger, Management Reporting, and CSV Exports.

However, an objective inspection of the actual source code reveals critical architectural debts that must be resolved before the system can be considered a production-grade POS:

1. **Transactional Sequence Bug in Sales & Returns:** In `OrderRepository.completeSale` and `ReturnRepository.processAtomicReturn`, `transaction.get(shiftRef)` is invoked *after* `transaction.update(productRef)` and `transaction.set(movementRef)`. In live Firestore SDK, all reads (`get`) must strictly precede all writes (`set`/`update`), causing runtime failures whenever sales or returns are linked to active cashier shifts.
2. **Historical Cost Distortion in Management Reporting:** `OrderItem` records do not persist a snapshot of the unit cost at the time of sale. As a result, `ReportingService` dynamically evaluates historical COGS against the product's *current* `costPrice`. When purchase costs change over time or products are deleted, historical gross margin and profit reports become retroactively incorrect.
3. **Open Firestore Security Rules & Client-Only Tenant Isolation:** `firestore.rules` allows open read/write access to any authenticated Firebase user on all `{collectionName}/{docId}` paths. Tenant isolation is enforced exclusively by client-side string prefixing (`${tenantId}-${collection}`). Any authenticated user can mutate another tenant's database by issuing SDK calls or modifying `localStorage.getItem("org")`.
4. **Unbounded Client-Side Aggregation:** `ReportingService.getSalesReport()` and `ExportService` execute unbounded `getAll()` queries that pull entire order and product datasets into browser RAM to compute totals in JavaScript.
5. **Completely Disconnected Offline Layer:** While `rxdb` and `@rxdb/plugins` are installed as npm packages, the POS engine, sales, returns, and inventory flows execute 100% against live Firestore with zero local caching, mutation queueing, or offline fallback.

---

## B. Transactional Core Findings

### Detailed Flow Traces

#### 1. POS Sale Checkout Flow
- **Trace:** `POSEngine` (UI) $\rightarrow$ `OrderService.completeSale()` $\rightarrow$ `OrderRepository.completeSale()` $\rightarrow$ Firestore `runTransaction`
- **Reads:** `transaction.get(productDocRef)` for all cart items.
- **Writes:**
  1. `transaction.update(productDocRef)` (decrements `unitsInStock`)
  2. `transaction.set(movementDocRef)` (creates `SALE` `StockMovement`)
  3. `transaction.set(orderDocRef)` (persists `Order`)
  4. `transaction.set(paymentDocRef)` (persists `Payment`)
  5. `transaction.get(shiftRef)` $\leftarrow$ **CRITICAL VIOLATION: READ OCCURS AFTER WRITES**
  6. `transaction.update(shiftRef)` (updates shift cash/card totals)
- **Atomicity:** All product stock decrements, movements, order, and payment are bundled in one transaction. However, the read-after-write violation causes live Firestore transaction rejection when `shiftId` is present.
- **Idempotency:** `findByIdempotencyKey` executes *prior to* the transaction outside the lock. Concurrent requests with the same idempotency key can enter the transaction in parallel.
- **Concurrency / Retry:** Firestore will automatically retry transaction on product document contention.

#### 2. Return & Refund Flow
- **Trace:** `OrderList` (UI) $\rightarrow$ `ReturnService.processReturn()` $\rightarrow$ `ReturnRepository.processAtomicReturn()` $\rightarrow$ Firestore `runTransaction`
- **Reads:** `transaction.get(orderRef)`, `transaction.get(productRef)` for returned items.
- **Writes:**
  1. `transaction.update(productRef)` (increments `unitsInStock`)
  2. `transaction.set(movDocRef)` (creates `RETURN` `StockMovement`)
  3. `transaction.update(orderRef)` (updates `returnedQuantity` and status)
  4. `transaction.get(shiftRef)` $\leftarrow$ **CRITICAL VIOLATION: READ OCCURS AFTER WRITES**
  5. `transaction.update(shiftRef)` (updates shift refund stats)
  6. `transaction.set(returnDocRef)` (persists `Return`)
- **Atomicity:** Bundles stock restore, movement, order refund status, and shift reconciliation. Contains the identical read-after-write ordering bug.

#### 3. Purchase Order Receiving Flow
- **Trace:** `PurchasingView` (UI) $\rightarrow$ `PurchaseOrderService.receiveItems()` $\rightarrow$ `PurchaseOrderRepository.receiveItemsAtomic()` $\rightarrow$ Firestore `runTransaction`
- **Reads:** `transaction.get(poRef)`, then `transaction.get(productRef)` for each line item.
- **Writes:**
  1. `transaction.update(productRef)` (increments `unitsInStock`, updates `costPrice` to weighted-average)
  2. `transaction.set(movRef)` (creates `RESTOCK` `StockMovement`)
  3. `transaction.update(poRef)` (updates `receivedQuantity` and status to `RECEIVED`/`PARTIALLY_RECEIVED`)
- **Atomicity:** **Correct.** All reads strictly precede all writes. Stock, weighted cost, movement ledger, and PO status update atomically.

#### 4. Inventory Adjustment Flow
- **Trace:** `StockMovementsView` (UI) $\rightarrow$ `StockMovementService.adjustStock()` $\rightarrow$ `StockMovementRepository.adjustStockAtomic()` $\rightarrow$ Firestore `runTransaction`
- **Reads:** `transaction.get(productRef)`
- **Writes:** `transaction.update(productRef)`, `transaction.set(movRef)`
- **Atomicity:** **Correct.** Reads precede writes. Negative-stock check is enforced inside transaction.

---

## C. Inventory Consistency Findings

| Mutation Source | Modifies `unitsInStock` | Writes `StockMovement` | Consistency Status |
|---|---|---|---|
| POS Sale (`completeSale`) | Yes | Yes (`SALE`, delta $< 0$) | Consistent |
| Customer Return (`processAtomicReturn`) | Yes | Yes (`RETURN`, delta $> 0$) | Consistent |
| PO Receiving (`receiveItemsAtomic`) | Yes | Yes (`RESTOCK`, delta $> 0$) | Consistent |
| Inventory Adjustment (`adjustStockAtomic`) | Yes | Yes (`ADJUSTMENT`, delta $\pm Q$) | Consistent |
| Direct Product Edit (`Product-form/index.tsx`) | **Yes** | **NO** | **INCONSISTENT (Bypasses Ledger)** |
| Legacy `ProductRepository.updateStock` | **Yes** | **NO** | **INCONSISTENT (Bypasses Ledger)** |

### Critical Leakage Paths:
1. **Product Edit Form Bypass:** When an admin edits product metadata in `src/ui/inventory/Inventory-form/index.tsx`, `unitsInStock` is submitted in the update payload. This executes `productService.updateProduct()`, directly modifying Firestore `unitsInStock` without creating an `ADJUSTMENT` movement or logging a reason.
2. **Legacy `updateStock`:** `ProductRepository.updateStock(id, newQty)` still exists in the codebase and mutates stock without an audit trail.

---

## D. Cost / COGS Audit

### Current Mathematical Implementation
In `ReportingService.getSalesReport`:
```typescript
const allOrders = await this.orderRepo.getAll(tenantId);
const products = await this.prodRepo.getAll(tenantId);

const costMap = new Map<string, number>();
products.forEach((p) => costMap.set(p.id, Number(p.costPrice) || 0));

for (const order of filteredOrders) {
  for (const item of order.products) {
    const cost = costMap.get(item.productId) || 0;
    const netQty = item.quantity - (item.returnedQuantity || 0);
    estimatedCogs += netQty * cost;
  }
}
```

### Flaws & Business Consequences:
1. **No Historical Cost Snapshot:** `OrderItem` does not store `costPrice` or `unitCost` at the moment of checkout.
2. **Retroactive Margin Corruption:** If Product A is acquired for \$10 in January and sold for \$20 (Gross Profit: \$10). In June, inflation pushes new restock unit cost to \$18. In July, running a January sales report evaluates the January sale at \$18 cost, displaying an incorrect Gross Profit of \$2 instead of \$10.
3. **Catalog Deletion Anomaly:** If a discontinued product is deleted from the product catalog, `costMap.get(pid)` returns `0`. All historical sales for that product immediately drop to \$0 COGS, falsely showing 100% gross profit.
4. **Weighted-Average Cost vs Negative Stock:** If stock was 0 or negative during manual adjustments and restocked, the weighted average formula defaults to the incoming unit cost.

---

## E. Reporting Audit

1. **Client-Side Data Dumping:**
   - All management reports (`SalesSummary`, `ProductSalesSummary`, `CashierSalesSummary`, `InventoryValuation`) perform an unbounded `orderRepo.getAll(tenantId)` and `prodRepo.getAll(tenantId)`.
   - In a store with 50,000 orders, every visit to the Reports tab downloads all 50,000 documents over the network.
2. **Cross-Period Refund Distortion:**
   - Refunds update the original `Order.refundedAmount` directly.
   - If Order #1 was purchased on Monday and refunded on Friday:
     - Friday's Shift Z-Report reflects the cash outflow of the refund.
     - Friday's Sales Report (filtered to Friday) excludes Order #1 because Order #1's `dateTime` is Monday.
     - Monday's Sales Report retroactively decreases net sales.
     - As a result, the Daily Sales Report and Daily Shift Report fail to reconcile on the day of the refund.
3. **Timezone Misalignment:**
   - Date filtering uses client browser local time (`new Date()`) against ISO UTC strings. A manager opening the report from a different timezone will aggregate transactions across shifted day boundaries.

---

## F. Security & Tenant Isolation Audit

| Security Domain | Implementation State | Production Risk |
|---|---|---|
| **Firestore Security Rules** | Open wildcard match `{collectionName}/{docId}` with `allow read, write: if isAuthenticated();` | **CRITICAL:** Any authenticated user can read/write any other tenant's collection directly via Firestore SDK. |
| **Realtime DB Rules** | `.read: auth != null`, `.write: auth != null` | **CRITICAL:** No tenant scoping or path restrictions. |
| **Tenant Switching** | Client-side `localStorage.setItem("org", id)` | **HIGH:** User can change `org` in browser DevTools and mutate target tenant data. |
| **Role Authorization** | UI-only conditional rendering (`isAdmin && <Organisation />`) | **HIGH:** No role enforcement in services, repositories, or Firestore rules. Cashiers can perform PO receiving, stock adjustments, and data exports. |
| **Custom Claims** | None used. Tenant ID and roles are not embedded in Firebase Auth JWT tokens. | **HIGH:** Inability to write secure server-side security rules based on `request.auth.token.tenantId`. |

---

## G. Offline Architecture Audit

1. **Current State:**
   - `rxdb`, `dexie`, and plugins are installed in `package.json`.
   - `src/services/local/rxdb.ts` and `src/services/local/schemas/orders/index.ts` exist as isolated prototypes.
   - **Zero Integration:** Neither `POSEngine`, `OrderRepository`, `ShiftRepository`, nor `StockMovementRepository` import or interact with `rxdb`.
2. **Operational Behavior During Outage:**
   - Any network drop causes immediate failure on checkout, returns, and inventory queries.
   - No local transaction queue exists.
   - No offline conflict resolution or sync replay exists.

---

## H. Data Model Audit

1. **`Product` vs `Inventory`:**
   - Duplicate concept: Both `Product` and `Inventory` models exist in `src/domain/models/`. `Product` is actively used while `Inventory` is redundant.
2. **`OrderItem` Missing Snapshots:**
   - Missing `unitCost` / `costPrice` snapshot at checkout.
   - Missing line-item tax and discount breakdown (`taxRate`, `taxAmount`, `discountAmount`).
3. **`Order` Duplicate Total Fields:**
   - Both `amountDue` and `total` are present and used interchangeably across components.
4. **Category Relationship:**
   - `Product.category` is stored as an unvalidated raw string rather than referencing a canonical `categoryId`.
5. **Inventory Adjustment Persistence:**
   - `InventoryAdjustment` exists only as an input schema; adjustments are logged as `StockMovement` records without a parent adjustment batch entity.

---

## I. Firestore Architecture Audit

1. **Root Collection Sprawl:**
   - Collections are flat-prefixed (`${tenantId}-products`, `${tenantId}-orders`, `${tenantId}-shifts`, `${tenantId}-stock_movements`, etc.).
   - With 1,000 tenants, Firestore root contains 12,000 flat collections, making management, indexing, and security rules unwieldy.
2. **Missing Composite Indexes:**
   - Queries with multi-field filters (e.g. `where("supplierId", "==", id)` + `orderBy("createdAt", "desc")`) require manual composite indexes in Firebase console.
3. **No Incremental Pre-Aggregation:**
   - Daily sales, product metrics, and register totals are computed on-the-fly from raw order documents rather than leveraging pre-aggregated daily summaries (`daily_summaries/{YYYY-MM-DD}`).

---

## J. Authorization Matrix (Actual Code State)

| Capability | Cashier | Manager | Admin | Actual Enforcement Level |
|---|---|---|---|---|
| **Sell / Checkout** | Allowed | Allowed | Allowed | Open |
| **Process Return / Refund** | Allowed | Allowed | Allowed | Open (No supervisor approval required) |
| **Open Shift** | Allowed | Allowed | Allowed | Open |
| **Close Shift & Reconcile** | Allowed | Allowed | Allowed | Open |
| **Adjust Stock** | Allowed | Allowed | Allowed | **Unrestricted** (Any authenticated user) |
| **Create Purchase Order** | Allowed | Allowed | Allowed | **Unrestricted** (Any authenticated user) |
| **Receive PO Stock** | Allowed | Allowed | Allowed | **Unrestricted** (Any authenticated user) |
| **Cancel Purchase Order** | Allowed | Allowed | Allowed | **Unrestricted** (Any authenticated user) |
| **View Management Reports** | Allowed | Allowed | Allowed | **Unrestricted** (Nav item visible to all) |
| **Export Financial Data** | Allowed | Allowed | Allowed | **Unrestricted** (Buttons accessible to all) |
| **Manage Products Catalog** | Allowed | Allowed | Allowed | **Unrestricted** (Full CRUD in UI) |
| **Manage Suppliers** | Allowed | Allowed | Allowed | **Unrestricted** (Full CRUD in UI) |
| **Manage Employees** | Allowed | Allowed | Allowed | **Unrestricted** (Full CRUD in UI) |
| **Manage Registers** | Allowed | Allowed | Allowed | **Unrestricted** (Full CRUD in UI) |
| **Manage Organization Info** | Hidden in UI | Hidden in UI | Allowed | **UI-Only** (Hidden from sidebar; open API) |

---

## K. UI / UX Architecture Audit

1. **Product Edit Form Stock Desynchronization:**
   - The Inventory Edit modal allows editing `unitsInStock` directly, completely bypassing the stock movement audit ledger.
2. **UI Domain Calculations:**
   - While `calculateSaleTotals` is in `SaleCalculations.ts`, certain components (e.g. `PurchasingView`, `OrderList` return calculator) compute line totals and taxes directly in inline React state.
3. **Stale Shift State:**
   - If a shift is closed on another terminal, the POS checkout screen retains the stale active shift in local state until a full page reload occurs.
4. **Missing Destructive Confirmations:**
   - Cancelling purchase orders or deleting suppliers does not feature robust confirmation dialogs or dependency validation.

---

## L. Test Coverage Audit

1. **Total Suites & Tests:** 9 test suites, 70 unit/integration tests passing 100%.
2. **What Is Real vs Mocked:**
   - Domain model validations (`Zod`), calculations (`SaleCalculations.ts`), error hierarchies, and CSV generation are tested with 100% genuine assertion depth.
   - Repositories and Services in `Milestone3Engine.test.ts` and `Milestone4Engine.test.ts` mock Firestore transaction primitives (`runTransaction`, `getDocs`, `doc`).
3. **Untested Scenarios:**
   - Firestore SDK transaction constraint rules (e.g. read-after-write order).
   - Real Firestore security rules evaluation (`@firebase/rules-unit-testing`).
   - Network failure, retry, and transaction abort rollbacks under concurrent contention.
   - Offline sync, mutation queueing, and conflict resolution.

---

## M. Architectural Debt Prioritization

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARCHITECTURAL DEBT MATRIX                       │
├────────────┬───────────────────────────────────────────────────────────┤
│ CRITICAL   │ 1. Read-After-Write violation in Sales & Returns txn      │
│            │ 2. Open Firestore security rules & client-only tenancy    │
│            │ 3. Direct stock mutation in Product Edit form             │
├────────────┼───────────────────────────────────────────────────────────┤
│ HIGH       │ 4. Missing historical cost snapshot on OrderItem (COGS)   │
│            │ 5. Unbounded getAll() queries for reporting and export    │
│            │ 6. Cross-period refund reporting reconciliation gap       │
│            │ 7. Complete lack of offline resilience & mutation queue   │
├────────────┼───────────────────────────────────────────────────────────┤
│ MEDIUM     │ 8. Flat collection root pollution (${tenantId}-*)         │
│            │ 9. UI-only authorization without service/rule checks      │
│            │ 10. Timezone misalignment in date range filters           │
│            │ 11. Redundant Inventory vs Product domain models          │
├────────────┼───────────────────────────────────────────────────────────┤
│ LOW        │ 12. Lack of composite index auto-declarations             │
│            │ 13. String-based category references                      │
│            │ 14. Deprecated style warnings in build logs               │
└────────────┴───────────────────────────────────────────────────────────┘
```

---

## N. 35-Capability Reassessment

| # | Capability Area | Functional State | Architectural Production-Readiness | Assessment Details |
|---|---|---|---|---|
| 1 | Sales & Checkout | **COMPLETE** | **PARTIAL** | Read-after-write bug with shifts; idempotency check outside txn |
| 2 | Product Management | **COMPLETE** | **PARTIAL** | Direct stock edit bypasses stock movement ledger |
| 3 | Inventory Management | **COMPLETE** | **COMPLETE** | Atomic adjustments & receiving; append-only ledger |
| 4 | Customer Management | **COMPLETE** | **COMPLETE** | Full CRUD, tenant scoped |
| 5 | Payments | **COMPLETE** | **COMPLETE** | Cash/Card tracking, change calculation |
| 6 | Employees & Roles | **COMPLETE** | **FOUNDATION ONLY** | No backend authorization enforcement |
| 7 | Registers & Terminals | **COMPLETE** | **COMPLETE** | Register stations, active checks |
| 8 | Multi-Store / Multi-Location | **FOUNDATION ONLY** | **FOUNDATION ONLY** | Tenant isolation in place; transfers missing |
| 9 | Purchasing & Suppliers | **COMPLETE** | **COMPLETE** | Atomic receiving, PO lifecycle, weighted cost |
| 10 | Sales & Business Reporting | **COMPLETE** | **PARTIAL** | Unbounded client-side queries; timezone issues |
| 11 | Tax & Accounting | **PARTIAL** | **PARTIAL** | Sales tax calculated; line-item tax breakdown missing |
| 12 | Pricing & Promotions | **PARTIAL** | **FOUNDATION ONLY** | Simple percentage discount; no rule engine |
| 13 | Returns & Refunds | **COMPLETE** | **PARTIAL** | Read-after-write bug with shifts; cross-period refund gap |
| 14 | Offline Operation & Sync | **FOUNDATION ONLY** | **NOT IMPLEMENTED** | RxDB not wired to transactional core |
| 15 | Security & Audit Logs | **COMPLETE** | **PARTIAL** | Rules open; client-only tenancy |
| 16 | Hardware Integrations | **COMPLETE** (Scope) | **COMPLETE** (Scope) | USB keyboard scanner, 80mm thermal CSS |
| 17 | Notifications | **COMPLETE** | **COMPLETE** | EmailJS inventory alert hooks |
| 18 | Barcode Scanning | **COMPLETE** | **COMPLETE** | Fast scanning, auto-increment |
| 19 | Cash Drawer & Float | **COMPLETE** | **COMPLETE** | Opening float, cash reconciliation |
| 20 | Customer Loyalty & Rewards | **NOT IMPLEMENTED** | **NOT IMPLEMENTED** | Out of scope |
| 21 | Gift Cards & Store Credit | **NOT IMPLEMENTED** | **NOT IMPLEMENTED** | Out of scope |
| 22 | Delivery & Routes | **FOUNDATION ONLY** | **FOUNDATION ONLY** | Routes/towns CRUD present |
| 23 | E-Commerce Sync | **NOT IMPLEMENTED** | **NOT IMPLEMENTED** | Out of scope |
| 24 | Mobile POS / Tablet Mode | **PARTIAL** | **PARTIAL** | Responsive layout |
| 25 | Shift & Time Tracking | **COMPLETE** | **COMPLETE** | Shift sessions, float, variance, Z-Reports |
| 26 | Stock Transfers | **NOT IMPLEMENTED** | **NOT IMPLEMENTED** | Out of scope |
| 27 | Purchase Orders | **COMPLETE** | **COMPLETE** | Full/partial receiving, over-receive block |
| 28 | Vendor Management | **COMPLETE** | **COMPLETE** | Supplier CRUD, PO linking |
| 29 | Expense Tracking | **NOT IMPLEMENTED** | **NOT IMPLEMENTED** | Out of scope |
| 30 | End-of-Day / Z-Reports | **COMPLETE** | **COMPLETE** | Reconciliation & thermal report printing |
| 31 | Data Portability & Export | **COMPLETE** | **PARTIAL** | Unbounded client queries |
| 32 | Third-Party API / Webhooks | **NOT IMPLEMENTED** | **NOT IMPLEMENTED** | Out of scope |
| 33 | User Preferences & Theming | **PARTIAL** | **PARTIAL** | Theme selection active |
| 34 | Multi-Currency | **FOUNDATION ONLY** | **FOUNDATION ONLY** | Currency code on Organization |
| 35 | Audit Trail & Compliance | **COMPLETE** | **COMPLETE** | Immutable stock ledger, audit events |

---

## O. Top 5 Priorities for Production Readiness

### 1. Fix Firestore Transaction Ordering (Read-Before-Write)
- **Why it matters:** In live Firestore, calling `transaction.get()` after `transaction.set()` or `transaction.update()` causes an immediate runtime exception. This breaks checkout and return workflows whenever active cashier shifts are linked.
- **Dependencies:** None. Must be fixed in `OrderRepository.completeSale` and `ReturnRepository.processAtomicReturn`.
- **Consequence without it:** Checkout crashes in real production environments with active shifts.

### 2. Lock Down Firestore Security Rules with Custom Claims
- **Why it matters:** Multi-tenancy is currently client-enforced. Any authenticated user can read or write any store's data by tampering with client requests or `localStorage`.
- **Dependencies:** Firebase Auth Custom Claims (`tenantId`, `role`).
- **Consequence without it:** Complete data leakage and vulnerability to unauthorized data destruction across tenants.

### 3. Capture Historical Cost Snapshot on `OrderItem`
- **Why it matters:** Historical profitability and COGS reports currently rewrite past margins whenever product cost changes.
- **Dependencies:** `OrderItem` schema and `completeSale` transaction.
- **Consequence without it:** Inaccurate financial accounting and corrupted historical profit analysis.

### 4. Close Inventory Mutation Leaks in UI
- **Why it matters:** Directly editing `unitsInStock` in the Product Edit Form desynchronizes inventory from the append-only `StockMovement` ledger.
- **Dependencies:** Restricting Product Edit form to non-stock fields, routing all quantity modifications exclusively through `adjustStockAtomic`.
- **Consequence without it:** Broken inventory audit trail and unreconcilable shrinkage.

### 5. Wire Offline Resilience & Mutation Queue
- **Why it matters:** Physical retail stores cannot tolerate POS stoppage during brief network fluctuations or internet provider outages.
- **Dependencies:** RxDB or Dexie local transaction queue with background Firestore replication.
- **Consequence without it:** Cashiers cannot ring up customers during network interruptions.

---

## P. Recommended Milestone 5 Scope

### Milestone 5: **Transactional Hardening, True Security Rules, Historical Accounting & Offline Resilience**

1. **Transactional & Concurrency Hardening:**
   - Reorder reads in `OrderRepository` and `ReturnRepository` so all document fetches precede writes.
   - Enforce transactional idempotency inside the lock.
2. **Security Rules & Custom Claims:**
   - Implement Firebase Auth Custom Claims for `tenantId` and `role` (`admin`, `manager`, `cashier`).
   - Replace open wildcard `firestore.rules` with strict tenant-scoped rules (`/organisations/{tenantId}/...`).
3. **Historical Accounting & Line-Item Economics:**
   - Add `unitCost`, `taxRate`, `taxAmount`, and `discountAmount` snapshots to `OrderItem`.
   - Update `ReportingService` to calculate COGS strictly from historical `item.unitCost`.
4. **Inventory Ledger Integrity:**
   - Remove stock quantity editing from `Inventory-form`; require explicit stock adjustments.
   - Deprecate legacy `ProductRepository.updateStock`.
5. **Offline Sales Queue & Replication Adapter:**
   - Integrate RxDB/Dexie local cache for products and registers.
   - Implement an offline sale mutation queue with automatic background sync upon reconnection.
