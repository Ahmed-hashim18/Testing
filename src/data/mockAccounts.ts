import { Account, AccountTransaction } from '@/types/account';

export const mockAccounts: Account[] = [
  // Assets
  { id: '1000', code: '1000', name: 'Assets', type: 'Assets', parentId: null, status: 'active', balance: 485000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '1100', code: '1100', name: 'Current Assets', type: 'Assets', parentId: '1000', status: 'active', balance: 285000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '1110', code: '1110', name: 'Cash and Cash Equivalents', type: 'Assets', parentId: '1100', status: 'active', balance: 125000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '1111', code: '1111', name: 'Petty Cash', type: 'Assets', parentId: '1110', status: 'active', balance: 2000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '1112', code: '1112', name: 'Bank Account - Main', type: 'Assets', parentId: '1110', status: 'active', balance: 123000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '1120', code: '1120', name: 'Accounts Receivable', type: 'Assets', parentId: '1100', status: 'active', balance: 85000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '1130', code: '1130', name: 'Inventory', type: 'Assets', parentId: '1100', status: 'active', balance: 75000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '1200', code: '1200', name: 'Fixed Assets', type: 'Assets', parentId: '1000', status: 'active', balance: 200000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '1210', code: '1210', name: 'Property and Equipment', type: 'Assets', parentId: '1200', status: 'active', balance: 150000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '1220', code: '1220', name: 'Accumulated Depreciation', type: 'Assets', parentId: '1200', status: 'active', balance: -50000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },

  // Liabilities
  { id: '2000', code: '2000', name: 'Liabilities', type: 'Liabilities', parentId: null, status: 'active', balance: 165000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '2100', code: '2100', name: 'Current Liabilities', type: 'Liabilities', parentId: '2000', status: 'active', balance: 115000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '2110', code: '2110', name: 'Accounts Payable', type: 'Liabilities', parentId: '2100', status: 'active', balance: 65000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '2120', code: '2120', name: 'Accrued Expenses', type: 'Liabilities', parentId: '2100', status: 'active', balance: 35000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '2130', code: '2130', name: 'Short-term Loans', type: 'Liabilities', parentId: '2100', status: 'active', balance: 15000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '2200', code: '2200', name: 'Long-term Liabilities', type: 'Liabilities', parentId: '2000', status: 'active', balance: 50000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '2210', code: '2210', name: 'Long-term Loans', type: 'Liabilities', parentId: '2200', status: 'active', balance: 50000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },

  // Equity
  { id: '3000', code: '3000', name: 'Equity', type: 'Equity', parentId: null, status: 'active', balance: 320000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '3100', code: '3100', name: 'Owner\'s Equity', type: 'Equity', parentId: '3000', status: 'active', balance: 250000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '3200', code: '3200', name: 'Retained Earnings', type: 'Equity', parentId: '3000', status: 'active', balance: 70000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },

  // Revenue
  { id: '4000', code: '4000', name: 'Revenue', type: 'Revenue', parentId: null, status: 'active', balance: 425000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '4100', code: '4100', name: 'Sales Revenue', type: 'Revenue', parentId: '4000', status: 'active', balance: 385000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '4110', code: '4110', name: 'Product Sales', type: 'Revenue', parentId: '4100', status: 'active', balance: 345000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '4120', code: '4120', name: 'Service Revenue', type: 'Revenue', parentId: '4100', status: 'active', balance: 40000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '4200', code: '4200', name: 'Other Income', type: 'Revenue', parentId: '4000', status: 'active', balance: 40000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },

  // Expenses
  { id: '5000', code: '5000', name: 'Expenses', type: 'Expenses', parentId: null, status: 'active', balance: 298500, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '5100', code: '5100', name: 'Cost of Goods Sold', type: 'Expenses', parentId: '5000', status: 'active', balance: 175000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '5200', code: '5200', name: 'Operating Expenses', type: 'Expenses', parentId: '5000', status: 'active', balance: 123500, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '5210', code: '5210', name: 'Salaries and Wages', type: 'Expenses', parentId: '5200', status: 'active', balance: 65000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '5220', code: '5220', name: 'Rent Expense', type: 'Expenses', parentId: '5200', status: 'active', balance: 24000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '5230', code: '5230', name: 'Utilities', type: 'Expenses', parentId: '5200', status: 'active', balance: 8500, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '5240', code: '5240', name: 'Marketing and Advertising', type: 'Expenses', parentId: '5200', status: 'active', balance: 15000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '5250', code: '5250', name: 'Office Supplies', type: 'Expenses', parentId: '5200', status: 'active', balance: 6000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '5260', code: '5260', name: 'Depreciation', type: 'Expenses', parentId: '5200', status: 'active', balance: 5000, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
];

export const mockAccountTransactions: Record<string, AccountTransaction[]> = {
  '1112': [
    { id: 't1', date: new Date('2024-11-05'), description: 'Customer Payment - INV-001', debit: 15000, credit: 0, balance: 123000, reference: 'INV-001' },
    { id: 't2', date: new Date('2024-11-03'), description: 'Supplier Payment - PO-045', debit: 0, credit: 8500, balance: 108000, reference: 'PO-045' },
    { id: 't3', date: new Date('2024-11-01'), description: 'Rent Payment', debit: 0, credit: 2000, balance: 116500, reference: 'RENT-NOV' },
    { id: 't4', date: new Date('2024-10-28'), description: 'Customer Payment - INV-098', debit: 22000, credit: 0, balance: 118500, reference: 'INV-098' },
    { id: 't5', date: new Date('2024-10-25'), description: 'Utilities Payment', debit: 0, credit: 850, balance: 96500, reference: 'UTIL-OCT' },
  ],
  '1120': [
    { id: 't6', date: new Date('2024-11-08'), description: 'Invoice INV-125', debit: 12000, credit: 0, balance: 85000, reference: 'INV-125' },
    { id: 't7', date: new Date('2024-11-05'), description: 'Payment Received INV-001', debit: 0, credit: 15000, balance: 73000, reference: 'INV-001' },
    { id: 't8', date: new Date('2024-11-01'), description: 'Invoice INV-120', debit: 8500, credit: 0, balance: 88000, reference: 'INV-120' },
  ],
};
