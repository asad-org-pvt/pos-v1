import { Shift, OpenShiftSchema, CloseShiftSchema, OpenShiftInput, CloseShiftInput } from "../../domain/models/Shift";
import { shiftRepository, ShiftRepository } from "../../repositories/ShiftRepository";
import { registerRepository, RegisterRepository } from "../../repositories/RegisterRepository";
import { ValidationError, NotFoundError, formatZodError } from "../../domain/errors/AppError";
import { QueryOptions } from "../../repositories/base/IRepository";
import { addLog } from "../cloud/firebase/logging";

export class ShiftService {
  constructor(
    private repo: ShiftRepository = shiftRepository,
    private regRepo: RegisterRepository = registerRepository
  ) {}

  async getShifts(tenantId?: string, options?: QueryOptions): Promise<Shift[]> {
    return this.repo.getAll(tenantId, options);
  }

  async getShiftById(id: string, tenantId?: string): Promise<Shift | null> {
    if (!id) throw new ValidationError("Shift ID is required");
    return this.repo.getById(id, tenantId);
  }

  async getActiveShiftForRegister(registerId: string, tenantId?: string): Promise<Shift | null> {
    if (!registerId) throw new ValidationError("Register ID is required");
    return this.repo.findActiveShiftByRegister(registerId, tenantId);
  }

  async getActiveShiftForCashier(cashierId: string, tenantId?: string): Promise<Shift | null> {
    if (!cashierId) throw new ValidationError("Cashier ID is required");
    return this.repo.findActiveShiftByCashier(cashierId, tenantId);
  }

  async openShift(input: OpenShiftInput, tenantId?: string): Promise<Shift> {
    const parseResult = OpenShiftSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Open shift validation failed: ${errorMsg}`, parseResult.error.format());
    }

    // 1. Verify register exists and is active
    const register = await this.regRepo.getById(input.registerId, tenantId);
    if (!register) {
      throw new NotFoundError("Register", input.registerId, {
        message: `Register "${input.registerId}" not found in current organization`,
      });
    }

    if (register.status !== "ACTIVE") {
      throw new ValidationError(`Register "${register.name}" is INACTIVE and cannot open a shift.`);
    }

    // 2. Open shift via repository (handles duplicate active shift validation)
    const shift = await this.repo.openShift(
      {
        ...parseResult.data,
        registerName: register.name,
      },
      tenantId
    );

    // 3. Audit log (non-blocking)
    addLog({
      message: `Shift opened: Register "${shift.registerName}", Cashier: ${shift.cashierName}, Float: ${shift.openingFloat}`,
      type: "info",
      path: "ShiftService.openShift",
    }).catch((err) => console.warn("Audit log failed", err));

    return shift;
  }

  async closeShift(shiftId: string, input: CloseShiftInput, tenantId?: string): Promise<Shift> {
    if (!shiftId) throw new ValidationError("Shift ID is required for closing");

    const parseResult = CloseShiftSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Close shift validation failed: ${errorMsg}`, parseResult.error.format());
    }

    const closedShift = await this.repo.closeShift(shiftId, parseResult.data, tenantId);

    // Audit log (non-blocking)
    addLog({
      message: `Shift closed: Register "${closedShift.registerName}", Counted: ${closedShift.closingCash}, Expected: ${closedShift.expectedCash}, Diff: ${closedShift.cashDifference}`,
      type: "info",
      path: "ShiftService.closeShift",
    }).catch((err) => console.warn("Audit log failed", err));

    return closedShift;
  }
}

export const shiftService = new ShiftService();
