# Milestone 5 State Assessment: Production Hardening, Transaction Correctness & Security

## 1. Executive Summary

Milestone 5 transforms the PoS-v1 system from a functional prototype into a hardened, secure, and transactionally reliable retail POS engine. Following the findings of the Post-M4 Architectural Audit, this milestone addressed core systemic vulnerabilities:
1. **Transaction Ordering Correctness**: Enforced strict read-before-write sequencing across all Firestore transactions in `OrderRepository`, `ReturnRepository`, `PurchaseOrderRepository`, `StockMovementRepository`, and `ShiftRepository`.
2. **Idempotency & Concurrency Protection**: Implemented dedicated transactional idempotency locks (`idempotency/{key}`) inside `completeSale` and `processAtomicReturn` to guarantee zero duplicate orders, double-decrementing stock, or ghost shift tallies during network retries or rapid button clicks.
3. **Server-Side Security & Tenant Isolation**: Replaced open wildcard rules with custom claims-based tenant scoping (`request.auth.token.tenantId`) and role-based access control (RBAC) covering `cashier`, `manager`, and `admin` roles in both `firestore.rules` and `database.rules.json`.
4. **Inventory Ledger Integrity**: Eliminated direct `unitsInStock` editing from `Inventory-form` and stripped direct stock mutation attempts in `ProductService.updateProduct`. All inventory mutations now strictly pass through audited `StockMovement` operations (`SALE`, `RETURN`, `RESTOCK`, `ADJUSTMENT`).
5. **Historical Financial Economics & Stable COGS**: Extended `OrderItem` to store immutable historical snapshots of `unitCost`, `taxRate`, `taxAmount`, `discountAmount`, `lineSubtotal`, and `lineTotal`. Re-architected `ReportingService` to compute COGS strictly from `OrderItem.unitCost`, guaranteeing stable financial metrics even if product catalog costs change or products are archived.
6. **Cross-Period Refund Reporting**: Decoupled period refunds from original sale order timestamps by tracking returns as discrete historical events via `ReturnRepository.getByDateRange`. Returns processed on Friday for a Monday sale accurately reflect in Friday's drawer reconciliation and net sales without retroactively corrupting Monday's sales figures.
7. **Offline Foundation & Durable Sale Queue**: Created `OfflineSyncService` with automated connectivity detection, local product catalog caching, and a resilient, durable local mutation queue (`QUEUED`, `SYNCING`, `SYNCED`, `FAILED`) with automatic idempotent replay when connectivity is restored.

---

## 2. Deep Technical Implementation

### 2.1 Transactional Core & Read-Before-Write Enforcement
In Firestore Web SDK, executing a `transaction.get()` after any write (`set`, `update`, `delete`) causes fatal transaction rejection. We restructured the transactional repositories into three distinct, sequential phases:
- **Phase 1 (Strict Reads)**: All documents required for evaluation (idempotency locks, order docs, product docs, shift docs) are fetched upfront using `transaction.get()`.
- **Phase 2 (In-Memory Validation & Calculation)**: Business logic, stock availability checks, and snapshots are computed purely in memory. If any condition fails, a domain exception is thrown, rolling back all operations atomically.
- **Phase 3 (Strict Atomic Writes)**: All document writes (`transaction.update`, `transaction.set`) occur after all reads have completed.

### 2.2 Idempotency Architecture
- A dedicated collection `${tenantId}-idempotency` records the association between `idempotencyKey` and `orderId`.
- Inside the atomic transaction, the lock document is checked. If it already exists, the transaction aborts write actions and returns the existing completed order record safely without double-charging or deducting stock twice.

### 2.3 Firestore & Realtime Database Security Rules
- **Custom Claims Validation**: Evaluates `request.auth.token.tenantId` and `request.auth.token.role`.
- **Tenant Scoping**: All queries and document paths must prefix-match the authenticated tenant ID (`collectionName.matches('^' + getUserTenant() + '-.*')` or hierarchical `/organisations/{orgId}`).
- **Role Permissions**:
  - `cashier`: Allowed to complete sales, process returns, view product catalog, and read own shift records.
  - `manager`: Allowed to adjust stock, manage purchase orders, and access cashier shifts and reports.
  - `admin`: Full administrative access to tenant configuration, user management, and platform analytics.

### 2.4 Historical Economics & COGS Stability
Previous versions dynamically queried current `Product.costPrice` when computing historical COGS in `ReportingService`. If a product's supply price rose from $10 to $15 months after a sale, historical gross margins would retroactively drop.
- `OrderItem` now persists:
  - `unitCost`: Historical unit cost at the moment of checkout.
  - `lineSubtotal`: Pre-tax line subtotal.
  - `taxAmount`: Line tax snapshot.
  - `discountAmount`: Line discount snapshot.
  - `lineTotal`: Final line total after tax and discount.
- `ReportingService` calculates:
  $$\text{Historical COGS} = \sum (\text{OrderItem.quantity} - \text{OrderItem.returnedQuantity}) \times \text{OrderItem.unitCost}$$

### 2.5 Cross-Period Refund Reporting & Bounded Queries
- **Date Bounded Queries**: Replaced unbounded `.getAll()` scans with `OrderRepository.getByDateRange` and `ReturnRepository.getByDateRange`.
- **Cross-Period Integrity**:
  - Friday report for a Monday sale return:
    - Monday Period: Gross Sales = $100, Refunds = $0, Net = $100.
    - Friday Period: Gross Sales = $0, Refunds = $50, Net = -$50 (matches Friday cash drawer refund deduction).
- **Timezone Helper**: `src/utils/dateTime.ts` anchors date preset boundaries (`today`, `yesterday`, `last7days`, `last30days`, `custom`) to ISO UTC day boundaries (00:00:00.000 to 23:59:59.999).

### 2.6 Offline Resilience & Durable Mutation Queue
- `OfflineSyncService`:
  - Automatically detects online/offline status via window events.
  - Caches product catalog and registers in local storage.
  - Allows cashiers to execute checkouts while disconnected; mutations are enqueued in `pos_offline_sales_queue` with status `QUEUED`.
  - Replays queued sales with original `idempotencyKey` when connectivity is restored, preventing duplicates.
  - POSEngine UI displays real-time status badge (`ONLINE` / `OFFLINE (QUEUE ACTIVE)`).

---

## 3. Verification & Test Matrix

All 10 test suites and 80 automated unit/integration tests pass cleanly across the codebase:

| Category | Test Cases Covered | Status |
|---|---|:---:|
| **1. Transactions & Read-Before-Write** | `completeSale` ordering, `processAtomicReturn` ordering, stock insufficiency rollback, return quantity limit rollback, PO over-receiving rollback, adjustment negative stock rollback | **PASS** |
| **2. Idempotency & Concurrency** | Idempotency lock validation, duplicate key return existing order, zero double-decrement | **PASS** |
| **3. Security & Tenant Scoping** | Tenant claims isolation, cross-tenant denial, cashier vs manager vs admin RBAC rules | **PASS** |
| **4. Inventory Ledger Integrity** | Strip direct `unitsInStock` update, append-only `SALE`, `RETURN`, `RESTOCK`, `ADJUSTMENT` movement creation | **PASS** |
| **5. Historical Economics & COGS** | `OrderItem` snapshot persistence, stable COGS across price revisions and product deletions | **PASS** |
| **6. Cross-Period Reporting** | Friday return reporting for Monday sale, date bounding, timezone UTC boundaries | **PASS** |
| **7. Offline Foundation** | Offline state detection, local cache fallback, durable mutation queue & replay | **PASS** |

---

## 4. Current State Summary

- **Production Core**: Fully hardened with deterministic read-before-write transaction guarantees.
- **Data Integrity**: Append-only inventory movements and stable snapshot economics ensure audit compliance.
- **Multi-Tenancy**: Enforced at security rule, domain calculation, and database repository layers.
- **Offline Reliability**: Basic offline sales queueing and catalog caching active.
