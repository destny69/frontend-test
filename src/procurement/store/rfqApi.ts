import { api } from '../../shared/api/client';
import type { Rfq, RfqQuote, RfqStatus, VendorCategory } from '../data/types';

interface ApiLookup {
  id: number;
  name: string;
}

interface ApiMaterial {
  material_code: string;
  material_name: string;
}

interface ApiRfqItem {
  id: number;
  raw_material_id: string;
  material?: ApiMaterial;
  quantity_requested: number;
  unit: string;
}

interface ApiRfqQuote {
  id: number;
  vendor?: ApiLookup;
  price: number;
  delivery_days: number;
  payment_terms: string | null;
  quality_rating: number;
  score: number | null;
  submitted: boolean;
}

interface ApiRfq {
  id: number;
  rfq_no: string;
  requisition_id: number | null;
  title: string;
  vendor_category?: ApiLookup;
  closing_date: string;
  currency: string;
  status: 'draft' | 'sent' | 'receiving_quotes' | 'closed' | 'awarded' | 'cancelled';
  awarded_vendor?: ApiLookup | null;
  invited_vendors?: ApiLookup[];
  items?: ApiRfqItem[];
  quotes?: ApiRfqQuote[];
  created_at: string;
}

const STATUS_LABEL: Record<ApiRfq['status'], RfqStatus> = {
  draft: 'Draft',
  sent: 'Sent',
  receiving_quotes: 'Receiving Quotes',
  closed: 'Closed',
  awarded: 'Awarded',
  cancelled: 'Cancelled',
};

function mapQuote(q: ApiRfqQuote): RfqQuote {
  return {
    vendorId: String(q.vendor?.id ?? ''),
    vendorName: q.vendor?.name ?? '',
    price: Number(q.price),
    deliveryDays: q.delivery_days,
    qualityRating: Number(q.quality_rating),
    paymentTerms: q.payment_terms ?? '',
    score: q.score != null ? Number(q.score) : 0,
    submitted: q.submitted,
  };
}

function mapRfq(r: ApiRfq): Rfq {
  return {
    id: String(r.id),
    rfqNo: r.rfq_no,
    requisitionId: r.requisition_id != null ? String(r.requisition_id) : undefined,
    title: r.title,
    category: (r.vendor_category?.name ?? '') as VendorCategory,
    createdDate: r.created_at?.slice(0, 10) ?? '',
    closingDate: r.closing_date,
    currency: r.currency,
    status: STATUS_LABEL[r.status],
    invitedVendors: (r.invited_vendors ?? []).map((v) => String(v.id)),
    items: (r.items ?? []).map((it) => ({
      // Canonical value is the material_code (the join key PO creation downstream
      // sends as rawMaterialId) — callers needing a label resolve it against the catalog.
      item: it.raw_material_id,
      description: '',
      requiredQty: Number(it.quantity_requested),
      unit: it.unit,
      currentStock: 0,
      requiredDate: '',
      remarks: '',
    })),
    quotes: (r.quotes ?? []).map(mapQuote),
    awardedVendor: r.awarded_vendor ? String(r.awarded_vendor.id) : undefined,
  };
}

export async function fetchRfqs(): Promise<Rfq[]> {
  const data = await api.get<ApiRfq[]>('/rfqs');
  return data.map(mapRfq);
}

export async function fetchRfq(id: string): Promise<Rfq> {
  const data = await api.get<ApiRfq>(`/rfqs/${id}`);
  return mapRfq(data);
}

export interface CreateRfqInput {
  requisitionId?: number;
  title: string;
  vendorCategoryId: number;
  closingDate: string;
  currency?: string;
  send: boolean;
  items: { rawMaterialId: string; quantityRequested: number; unit: string }[];
  invitedVendorIds: number[];
}

export async function createRfq(input: CreateRfqInput): Promise<Rfq> {
  const data = await api.post<ApiRfq>('/rfqs', input);
  return mapRfq(data);
}

export async function submitRfqQuote(
  rfqId: string,
  input: { vendorId: number; price: number; deliveryDays: number; qualityRating: number; paymentTerms?: string },
): Promise<Rfq> {
  const data = await api.post<ApiRfq>(`/rfqs/${rfqId}/quotes`, input);
  return mapRfq(data);
}

export async function awardRfqApi(rfqId: string, vendorId: number): Promise<Rfq> {
  const data = await api.post<ApiRfq>(`/rfqs/${rfqId}/award`, { vendorId });
  return mapRfq(data);
}

export async function inviteRfqVendorsApi(rfqId: string, additionalVendorIds: number[]): Promise<Rfq> {
  const data = await api.put<ApiRfq>(`/rfqs/${rfqId}`, { additionalVendorIds });
  return mapRfq(data);
}
