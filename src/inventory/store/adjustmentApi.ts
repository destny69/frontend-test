import { api } from '../../shared/api/client';
import type { Adjustment, AdjustmentReason, AdjustmentStatus } from '../data/types';

interface ApiLookup {
  id: number;
  name: string;
}

interface ApiMaterial {
  material_code: string;
  material_name: string;
}

interface ApiAdjustmentItem {
  id: number;
  raw_material_id: string;
  material?: ApiMaterial;
  batch_number: string;
  current_qty: number;
  actual_qty: number;
  delta: number;
}

interface ApiAdjustment {
  id: number;
  adjustment_no: string;
  warehouse?: ApiLookup;
  type: 'increase' | 'decrease';
  reason: 'damage' | 'loss' | 'theft' | 'counting_error' | 'expired_items' | 'quality_rejection';
  reference: string | null;
  notes: string | null;
  date: string;
  created_by?: ApiLookup | null;
  status: 'pending_approval' | 'approved' | 'rejected';
  approved_by?: ApiLookup | null;
  items?: ApiAdjustmentItem[];
  created_at: string;
}

const STATUS_LABEL: Record<ApiAdjustment['status'], AdjustmentStatus> = {
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

const REASON_LABEL: Record<ApiAdjustment['reason'], AdjustmentReason> = {
  damage: 'Damage',
  loss: 'Loss',
  theft: 'Theft',
  counting_error: 'Counting Error',
  expired_items: 'Expired Items',
  quality_rejection: 'Quality Rejection',
};

function mapAdjustment(r: ApiAdjustment): Adjustment {
  return {
    id: String(r.id),
    adjustmentNo: r.adjustment_no,
    warehouseId: r.warehouse?.id != null ? String(r.warehouse.id) : '',
    type: r.type === 'increase' ? 'Increase' : 'Decrease',
    reason: REASON_LABEL[r.reason],
    reference: r.reference ?? '',
    notes: r.notes ?? '',
    date: r.date,
    createdBy: r.created_by?.name ?? '',
    status: STATUS_LABEL[r.status],
    approver: r.approved_by?.name ?? '',
    items: (r.items ?? []).map((it) => ({
      // Canonical value is the material_code - callers needing a label
      // resolve it against the item catalog.
      itemId: it.raw_material_id,
      batchNumber: it.batch_number,
      currentQty: Number(it.current_qty),
      actualQty: Number(it.actual_qty),
    })),
  };
}

export async function fetchAdjustments(): Promise<Adjustment[]> {
  const data = await api.get<ApiAdjustment[]>('/adjustments');
  return data.map(mapAdjustment);
}

export interface AdjustmentItemInput {
  rawMaterialId: string;
  batchNumber: string;
  currentQty: number;
  actualQty: number;
}

export interface CreateAdjustmentInput {
  warehouseId: number;
  type: 'increase' | 'decrease';
  reason: 'damage' | 'loss' | 'theft' | 'counting_error' | 'expired_items' | 'quality_rejection';
  reference?: string;
  notes?: string;
  date: string;
  items: AdjustmentItemInput[];
}

export async function createAdjustment(input: CreateAdjustmentInput): Promise<Adjustment> {
  const data = await api.post<ApiAdjustment>('/adjustments', input);
  return mapAdjustment(data);
}

export async function approveAdjustmentApi(id: string): Promise<Adjustment> {
  const data = await api.post<ApiAdjustment>(`/adjustments/${id}/approve`);
  return mapAdjustment(data);
}

export async function rejectAdjustmentApi(id: string): Promise<Adjustment> {
  const data = await api.post<ApiAdjustment>(`/adjustments/${id}/reject`);
  return mapAdjustment(data);
}
