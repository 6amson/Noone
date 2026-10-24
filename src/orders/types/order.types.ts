export type OrderStatus = 'pending' | 'paid';

export interface OrderItem {
  packageName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoiceData {
  orderId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  depositRequired: number;
  totalDueNow: number;
  balanceRemaining: number;
  deliveryDate: string;
  notes: string;
}

export interface ReceiptData {
  orderId: string;
  status: 'paid';
  amountReceived: number;
  paymentReference: string;
  paidAt: string;
  balanceRemaining: number;
}

export interface StoredOrder extends InvoiceData {
  customerEmail: string;
  occasion?: string;
  recipientCount?: number;
  deliveryArea?: string;
  customerNote?: string;
  createdAt: string;
  paidAt?: string;
  paymentReference?: string;
}
