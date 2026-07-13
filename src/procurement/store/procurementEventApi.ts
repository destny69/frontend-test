import { api } from '../../shared/api/client';
import type { ProcurementEvent, ProcurementEventType, ProcurementEntity } from '../data/types';

interface ApiProcurementEvent {
  id: number;
  date: string;
  type: string;
  entity: string;
  ref: string;
  by: string | null;
}

function mapEvent(e: ApiProcurementEvent): ProcurementEvent {
  return {
    id: String(e.id),
    date: e.date,
    type: e.type as ProcurementEventType,
    entity: e.entity as ProcurementEntity,
    ref: e.ref,
    by: e.by ?? '',
  };
}

export async function fetchProcurementEvents(): Promise<ProcurementEvent[]> {
  const data = await api.get<ApiProcurementEvent[]>('/procurement-events');
  return data.map(mapEvent);
}
