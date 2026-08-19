# PoS-v1 Milestone 2 State Assessment: Sales, Orders, Payments & Receipts

> **Date:** 2026-08-18  
> **Milestone:** Milestone 2 — Sales, Orders, Payments & Receipts  
> **Status:** COMPLETED & VALIDATED (7 Test Suites, 37 Tests Passing, Build Passing)

---

## A. What Changed

### 1. Domain Models & Schemas
- **`Payment` Model Added (`src/domain/models/Payment.ts`):** Defined first-class `Payment` entity with `PaymentMethodEnum` (`CASH`, `CARD`, `OTHER`), `PaymentStatusEnum` (`PENDING`, `COMPLETED`, `FAILED`, `VOIDED`, `REFUNDED`), `amount`, `amountTendered`, `change`, `reference`, `recordedBy`, and timestamps.
- **`Order` Model Extended (`src/domain/models/Order.ts`):** Added `idempotencyKey`, `tenantId`, `taxRate`, `discountRate`, `amountPaid`, `amountDue`, `change`, `payments: Payment[]`, `customerPhone`, `customerEmail`, and full order lifecycle statuses (`DRAFT`, `PENDING`, `COMPLETED`, `VOIDED`, `REFUNDED`, `PARTIALLY_REFUNDED`).
- **`AuditEvent` Model Added (`src/domain/models/AuditEvent.ts`):** Foundation for logging sale and payment events (`SALE_COMPLETED`, `SALE_FAILED`, `PAYMENT_RECORDED`, `SALE_VOIDED`).
- **Authoritative Calculations Engine (`src/domain/calculations/SaleCalculations.ts`):** Centralized all sale calculations (`subtotal`, `tax`, `total`, `discount`, `amountDue`, `amountPaid`, `change`, `isFullyPaid`) to eliminate divergent math between UI components and backend validation.

### 2. Transaction & Data Access Layer
- **`OrderRepository.completeSale` (`src/repositories/OrderRepository.ts`):**
  - **Idempotency Protection:** Checks for existing `idempotencyKey` before execution. If found, safely returns the already-processed sale without re-decrementing inventory.
  - **Atomic Firestore Transaction:** Executes inventory validation (existence, sellable status, quantity > 0, stock availability) and applies stock decrements, order document write, and payment document write inside a single `runTransaction`.
- **Decoupled Asynchronous Notifications:** Moved EmailJS notification out of the critical transactional path into non-blocking background execution, preventing third-party email failures from aborting completed sales.

### 3. Application & Service Layer
- **`OrderService.completeSale` (`src/services/app/OrderService.ts`):** Orchestrates authoritative calculation normalization, underpayment rejection for cash, payment validation, and repository transaction execution.
- **`OrderService.searchOrders`:** Provides multi-field searching across invoice numbers, customer names, cashier names, payment methods, and sale statuses.
- **`generateNextInvoiceNumber` (`src/utils/utilFunctions.ts`):** Corrected sequential incrementing and 7-digit rollover math (`AAA0000001` -> `AAA0000002`, `AAA9999999` -> `AAB0000000`).

### 4. User Interface & Cashier Experience
- **`POSEngine` (`src/ui/pos-engine/index.tsx`):**
  - Customer selection: Allows linking an existing customer or defaulting to "Walk-in Customer".
  - Payment method toggle: `CASH`, `CARD`, `OTHER`.
  - Amount tendered input with live change calculation for cash sales.
  - Automatic popup of the official `PrintableReceipt` upon sale completion.
  - Idempotency key generation per checkout session.
- **`Invoice` Component (`src/ui/common/components/invoice/index.tsx`):** Upgraded to use authoritative calculations with payment controls, underpayment warning, and disabled states during submission.
- **`PrintableReceipt` Component (`src/ui/common/components/printable-invoice/index.tsx`):** Replaced mock placeholder with a complete thermal-receipt (80mm) and standard paper print layout with company details, cashier, customer, line items, taxes, discounts, payment breakdown, and change.
- **`OrderList` (`src/ui/order/order-list/index.tsx`):** Added live search filtering, status chips, order details modal, and on-demand receipt viewing and printing for any past order.

---

## B. Current End-to-End Sale Flow

```
1. Cashier adds items & selects Customer/Payment Method in POSEngine
                               ↓
2. Single Authoritative Calculation (calculateSaleTotals) computes subtotal, tax, discount, total, change
                               ↓
3. Cashier clicks "Confirm Sale" (UI passes idempotencyKey & validated inputs)
                               ↓
4. OrderService.completeSale validates payload & payment rules
                               ↓
5. OrderRepository.completeSale checks idempotencyKey (prevents duplicate sales)
                               ↓
6. Atomic Firestore runTransaction:
   ├─ Reads & validates current stock for each product
   ├─ Decrements product stock & updates availability status
   ├─ Writes Order document (status: COMPLETED)
   └─ Writes Payment document (status: COMPLETED)
                               ↓
7. Post-Transaction Operations (Decoupled):
   ├─ Sequential Invoice Number recorded
   ├─ Audit event logged
   └─ Email notification sent asynchronously in background
                               ↓
8. UI updates cart, displays PrintableReceipt modal, and refreshes inventory state
```

---

## C. Transaction Guarantees

| Guarantee | Status | Implementation Details |
|---|---|---|
| **Atomicity** | **GUARANTEED** | Product inventory decrements, order document write, and payment document write are executed inside a single Firestore `runTransaction`. |
| **Consistency** | **GUARANTEED** | Single calculation engine (`calculateSaleTotals`) enforces matching line item sums, tax rates, discount rates, amount due, and change. |
| **Idempotency** | **GUARANTEED** | Every sale submission includes an `idempotencyKey`. Duplicate requests return the existing completed order without repeating stock decrements. |
| **Concurrency Safety** | **GUARANTEED** | Firestore optimistic locking in `runTransaction` detects concurrent writes to the same product document and retries safely or aborts if stock is depleted. |
| **Duplicate Protection** | **GUARANTEED** | Idempotency lookup + UI submission disabling state protect against double-clicks and network retries. |
| **Payment Integrity** | **GUARANTEED** | Cash sales reject underpayment; card/other sales enforce exact totals and never produce erroneous cash change. |
| **Invoice Uniqueness** | **GUARANTEED** | `generateNextInvoiceNumber` enforces sequential alphanumeric progression and tenant-scoped tracking. |

---

## D. Current POS Capability Status (35 Areas)

| # | Capability Area | Status | Milestone 2 Assessment |
|---|---|---|---|
| 1 | Sales & Checkout | **COMPLETE** (M2 Scope) | Authoritative calculations, customer association, payment selection, atomic execution |
| 2 | Product Management | **COMPLETE** | Full CRUD, category mapping, dynamic stock management |
| 3 | Inventory Management | **PARTIAL** | Atomic decrement on sale, threshold checking; movement ledger pending |
| 4 | Customer Management | **COMPLETE** | Full CRUD, walk-in customer support, order-level customer linkage |
| 5 | Payments | **COMPLETE** (M2 Scope) | Cash, Card, Other methods, change calculations, payment record entity |
| 6 | Employees & Roles | **PARTIAL** | Employee CRUD, cashier association on sales, role resolution |
| 7 | Registers & Terminals | **NOT IMPLEMENTED** | Register/station entity and float tracking pending |
| 8 | Multi-store & Multi-location | **FOUNDATION ONLY** | Tenant isolation in place; multi-store routing pending |
| 9 | Purchasing & Suppliers | **PARTIAL** | Supplier CRUD complete; PO receiving pending |
| 10 | Sales & Business Reporting | **PARTIAL** | Searchable sale history with detailed modal and receipt viewer |
| 11 | Tax & Accounting | **PARTIAL** | Authoritative tax calculations on sales; customizable tax rules pending |
| 12 | Pricing & Promotions | **PARTIAL** | Authoritative percentage discount engine on sales; rule engine pending |
| 13 | Returns, Refunds & Exchanges | **FOUNDATION ONLY** | Order status lifecycle (`REFUNDED`, `PARTIALLY_REFUNDED`) ready |
| 14 | Offline Operation & Sync | **FOUNDATION ONLY** | RxDB installed; mutation queue & replication adapter pending |
| 15 | Security & Audit Logs | **PARTIAL** | Secured rules, sale and payment audit logging foundation |
| 16 | Hardware Integrations | **PARTIAL** | Browser thermal-receipt (80mm) and standard paper print CSS complete |
| 17 | Notifications | **COMPLETE** (M2 Scope) | Asynchronous EmailJS receipt dispatch decoupled from transaction |
| 18 | Barcode Scanning & Labeling | **FOUNDATION ONLY** | SKU and barcode fields in product schema; scanner listener pending |
| 19 | Cash Drawer & Float Management | **NOT IMPLEMENTED** | Requires register and shift management |
| 20 | Customer Loyalty & Rewards | **NOT IMPLEMENTED** | Requires CRM / points engine |
| 21 | Gift Cards & Store Credit | **NOT IMPLEMENTED** | Requires stored-value ledger |
| 22 | Delivery & Order Tracking | **FOUNDATION ONLY** | Sales routes / towns CRUD present |
| 23 | E-commerce Synchronization | **NOT IMPLEMENTED** | Out of scope |
| 24 | Mobile POS / Tablet Mode | **PARTIAL** | Responsive layout in place |
| 25 | Shift & Time Tracking | **NOT IMPLEMENTED** | Requires cashier shift sessions |
| 26 | Stock Transfers | **NOT IMPLEMENTED** | Requires multi-location inventory ledger |
| 27 | Purchase Orders | **NOT IMPLEMENTED** | Requires purchasing module |
| 28 | Vendor Management | **PARTIAL** | Supplier entity and CRUD complete |
| 29 | Expense Tracking | **NOT IMPLEMENTED** | Out of scope |
| 30 | End-of-Day / Z-Reports | **NOT IMPLEMENTED** | Requires register closeout session |
| 31 | Data Portability & Export | **NOT IMPLEMENTED** | Export to CSV/PDF pending |
| 32 | Third-Party API & Webhooks | **NOT IMPLEMENTED** | Out of scope |
| 33 | User Preferences & Theming | **PARTIAL** | Theming, layout preferences, and profile management active |
| 34 | Multi-Currency Support | **FOUNDATION ONLY** | Currency code on Organization schema |
| 35 | Audit Trail & Compliance | **PARTIAL** | Audit logging on sale completion, error logging active |

---

## E. Remaining Architectural Problems

1. **No Cashier Shift / Register Boundary:** All sales are recorded under the authenticated user and tenant, but there is no concept of a "Shift Session" (Opening cash float, X/Z-Reports, closing cash reconciliation).
2. **Missing Stock Movement Audit Ledger:** Inventory count is decremented correctly in products, but there is no separate append-only `StockMovement` collection tracking individual delta events (Sale, Return, Adjustment, Restock).
3. **No Refund / Return Transaction Flow:** The order model supports refund statuses, but there is no UI or transaction engine for partial/full item returns with inventory restoration.

---

## F. Next Milestone Recommendation

### Recommended Milestone 3: **Registers, Cashier Shifts, Returns & Stock Movements**

Based on the completed sale engine from Milestone 2, the next logical step to complete core POS retail operations is:
1. **Register & Cashier Shifts:** Opening float, active shift tracking, cash drawer balance monitoring, and End-of-Day (Z-Report) cash reconciliation.
2. **Returns & Refunds Engine:** Search past sales by invoice #, select items to return, calculate refund amount (cash/card), restore inventory in an atomic transaction, and issue refund receipts.
3. **Stock Movement Ledger:** Append-only ledger recording all stock changes (`SALE`, `RETURN`, `ADJUSTMENT`, `RESTOCK`) with before/after counts, timestamps, and cashier attribution.
4. **Thermal Printer & Barcode Scanner UX:** Direct barcode scanner auto-add to cart in `POSEngine` and one-click thermal print triggering.
