export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address: string;
  city: string;
  country: string;
  taxId?: string;
  creditLimit: number;
  balance: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface CustomerFilters {
  search: string;
  status: string;
}
