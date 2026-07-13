import { api } from '../../shared/api/client';
import type { Transfer, TransferStatus } from '../data/types';

interface ApiLookup {
  id: number;
  name: string;
}

interface ApiMaterial {
  material_code: string;
  material_name: string;
}

interface ApiTransferItem {
  id: number;
  raw_material_id: string;
  material?: ApiMaterial;
  batch_number: string;
  current_bin: string | null;
  quantity: number;
  destination_bin: string | null;
}

interface ApiTransfer {
  id: number;
  transfer_number: string;
  from_warehouse?: ApiLookup;
  to_warehouse?: ApiLookup;
  reason: string | null;
  requested_by?: ApiLookup | null;
  approved_by?: ApiLookup | null;
  transfer_date: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'in_transit' | 'completed' | 'cancelled';
  items?: ApiTransferItem[];
  created_at: string;
}

const STATUS_LABEL: Record<ApiTransfer['status'], TransferStatus> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  in_transit: 'In Transit',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function mapTransfer(r: ApiTransfer): Transfer {
  return {
    id: String(r.id),
    transferNumber: r.transfer_number,
    fromWarehouseId: r.from_warehouse?.id != null ? String(r.from_warehouse.id) : '',
    toWarehouseId: r.to_warehouse?.id != null ? String(r.to_warehouse.id) : '',
    reason: r.reason ?? '',
    requestedBy: r.requested_by?.name ?? '',
    approver: r.approved_by?.name ?? undefined,
    transferDate: r.transfer_date,
    status: STATUS_LABEL[r.status],
    items: (r.items ?? []).map((it) => ({
      // Canonical value is the material_code - callers needing a label
      // resolve it against the item catalog.
      itemId: it.raw_material_id,
      batchNumber: it.batch_number,
      currentBin: it.current_bin ?? '',
      quantity: Number(it.quantity),
      destinationBin: it.destination_bin ?? '',
    })),
  };
}

export async function fetchTransfers(): Promise<Transfer[]> {
  const data = await api.get<ApiTransfer[]>('/transfers');
  return data.map(mapTransfer);
}

export interface TransferItemInput {
  rawMaterialId: string;
  batchNumber: string;
  currentBin?: string;
  quantity: number;
  destinationBin?: string;
}

export interface CreateTransferInput {
  fromWarehouseId: number;
  toWarehouseId: number;
  reason?: string;
  transferDate: string;
  submit: boolean;
  items: TransferItemInput[];
}

export async function createTransfer(input: CreateTransferInput): Promise<Transfer> {
  const data = await api.post<ApiTransfer>('/transfers', input);
  return mapTransfer(data);
}

export async function approveTransferApi(id: string): Promise<Transfer> {
  const data = await api.post<ApiTransfer>(`/transfers/${id}/approve`);
  return mapTransfer(data);
}

export async function completeTransferApi(id: string): Promise<Transfer> {
  const data = await api.post<ApiTransfer>(`/transfers/${id}/complete`);
  return mapTransfer(data);
}

export async function cancelTransferApi(id: string): Promise<Transfer> {
  const data = await api.post<ApiTransfer>(`/transfers/${id}/cancel`);
  return mapTransfer(data);
}
