import { api } from '../../shared/api/client';
import type { Item, CostingMethod, ItemStatus } from '../data/types';

interface ApiRawMaterial {
  material_code: string;
  material_name: string;
  category: string;
  unit_of_measure: string;
  standard_shelf_life_days: number | null;
  storage_conditions: string | null;
  reorder_level: number;
  reorder_quantity: number;
  min_stock: number;
  max_stock: number;
  standard_cost: number;
  status: 'active' | 'discontinued';
  costing_method: 'fefo' | 'fifo';
}

const STATUS_LABEL: Record<ApiRawMaterial['status'], ItemStatus> = {
  active: 'Active',
  discontinued: 'Inactive',
};
const COSTING_LABEL: Record<ApiRawMaterial['costing_method'], CostingMethod> = {
  fefo: 'FEFO',
  fifo: 'FIFO',
};

function mapItem(m: ApiRawMaterial): Item {
  return {
    id: m.material_code,
    sku: m.material_code,
    name: m.material_name,
    category: m.category,
    // Not modeled on the backend yet - these stay local-only defaults.
    brand: '',
    manufacturer: '',
    description: '',
    uom: m.unit_of_measure,
    reorderLevel: Number(m.reorder_level),
    safetyStock: Number(m.min_stock),
    maximumStock: Number(m.max_stock),
    storageCondition: m.storage_conditions ?? '',
    batchTracking: true,
    expiryTracking: (m.standard_shelf_life_days ?? 0) > 0,
    shelfLifeMonths: Math.round((m.standard_shelf_life_days ?? 0) / 30),
    costingMethod: COSTING_LABEL[m.costing_method],
    stockType: 'Raw Material',
    barcode: '',
    preferredSupplier: '',
    purchasePrice: Number(m.standard_cost),
    averageCost: Number(m.standard_cost),
    currency: 'NPR',
    status: STATUS_LABEL[m.status],
  };
}

export async function fetchItems(): Promise<Item[]> {
  const data = await api.get<ApiRawMaterial[]>('/raw-materials');
  return data.map(mapItem);
}

export interface CreateItemInput {
  materialCode: string;
  materialName: string;
  category: string;
  unitOfMeasure: string;
  standardShelfLifeDays?: number;
  storageConditions?: string;
  reorderLevel?: number;
  minStock?: number;
  maxStock?: number;
  standardCost?: number;
  costingMethod?: 'fefo' | 'fifo';
}

export async function createItem(input: CreateItemInput): Promise<Item> {
  const data = await api.post<ApiRawMaterial>('/raw-materials', input);
  return mapItem(data);
}
