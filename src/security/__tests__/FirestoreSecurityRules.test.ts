/**
 * @jest-environment node
 */
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import * as fs from "fs";
import * as path from "path";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

if (typeof (global as any).setImmediate === "undefined") {
  (global as any).setImmediate = (fn: (...args: any[]) => void, ...args: any[]) => setTimeout(fn, 0, ...args);
}
if (typeof (global as any).clearImmediate === "undefined") {
  (global as any).clearImmediate = (id: any) => clearTimeout(id);
}

jest.setTimeout(30000);

import * as net from "net";

async function isEmulatorRunning(port = 8080, host = "127.0.0.1"): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

describe("Firestore Security Rules Tests", () => {
  let testEnv: RulesTestEnvironment | null = null;

  beforeAll(async () => {
    const isUp = await isEmulatorRunning();
    if (!isUp) {
      console.warn("⚠️ Firestore Emulator is not running on port 8080. Skipping rules tests in standard runner. Use 'npm run test:security' to execute rules tests.");
      return;
    }

    const rulesPath = path.resolve(__dirname, "../../../firestore.rules");
    const rules = fs.readFileSync(rulesPath, "utf8");

    testEnv = await initializeTestEnvironment({
      projectId: "pos-v1-security-test",
      firestore: {
        rules,
        host: "127.0.0.1",
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();

      // Seed documents using rules-disabled context
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();

        // Seed tenant_a documents
        await setDoc(doc(db, "tenant_a-products", "prod_1"), {
          id: "prod_1",
          name: "Item A",
          unitPrice: 10,
          unitsInStock: 50,
        });

        await setDoc(doc(db, "tenant_a-orders", "order_1"), {
          id: "order_1",
          invoiceNumber: "INV-001",
          subtotal: 100,
          total: 105,
          refundedAmount: 0,
          status: "COMPLETED",
          products: [{ id: "prod_1", quantity: 1, unitPrice: 10 }],
          updatedAt: "2026-08-18T00:00:00Z",
        });

        await setDoc(doc(db, "tenant_a-payments", "pay_1"), {
          id: "pay_1",
          orderId: "order_1",
          amount: 105,
          status: "COMPLETED",
        });

        await setDoc(doc(db, "tenant_a-returns", "ret_1"), {
          id: "ret_1",
          orderId: "order_1",
          refundTotal: 10,
        });

        await setDoc(doc(db, "tenant_a-stock_movements", "mov_1"), {
          id: "mov_1",
          productId: "prod_1",
          type: "SALE",
          quantityDelta: -1,
        });

        await setDoc(doc(db, "tenant_a-shifts", "shift_1"), {
          id: "shift_1",
          registerId: "reg_1",
          status: "OPEN",
          cashSales: 105,
        });

        await setDoc(doc(db, "tenant_a-idempotency", "lock_1"), {
          id: "lock_1",
          orderId: "order_1",
          status: "COMMITTED",
        });

        await setDoc(doc(db, "tenant_a-registers", "reg_1"), {
          id: "reg_1",
          name: "Lane 1",
        });

        await setDoc(doc(db, "tenant_a-employees", "emp_1"), {
          id: "emp_1",
          name: "Alice Cashier",
          role: "cashier",
        });

        await setDoc(doc(db, "tenant_a-purchase_orders", "po_1"), {
          id: "po_1",
          poNumber: "PO-001",
          status: "PENDING",
        });

        await setDoc(doc(db, "tenant_a-settings", "organization"), {
          id: "organization-settings",
          tenantId: "tenant_a",
          businessName: "Tenant A Store",
          currencyCode: "USD",
        });

        await setDoc(doc(db, "tenant_a-printer_configs", "printer_1"), {
          id: "printer_1",
          tenantId: "tenant_a",
          name: "Printer 1",
          transport: "BROWSER",
        });

        // Seed tenant_b documents
        await setDoc(doc(db, "tenant_b-orders", "order_2"), {
          id: "order_2",
          invoiceNumber: "INV-002",
          subtotal: 50,
          total: 50,
          status: "COMPLETED",
        });

        await setDoc(doc(db, "tenant_b-products", "prod_2"), {
          id: "prod_2",
          name: "Item B",
          unitPrice: 20,
        });

        await setDoc(doc(db, "tenant_b-shifts", "shift_2"), {
          id: "shift_2",
          status: "OPEN",
        });

        await setDoc(doc(db, "tenant_b-stock_movements", "mov_2"), {
          id: "mov_2",
          quantityDelta: -2,
        });

        await setDoc(doc(db, "tenant_b-employees", "emp_2"), {
          id: "emp_2",
          name: "Bob",
        });

        // Seed organizations
        await setDoc(doc(db, "organisations", "tenant_a"), {
          id: "tenant_a",
          name: "Tenant A Store",
        });

        await setDoc(doc(db, "organisations", "tenant_b"), {
          id: "tenant_b",
          name: "Tenant B Store",
        });

        // Seed platform admin
        await setDoc(doc(db, "admins", "admins"), {
          admins: ["admin@platform.com"],
        });
      });
    }
  });

  const itRule = (name: string, fn: () => Promise<void>) =>
    it(name, async () => {
      if (!testEnv) return;
      await fn();
    });

  // ==========================================
  // 1. AUTHENTICATION
  // ==========================================
  describe("Authentication", () => {
    itRule("Scenario 1: unauthenticated request is denied", async () => {
      const db = testEnv!.unauthenticatedContext().firestore();
      await assertFails(getDoc(doc(db, "tenant_a-products", "prod_1")));
      await assertFails(setDoc(doc(db, "tenant_a-orders", "new_order"), { id: "new_order" }));
    });

    itRule("Scenario 2: authenticated user with missing tenantId claim is denied", async () => {
      const db = testEnv!.authenticatedContext("user_no_tenant", { role: "cashier" }).firestore();
      await assertFails(getDoc(doc(db, "tenant_a-products", "prod_1")));
    });

    itRule("Scenario 3: authenticated user with missing role claim is denied", async () => {
      const db = testEnv!.authenticatedContext("user_no_role", { tenantId: "tenant_a" }).firestore();
      await assertFails(getDoc(doc(db, "tenant_a-products", "prod_1")));
    });

    itRule("Scenario 4: valid tenant member with valid claims is allowed", async () => {
      const db = testEnv!.authenticatedContext("user_a", { tenantId: "tenant_a", role: "cashier" }).firestore();
      await assertSucceeds(getDoc(doc(db, "tenant_a-products", "prod_1")));
    });
  });

  // ==========================================
  // 2. TENANT ISOLATION
  // ==========================================
  describe("Tenant Isolation", () => {
    itRule("Scenario 5: tenant_a cannot read tenant_b-orders", async () => {
      const db = testEnv!.authenticatedContext("user_a", { tenantId: "tenant_a", role: "admin" }).firestore();
      await assertFails(getDoc(doc(db, "tenant_b-orders", "order_2")));
    });

    itRule("Scenario 6: tenant_a cannot create tenant_b-products", async () => {
      const db = testEnv!.authenticatedContext("user_a", { tenantId: "tenant_a", role: "admin" }).firestore();
      await assertFails(
        setDoc(doc(db, "tenant_b-products", "prod_fake"), {
          id: "prod_fake",
          name: "Fake",
        })
      );
    });

    itRule("Scenario 7: tenant_a cannot update tenant_b-shifts", async () => {
      const db = testEnv!.authenticatedContext("user_a", { tenantId: "tenant_a", role: "admin" }).firestore();
      await assertFails(
        updateDoc(doc(db, "tenant_b-shifts", "shift_2"), {
          status: "CLOSED",
        })
      );
    });

    itRule("Scenario 8: tenant_a cannot delete tenant_b-stock_movements", async () => {
      const db = testEnv!.authenticatedContext("user_a", { tenantId: "tenant_a", role: "admin" }).firestore();
      await assertFails(deleteDoc(doc(db, "tenant_b-stock_movements", "mov_2")));
    });
  });

  // ==========================================
  // 3. ROLE-BASED ACCESS CONTROL (RBAC)
  // ==========================================
  describe("Role-Based Access Control", () => {
    itRule("Scenario 9: cashier can read products in own tenant", async () => {
      const db = testEnv!.authenticatedContext("cashier_1", { tenantId: "tenant_a", role: "cashier" }).firestore();
      await assertSucceeds(getDoc(doc(db, "tenant_a-products", "prod_1")));
    });

    itRule("Scenario 10: cashier cannot create, update, or delete products", async () => {
      const db = testEnv!.authenticatedContext("cashier_1", { tenantId: "tenant_a", role: "cashier" }).firestore();
      await assertFails(setDoc(doc(db, "tenant_a-products", "prod_new"), { name: "New" }));
      await assertFails(updateDoc(doc(db, "tenant_a-products", "prod_1"), { unitPrice: 20 }));
      await assertFails(deleteDoc(doc(db, "tenant_a-products", "prod_1")));
    });

    itRule("Scenario 11: cashier cannot read or write purchase orders", async () => {
      const db = testEnv!.authenticatedContext("cashier_1", { tenantId: "tenant_a", role: "cashier" }).firestore();
      await assertFails(getDoc(doc(db, "tenant_a-purchase_orders", "po_1")));
      await assertFails(setDoc(doc(db, "tenant_a-purchase_orders", "po_new"), { status: "DRAFT" }));
    });

    itRule("Scenario 12: cashier cannot write employees", async () => {
      const db = testEnv!.authenticatedContext("cashier_1", { tenantId: "tenant_a", role: "cashier" }).firestore();
      await assertFails(setDoc(doc(db, "tenant_a-employees", "emp_new"), { name: "New Emp" }));
    });

    itRule("Scenario 13: manager can write products (create and update)", async () => {
      const db = testEnv!.authenticatedContext("manager_1", { tenantId: "tenant_a", role: "manager" }).firestore();
      await assertSucceeds(
        setDoc(doc(db, "tenant_a-products", "prod_mgr"), {
          id: "prod_mgr",
          name: "Manager Item",
          unitPrice: 15,
        })
      );
      await assertSucceeds(
        updateDoc(doc(db, "tenant_a-products", "prod_mgr"), {
          unitPrice: 18,
        })
      );
    });

    itRule("Scenario 14: manager can write purchase orders", async () => {
      const db = testEnv!.authenticatedContext("manager_1", { tenantId: "tenant_a", role: "manager" }).firestore();
      await assertSucceeds(
        setDoc(doc(db, "tenant_a-purchase_orders", "po_1"), {
          id: "po_1",
          poNumber: "PO-001",
          status: "ORDERED",
        })
      );
      await assertSucceeds(
        updateDoc(doc(db, "tenant_a-purchase_orders", "po_1"), {
          status: "RECEIVED",
        })
      );
    });

    itRule("Scenario 15: manager can write registers", async () => {
      const db = testEnv!.authenticatedContext("manager_1", { tenantId: "tenant_a", role: "manager" }).firestore();
      await assertSucceeds(
        setDoc(doc(db, "tenant_a-registers", "reg_1"), {
          id: "reg_1",
          name: "Register 1",
          status: "ACTIVE",
        })
      );
    });

    itRule("Scenario 16: admin can write employees", async () => {
      const db = testEnv!.authenticatedContext("admin_1", { tenantId: "tenant_a", role: "admin" }).firestore();
      await assertSucceeds(
        setDoc(doc(db, "tenant_a-employees", "emp_1"), {
          id: "emp_1",
          name: "Alice",
          role: "cashier",
        })
      );
      await assertSucceeds(
        updateDoc(doc(db, "tenant_a-employees", "emp_1"), {
          role: "manager",
        })
      );
    });

    itRule("Scenario 17: admin can update own organisation document", async () => {
      const db = testEnv!.authenticatedContext("admin_1", { tenantId: "tenant_a", role: "admin" }).firestore();
      await assertSucceeds(
        updateDoc(doc(db, "organisations", "tenant_a"), {
          name: "Updated Tenant A Store",
        })
      );
    });

    itRule("Scenario 18: non-platform admin cannot access /admins collection", async () => {
      const db = testEnv!.authenticatedContext("admin_1", { tenantId: "tenant_a", role: "admin" }).firestore();
      await assertFails(getDoc(doc(db, "admins", "admins")));
      await assertFails(setDoc(doc(db, "admins", "admins"), { admins: ["hacked@hacked.com"] }));
    });
  });

  // ==========================================
  // 4. FINANCIAL IMMUTABILITY
  // ==========================================
  describe("Financial Immutability", () => {
    itRule("Scenario 19: order deletion is denied for all roles", async () => {
      const dbCashier = testEnv!.authenticatedContext("user_1", { tenantId: "tenant_a", role: "cashier" }).firestore();
      const dbManager = testEnv!.authenticatedContext("user_2", { tenantId: "tenant_a", role: "manager" }).firestore();
      const dbAdmin = testEnv!.authenticatedContext("user_3", { tenantId: "tenant_a", role: "admin" }).firestore();

      await assertFails(deleteDoc(doc(dbCashier, "tenant_a-orders", "order_1")));
      await assertFails(deleteDoc(doc(dbManager, "tenant_a-orders", "order_1")));
      await assertFails(deleteDoc(doc(dbAdmin, "tenant_a-orders", "order_1")));
    });

    itRule("Scenario 20: payment update and delete are denied for all roles", async () => {
      const dbAdmin = testEnv!.authenticatedContext("admin_1", { tenantId: "tenant_a", role: "admin" }).firestore();
      await assertFails(updateDoc(doc(dbAdmin, "tenant_a-payments", "pay_1"), { amount: 0 }));
      await assertFails(deleteDoc(doc(dbAdmin, "tenant_a-payments", "pay_1")));
    });

    itRule("Scenario 21: return update and delete are denied for all roles", async () => {
      const dbAdmin = testEnv!.authenticatedContext("admin_1", { tenantId: "tenant_a", role: "admin" }).firestore();
      await assertFails(updateDoc(doc(dbAdmin, "tenant_a-returns", "ret_1"), { refundTotal: 0 }));
      await assertFails(deleteDoc(doc(dbAdmin, "tenant_a-returns", "ret_1")));
    });

    itRule("Scenario 22: stock movement update and delete are denied for all roles", async () => {
      const dbAdmin = testEnv!.authenticatedContext("admin_1", { tenantId: "tenant_a", role: "admin" }).firestore();
      await assertFails(updateDoc(doc(dbAdmin, "tenant_a-stock_movements", "mov_1"), { quantityDelta: 100 }));
      await assertFails(deleteDoc(doc(dbAdmin, "tenant_a-stock_movements", "mov_1")));
    });

    itRule("Scenario 23: idempotency lock update and delete are denied for all roles", async () => {
      const dbAdmin = testEnv!.authenticatedContext("admin_1", { tenantId: "tenant_a", role: "admin" }).firestore();
      await assertFails(updateDoc(doc(dbAdmin, "tenant_a-idempotency", "lock_1"), { status: "TAMPERED" }));
      await assertFails(deleteDoc(doc(dbAdmin, "tenant_a-idempotency", "lock_1")));
    });

    itRule("Scenario 24: shift delete is denied for all roles", async () => {
      const dbAdmin = testEnv!.authenticatedContext("admin_1", { tenantId: "tenant_a", role: "admin" }).firestore();
      await assertFails(deleteDoc(doc(dbAdmin, "tenant_a-shifts", "shift_1")));
    });
  });

  // ==========================================
  // 5. ORDER UPDATE RESTRICTIONS
  // ==========================================
  describe("Order Update Restrictions", () => {
    itRule("Scenario 25: legitimate return reconciliation update is allowed", async () => {
      const dbCashier = testEnv!.authenticatedContext("cashier_1", { tenantId: "tenant_a", role: "cashier" }).firestore();
      // Only modifying return-related allowed keys
      await assertSucceeds(
        updateDoc(doc(dbCashier, "tenant_a-orders", "order_1"), {
          refundedAmount: 10,
          status: "PARTIALLY_REFUNDED",
          updatedAt: "2026-08-18T10:00:00Z",
        })
      );
    });

    itRule("Scenario 26: arbitrary financial modification on order is denied", async () => {
      const dbAdmin = testEnv!.authenticatedContext("admin_1", { tenantId: "tenant_a", role: "admin" }).firestore();
      // Trying to tamper with subtotal or total on existing order
      await assertFails(
        updateDoc(doc(dbAdmin, "tenant_a-orders", "order_1"), {
          subtotal: 50,
          total: 50,
        })
      );
    });
  });

  // ==========================================
  // 6. CROSS-TENANT OPERATIONS
  // ==========================================
  describe("Cross-Tenant Operations", () => {
    itRule("Scenario 27: tenant_a admin cannot modify tenant_b organisation", async () => {
      const dbA = testEnv!.authenticatedContext("admin_a", { tenantId: "tenant_a", role: "admin" }).firestore();
      await assertFails(
        updateDoc(doc(dbA, "organisations", "tenant_b"), {
          name: "Hacked Tenant B",
        })
      );
    });

    itRule("Scenario 28: tenant_a admin cannot modify tenant_b employees", async () => {
      const dbA = testEnv!.authenticatedContext("admin_a", { tenantId: "tenant_a", role: "admin" }).firestore();
      await assertFails(
        setDoc(doc(dbA, "tenant_b-employees", "emp_spy"), {
          name: "Spy",
          role: "admin",
        })
      );
      await assertFails(deleteDoc(doc(dbA, "tenant_b-employees", "emp_2")));
    });
  });

  // ==========================================
  // 7. CLIENT SPOOFING & INVALID CLAIMS
  // ==========================================
  describe("Client Spoofing & Invalid Claims", () => {
    itRule("Scenario 29: client document tenantId field cannot override token tenantId", async () => {
      const db = testEnv!.authenticatedContext("user_a", { tenantId: "tenant_a", role: "cashier" }).firestore();
      // Trying to write to tenant_b collection while passing tenantId: tenant_b in body
      await assertFails(
        setDoc(doc(db, "tenant_b-orders", "spoofed_order"), {
          id: "spoofed_order",
          tenantId: "tenant_b",
          total: 100,
        })
      );
    });

    itRule("Scenario 30: user with invalid role is denied privileged operations", async () => {
      const db = testEnv!.authenticatedContext("user_hacker", { tenantId: "tenant_a", role: "super_hacker" }).firestore();
      await assertFails(getDoc(doc(db, "tenant_a-products", "prod_1")));
      await assertFails(setDoc(doc(db, "tenant_a-products", "prod_hacked"), { name: "Hacked" }));
      await assertFails(setDoc(doc(db, "tenant_a-purchase_orders", "po_hacked"), { status: "HACKED" }));
    });
  });

  // ==========================================
  // 8. SETTINGS & PRINTER CONFIGS AUTHORIZATION
  // ==========================================
  describe("Settings & Printer Configs Authorization", () => {
    itRule("Scenario 31: cashier can read own tenant settings but cannot update them", async () => {
      const db = testEnv!.authenticatedContext("cashier_a", { tenantId: "tenant_a", role: "cashier" }).firestore();
      await assertSucceeds(getDoc(doc(db, "tenant_a-settings", "organization")));
      await assertFails(
        updateDoc(doc(db, "tenant_a-settings", "organization"), {
          businessName: "Hacked by Cashier",
        })
      );
      await assertFails(deleteDoc(doc(db, "tenant_a-settings", "organization")));
    });

    itRule("Scenario 32: manager and admin can update own tenant settings", async () => {
      const dbManager = testEnv!.authenticatedContext("mgr_a", { tenantId: "tenant_a", role: "manager" }).firestore();
      await assertSucceeds(
        updateDoc(doc(dbManager, "tenant_a-settings", "organization"), {
          businessName: "Manager Updated Store",
        })
      );

      const dbAdmin = testEnv!.authenticatedContext("adm_a", { tenantId: "tenant_a", role: "admin" }).firestore();
      await assertSucceeds(
        updateDoc(doc(dbAdmin, "tenant_a-settings", "organization"), {
          businessName: "Admin Updated Store",
        })
      );
    });

    itRule("Scenario 33: cross-tenant read or write to settings is denied", async () => {
      const dbB = testEnv!.authenticatedContext("admin_b", { tenantId: "tenant_b", role: "admin" }).firestore();
      await assertFails(getDoc(doc(dbB, "tenant_a-settings", "organization")));
      await assertFails(
        setDoc(doc(dbB, "tenant_a-settings", "organization"), {
          businessName: "Tenant B Hijack",
        })
      );
    });

    itRule("Scenario 34: printer config obeys tenant isolation and manager/admin permissions", async () => {
      const dbCashier = testEnv!.authenticatedContext("cashier_a", { tenantId: "tenant_a", role: "cashier" }).firestore();
      await assertSucceeds(getDoc(doc(dbCashier, "tenant_a-printer_configs", "printer_1")));
      await assertFails(
        setDoc(doc(dbCashier, "tenant_a-printer_configs", "printer_new"), {
          id: "printer_new",
          name: "Cashier Printer",
        })
      );

      const dbManager = testEnv!.authenticatedContext("mgr_a", { tenantId: "tenant_a", role: "manager" }).firestore();
      await assertSucceeds(
        setDoc(doc(dbManager, "tenant_a-printer_configs", "printer_new"), {
          id: "printer_new",
          name: "Manager Printer",
        })
      );

      const dbB = testEnv!.authenticatedContext("admin_b", { tenantId: "tenant_b", role: "admin" }).firestore();
      await assertFails(getDoc(doc(dbB, "tenant_a-printer_configs", "printer_1")));
      await assertFails(deleteDoc(doc(dbB, "tenant_a-printer_configs", "printer_1")));
    });
  });
});
