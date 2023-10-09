import { getWithPath, writeWithPath } from "..";
const LAST_INVOICE_ID = "lastInvoiceId";

export const addLastInvoiceNumber = async (invoiceNumber: string) => {
  return await writeWithPath(LAST_INVOICE_ID, invoiceNumber);
};
export const getLastInvoiceNumber = async () => {
  console.log("in dm");
  return await getWithPath(LAST_INVOICE_ID);
};
