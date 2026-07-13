import { api } from '../../shared/api/client';
import type { Batch, BatchStatus } from '../data/types';

interface ApiLookup {
  id: number;
  name: string;
}

interface ApiMaterial {
  material_code: string;
  material_name: string;
}

interface ApiWarehouse {
  id: number;
  name: string;
}

interface ApiBatch {
  id: number;
  batch_number: string;
  raw_material_id: string;
  material?: ApiMaterial;
  vendor?: ApiLookup | null;
  purchase_order?: { id: number; po_number: string } | null;
  grn?: { id: number; grn_number: string } | null;
  warehouse?: ApiWarehouse;
  bin: string | null;
  manufacturing_date: string | null;
  expiry_date: string | null;
  shelf_life_months: number | null;
  country_of_origin: string | null;
  qc_status: 'available' | 'quarantined' | 'under_inspection' | 'released' | 'expired' | 'recalled';
  inspection_result: string | null;
  approved_by?: ApiLookup | null;
  released_date: string | null;
  received_qty: number;
  available_qty: number;
  reserved_qty: number;
  damaged_qty: number;
  returned_qty: number;
}

const QC_LABEL: Record<ApiBatch['qc_status'], BatchStatus> = {
  available: 'Available',
  quarantined: 'Quarantined',
  under_inspection: 'Under Inspection',
  released: 'Released',
  expired: 'Expired',
  recalled: 'Recalled',
};

function mapBatch(r: ApiBatch): Batch {
  return {
    id: String(r.id),
    batchNumber: r.batch_number,
    itemId: r.raw_material_id,
    supplierName: r.vendor?.name ?? '',
    poNumber: r.purchase_order?.po_number ?? '',
    grnNumber: r.grn?.grn_number ?? '',
    warehouseId: r.warehouse?.id != null ? String(r.warehouse.id) : '',
    bin: r.bin ?? '',
    manufacturingDate: r.manufacturing_date ?? '',
    expiryDate: r.expiry_date ?? '',
    shelfLifeMonths: r.shelf_life_months ?? 0,
    countryOfOrigin: r.country_of_origin ?? '',
    qcStatus: QC_LABEL[r.qc_status],
    inspectionResult: r.inspection_result ?? '',
    approvedBy: r.approved_by?.name ?? '',
    releasedDate: r.released_date ?? '',
    receivedQty: Number(r.received_qty),
    availableQty: Number(r.available_qty),
    reservedQty: Number(r.reserved_qty),
    damagedQty: Number(r.damaged_qty),
    returnedQty: Number(r.returned_qty),
  };
}

export async function fetchBatches(): Promise<Batch[]> {
  const data = await api.get<ApiBatch[]>('/batches');
  return data.map(mapBatch);
}

export async function releaseBatchApi(id: string): Promise<Batch> {
  const data = await api.post<ApiBatch>(`/batches/${id}/release`);
  return mapBatch(data);
}

export async function recallBatchApi(id: string): Promise<Batch> {
  const data = await api.post<ApiBatch>(`/batches/${id}/recall`);
  return mapBatch(data);
}

export async function disposeBatchApi(id: string): Promise<Batch> {
  const data = await api.post<ApiBatch>(`/batches/${id}/dispose`);
  return mapBatch(data);
}

export async function releaseReservationApi(id: string, qty: number): Promise<Batch> {
  const data = await api.post<ApiBatch>(`/batches/${id}/release-reservation`, { qty });
  return mapBatch(data);
}

export async function returnStockApi(id: string, qty: number): Promise<Batch> {
  const data = await api.post<ApiBatch>(`/batches/${id}/return`, { qty });
  return mapBatch(data);
}

export async function reserveStockApi(rawMaterialId: string, warehouseId: number, qty: number): Promise<void> {
  await api.post('/stock/reserve', { rawMaterialId, warehouseId, qty });
}

export async function updateBatchBinApi(id: string, bin: string): Promise<Batch> {
  const data = await api.patch<ApiBatch>(`/batches/${id}/bin`, { bin });
  return mapBatch(data);
}

export interface StockOutLineInput {
  rawMaterialId: string;
  warehouseId: number;
  qty: number;
  reference?: string;
}

export async function stockOutApi(lines: StockOutLineInput[]): Promise<void> {
  await api.post('/stock/out', { lines });
}
