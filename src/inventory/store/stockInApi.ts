import { api } from '../../shared/api/client';

export interface ReceiveStockLineInput {
  rawMaterialId: string;
  batchNumber: string;
  warehouseId: number;
  quantity: number;
  expiryDate?: string;
  manufacturingDate?: string;
  vendorId?: number;
  reference?: string;
  shelfLifeMonths?: number;
  countryOfOrigin?: string;
  qcStatus?: 'available' | 'quarantined' | 'under_inspection' | 'released' | 'expired' | 'recalled';
}

export async function receiveStockApi(lines: ReceiveStockLineInput[]): Promise<void> {
  await api.post('/stock/receive', { lines });
}
