import { OrderItem } from "../models/OrderItem";
import { PaymentMethod } from "../models/Payment";
import { ValidationError } from "../errors/AppError";

export interface PaymentAllocation {
  method: PaymentMethod;
  amount: number;
  amountTendered?: number;
  change?: number;
  reference?: string;
}

export interface SaleCalculationInput {
  items: Array<{
    id?: string;
    productId?: string;
    name: string;
    unitPrice: number | string;
    unitCost?: number | string;
    quantity: number | string;
    category?: string;
    unitsInStock?: number;
  }>;
  taxRate?: number;
  discountRate?: number;
  specialDiscount?: number | string;
  maxDiscountPercent?: number;
  paymentMethod?: PaymentMethod;
  amountTendered?: number;
  payments?: PaymentAllocation[];
}

export interface SaleCalculatedTotals {
  products: OrderItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  generalDiscount: number;
  specialDiscount: number;
  discountRate: number;
  total: number;
  amountDue: number;
  amountPaid: number;
  change: number;
  paymentMethod: PaymentMethod;
  payments: PaymentAllocation[];
  isFullyPaid: boolean;
}

export const DEFAULT_TAX_RATE = 0.05;
export const DEFAULT_DISCOUNT_RATE = 0.02;

/**
 * Authoritative single calculation engine for all sale calculations.
 * Guarantees consistent line item totals, tax, discounts, amount due, and cash change across UI and backend.
 * Supports single tender and multi-tender split payment allocations.
 */
export function calculateSaleTotals(input: SaleCalculationInput): SaleCalculatedTotals {
  if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
    throw new ValidationError("At least one product item is required for sale calculation");
  }

  const taxRate = input.taxRate !== undefined && input.taxRate >= 0 ? Number(input.taxRate) : DEFAULT_TAX_RATE;
  const discountRate =
    input.discountRate !== undefined && input.discountRate >= 0 ? Number(input.discountRate) : DEFAULT_DISCOUNT_RATE;

  let subtotal = 0;
  const products: OrderItem[] = input.items.map((item) => {
    const qty = Number(item.quantity);
    const price = Number(item.unitPrice);
    const unitCost = item.unitCost !== undefined ? Number(item.unitCost) : 0;

    if (isNaN(qty) || qty <= 0) {
      throw new ValidationError(`Invalid quantity for item "${item.name}": must be greater than 0`);
    }
    if (isNaN(price) || price < 0) {
      throw new ValidationError(`Invalid unit price for item "${item.name}": cannot be negative`);
    }

    const itemSubtotal = Number((price * qty).toFixed(2));
    const itemTax = Number((itemSubtotal * taxRate).toFixed(2));
    const itemDiscount = Number((itemSubtotal * discountRate).toFixed(2));
    const itemTotal = Number((itemSubtotal + itemTax - itemDiscount).toFixed(2));

    subtotal += itemSubtotal;

    return {
      id: item.id || item.productId || "",
      productId: item.productId || item.id || "",
      name: item.name,
      unitPrice: price,
      unitCost: !isNaN(unitCost) ? unitCost : 0,
      quantity: Math.floor(qty),
      lineSubtotal: itemSubtotal,
      lineTotal: itemTotal,
      taxRate,
      taxAmount: itemTax,
      discountAmount: itemDiscount,
      total: itemSubtotal, // Preserves legacy total field = subtotal
      category: item.category || "",
      unitsInStock: item.unitsInStock,
      returnedQuantity: 0,
    };
  });

  subtotal = Number(subtotal.toFixed(2));
  const tax = Number((subtotal * taxRate).toFixed(2));
  const totalBeforeDiscount = Number((subtotal + tax).toFixed(2));
  const generalDiscount = Number((totalBeforeDiscount * discountRate).toFixed(2));
  let specialDiscount =
    input.specialDiscount !== undefined && Number(input.specialDiscount) > 0
      ? Number(Number(input.specialDiscount).toFixed(2))
      : 0;

  // Enforce max discount limit if configured
  if (input.maxDiscountPercent !== undefined && input.maxDiscountPercent >= 0) {
    const maxAllowedDiscount = Number(((totalBeforeDiscount * input.maxDiscountPercent) / 100).toFixed(2));
    if (generalDiscount + specialDiscount > maxAllowedDiscount) {
      specialDiscount = Math.max(0, Number((maxAllowedDiscount - generalDiscount).toFixed(2)));
    }
  }

  const discount = Number((generalDiscount + specialDiscount).toFixed(2));
  const amountDue = Math.max(0, Math.round(totalBeforeDiscount - discount));

  let amountPaid = 0;
  let change = 0;
  let isFullyPaid = false;
  let paymentMethod: PaymentMethod = input.paymentMethod || "CASH";
  let resolvedPayments: PaymentAllocation[] = [];

  if (input.payments && Array.isArray(input.payments) && input.payments.length > 0) {
    // ---------------------------------------------------------
    // MULTI-TENDER SPLIT ALLOCATIONS
    // ---------------------------------------------------------
    let totalAllocated = 0;
    let totalChange = 0;

    resolvedPayments = input.payments.map((p) => {
      const allocAmount = Number(p.amount);
      if (isNaN(allocAmount) || allocAmount <= 0) {
        throw new ValidationError(`Payment allocation amount must be greater than 0 (got: ${p.amount})`);
      }

      let allocChange = 0;
      let allocTendered = p.amountTendered !== undefined ? Number(p.amountTendered) : allocAmount;

      if (p.method === "CASH") {
        if (isNaN(allocTendered) || allocTendered < allocAmount) {
          throw new ValidationError(
            `Cash tendered (${allocTendered}) cannot be less than cash allocation (${allocAmount})`
          );
        }
        allocChange = Number((allocTendered - allocAmount).toFixed(2));
      } else {
        allocTendered = allocAmount;
        allocChange = 0;
      }

      totalAllocated = Number((totalAllocated + allocAmount).toFixed(2));
      totalChange = Number((totalChange + allocChange).toFixed(2));

      return {
        method: p.method,
        amount: allocAmount,
        amountTendered: allocTendered,
        change: allocChange,
        reference: p.reference || "",
      };
    });

    amountPaid = totalAllocated;
    change = totalChange;
    isFullyPaid = amountPaid >= amountDue;

    // Determine aggregate paymentMethod
    const uniqueMethods = Array.from(new Set(resolvedPayments.map((p) => p.method)));
    if (uniqueMethods.length === 1) {
      paymentMethod = uniqueMethods[0];
    } else {
      paymentMethod = "OTHER";
    }
  } else {
    // ---------------------------------------------------------
    // SINGLE TENDER PAYMENT (FALLBACK / DEFAULT)
    // ---------------------------------------------------------
    if (paymentMethod === "CASH") {
      const tendered = input.amountTendered !== undefined ? Number(input.amountTendered) : amountDue;
      if (isNaN(tendered) || tendered < 0) {
        throw new ValidationError("Amount tendered cannot be negative");
      }

      if (tendered >= amountDue) {
        amountPaid = amountDue;
        change = Number((tendered - amountDue).toFixed(2));
        isFullyPaid = true;
      } else {
        amountPaid = Number(tendered.toFixed(2));
        change = 0;
        isFullyPaid = false;
      }

      resolvedPayments = [
        {
          method: "CASH",
          amount: amountPaid,
          amountTendered: tendered,
          change,
        },
      ];
    } else {
      // For CARD and OTHER, payment is exact and never produces cash change
      amountPaid = amountDue;
      change = 0;
      isFullyPaid = true;
      resolvedPayments = [
        {
          method: paymentMethod,
          amount: amountDue,
          amountTendered: amountDue,
          change: 0,
        },
      ];
    }
  }

  return {
    products,
    subtotal,
    tax,
    taxRate,
    discount,
    generalDiscount,
    specialDiscount,
    discountRate,
    total: totalBeforeDiscount,
    amountDue,
    amountPaid,
    change,
    paymentMethod,
    payments: resolvedPayments,
    isFullyPaid,
  };
}
