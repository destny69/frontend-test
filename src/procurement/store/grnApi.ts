import { api } from '../../shared/api/client';
import type { Grn, GrnInspectionResult, GrnStatus } from '../data/types';

interface ApiLookup {
  id: number;
  name: string;
}

interface ApiMaterial {
  material_code: string;
  material_name: string;
}

interface ApiGrnItem {
  id: number;
  raw_material_id: string;
  material?: ApiMaterial;
  ordered_qty: number;
  received_qty: number;
  accepted_qty: number;
  rejected_qty: number;
  batch_number: string;
  expiry_date: string | null;
}

interface ApiInspectionResult {
  id: number;
  check: string;
  result: 'pass' | 'fail';
}

interface ApiGrn {
  id: number;
  grn_number: string;
  purchase_order?: { id: number; po_number: string; status: string };
  vendor?: ApiLookup;
  warehouse?: ApiLookup;
  received_date: string;
  received_by?: ApiLookup | null;
  delivery_note: string | null;
  status: 'pending' | 'inspection' | 'accepted' | 'rejected' | 'completed';
  items?: ApiGrnItem[];
  inspection_results?: ApiInspectionResult[];
  created_at: string;
}

const STATUS_LABEL: Record<ApiGrn['status'], GrnStatus> = {
  pending: 'Pending',
  inspection: 'Inspection',
  accepted: 'Accepted',
  rejected: 'Rejected',
  completed: 'Completed',
};

function mapGrn(r: ApiGrn): Grn {
  return {
    id: String(r.id),
    grnNumber: r.grn_number,
    poNumber: r.purchase_order?.po_number ?? '',
    vendorName: r.vendor?.name ?? '',
    warehouse: r.warehouse?.name ?? '',
    receivedDate: r.received_date,
    receivedBy: r.received_by?.name ?? '',
    deliveryNote: r.delivery_note ?? '',
    status: STATUS_LABEL[r.status],
    items: (r.items ?? []).map((it) => ({
      // Canonical value is the material_code (matches Batch.itemId downstream) —
      // callers needing a label resolve it against the item catalog.
      product: it.raw_material_id,
      orderedQty: Number(it.ordered_qty),
      receivedQty: Number(it.received_qty),
      acceptedQty: Number(it.accepted_qty),
      rejectedQty: Number(it.rejected_qty),
      batchNumber: it.batch_number,
      expiryDate: it.expiry_date ?? '',
    })),
    inspection: (r.inspection_results ?? []).map(
      (ins): GrnInspectionResult => ({ check: ins.check, result: ins.result }),
    ),
  };
}

export async function fetchGrns(): Promise<Grn[]> {
  const data = await api.get<ApiGrn[]>('/grns');
  return data.map(mapGrn);
}

export async function fetchGrn(id: string): Promise<Grn> {
  const data = await api.get<ApiGrn>(`/grns/${id}`);
  return mapGrn(data);
}

export interface GrnItemInput {
  rawMaterialId: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  batchNumber: string;
  expiryDate?: string;
}

export interface CreateGrnInput {
  purchaseOrderId: number;
  receivedDate: string;
  warehouseId: number;
  deliveryNote?: string;
  complete: boolean;
  items: GrnItemInput[];
  inspection?: { check: string; result: 'pass' | 'fail' }[];
}

export async function createGrn(input: CreateGrnInput): Promise<Grn> {
  const data = await api.post<ApiGrn>('/grns', input);
  return mapGrn(data);
}

export async function completeGrnApi(id: string): Promise<Grn> {
  const data = await api.post<ApiGrn>(`/grns/${id}/complete`);
  return mapGrn(data);
}
