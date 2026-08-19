import { ZodError } from "zod";

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, code = "APP_ERROR", statusCode = 500, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class AuthError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "AUTH_ERROR", 401, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "You do not have permission to perform this action", details?: unknown) {
    super(message, "UNAUTHORIZED_ERROR", 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(entityName: string, id?: string, details?: unknown) {
    const msg = id ? `${entityName} with ID '${id}' not found` : `${entityName} not found`;
    super(msg, "NOT_FOUND_ERROR", 404, details);
  }
}

export class TenantError extends AppError {
  constructor(message = "Invalid or missing tenant context", details?: unknown) {
    super(message, "TENANT_ERROR", 400, details);
  }
}

export class PersistenceError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "PERSISTENCE_ERROR", 500, details);
  }
}

export const formatZodError = (error: ZodError): string => {
  if (!error || !Array.isArray(error.issues)) {
    return error?.message || "Validation failed";
  }
  return error.issues.map((e) => `${e.path.length ? e.path.join(".") : "field"}: ${e.message}`).join(", ");
};
