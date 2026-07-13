import { api } from '../../shared/api/client';
import type { MovementType, StockMovement } from '../data/types';

interface ApiWarehouse {
  id: number;
  name: string;
}

interface ApiStockMovement {
  id: number;
  date: string;
  type: 'in' | 'out' | 'transfer' | 'adjustment' | 'reserve' | 'return' | 'write_off';
  raw_material_id: string;
  batch_number: string;
  warehouse?: ApiWarehouse;
  qty: number;
  reference: string | null;
  by: string | null;
}

const TYPE_LABEL: Record<ApiStockMovement['type'], MovementType> = {
  in: 'In',
  out: 'Out',
  transfer: 'Transfer',
  adjustment: 'Adjustment',
  reserve: 'Reserve',
  return: 'Return',
  write_off: 'Write-off',
};

function mapMovement(m: ApiStockMovement): StockMovement {
  return {
    id: String(m.id),
    date: m.date,
    type: TYPE_LABEL[m.type],
    itemId: m.raw_material_id,
    batchNumber: m.batch_number,
    warehouseId: m.warehouse?.id != null ? String(m.warehouse.id) : '',
    qty: Number(m.qty),
    reference: m.reference ?? '',
    by: m.by ?? '',
  };
}

export async function fetchStockMovements(): Promise<StockMovement[]> {
  const data = await api.get<ApiStockMovement[]>('/stock-movements');
  return data.map(mapMovement);
}
