// Vendor performance is DERIVED from real purchase orders + GRNs — never stored.
// A GRN is linked to a vendor by matching grn.poNumber -> purchaseOrder.poNumber -> vendorId.
// If a vendor has no purchase orders the vendor is "Not yet rated"; if it has orders but
// no matched receipts yet the delivery/quality metrics have no evidence and rating is null.

import type { PurchaseOrder, Grn } from './types';

export interface VendorPerformance {
  totalOrders: number;
  totalPurchase: number;
  matchedGrns: number;
  onTimePct: number | null;
  avgLeadDays: number | null;
  rejectedPct: number | null;
  rating: number | null;
  // Human-readable state when a numeric rating cannot honestly be shown.
  ratingLabel: 'Not yet rated' | 'Awaiting receipts' | null;
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  return (b - a) / 86_400_000;
}

// Lead-time score maps average order-to-receipt days onto 0..1 (shorter is better).
// 0 days -> 1, 30+ days -> 0. A fixed, transparent scale over real measured days.
export function leadScore(avgLeadDays: number): number {
  return Math.max(0, Math.min(1, 1 - avgLeadDays / 30));
}

export function vendorPerformance(
  vendorId: string,
  purchaseOrders: PurchaseOrder[],
  grns: Grn[],
): VendorPerformance {
  const vendorPOs = purchaseOrders.filter((p) => p.vendorId === vendorId);
  const totalOrders = vendorPOs.length;
  const totalPurchase = vendorPOs.reduce((sum, p) => sum + p.amount, 0);

  // Match each GRN to a PO by poNumber, keep only GRNs whose PO belongs to this vendor.
  const matched = grns
    .map((g) => ({ grn: g, po: purchaseOrders.find((p) => p.poNumber === g.poNumber) }))
    .filter((m): m is { grn: Grn; po: PurchaseOrder } => !!m.po && m.po.vendorId === vendorId);

  const matchedGrns = matched.length;

  if (totalOrders === 0) {
    return {
      totalOrders: 0,
      totalPurchase: 0,
      matchedGrns: 0,
      onTimePct: null,
      avgLeadDays: null,
      rejectedPct: null,
      rating: null,
      ratingLabel: 'Not yet rated',
    };
  }

  if (matchedGrns === 0) {
    return {
      totalOrders,
      totalPurchase,
      matchedGrns: 0,
      onTimePct: null,
      avgLeadDays: null,
      rejectedPct: null,
      rating: null,
      ratingLabel: 'Awaiting receipts',
    };
  }

  const onTimeCount = matched.filter(
    ({ grn, po }) => daysBetween(grn.receivedDate, po.expectedDelivery) >= 0,
  ).length;
  const onTimeFraction = onTimeCount / matchedGrns;
  const onTimePct = Math.round(onTimeFraction * 100);

  const avgLeadDays =
    matched.reduce((sum, { grn, po }) => sum + daysBetween(po.date, grn.receivedDate), 0) /
    matchedGrns;

  const totalReceived = matched.reduce(
    (sum, { grn }) => sum + grn.items.reduce((s, it) => s + it.receivedQty, 0),
    0,
  );
  const totalRejected = matched.reduce(
    (sum, { grn }) => sum + grn.items.reduce((s, it) => s + it.rejectedQty, 0),
    0,
  );
  const rejectedFraction = totalReceived > 0 ? totalRejected / totalReceived : 0;
  const rejectedPct = Math.round(rejectedFraction * 100);

  const composite =
    0.5 * onTimeFraction + 0.3 * (1 - rejectedFraction) + 0.2 * leadScore(avgLeadDays);
  const rating = Math.round(composite * 5 * 10) / 10;

  return {
    totalOrders,
    totalPurchase,
    matchedGrns,
    onTimePct,
    avgLeadDays: Math.round(avgLeadDays * 10) / 10,
    rejectedPct,
    rating,
    ratingLabel: null,
  };
}
