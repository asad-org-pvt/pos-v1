import { ProductService } from "../ProductService";
import { ValidationError } from "../../../domain/errors/AppError";

describe("ProductService", () => {
  let mockRepo: any;
  let productService: ProductService;

  beforeEach(() => {
    mockRepo = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateStock: jest.fn(),
    };
    productService = new ProductService(mockRepo);
  });

  it("validates and creates a valid product", async () => {
    mockRepo.create.mockImplementation(async (data: any) => ({
      id: "prod-1",
      ...data,
    }));

    const input = {
      name: "Pepsi 1L",
      unitPrice: 150,
      unitsInStock: 25,
      category: "Beverages",
    };

    const res = await productService.createProduct(input, "test-org");
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Pepsi 1L",
        unitPrice: 150,
        unitsInStock: 25,
      }),
      "test-org"
    );
    expect(res.id).toBe("prod-1");
  });

  it("rejects product with missing name", async () => {
    const invalid = {
      unitPrice: 100,
      unitsInStock: 10,
    };

    await expect(productService.createProduct(invalid)).rejects.toThrow(ValidationError);
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("rejects stock update with negative quantity", async () => {
    mockRepo.updateStock.mockRejectedValue(new ValidationError("Stock quantity cannot be negative"));

    await expect(productService.updateStock("prod-1", -5)).rejects.toThrow(ValidationError);
  });
});
