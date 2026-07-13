import type { Batch, CostingMethod } from './types';

// Orders a batch list for issue/reservation.
//   FEFO — First-Expired-First-Out: earliest expiry date is consumed first.
//   FIFO — First-In-First-Out: earliest received batch (lowest id) is consumed first.
// Batches without an expiry date sort last under FEFO. Ties break by id so the
// order is deterministic (StrictMode-safe, no dependence on array identity).
export function orderBatchesByCosting(batches: Batch[], method: CostingMethod): Batch[] {
  const copy = [...batches];
  if (method === 'FIFO') {
    return copy.sort((a, b) => a.id.localeCompare(b.id));
  }
  return copy.sort((a, b) => {
    const ax = a.expiryDate || '';
    const bx = b.expiryDate || '';
    if (!ax && !bx) return a.id.localeCompare(b.id);
    if (!ax) return 1;
    if (!bx) return -1;
    return ax.localeCompare(bx) || a.id.localeCompare(b.id);
  });
}

// One allocation step against an ordered pool: given a required quantity, returns
// how much to take from each batch (used by stock-out preview and the store).
export interface Allocation {
  batch: Batch;
  take: number;
}
export function allocateByCosting(
  batches: Batch[],
  method: CostingMethod,
  qty: number,
): { allocations: Allocation[]; shortfall: number } {
  const ordered = orderBatchesByCosting(
    batches.filter((b) => b.availableQty > 0),
    method,
  );
  let remaining = qty;
  const allocations: Allocation[] = [];
  for (const batch of ordered) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, batch.availableQty);
    if (take <= 0) continue;
    allocations.push({ batch, take });
    remaining -= take;
  }
  return { allocations, shortfall: Math.max(0, remaining) };
}
