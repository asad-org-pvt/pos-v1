import { OrderService } from "../OrderService";
import { ValidationError } from "../../../domain/errors/AppError";

describe("OrderService", () => {
  let mockRepo: any;
  let orderService: OrderService;

  beforeEach(() => {
    mockRepo = {
      getAll: jest.fn(),
      getById: jest.fn(),
      completeSale: jest.fn(),
      findByIdempotencyKey: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    orderService = new OrderService(mockRepo);
  });

  it("calculates subtotal, tax, discount and total automatically if not provided", async () => {
    mockRepo.completeSale.mockImplementation(async (data: any) => ({
      id: "ord-test",
      ...data,
    }));

    const rawOrder = {
      invoiceNumber: "AAA0000001",
      products: [
        {
          id: "prod-1",
          name: "Item A",
          unitPrice: 100,
          quantity: 2,
        },
        {
          id: "prod-2",
          name: "Item B",
          unitPrice: 50,
          quantity: 1,
        },
      ],
    };

    const created = await orderService.createOrder(rawOrder, "test-org");

    expect(mockRepo.completeSale).toHaveBeenCalled();
    const passedData = mockRepo.completeSale.mock.calls[0][0];

    // Subtotal: 100*2 + 50*1 = 250
    expect(passedData.subtotal).toBe(250);
    // Tax: 250 * 0.05 = 12.5
    expect(passedData.tax).toBe(12.5);
    // Total: 250 + 12.5 = 262.5
    expect(passedData.total).toBe(262.5);
    // Discount: 262.5 * 0.02 = 5.25
    expect(passedData.discount).toBe(5.25);
    // Amount Due: round(262.5 - 5.25) = 257
    expect(passedData.amountDue).toBe(257);
  });

  it("throws ValidationError when products array is empty", async () => {
    const invalidOrder = {
      invoiceNumber: "AAA0000001",
      products: [],
    };

    await expect(orderService.createOrder(invalidOrder)).rejects.toThrow(ValidationError);
    expect(mockRepo.completeSale).not.toHaveBeenCalled();
  });
});
