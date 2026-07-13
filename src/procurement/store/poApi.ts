import { api } from '../../shared/api/client';
import type { PoStatus, PurchaseOrder } from '../data/types';

interface ApiLookup {
  id: number;
  name: string;
}

interface ApiMaterial {
  material_code: string;
  material_name: string;
}

interface ApiPurchaseOrderItem {
  id: number;
  raw_material_id: string;
  material?: ApiMaterial;
  qty: number;
  unit: string;
  unit_price: number;
  discount_percent: number;
  vat_percent: number;
  received_qty: number;
  subtotal: number;
  total: number;
}

interface ApiPurchaseOrderAmendment {
  id: number;
  note: string;
  changed_by?: ApiLookup | null;
  created_at: string;
}

interface ApiPurchaseOrder {
  id: number;
  po_number: string;
  rfq_id: number | null;
  vendor?: ApiLookup;
  order_date: string;
  expected_delivery: string;
  currency: string;
  warehouse: string | null;
  department?: ApiLookup | null;
  amount: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partially_received' | 'completed' | 'cancelled';
  created_by?: ApiLookup | null;
  items?: ApiPurchaseOrderItem[];
  amendments?: ApiPurchaseOrderAmendment[];
  created_at: string;
}

const STATUS_LABEL: Record<ApiPurchaseOrder['status'], PoStatus> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  sent: 'Sent',
  partially_received: 'Partially Received',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function mapPo(r: ApiPurchaseOrder): PurchaseOrder {
  return {
    id: String(r.id),
    poNumber: r.po_number,
    rfqId: r.rfq_id != null ? String(r.rfq_id) : undefined,
    vendorId: r.vendor?.id != null ? String(r.vendor.id) : '',
    vendorName: r.vendor?.name ?? '',
    date: r.order_date,
    expectedDelivery: r.expected_delivery,
    currency: r.currency,
    warehouse: r.warehouse ?? '',
    department: r.department?.name ?? '',
    amount: Number(r.amount),
    status: STATUS_LABEL[r.status],
    createdBy: r.created_by?.name ?? '',
    items: (r.items ?? []).map((it) => ({
      // Canonical value is the material_code (join key for GRN receiving downstream) —
      // callers needing a friendly label resolve it against the item catalog.
      product: it.raw_material_id,
      description: '',
      qty: Number(it.qty),
      unit: it.unit,
      unitPrice: Number(it.unit_price),
      discount: Number(it.discount_percent),
      vat: Number(it.vat_percent),
      receivedQty: Number(it.received_qty),
    })),
    amendments: (r.amendments ?? []).map((a) => ({
      date: a.created_at,
      note: a.note,
      changedBy: a.changed_by?.name ?? '',
    })),
  };
}

export async function fetchPurchaseOrders(): Promise<PurchaseOrder[]> {
  const data = await api.get<ApiPurchaseOrder[]>('/purchase-orders');
  return data.map(mapPo);
}

export async function fetchPurchaseOrder(id: string): Promise<PurchaseOrder> {
  const data = await api.get<ApiPurchaseOrder>(`/purchase-orders/${id}`);
  return mapPo(data);
}

export interface PoItemInput {
  rawMaterialId: string;
  qty: number;
  unit: string;
  unitPrice: number;
  discountPercent?: number;
  vatPercent?: number;
}

export interface CreatePurchaseOrderInput {
  rfqId?: number;
  vendorId: number;
  orderDate: string;
  expectedDelivery: string;
  currency?: string;
  warehouse?: string;
  departmentId?: number;
  submit: boolean;
  items: PoItemInput[];
}

export async function createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
  const data = await api.post<ApiPurchaseOrder>('/purchase-orders', input);
  return mapPo(data);
}

export async function approvePurchaseOrderApi(id: string): Promise<PurchaseOrder> {
  const data = await api.post<ApiPurchaseOrder>(`/purchase-orders/${id}/approve`);
  return mapPo(data);
}

export async function sendPurchaseOrderApi(id: string): Promise<PurchaseOrder> {
  const data = await api.post<ApiPurchaseOrder>(`/purchase-orders/${id}/send`);
  return mapPo(data);
}

export async function amendPurchaseOrderApi(
  id: string,
  note: string,
  items: PoItemInput[],
): Promise<PurchaseOrder> {
  const data = await api.post<ApiPurchaseOrder>(`/purchase-orders/${id}/amend`, { note, items });
  return mapPo(data);
}

export async function cancelPurchaseOrderApi(id: string): Promise<PurchaseOrder> {
  const data = await api.post<ApiPurchaseOrder>(`/purchase-orders/${id}/cancel`);
  return mapPo(data);
}
