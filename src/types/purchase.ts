export type PurchaseStatus = "draft" | "ordered" | "received" | "paid" | "cancelled";

export interface PurchaseLineItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  date: string;
  vendorId: string;
  vendorName: string;
  status: PurchaseStatus;
  lineItems: PurchaseLineItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  amountPaid: number;
  balance: number;
  notes?: string;
  receivedDate?: string;
  paymentDate?: string;
  createdAt: string;
  createdBy: string;
}

export interface PurchaseFilters {
  search: string;
  status: PurchaseStatus | "all";
  vendorId: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}
