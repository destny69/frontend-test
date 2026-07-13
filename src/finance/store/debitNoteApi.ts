import { api } from '../../shared/api/client';
import type { DebitNote } from '../data/types';

interface ApiLookup {
  id: number;
  name: string;
}

interface ApiDebitNote {
  id: number;
  debit_note_no: string;
  date: string;
  vendor?: ApiLookup;
  supplier_bill?: { id: number; bill_no: string } | null;
  reason: string | null;
  amount: number;
  status: string;
  created_at: string;
}

function mapDebitNote(r: ApiDebitNote): DebitNote {
  return {
    id: String(r.id),
    debitNoteNo: r.debit_note_no,
    date: r.date,
    vendorId: r.vendor?.id != null ? String(r.vendor.id) : '',
    vendorName: r.vendor?.name ?? '',
    billNo: r.supplier_bill?.bill_no ?? '',
    reason: r.reason ?? '',
    amount: Number(r.amount),
    status: 'Issued',
  };
}

export async function fetchDebitNotes(): Promise<DebitNote[]> {
  const data = await api.get<ApiDebitNote[]>('/debit-notes');
  return data.map(mapDebitNote);
}

export interface CreateDebitNoteInput {
  date: string;
  vendorId: number;
  supplierBillId: number;
  reason?: string;
  amount: number;
}

export async function createDebitNote(input: CreateDebitNoteInput): Promise<DebitNote> {
  const data = await api.post<ApiDebitNote>('/debit-notes', input);
  return mapDebitNote(data);
}
