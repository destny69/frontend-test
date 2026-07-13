import type { Item, Warehouse, StockEntry, Batch, Transfer, Adjustment, StockMovement } from './types';

export const categories = ['API', 'Excipients', 'Packaging', 'Lab Equipment', 'MRO'];
export const brands = ['Generic', 'PharmaGrade', 'LabPro', 'IndustrialCo'];

export const warehouses: Warehouse[] = [
  {
    id: 'WH-01',
    code: 'WH01',
    name: 'Main Warehouse',
    location: 'Kathmandu, Nepal',
    address: 'Balaju Industrial Area, Kathmandu, Nepal',
    manager: 'David Kim',
    phone: '+977 1 455 0192',
    email: 'wh01@pharmaco.com',
    description: 'Primary storage for API and excipients, ambient conditions',
    totalCapacity: 12000,
    occupied: 8460,
    temperatureControlled: false,
    coldStorage: false,
    hazardStorage: true,
    zones: ['Zone A', 'Zone B', 'Zone C'],
  },
  {
    id: 'WH-02',
    code: 'WH02',
    name: 'Cold Storage',
    location: 'Kathmandu, Nepal',
    address: 'Balaju Industrial Area, Unit 4, Kathmandu, Nepal',
    manager: 'Priya Nair',
    phone: '+977 1 455 0201',
    email: 'wh02@pharmaco.com',
    description: 'Temperature controlled (2–8°C) storage for sensitive materials',
    totalCapacity: 3000,
    occupied: 1120,
    temperatureControlled: true,
    coldStorage: true,
    hazardStorage: false,
    zones: ['Zone A'],
  },
  {
    id: 'WH-03',
    code: 'WH03',
    name: 'Packaging Store',
    location: 'Kathmandu, Nepal',
    address: 'Balaju Industrial Area, Unit 2, Kathmandu, Nepal',
    manager: 'Sofia Reyes',
    phone: '+977 1 455 0210',
    email: 'wh03@pharmaco.com',
    description: 'Packaging materials — foils, capsules, labels, cartons',
    totalCapacity: 6000,
    occupied: 3900,
    temperatureControlled: false,
    coldStorage: false,
    hazardStorage: false,
    zones: ['Zone A', 'Zone B'],
  },
  {
    id: 'WH-04',
    code: 'WH04',
    name: 'Maintenance Store',
    location: 'Kathmandu, Nepal',
    address: 'Balaju Industrial Area, Unit 5, Kathmandu, Nepal',
    manager: 'Tom Wallace',
    phone: '+977 1 455 0219',
    email: 'wh04@pharmaco.com',
    description: 'Spares, MRO consumables and maintenance equipment',
    totalCapacity: 1500,
    occupied: 640,
    temperatureControlled: false,
    coldStorage: false,
    hazardStorage: false,
    zones: ['Zone A'],
  },
  {
    id: 'WH-05',
    code: 'WH05',
    name: 'QC Lab',
    location: 'Kathmandu, Nepal',
    address: 'Balaju Industrial Area, Unit 6, Kathmandu, Nepal',
    manager: 'Ben Okoye',
    phone: '+977 1 455 0227',
    email: 'wh05@pharmaco.com',
    description: 'Lab equipment, reference standards and QC consumables',
    totalCapacity: 800,
    occupied: 310,
    temperatureControlled: true,
    coldStorage: false,
    hazardStorage: false,
    zones: ['Zone A'],
  },
];

export const items: Item[] = [];

export const batches: Batch[] = [];

export const stockEntries: StockEntry[] = batches.map((b, i) => ({
  id: `STK-${String(i + 1).padStart(3, '0')}`,
  itemId: b.itemId,
  batchNumber: b.batchNumber,
  warehouseId: b.warehouseId,
  bin: b.bin,
  availableQty: b.availableQty,
  reservedQty: b.reservedQty,
  damagedQty: b.damagedQty,
  pendingInspectionQty: b.qcStatus === 'Under Inspection' ? b.receivedQty - b.availableQty - b.reservedQty : 0,
  expiryDate: b.expiryDate,
  supplierName: b.supplierName,
  poNumber: b.poNumber,
  grnNumber: b.grnNumber,
}));

export const transfers: Transfer[] = [];

export const adjustments: Adjustment[] = [];

// Deterministic bin code for newly created batches (matches the seed bin scheme).
export function deriveBin(warehouseId: string, seq: number): string {
  return `${warehouseId.replace('WH-', 'WH')}-A${(seq % 5) + 1}-R${(seq % 3) + 1}-S${(seq % 4) + 1}`;
}

export const movements: StockMovement[] = [];

export function itemById(id: string) {
  return items.find((i) => i.id === id);
}
export function warehouseById(id: string) {
  return warehouses.find((w) => w.id === id);
}
export function batchById(id: string) {
  return batches.find((b) => b.id === id);
}
export function stockById(id: string) {
  return stockEntries.find((s) => s.id === id);
}
export function transferById(id: string) {
  return transfers.find((t) => t.id === id);
}
export function adjustmentById(id: string) {
  return adjustments.find((a) => a.id === id);
}
