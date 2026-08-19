import { orderService } from "../../services/app/OrderService";

// get orders from POS
export const getOrdersFromPOS = async () => {
  return await orderService.getOrders();
};

// add order in POS
export const addOrderIntoPOS = async (order: any) => {
  return await orderService.createOrder(order);
};

// delete order api
export const deleteOrderFromPOS = async (id: string) => {
  return await orderService.deleteOrder(id);
};

// edit order api
export const editOrderFromPOS = async (id: string, order: any) => {
  return await orderService.updateOrder(id, order);
};
