export type ItemStatus = 'Active' | 'Inactive';
export type StockLevel = 'In Stock' | 'Low Stock' | 'Out of Stock';
export type BatchStatus =
  | 'Available'
  | 'Quarantined'
  | 'Under Inspection'
  | 'Released'
  | 'Expired'
  | 'Recalled';
export type TransferStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'In Transit'
  | 'Completed'
  | 'Cancelled';
export type AdjustmentReason =
  | 'Damage'
  | 'Loss'
  | 'Theft'
  | 'Counting Error'
  | 'Expired Items'
  | 'Quality Rejection';
export type AdjustmentStatus = 'Pending Approval' | 'Approved' | 'Rejected';

export type CostingMethod = 'FEFO' | 'FIFO';
export type StockType = 'Raw Material' | 'Packaging' | 'Work-in-Progress' | 'Finished Goods';

// Every quantity change in the system appends one of these to the ledger.
export type MovementType =
  | 'In'
  | 'Out'
  | 'Transfer'
  | 'Adjustment'
  | 'Reserve'
  | 'Return'
  | 'Write-off';

export interface StockMovement {
  id: string;
  date: string;
  type: MovementType;
  itemId: string;
  batchNumber: string;
  warehouseId: string;
  qty: number; // signed: positive = stock in, negative = stock out
  reference: string;
  by: string;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  manufacturer: string;
  description: string;
  uom: string;
  reorderLevel: number;
  safetyStock: number;
  maximumStock: number;
  storageCondition: string;
  batchTracking: boolean;
  expiryTracking: boolean;
  shelfLifeMonths: number;
  costingMethod: CostingMethod;
  stockType: StockType;
  barcode: string;
  preferredSupplier: string;
  purchasePrice: number;
  averageCost: number;
  currency: string;
  status: ItemStatus;
}

export interface Bin {
  code: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  location: string;
  address: string;
  manager: string;
  phone: string;
  email: string;
  description: string;
  totalCapacity: number;
  occupied: number;
  temperatureControlled: boolean;
  coldStorage: boolean;
  hazardStorage: boolean;
  zones: string[];
}

export interface StockEntry {
  id: string;
  itemId: string;
  batchNumber: string;
  warehouseId: string;
  bin: string;
  availableQty: number;
  reservedQty: number;
  damagedQty: number;
  pendingInspectionQty: number;
  expiryDate: string;
  supplierName: string;
  poNumber: string;
  grnNumber: string;
}

export interface Batch {
  id: string;
  batchNumber: string;
  itemId: string;
  supplierName: string;
  poNumber: string;
  grnNumber: string;
  warehouseId: string;
  bin: string;
  manufacturingDate: string;
  expiryDate: string;
  shelfLifeMonths: number;
  countryOfOrigin: string;
  qcStatus: BatchStatus;
  inspectionResult: string;
  approvedBy: string;
  releasedDate: string;
  receivedQty: number;
  availableQty: number;
  reservedQty: number;
  damagedQty: number;
  returnedQty: number;
}

export interface TransferItem {
  itemId: string;
  batchNumber: string;
  currentBin: string;
  quantity: number;
  destinationBin: string;
}

export interface Transfer {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  reason: string;
  requestedBy: string;
  approver?: string;
  transferDate: string;
  status: TransferStatus;
  items: TransferItem[];
}

export interface AdjustmentItem {
  itemId: string;
  batchNumber: string;
  currentQty: number;
  actualQty: number;
}

export interface Adjustment {
  id: string;
  adjustmentNo: string;
  warehouseId: string;
  type: 'Increase' | 'Decrease';
  reason: AdjustmentReason;
  reference: string;
  notes: string;
  date: string;
  createdBy: string;
  status: AdjustmentStatus;
  approver: string;
  items: AdjustmentItem[];
}
