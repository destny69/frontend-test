import { api } from '../../shared/api/client';
import type { Warehouse } from '../data/types';

interface ApiWarehouse {
  id: number;
  code: string;
  name: string;
  location: string | null;
  address: string | null;
  manager: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  total_capacity: number;
  occupied: number;
  temperature_controlled: boolean;
  cold_storage: boolean;
  hazard_storage: boolean;
  zones: string[] | null;
}

function mapWarehouse(w: ApiWarehouse): Warehouse {
  return {
    id: String(w.id),
    code: w.code,
    name: w.name,
    location: w.location ?? '',
    address: w.address ?? '',
    manager: w.manager ?? '',
    phone: w.phone ?? '',
    email: w.email ?? '',
    description: w.description ?? '',
    totalCapacity: Number(w.total_capacity),
    occupied: Number(w.occupied),
    temperatureControlled: w.temperature_controlled,
    coldStorage: w.cold_storage,
    hazardStorage: w.hazard_storage,
    zones: w.zones ?? [],
  };
}

export async function fetchWarehouses(): Promise<Warehouse[]> {
  const data = await api.get<ApiWarehouse[]>('/warehouses');
  return data.map(mapWarehouse);
}
