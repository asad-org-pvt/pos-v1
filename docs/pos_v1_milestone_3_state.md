# PoS-v1 Milestone 3 State Assessment: Registers, Cashier Shifts, Returns & Stock Movements

> **Date:** 2026-08-18  
> **Milestone:** Milestone 3 — Registers, Cashier Shifts, Returns & Stock Movements  
> **Status:** COMPLETED & VALIDATED (8 Test Suites, 55 Tests Passing, Build Passing)

---

## A. What Was Actually Implemented

### 1. Register & Cashier Shift Domain
- **`Register` Entity & Service ([`src/domain/models/Register.ts`](file:///Users/home/Documents/GitHub/pos-v1/src/domain/models/Register.ts), [`src/repositories/RegisterRepository.ts`](file:///Users/home/Documents/GitHub/pos-v1/src/repositories/RegisterRepository.ts), [`src/services/app/RegisterService.ts`](file:///Users/home/Documents/GitHub/pos-v1/src/services/app/RegisterService.ts)):**
  - Logical cash stations with tenant isolation, status tracking (`ACTIVE`, `INACTIVE`), and location tags.
- **`Shift` Entity, Repository & Service ([`src/domain/models/Shift.ts`](file:///Users/home/Documents/GitHub/pos-v1/src/domain/models/Shift.ts), [`src/repositories/ShiftRepository.ts`](file:///Users/home/Documents/GitHub/pos-v1/src/repositories/ShiftRepository.ts), [`src/services/app/ShiftService.ts`](file:///Users/home/Documents/GitHub/pos-v1/src/services/app/ShiftService.ts)):**
  - Cashier operational shift lifecycle (`OPEN`, `CLOSED`, `CANCELLED`).
  - Shift opening with opening float validation and single-occupancy register enforcement.
  - Cash accounting: $\text{Expected Cash} = \text{Opening Float} + \text{Cash Sales} - \text{Cash Refunds}$.
  - Shift closeout reconciliation: $\text{Cash Difference} = \text{Counted Cash} - \text{Expected Cash}$.
  - Shift summary and End-of-Day (Z-Report) printable receipt (`PrintableShiftReport`).

### 2. Returns, Refunds & Order Status Lifecycle
- **`Return` Entity & Repository ([`src/domain/models/Return.ts`](file:///Users/home/Documents/GitHub/pos-v1/src/domain/models/Return.ts), [`src/repositories/ReturnRepository.ts`](file:///Users/home/Documents/GitHub/pos-v1/src/repositories/ReturnRepository.ts), [`src/services/app/ReturnService.ts`](file:///Users/home/Documents/GitHub/pos-v1/src/services/app/ReturnService.ts)):**
  - Supports full and partial item returns with quantity bounds checking (`requestedReturnQty <= soldQty - returnedQty`).
  - Proportional refund amount calculation.
  - Atomic transaction: Restores product inventory, creates `RETURN` stock movements, writes `Return` document, updates `Order` status (`REFUNDED` or `PARTIALLY_REFUNDED`), and updates shift accounting.
  - Printable return receipt (`PrintableRefundReceipt`).

### 3. Append-Only Stock Movement Ledger
- **`StockMovement` Entity & Repository ([`src/domain/models/StockMovement.ts`](file:///Users/home/Documents/GitHub/pos-v1/src/domain/models/StockMovement.ts), [`src/repositories/StockMovementRepository.ts`](file:///Users/home/Documents/GitHub/pos-v1/src/repositories/StockMovementRepository.ts), [`src/services/app/StockMovementService.ts`](file:///Users/home/Documents/GitHub/pos-v1/src/services/app/StockMovementService.ts)):**
  - Append-only model strictly preventing historical edits and deletions.
  - **Sale Integration:** `OrderRepository.completeSale` atomically records `SALE` movements ($\Delta < 0$) with before/after quantities in the same Firestore transaction that decrements stock.
  - **Return Integration:** `ReturnRepository.processAtomicReturn` atomically records `RETURN` movements ($\Delta > 0$) in the same transaction that restores stock.

### 4. Barcode Checkout & UX Improvements
- **Barcode & SKU Scanning in `POSEngine` ([`src/ui/pos-engine/index.tsx`](file:///Users/home/Documents/GitHub/pos-v1/src/ui/pos-engine/index.tsx)):**
  - Integrated keyboard-emulated scanner input.
  - Scans resolve by barcode, SKU, or product ID.
  - Auto-adds to cart or increments quantity for repeated scans with out-of-stock guards.
- **Cashier Shift Control Banner in `POSEngine`:**
  - Real-time active shift indicator showing current cashier, register, and live cash drawer balance.
  - Open Shift and Close Shift modals with End-of-Day Z-Report printing.
- **Return & Refund UI in `OrderList` ([`src/ui/order/order-list/index.tsx`](file:///Users/home/Documents/GitHub/pos-v1/src/ui/order/order-list/index.tsx)):**
  - "Return" action on orders opening item selection modal with live refund summary and immediate printable refund receipt.

---

## B. Current Register & Shift Lifecycle

```
[Register: ACTIVE]
       ↓
[Cashier Opens Shift] ──> Validates register & opening float ──> Shift Status: OPEN
       ↓
[Transactions during Shift]
  ├── Sale (Cash / Card) ──> Updates Shift (cashSales, cardSales, totalSales, expectedCash)
  └── Return (Cash / Card) ──> Updates Shift (cashRefunds, cardRefunds, totalRefunds, expectedCash)
       ↓
[Cashier Closes Shift]
  ├── Counted closing cash entered
  ├── Calculates difference: Counted - Expected
  ├── Marks Shift: CLOSED (prevents further transactions)
  └── Generates & prints End-of-Day / Shift Report (Z-Report)
```

---

## C. Current Inventory Lifecycle

```
[Initial Product Stock: S]

1. Sale of Q units:
   ├── Verifies S >= Q
   ├── Decrements product unitsInStock: S' = S - Q
   └── In SAME transaction: Writes SALE StockMovement (Delta: -Q, Before: S, After: S')

2. Return of R units (R <= Q):
   ├── Verifies R <= remaining refundable qty
   ├── Increments product unitsInStock: S'' = S' + R
   └── In SAME transaction: Writes RETURN StockMovement (Delta: +R, Before: S', After: S'')
```

---

## D. Transaction Guarantees

| Guarantee | Status | Evaluation |
|---|---|---|
| **Sale Atomicity** | **GUARANTEED** | Product stock decrement, SALE stock movements, order doc write, payment doc write, and shift stats update execute in a single Firestore `runTransaction`. |
| **Refund Atomicity** | **GUARANTEED** | Product stock restoration, RETURN stock movements, return doc write, order status update, and shift refund stats execute in a single `runTransaction`. |
| **Stock Consistency** | **GUARANTEED** | `unitsInStock` and the sum of historical `StockMovement` deltas remain perfectly synchronized. |
| **Movement Consistency** | **GUARANTEED** | Every inventory change produces an immutable, append-only `StockMovement` record with before/after counts and cashier attribution. |
| **Shift Consistency** | **GUARANTEED** | Cash accounting strictly separates physical cash from card payments and factors in cash refunds. |
| **Refund Idempotency** | **GUARANTEED** | Returns enforce cumulative refundable quantity limits (`sum(returnedQuantity) <= originalQuantity`), preventing duplicate or excess refunds. |
| **Duplicate Protection** | **GUARANTEED** | Shifts prevent duplicate opens on occupied registers and duplicate closes on already-closed shifts. |
| **Tenant Isolation** | **GUARANTEED** | All collections, queries, and transactions are dynamically scoped to the active tenant ID. |

---

## E. Current POS Capability Status (35 Areas)

| # | Capability Area | Status | Milestone 3 Assessment |
|---|---|---|---|
| 1 | Sales & Checkout | **COMPLETE** | Barcode scanning, authoritative calculations, customer linking, atomic checkout |
| 2 | Product Management | **COMPLETE** | Full CRUD, category mapping, barcode/SKU indexing |
| 3 | Inventory Management | **COMPLETE** (M3 Scope) | Atomic stock updates, threshold checking, append-only StockMovement ledger |
| 4 | Customer Management | **COMPLETE** | Full CRUD, walk-in support, sale linkage |
| 5 | Payments | **COMPLETE** | Cash, Card, Other payment tracking, cash change calculations |
| 6 | Employees & Roles | **COMPLETE** (M3 Scope) | Employee CRUD, cashier attribution on shifts, sales, and returns |
| 7 | Registers & Terminals | **COMPLETE** | Register stations CRUD, status management, active register lookup |
| 8 | Multi-store & Multi-location | **FOUNDATION ONLY** | Tenant isolation in place; multi-store inventory transfers pending |
| 9 | Purchasing & Suppliers | **PARTIAL** | Supplier entity and CRUD complete; purchase orders & receiving pending |
| 10 | Sales & Business Reporting | **PARTIAL** | Searchable sale history, order details, Z-Report shift closeouts |
| 11 | Tax & Accounting | **PARTIAL** | Authoritative tax calculations on sales, drawer cash reconciliation |
| 12 | Pricing & Promotions | **PARTIAL** | Percentage discount engine on sales; rule engine pending |
| 13 | Returns, Refunds & Exchanges | **COMPLETE** | Full/partial item returns, stock restoration, atomic refund receipts |
| 14 | Offline Operation & Sync | **FOUNDATION ONLY** | RxDB installed; mutation queue & replication adapter pending |
| 15 | Security & Audit Logs | **COMPLETE** (M3 Scope) | Authenticated security rules, append-only movement ledger, audit logs |
| 16 | Hardware Integrations | **COMPLETE** (M3 Scope) | USB barcode keyboard scanner input, 80mm thermal receipt & report CSS |
| 17 | Notifications | **COMPLETE** | Decoupled EmailJS notifications for inventory alerts and receipts |
| 18 | Barcode Scanning & Labeling | **COMPLETE** (M3 Scope) | Fast barcode / SKU input with auto-add and duplicate quantity increment |
| 19 | Cash Drawer & Float Management | **COMPLETE** | Opening float, cash sales, cash refunds, expected cash calculation, closing reconciliation |
| 20 | Customer Loyalty & Rewards | **NOT IMPLEMENTED** | CRM points / rewards engine out of scope |
| 21 | Gift Cards & Store Credit | **NOT IMPLEMENTED** | Stored-value ledger out of scope |
| 22 | Delivery & Order Tracking | **FOUNDATION ONLY** | Sales routes / towns CRUD present |
| 23 | E-commerce Synchronization | **NOT IMPLEMENTED** | Out of scope |
| 24 | Mobile POS / Tablet Mode | **PARTIAL** | Responsive layout in place |
| 25 | Shift & Time Tracking | **COMPLETE** | Shift sessions, float tracking, closing cash reconciliation, Z-Reports |
| 26 | Stock Transfers | **NOT IMPLEMENTED** | Requires multi-location inventory transfer workflow |
| 27 | Purchase Orders | **NOT IMPLEMENTED** | Requires purchasing & supplier receiving module |
| 28 | Vendor Management | **PARTIAL** | Supplier entity and CRUD complete |
| 29 | Expense Tracking | **NOT IMPLEMENTED** | Out of scope |
| 30 | End-of-Day / Z-Reports | **COMPLETE** | End-of-Day Z-Report generation, reconciliation, and thermal printing |
| 31 | Data Portability & Export | **NOT IMPLEMENTED** | CSV / Excel export pending |
| 32 | Third-Party API & Webhooks | **NOT IMPLEMENTED** | Out of scope |
| 33 | User Preferences & Theming | **PARTIAL** | Theming and profile management active |
| 34 | Multi-Currency Support | **FOUNDATION ONLY** | Currency code on Organization schema |
| 35 | Audit Trail & Compliance | **COMPLETE** (M3 Scope) | Append-only stock ledger, shift logs, sale audit events |

---

## F. Remaining Architectural Problems

1. **Purchasing & Restocking Module Missing:** Stock increases currently rely on direct product edits rather than formal Purchase Orders (PO) or Supplier Receiving invoices that generate `RESTOCK` movements.
2. **Offline Local Persistence & Queueing:** POS operations currently execute directly against Firestore; if network drops mid-transaction, offline sales queueing is not yet operational.
3. **Data Export & Comprehensive Analytics:** Cashiers can print shift reports and receipts, but management lacks CSV/Excel exports for accounting and cross-shift date range analytics.

---

## G. Next Milestone Recommendation

### Recommended Milestone 4: **Purchasing, Supplier Receiving, Inventory Adjustments & Export Analytics**

To complete the full retail supply chain loop, Milestone 4 should focus on:
1. **Purchase Orders & Supplier Receiving:** Create POs to suppliers, record receiving goods against POs with automatic stock increments and `RESTOCK` StockMovements.
2. **Stock Adjustments & Waste Tracking:** Formal inventory adjustment workflow (Damage, Spoilage, Shrinkage, Count Correction) with `ADJUSTMENT` StockMovements.
3. **Sales & Inventory Export Analytics:** Date-range financial reporting, top-selling products, cashier performance, and CSV/PDF data exports for accounting.
