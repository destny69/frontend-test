import { api } from '../../shared/api/client';
import type { Requisition, RequisitionStatus, Priority } from '../data/types';

interface ApiLookup {
  id: number;
  name: string;
}

interface ApiMaterial {
  material_code: string;
  material_name: string;
}

interface ApiRequisitionItem {
  id: number;
  raw_material_id: string;
  material?: ApiMaterial;
  quantity_requested: number;
  unit: string;
}

interface ApiRequisition {
  id: number;
  requisition_no: string;
  department?: ApiLookup;
  requested_by?: ApiLookup | null;
  required_by_date: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  purpose_remarks: string;
  status: 'draft' | 'submitted' | 'pending_approval' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  approved_by?: ApiLookup | null;
  approved_at: string | null;
  items?: ApiRequisitionItem[];
  created_at: string;
}

const STATUS_LABEL: Record<ApiRequisition['status'], RequisitionStatus> = {
  draft: 'Draft',
  submitted: 'Submitted',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

const PRIORITY_LABEL: Record<ApiRequisition['priority'], Priority> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

function mapRequisition(r: ApiRequisition): Requisition {
  return {
    id: String(r.id),
    requestNo: r.requisition_no,
    department: r.department?.name ?? '',
    requestedBy: r.requested_by?.name ?? '',
    requestDate: r.created_at?.slice(0, 10) ?? '',
    requiredDate: r.required_by_date ?? '',
    priority: PRIORITY_LABEL[r.priority],
    purpose: r.purpose_remarks,
    notes: undefined,
    status: STATUS_LABEL[r.status],
    approvedBy: r.approved_by?.name,
    items: (r.items ?? []).map((it) => ({
      // Canonical value is the material_code (the join key RFQ/PO creation downstream
      // send as rawMaterialId) — callers needing a label resolve it against the catalog.
      item: it.raw_material_id,
      description: '',
      requiredQty: Number(it.quantity_requested),
      unit: it.unit,
      currentStock: 0,
      requiredDate: r.required_by_date ?? '',
      remarks: '',
    })),
  };
}

export async function fetchRequisitions(): Promise<Requisition[]> {
  const data = await api.get<ApiRequisition[]>('/material-requisitions');
  return data.map(mapRequisition);
}

export async function fetchDepartments(): Promise<ApiLookup[]> {
  return api.get<ApiLookup[]>('/departments');
}

export interface CreateRequisitionInput {
  departmentId: number;
  requiredByDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  purposeRemarks: string;
  submit: boolean;
  items: { rawMaterialId: string; quantityRequested: number; unit: string }[];
}

export async function createRequisition(input: CreateRequisitionInput): Promise<Requisition> {
  const data = await api.post<ApiRequisition>('/material-requisitions', input);
  return mapRequisition(data);
}

export async function approveRequisitionApi(id: string): Promise<Requisition> {
  const data = await api.post<ApiRequisition>(`/material-requisitions/${id}/approve`);
  return mapRequisition(data);
}

export async function rejectRequisitionApi(id: string, reason?: string): Promise<Requisition> {
  const data = await api.post<ApiRequisition>(`/material-requisitions/${id}/reject`, { reason });
  return mapRequisition(data);
}

export async function submitRequisitionApi(id: string): Promise<Requisition> {
  const data = await api.post<ApiRequisition>(`/material-requisitions/${id}/submit`);
  return mapRequisition(data);
}

export async function completeRequisitionApi(id: string): Promise<Requisition> {
  const data = await api.post<ApiRequisition>(`/material-requisitions/${id}/complete`);
  return mapRequisition(data);
}
