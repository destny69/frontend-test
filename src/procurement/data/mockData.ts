import type {
  Requisition,
  Vendor,
  Rfq,
  PurchaseOrder,
  Grn,
} from './types';

export const departments = [
  'Production',
  'Quality Control',
  'Quality Assurance',
  'Warehouse',
  'R&D',
  'Maintenance',
  'Packaging',
];

export const vendors: Vendor[] = [];

export const requisitions: Requisition[] = [];

export const rfqs: Rfq[] = [];

export const purchaseOrders: PurchaseOrder[] = [];

export const grns: Grn[] = [];

export function vendorById(id: string) {
  return vendors.find((v) => v.id === id);
}
export function requisitionById(id: string) {
  return requisitions.find((r) => r.id === id);
}
export function rfqById(id: string) {
  return rfqs.find((r) => r.id === id);
}
export function poById(id: string) {
  return purchaseOrders.find((p) => p.id === id);
}
export function grnById(id: string) {
  return grns.find((g) => g.id === id);
}
