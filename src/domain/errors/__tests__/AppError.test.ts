import {
  AppError,
  ValidationError,
  AuthError,
  UnauthorizedError,
  NotFoundError,
  TenantError,
  PersistenceError,
} from "../AppError";

describe("Domain Error Hierarchy", () => {
  it("should create AppError with default status 500", () => {
    const err = new AppError("Something went wrong");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toBe("Something went wrong");
    expect(err.code).toBe("APP_ERROR");
    expect(err.statusCode).toBe(500);
  });

  it("should create ValidationError with 400 status", () => {
    const err = new ValidationError("Invalid field", { field: "email" });
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.statusCode).toBe(400);
    expect(err.details).toEqual({ field: "email" });
  });

  it("should create AuthError with 401 status", () => {
    const err = new AuthError("Invalid credentials");
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe("AUTH_ERROR");
    expect(err.statusCode).toBe(401);
  });

  it("should create UnauthorizedError with 403 status", () => {
    const err = new UnauthorizedError();
    expect(err.code).toBe("UNAUTHORIZED_ERROR");
    expect(err.statusCode).toBe(403);
  });

  it("should create NotFoundError with 404 status and formatted message", () => {
    const err = new NotFoundError("Product", "prod-123");
    expect(err.code).toBe("NOT_FOUND_ERROR");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Product with ID 'prod-123' not found");
  });

  it("should create TenantError with 400 status", () => {
    const err = new TenantError();
    expect(err.code).toBe("TENANT_ERROR");
    expect(err.statusCode).toBe(400);
  });

  it("should create PersistenceError with 500 status", () => {
    const err = new PersistenceError("Database connection dropped");
    expect(err.code).toBe("PERSISTENCE_ERROR");
    expect(err.statusCode).toBe(500);
  });
});
