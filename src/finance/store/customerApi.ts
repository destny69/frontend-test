import { api } from '../../shared/api/client';
import type { Customer } from '../data/types';

interface ApiCustomer {
  id: number;
  name: string;
  type: string;
  email: string | null;
  phone: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  payment_terms: string | null;
}

function mapCustomer(r: ApiCustomer): Customer {
  return {
    id: String(r.id),
    name: r.name,
    type: r.type,
    email: r.email ?? '',
    phone: r.phone ?? '',
    billingAddress: r.billing_address ?? '',
    shippingAddress: r.shipping_address ?? '',
    paymentTerms: r.payment_terms ?? '',
  };
}

export async function fetchCustomers(): Promise<Customer[]> {
  const data = await api.get<ApiCustomer[]>('/customers');
  return data.map(mapCustomer);
}
