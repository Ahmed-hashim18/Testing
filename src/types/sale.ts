export type SalesStatus = 'draft' | 'confirmed' | 'invoiced' | 'paid' | 'cancelled';

export interface LineItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  status: SalesStatus;
  lineItems: LineItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  balance: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesFilters {
  search: string;
  status: string;
  customerId: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
}
