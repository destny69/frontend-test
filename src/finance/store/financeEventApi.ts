import { api } from '../../shared/api/client';
import type { FinanceEvent } from '../data/types';

interface ApiFinanceEvent {
  id: number;
  date: string;
  type: string;
  entity: string;
  ref: string;
  by: string | null;
}

function mapEvent(e: ApiFinanceEvent): FinanceEvent {
  return { id: String(e.id), date: e.date, type: e.type, entity: e.entity, ref: e.ref, by: e.by ?? '' };
}

export async function fetchFinanceEvents(): Promise<FinanceEvent[]> {
  const data = await api.get<ApiFinanceEvent[]>('/finance-events');
  return data.map(mapEvent);
}
