import { api } from '../../shared/api/client';
import type { BillStatus, SupplierBill } from '../data/types';

interface ApiLookup {
  id: number;
  name: string;
}

interface ApiBillLine {
  id: number;
  product: string;
  batch_number: string | null;
  quantity: number;
  unit_cost: number;
  vat_percent: number;
  total: number;
}

interface ApiSupplierBill {
  id: number;
  bill_no: string;
  vendor?: ApiLookup;
  purchase_order?: { id: number; po_number: string } | null;
  grn?: { id: number; grn_number: string } | null;
  invoice_date: string;
  due_date: string;
  status: 'draft' | 'pending_verification' | 'approved' | 'partially_paid' | 'paid' | 'cancelled';
  amount: number;
  paid: number;
  po_match: boolean;
  grn_match: boolean;
  invoice_match: boolean;
  difference: number;
  credited: number;
  balance: number;
  lines?: ApiBillLine[];
  created_at: string;
}

const STATUS_LABEL: Record<ApiSupplierBill['status'], BillStatus> = {
  draft: 'Draft',
  pending_verification: 'Pending Verification',
  approved: 'Approved',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

function mapBill(r: ApiSupplierBill): SupplierBill {
  return {
    id: String(r.id),
    billNo: r.bill_no,
    vendorId: r.vendor?.id != null ? String(r.vendor.id) : '',
    vendorName: r.vendor?.name ?? '',
    poNumber: r.purchase_order?.po_number ?? '',
    grnNumber: r.grn?.grn_number ?? '',
    invoiceDate: r.invoice_date,
    dueDate: r.due_date,
    status: STATUS_LABEL[r.status],
    amount: Number(r.amount),
    paid: Number(r.paid),
    poMatch: r.po_match,
    grnMatch: r.grn_match,
    invoiceMatch: r.invoice_match,
    difference: Number(r.difference),
    credited: Number(r.credited),
    lines: (r.lines ?? []).map((l) => ({
      product: l.product,
      batchNumber: l.batch_number ?? '',
      quantity: Number(l.quantity),
      unitCost: Number(l.unit_cost),
      vat: Number(l.vat_percent),
    })),
  };
}

export async function fetchBills(): Promise<SupplierBill[]> {
  const data = await api.get<ApiSupplierBill[]>('/supplier-bills');
  return data.map(mapBill);
}

export interface BillLineInput {
  product: string;
  batchNumber?: string;
  quantity: number;
  unitCost: number;
  vatPercent?: number;
}

export interface CreateBillInput {
  vendorId: number;
  purchaseOrderId?: number;
  grnId?: number;
  invoiceDate: string;
  dueDate: string;
  lines: BillLineInput[];
}

export async function createBill(input: CreateBillInput): Promise<SupplierBill> {
  const data = await api.post<ApiSupplierBill>('/supplier-bills', input);
  return mapBill(data);
}

export async function approveBillApi(id: string): Promise<SupplierBill> {
  const data = await api.post<ApiSupplierBill>(`/supplier-bills/${id}/approve`);
  return mapBill(data);
}

export async function cancelBillApi(id: string): Promise<SupplierBill> {
  const data = await api.post<ApiSupplierBill>(`/supplier-bills/${id}/cancel`);
  return mapBill(data);
}
