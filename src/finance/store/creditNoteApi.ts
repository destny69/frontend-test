import { api } from '../../shared/api/client';
import type { CreditNote } from '../data/types';

interface ApiLookup {
  id: number;
  name: string;
}

interface ApiCreditNote {
  id: number;
  credit_note_no: string;
  date: string;
  customer?: ApiLookup;
  invoice?: { id: number; invoice_no: string } | null;
  reason: string | null;
  amount: number;
  status: string;
  created_at: string;
}

function mapCreditNote(r: ApiCreditNote): CreditNote {
  return {
    id: String(r.id),
    creditNoteNo: r.credit_note_no,
    date: r.date,
    customerId: r.customer?.id != null ? String(r.customer.id) : '',
    invoiceNo: r.invoice?.invoice_no ?? '',
    reason: r.reason ?? '',
    amount: Number(r.amount),
    status: 'Issued',
  };
}

export async function fetchCreditNotes(): Promise<CreditNote[]> {
  const data = await api.get<ApiCreditNote[]>('/credit-notes');
  return data.map(mapCreditNote);
}

export interface CreateCreditNoteInput {
  date: string;
  customerId: number;
  invoiceId: number;
  reason?: string;
  amount: number;
}

export async function createCreditNote(input: CreateCreditNoteInput): Promise<CreditNote> {
  const data = await api.post<ApiCreditNote>('/credit-notes', input);
  return mapCreditNote(data);
}
