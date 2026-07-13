import { api } from '../../shared/api/client';
import type { Payment, PaymentMethod, PaymentType } from '../data/types';

interface ApiPayment {
  id: number;
  payment_no: string;
  date: string;
  type: 'customer_payment' | 'supplier_payment' | 'advance_payment' | 'refund' | 'adjustment';
  party_name: string | null;
  invoice_or_bill_ref: string | null;
  method: 'cash' | 'bank_transfer' | 'cheque' | 'credit_card' | 'online_payment' | 'mobile_wallet';
  outstanding_balance: number;
  amount: number;
  remaining_balance: number;
  bank: string | null;
  reference_number: string | null;
  transaction_id: string | null;
  notes: string | null;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
}

const TYPE_LABEL: Record<ApiPayment['type'], PaymentType> = {
  customer_payment: 'Customer Payment',
  supplier_payment: 'Supplier Payment',
  advance_payment: 'Advance Payment',
  refund: 'Refund',
  adjustment: 'Adjustment',
};

const METHOD_LABEL: Record<ApiPayment['method'], PaymentMethod> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  credit_card: 'Credit Card',
  online_payment: 'Online Payment',
  mobile_wallet: 'Mobile Wallet',
};

const STATUS_LABEL: Record<ApiPayment['status'], Payment['status']> = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
};

function mapPayment(r: ApiPayment): Payment {
  return {
    id: String(r.id),
    paymentNo: r.payment_no,
    date: r.date,
    type: TYPE_LABEL[r.type],
    partyName: r.party_name ?? '',
    invoiceOrBillRef: r.invoice_or_bill_ref ?? '',
    method: METHOD_LABEL[r.method],
    outstandingBalance: Number(r.outstanding_balance),
    amount: Number(r.amount),
    remainingBalance: Number(r.remaining_balance),
    bank: r.bank ?? '',
    referenceNumber: r.reference_number ?? '',
    transactionId: r.transaction_id ?? '',
    notes: r.notes ?? '',
    status: STATUS_LABEL[r.status],
  };
}

export async function fetchPayments(): Promise<Payment[]> {
  const data = await api.get<ApiPayment[]>('/payments');
  return data.map(mapPayment);
}

export interface CreatePaymentInput {
  date: string;
  type: 'customer_payment' | 'supplier_payment' | 'advance_payment' | 'refund' | 'adjustment';
  method: 'cash' | 'bank_transfer' | 'cheque' | 'credit_card' | 'online_payment' | 'mobile_wallet';
  amount: number;
  partyName?: string;
  invoiceOrBillRef?: string;
  outstandingBalance?: number;
  bank?: string;
  referenceNumber?: string;
  transactionId?: string;
  notes?: string;
}

export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  const data = await api.post<ApiPayment>('/payments', input);
  return mapPayment(data);
}
