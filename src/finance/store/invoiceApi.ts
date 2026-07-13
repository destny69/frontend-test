import { api } from '../../shared/api/client';
import type { Invoice, InvoiceStatus, PaymentMethod } from '../data/types';

interface ApiCustomer {
  id: number;
  name: string;
}

interface ApiInvoiceLine {
  id: number;
  product: string;
  batch_number: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  vat_percent: number;
  total: number;
}

interface ApiInvoice {
  id: number;
  invoice_no: string;
  customer?: ApiCustomer;
  invoice_date: string;
  due_date: string;
  salesperson: string | null;
  reference_number: string | null;
  payment_method: string | null;
  status: 'draft' | 'proforma' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  amount: number;
  paid: number;
  credited: number;
  balance: number;
  lines?: ApiInvoiceLine[];
  created_at: string;
}

const STATUS_LABEL: Record<ApiInvoice['status'], InvoiceStatus> = {
  draft: 'Draft',
  proforma: 'Proforma',
  sent: 'Sent',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

const METHOD_LABEL: Record<string, PaymentMethod> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  credit_card: 'Credit Card',
  online_payment: 'Online Payment',
  mobile_wallet: 'Mobile Wallet',
};

function mapInvoice(r: ApiInvoice): Invoice {
  return {
    id: String(r.id),
    invoiceNo: r.invoice_no,
    customerId: r.customer?.id != null ? String(r.customer.id) : '',
    invoiceDate: r.invoice_date,
    dueDate: r.due_date,
    salesperson: r.salesperson ?? '',
    referenceNumber: r.reference_number ?? '',
    paymentMethod: r.payment_method ? (METHOD_LABEL[r.payment_method] ?? 'Bank Transfer') : 'Bank Transfer',
    status: STATUS_LABEL[r.status],
    amount: Number(r.amount),
    paid: Number(r.paid),
    credited: Number(r.credited),
    lines: (r.lines ?? []).map((l) => ({
      product: l.product,
      batchNumber: l.batch_number ?? '',
      quantity: Number(l.quantity),
      unitPrice: Number(l.unit_price),
      discount: Number(l.discount_percent),
      vat: Number(l.vat_percent),
    })),
  };
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const data = await api.get<ApiInvoice[]>('/invoices');
  return data.map(mapInvoice);
}

export interface InvoiceLineInput {
  product: string;
  batchNumber?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  vatPercent?: number;
}

export interface CreateInvoiceInput {
  customerId: number;
  invoiceDate: string;
  dueDate: string;
  status: 'draft' | 'proforma' | 'sent';
  salesperson?: string;
  referenceNumber?: string;
  paymentMethod?: string;
  shippingAmount?: number;
  lines: InvoiceLineInput[];
}

export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const data = await api.post<ApiInvoice>('/invoices', input);
  return mapInvoice(data);
}

export async function convertProformaApi(id: string): Promise<Invoice> {
  const data = await api.post<ApiInvoice>(`/invoices/${id}/convert-proforma`);
  return mapInvoice(data);
}

export async function cancelInvoiceApi(id: string): Promise<Invoice> {
  const data = await api.post<ApiInvoice>(`/invoices/${id}/cancel`);
  return mapInvoice(data);
}
