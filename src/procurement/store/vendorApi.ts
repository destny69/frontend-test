import { api } from '../../shared/api/client';
import type { Vendor, VendorCategory, VendorDoc } from '../data/types';

interface ApiLookup {
  id: number;
  name: string;
}

interface ApiVendorDocument {
  id: number;
  name: string;
  status: 'valid' | 'expiring' | 'expired' | 'missing';
  expiry: string | null;
}

interface ApiVendor {
  id: number;
  vendor_code: string;
  name: string;
  category?: ApiLookup;
  business_type?: ApiLookup | null;
  phone: string;
  email: string;
  website: string | null;
  address: string;
  country: string;
  status: 'active' | 'on_hold' | 'blacklisted' | 'pending_approval';
  registration_number: string | null;
  vat_number: string | null;
  established_date: string | null;
  primary_contact: string | null;
  payment_terms: string;
  currency: string;
  credit_limit: number;
  documents?: ApiVendorDocument[];
}

const DOC_STATUS_LABEL: Record<ApiVendorDocument['status'], VendorDoc['status']> = {
  valid: 'Valid',
  expiring: 'Expiring',
  expired: 'Expired',
  missing: 'Missing',
};

function mapVendorDoc(d: ApiVendorDocument): VendorDoc {
  return { id: String(d.id), name: d.name, status: DOC_STATUS_LABEL[d.status], expiry: d.expiry ?? undefined };
}

const DOC_STATUS_VALUE: Record<VendorDoc['status'], ApiVendorDocument['status']> = {
  Valid: 'valid',
  Expiring: 'expiring',
  Expired: 'expired',
  Missing: 'missing',
};

const STATUS_LABEL: Record<ApiVendor['status'], Vendor['status']> = {
  active: 'Active',
  on_hold: 'On Hold',
  blacklisted: 'Blacklisted',
  pending_approval: 'Pending Approval',
};

function mapVendor(v: ApiVendor): Vendor {
  return {
    id: String(v.id),
    vendorCode: v.vendor_code,
    name: v.name,
    category: (v.category?.name ?? '') as VendorCategory,
    phone: v.phone,
    email: v.email,
    website: v.website ?? undefined,
    address: v.address,
    country: v.country,
    status: STATUS_LABEL[v.status] ?? 'Pending Approval',
    registrationNumber: v.registration_number ?? '',
    vatNumber: v.vat_number ?? '',
    businessType: v.business_type?.name ?? '',
    establishedDate: v.established_date ?? '',
    primaryContact: v.primary_contact ?? '',
    paymentTerms: v.payment_terms,
    currency: v.currency,
    bankAccount: '—',
    creditLimit: v.credit_limit,
    // Not modeled on the backend yet - stays local-only until an AR ledger exists.
    outstandingBalance: 0,
    documents: (v.documents ?? []).map(mapVendorDoc),
  };
}

export async function fetchVendors(): Promise<Vendor[]> {
  const data = await api.get<ApiVendor[]>('/vendors');
  return data.map(mapVendor);
}

export async function fetchVendorCategories(): Promise<ApiLookup[]> {
  return api.get<ApiLookup[]>('/vendor-categories');
}

export async function fetchBusinessTypes(): Promise<ApiLookup[]> {
  return api.get<ApiLookup[]>('/business-types');
}

export interface CreateVendorInput {
  name: string;
  vendorCategoryId: number;
  businessTypeId?: number;
  phone: string;
  email: string;
  website?: string;
  address: string;
  country: string;
  registrationNumber?: string;
  vatNumber?: string;
  establishedDate?: string;
  primaryContact?: string;
  paymentTerms?: string;
  currency?: string;
  creditLimit?: number;
}

export async function createVendor(input: CreateVendorInput): Promise<Vendor> {
  const data = await api.post<ApiVendor>('/vendors', input);
  return mapVendor(data);
}

const STATUS_VALUE: Record<Vendor['status'], ApiVendor['status']> = {
  Active: 'active',
  'On Hold': 'on_hold',
  Blacklisted: 'blacklisted',
  'Pending Approval': 'pending_approval',
};

// No dedicated approve/reject endpoint - vendor standing is just a field on
// the standard update route.
export async function updateVendorStatus(id: string, status: Vendor['status']): Promise<Vendor> {
  const data = await api.put<ApiVendor>(`/vendors/${id}`, { status: STATUS_VALUE[status] });
  return mapVendor(data);
}

export async function addVendorDocumentApi(vendorId: string, doc: VendorDoc): Promise<Vendor> {
  const data = await api.post<ApiVendor>(`/vendors/${vendorId}/documents`, {
    name: doc.name,
    status: DOC_STATUS_VALUE[doc.status],
    expiry: doc.expiry,
  });
  return mapVendor(data);
}

export async function removeVendorDocumentApi(vendorId: string, documentId: string): Promise<Vendor> {
  const data = await api.del<ApiVendor>(`/vendors/${vendorId}/documents/${documentId}`);
  return mapVendor(data);
}
