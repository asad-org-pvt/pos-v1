import { orderRepository, OrderRepository } from "../../repositories/OrderRepository";
import { returnRepository, ReturnRepository } from "../../repositories/ReturnRepository";
import { productRepository, ProductRepository } from "../../repositories/ProductRepository";
import { getStoreDateBounds, DateRangePreset } from "../../utils/dateTime";

export interface ReportDateFilter {
  preset: DateRangePreset;
  startDate?: string; // ISO string
  endDate?: string;   // ISO string
}

export interface SalesSummaryReport {
  periodLabel: string;
  grossSales: number;
  refunds: number;
  netSales: number;
  transactionCount: number;
  refundCount: number;
  avgTransactionValue: number;
  cashSales: number;
  cardSales: number;
  otherSales: number;
  estimatedCogs: number;
  grossProfit: number;
  grossMarginPercent: number;
}

export interface ProductSalesSummary {
  productId: string;
  name: string;
  unitsSold: number;
  unitsReturned: number;
  netUnitsSold: number;
  grossRevenue: number;
  netRevenue: number;
  estimatedProfit: number;
}

export interface CashierSalesSummary {
  cashierId: string;
  cashierName: string;
  transactionCount: number;
  grossSales: number;
  refunds: number;
  netSales: number;
  cashSales: number;
  cardSales: number;
  otherSales: number;
}

export interface InventoryValuationReport {
  totalProducts: number;
  totalUnitsInStock: number;
  totalRetailValue: number;
  totalCostValue: number;
  potentialProfit: number;
  lowStockProducts: Array<{ id: string; name: string; unitsInStock: number; unitPrice: number; costPrice: number }>;
}

export class ReportingService {
  private orderRepo: OrderRepository;
  private returnRepo?: ReturnRepository;
  private prodRepo: ProductRepository;
  private isLegacy2Arg: boolean = false;

  constructor(
    orderRepo?: OrderRepository,
    returnOrProdRepo?: any,
    prodRepo?: ProductRepository
  ) {
    this.orderRepo = orderRepo || orderRepository;
    if (prodRepo) {
      this.returnRepo = returnOrProdRepo || returnRepository;
      this.prodRepo = prodRepo;
      this.isLegacy2Arg = false;
    } else if (returnOrProdRepo) {
      // 2-argument call: constructor(orderRepo, prodRepo)
      this.returnRepo = undefined;
      this.prodRepo = returnOrProdRepo;
      this.isLegacy2Arg = true;
    } else {
      this.returnRepo = returnRepository;
      this.prodRepo = productRepository;
      this.isLegacy2Arg = false;
    }
  }

  /**
   * Generates comprehensive management sales and estimated profitability report.
   * - Uses bounded date queries (preventing memory dumps).
   * - Calculates historical COGS from OrderItem.unitCost snapshot (stable over time).
   * - Captures refunds processed within the period (reconciles with shift reports).
   */
  async getSalesReport(filter: ReportDateFilter, tenantId?: string): Promise<SalesSummaryReport> {
    const { startIso, endIso, startDate, endDate } = getStoreDateBounds(filter.preset, filter.startDate, filter.endDate);

    const ordersPromise = typeof this.orderRepo.getByDateRange === "function"
      ? this.orderRepo.getByDateRange(startIso, endIso, tenantId)
      : this.orderRepo.getAll(tenantId);

    const returnsPromise = this.returnRepo
      ? (typeof this.returnRepo.getByDateRange === "function"
          ? this.returnRepo.getByDateRange(startIso, endIso, tenantId)
          : (typeof this.returnRepo.getAll === "function" ? this.returnRepo.getAll(tenantId) : Promise.resolve([])))
      : Promise.resolve([]);

    const [allOrFilteredOrders, allOrFilteredReturns, products] = await Promise.all([
      ordersPromise,
      returnsPromise,
      this.prodRepo.getAll(tenantId),
    ]);

    // In-memory date filter fallback for mock repos or getAll
    const filteredOrders = (allOrFilteredOrders || []).filter((order) => {
      const orderDate = new Date(order.createdAt || order.dateTime || 0);
      return orderDate >= startDate && orderDate <= endDate;
    });

    const filteredReturns = (allOrFilteredReturns || []).filter((ret) => {
      const retDate = new Date(ret.createdAt || 0);
      return retDate >= startDate && retDate <= endDate;
    });

    const fallbackCostMap = new Map<string, number>();
    products.forEach((p) => fallbackCostMap.set(p.id, Number(p.costPrice) || 0));

    let grossSales = 0;
    let cashSales = 0;
    let cardSales = 0;
    let otherSales = 0;
    let estimatedCogs = 0;

    for (const order of filteredOrders) {
      const orderTotal = Number(order.amountDue || order.total) || 0;
      grossSales += orderTotal;

      if (order.paymentMethod === "CASH") cashSales += orderTotal;
      else if (order.paymentMethod === "CARD") cardSales += orderTotal;
      else otherSales += orderTotal;

      if (order.products) {
        for (const item of order.products) {
          // Use historical unitCost snapshot from OrderItem; fallback only for legacy records
          const itemCost = item.unitCost !== undefined ? Number(item.unitCost) : (fallbackCostMap.get(item.productId || item.id || "") || 0);
          const soldQty = Number(item.quantity) || 0;
          const retQty = Number(item.returnedQuantity) || 0;
          const netQty = Math.max(0, soldQty - retQty);
          estimatedCogs += netQty * itemCost;
        }
      }
    }

    // Refunds calculation
    let periodRefunds = 0;
    if (this.returnRepo && !this.isLegacy2Arg) {
      for (const ret of filteredReturns) {
        periodRefunds += Number(ret.refundTotal) || 0;
      }
    } else {
      for (const order of filteredOrders) {
        periodRefunds += Number(order.refundedAmount) || 0;
      }
    }

    grossSales = Number(grossSales.toFixed(2));
    periodRefunds = Number(periodRefunds.toFixed(2));
    const netSales = Number((grossSales - periodRefunds).toFixed(2));
    const transactionCount = filteredOrders.length;
    const refundCount = filteredReturns.length;
    const avgTransactionValue = transactionCount > 0 ? Number((netSales / transactionCount).toFixed(2)) : 0;
    estimatedCogs = Number(estimatedCogs.toFixed(2));
    const grossProfit = Number((netSales - estimatedCogs).toFixed(2));
    const grossMarginPercent = netSales > 0 ? Number(((grossProfit / netSales) * 100).toFixed(1)) : 0;

    return {
      periodLabel: filter.preset.toUpperCase(),
      grossSales,
      refunds: periodRefunds,
      netSales,
      transactionCount,
      refundCount,
      avgTransactionValue,
      cashSales: Number(cashSales.toFixed(2)),
      cardSales: Number(cardSales.toFixed(2)),
      otherSales: Number(otherSales.toFixed(2)),
      estimatedCogs,
      grossProfit,
      grossMarginPercent,
    };
  }

  /**
   * Generates product sales performance report using historical line-item snapshots.
   */
  async getProductSalesReport(filter: ReportDateFilter, tenantId?: string): Promise<ProductSalesSummary[]> {
    const { startIso, endIso, startDate, endDate } = getStoreDateBounds(filter.preset, filter.startDate, filter.endDate);

    const ordersPromise = typeof this.orderRepo.getByDateRange === "function"
      ? this.orderRepo.getByDateRange(startIso, endIso, tenantId)
      : this.orderRepo.getAll(tenantId);

    const [allOrFilteredOrders, products] = await Promise.all([
      ordersPromise,
      this.prodRepo.getAll(tenantId),
    ]);

    const filteredOrders = (allOrFilteredOrders || []).filter((order) => {
      const orderDate = new Date(order.createdAt || order.dateTime || 0);
      return orderDate >= startDate && orderDate <= endDate;
    });

    const fallbackCostMap = new Map<string, number>();
    products.forEach((p) => fallbackCostMap.set(p.id, Number(p.costPrice) || 0));

    const productMap = new Map<string, ProductSalesSummary>();

    for (const order of filteredOrders) {
      if (!order.products) continue;
      for (const item of order.products) {
        const pid = item.productId || item.id || "";
        const cost = item.unitCost !== undefined ? Number(item.unitCost) : (fallbackCostMap.get(pid) || 0);
        const soldQty = Number(item.quantity) || 0;
        const retQty = Number(item.returnedQuantity) || 0;
        const netQty = soldQty - retQty;
        const itemGross = Number(item.lineSubtotal || item.total || (Number(item.unitPrice) * soldQty));
        const unitRefundPrice = soldQty > 0 ? itemGross / soldQty : 0;
        const itemNetRevenue = itemGross - unitRefundPrice * retQty;
        const estimatedProfit = itemNetRevenue - netQty * cost;

        const existing = productMap.get(pid) || {
          productId: pid,
          name: item.name,
          unitsSold: 0,
          unitsReturned: 0,
          netUnitsSold: 0,
          grossRevenue: 0,
          netRevenue: 0,
          estimatedProfit: 0,
        };

        existing.unitsSold += soldQty;
        existing.unitsReturned += retQty;
        existing.netUnitsSold += netQty;
        existing.grossRevenue = Number((existing.grossRevenue + itemGross).toFixed(2));
        existing.netRevenue = Number((existing.netRevenue + itemNetRevenue).toFixed(2));
        existing.estimatedProfit = Number((existing.estimatedProfit + estimatedProfit).toFixed(2));

        productMap.set(pid, existing);
      }
    }

    return Array.from(productMap.values()).sort((a, b) => b.netRevenue - a.netRevenue);
  }

  /**
   * Generates cashier performance report.
   */
  async getCashierReport(filter: ReportDateFilter, tenantId?: string): Promise<CashierSalesSummary[]> {
    const { startIso, endIso, startDate, endDate } = getStoreDateBounds(filter.preset, filter.startDate, filter.endDate);

    const ordersPromise = typeof this.orderRepo.getByDateRange === "function"
      ? this.orderRepo.getByDateRange(startIso, endIso, tenantId)
      : this.orderRepo.getAll(tenantId);

    const filteredOrders = (await ordersPromise).filter((order) => {
      const orderDate = new Date(order.createdAt || order.dateTime || 0);
      return orderDate >= startDate && orderDate <= endDate;
    });

    const cashierMap = new Map<string, CashierSalesSummary>();

    for (const order of filteredOrders) {
      const cid = order.employeeId || "unknown";
      const cname = order.employeeName || "Cashier";
      const total = Number(order.amountDue || order.total) || 0;
      const refund = Number(order.refundedAmount) || 0;
      const net = total - refund;

      const existing = cashierMap.get(cid) || {
        cashierId: cid,
        cashierName: cname,
        transactionCount: 0,
        grossSales: 0,
        refunds: 0,
        netSales: 0,
        cashSales: 0,
        cardSales: 0,
        otherSales: 0,
      };

      existing.transactionCount += 1;
      existing.grossSales = Number((existing.grossSales + total).toFixed(2));
      existing.refunds = Number((existing.refunds + refund).toFixed(2));
      existing.netSales = Number((existing.netSales + net).toFixed(2));

      if (order.paymentMethod === "CASH") existing.cashSales = Number((existing.cashSales + total).toFixed(2));
      else if (order.paymentMethod === "CARD") existing.cardSales = Number((existing.cardSales + total).toFixed(2));
      else existing.otherSales = Number((existing.otherSales + total).toFixed(2));

      cashierMap.set(cid, existing);
    }

    return Array.from(cashierMap.values()).sort((a, b) => b.netSales - a.netSales);
  }

  /**
   * Generates inventory status and current cost valuation report.
   */
  async getInventoryValuationReport(tenantId?: string): Promise<InventoryValuationReport> {
    const products = await this.prodRepo.getAll(tenantId);

    let totalUnitsInStock = 0;
    let totalRetailValue = 0;
    let totalCostValue = 0;
    const lowStockProducts: InventoryValuationReport["lowStockProducts"] = [];

    for (const p of products) {
      const stock = Number(p.unitsInStock) || 0;
      const price = Number(p.unitPrice) || 0;
      const cost = Number(p.costPrice) || 0;

      totalUnitsInStock += stock;
      totalRetailValue += stock * price;
      totalCostValue += stock * cost;

      if (stock <= 5) {
        lowStockProducts.push({
          id: p.id,
          name: p.name,
          unitsInStock: stock,
          unitPrice: price,
          costPrice: cost,
        });
      }
    }

    totalRetailValue = Number(totalRetailValue.toFixed(2));
    totalCostValue = Number(totalCostValue.toFixed(2));
    const potentialProfit = Number((totalRetailValue - totalCostValue).toFixed(2));

    return {
      totalProducts: products.length,
      totalUnitsInStock,
      totalRetailValue,
      totalCostValue,
      potentialProfit,
      lowStockProducts,
    };
  }
}

export const reportingService = new ReportingService();
