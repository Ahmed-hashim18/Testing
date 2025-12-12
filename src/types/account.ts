export type AccountType = 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses';

export type AccountStatus = 'active' | 'inactive';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentId: string | null;
  status: AccountStatus;
  balance: number;
  description?: string;
  isImported?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountWithChildren extends Account {
  children: AccountWithChildren[];
  level: number;
}

export interface AccountTransaction {
  id: string;
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference: string;
}
