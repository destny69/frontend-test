import type {
  Customer,
  Invoice,
  SupplierBill,
  Payment,
  PaymentType,
  Account,
  JournalEntry,
  BankAccount,
  BankTransaction,
  CreditNote,
  DebitNote,
  Advance,
  AdvanceApplication,
  FinanceEvent,
} from './types';

// Cost centres used to tag journal entries for the cost-centre analytics report.
export const costCenters = [
  'Sales & Distribution',
  'Manufacturing',
  'Warehouse',
  'Administration',
  'Quality Control',
];

export const customers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'MedLife Pharmacy Chain',
    type: 'Retail Chain',
    email: 'accounts@medlifepharmacy.com',
    phone: '+977 1 552 0198',
    billingAddress: 'Durbar Marg, Kathmandu, Nepal',
    shippingAddress: 'Central Warehouse, Kathmandu, Nepal',
    paymentTerms: 'Net 30',
  },
  {
    id: 'CUST-002',
    name: 'HealthPlus Distributors',
    type: 'Distributor',
    email: 'billing@healthplusdist.com',
    phone: '+977 1 552 0221',
    billingAddress: 'New Road, Kathmandu, Nepal',
    shippingAddress: 'New Road, Kathmandu, Nepal',
    paymentTerms: 'Net 45',
  },
  {
    id: 'CUST-003',
    name: 'CityCare Hospital',
    type: 'Hospital',
    email: 'pharmacy@citycarehospital.org',
    phone: '+977 1 552 0355',
    billingAddress: 'Bansbari, Kathmandu, Nepal',
    shippingAddress: 'Bansbari, Kathmandu, Nepal',
    paymentTerms: 'Net 60',
  },
  {
    id: 'CUST-004',
    name: 'Apex Wholesale Meds',
    type: 'Wholesaler',
    email: 'ap@apexwholesale.com',
    phone: '+977 1 552 0410',
    billingAddress: 'Kalanki, Kathmandu, Nepal',
    shippingAddress: 'Kalanki, Kathmandu, Nepal',
    paymentTerms: 'Net 30',
  },
  {
    id: 'CUST-005',
    name: 'Rainbow Drug Store',
    type: 'Retail',
    email: 'owner@rainbowdrugstore.com',
    phone: '+977 1 552 0532',
    billingAddress: 'Patan, Lalitpur, Nepal',
    shippingAddress: 'Patan, Lalitpur, Nepal',
    paymentTerms: 'Net 15',
  },
];

export const invoices: Invoice[] = [];

export const supplierBills: SupplierBill[] = [];

export const payments: Payment[] = [];

export const chartOfAccounts: Account[] = [
  { code: '1000', name: 'Cash on Hand', type: 'Asset', balance: 18400, status: 'Active' },
  { code: '1010', name: 'Bank — Nepal Investment Bank', type: 'Asset', balance: 284600, status: 'Active' },
  { code: '1011', name: 'Bank — Standard Chartered Nepal', type: 'Asset', balance: 142300, status: 'Active' },
  { code: '1200', name: 'Accounts Receivable', type: 'Asset', balance: 217500, status: 'Active' },
  { code: '1400', name: 'Inventory', type: 'Asset', balance: 486000, status: 'Active' },
  { code: '2000', name: 'Accounts Payable', type: 'Liability', balance: 196700, status: 'Active' },
  { code: '2100', name: 'VAT Payable', type: 'Liability', balance: 18240, status: 'Active' },
  { code: '3000', name: "Owner's Equity", type: 'Equity', balance: 650000, status: 'Active' },
  { code: '4000', name: 'Sales Revenue', type: 'Revenue', balance: 612400, status: 'Active' },
  { code: '5000', name: 'Cost of Goods Sold', type: 'Expense', balance: 348200, status: 'Active' },
  { code: '5100', name: 'Operating Expenses', type: 'Expense', balance: 84500, status: 'Active' },
];

export const journalEntries: JournalEntry[] = [
  {
    id: 'JE-001',
    journalNo: 'JE-2026-0812',
    date: '2026-07-03',
    reference: 'INV-2026-1042',
    description: 'Revenue recognition — MedLife Pharmacy Chain invoice',
    debitAccount: 'Accounts Receivable',
    creditAccount: 'Sales Revenue',
    amount: 24500,
    costCenter: 'Sales & Distribution',
    status: 'Posted',
  },
  {
    id: 'JE-002',
    journalNo: 'JE-2026-0811',
    date: '2026-06-25',
    reference: 'BILL-2026-0508',
    description: 'Supplier bill accrual — Alpine Pharma Chemicals',
    debitAccount: 'Cost of Goods Sold',
    creditAccount: 'Accounts Payable',
    amount: 96400,
    costCenter: 'Manufacturing',
    status: 'Posted',
  },
  {
    id: 'JE-003',
    journalNo: 'JE-2026-0810',
    date: '2026-06-15',
    reference: 'PAY-2026-3301',
    description: 'Customer payment received — HealthPlus Distributors',
    debitAccount: 'Bank — Nepal Investment Bank',
    creditAccount: 'Accounts Receivable',
    amount: 30000,
    costCenter: 'Sales & Distribution',
    status: 'Posted',
  },
  {
    id: 'JE-004',
    journalNo: 'JE-2026-0809',
    date: '2026-06-01',
    reference: 'Payroll June',
    description: 'Monthly payroll accrual',
    debitAccount: 'Operating Expenses',
    creditAccount: 'Bank — Standard Chartered Nepal',
    amount: 42000,
    costCenter: 'Administration',
    status: 'Posted',
  },
];

export const bankAccounts: BankAccount[] = [
  { id: 'BANK-001', bankName: 'Nepal Investment Bank', accountNumber: '****4471', currency: 'NPR', balance: 284600, status: 'Active' },
  { id: 'BANK-002', bankName: 'Standard Chartered Nepal', accountNumber: '****4402', currency: 'NPR', balance: 142300, status: 'Active' },
];

export const bankTransactions: BankTransaction[] = [
  { id: 'BTX-001', bankAccountId: 'BANK-001', transactionId: 'TXN-88213', date: '2026-06-15', description: 'HealthPlus Distributors payment', debit: 0, credit: 30000, balance: 284600, reconciled: true },
  { id: 'BTX-002', bankAccountId: 'BANK-001', transactionId: 'TXN-88190', date: '2026-06-10', description: 'Office rent', debit: 5200, credit: 0, balance: 254600, reconciled: true },
  { id: 'BTX-003', bankAccountId: 'BANK-002', transactionId: 'TXN-77102', date: '2026-06-25', description: 'Alpine Pharma Chemicals payment', debit: 6000, credit: 0, balance: 142300, reconciled: true },
  { id: 'BTX-004', bankAccountId: 'BANK-002', transactionId: 'TXN-77098', date: '2026-06-01', description: 'Vertex Fine Chemicals payment', debit: 96400, credit: 0, balance: 148300, reconciled: true },
  { id: 'BTX-005', bankAccountId: 'BANK-001', transactionId: 'TXN-88240', date: '2026-07-02', description: 'Unidentified deposit', debit: 0, credit: 1200, balance: 285800, reconciled: false },
];

export const creditNotes: CreditNote[] = [];

export const debitNotes: DebitNote[] = [];

export const advances: Advance[] = [];

export const advanceApplications: AdvanceApplication[] = [];

export const financeEvents: FinanceEvent[] = [];

// Outstanding balance of an invoice after payments and credit notes / applied advances.
export function invoiceBalance(i: Invoice): number {
  return i.amount - i.paid - (i.credited ?? 0);
}
// Outstanding balance of a supplier bill after payments and debit notes / applied advances.
export function billBalance(b: SupplierBill): number {
  return b.amount - b.paid - (b.credited ?? 0);
}
// Statuses that mean an invoice does NOT count toward accounts receivable / outstanding.
export const NON_RECEIVABLE_STATUSES: Invoice['status'][] = ['Draft', 'Proforma', 'Paid', 'Cancelled'];
export function countsTowardReceivable(i: Invoice): boolean {
  return !NON_RECEIVABLE_STATUSES.includes(i.status) && invoiceBalance(i) > 0;
}

// Net cash/bank movement implied by real payment records — no backend ledger or
// bank-feed exists, so opening balances aren't tracked; this is the running total
// of live Payment rows only (Customer/Advance Payment = inflow, Supplier Payment/
// Refund = outflow), split by method/bank.
const CASH_INFLOW_TYPES: PaymentType[] = ['Customer Payment', 'Advance Payment'];
const CASH_OUTFLOW_TYPES: PaymentType[] = ['Supplier Payment', 'Refund'];
function signedPaymentAmount(p: Payment): number {
  if (CASH_INFLOW_TYPES.includes(p.type)) return p.amount;
  if (CASH_OUTFLOW_TYPES.includes(p.type)) return -p.amount;
  return 0;
}
export function cashOnHandBalance(payments: Payment[]): number {
  return payments.filter((p) => p.method === 'Cash').reduce((s, p) => s + signedPaymentAmount(p), 0);
}
export function bankBalanceByName(payments: Payment[], bankName: string): number {
  return payments
    .filter((p) => p.method !== 'Cash' && p.bank === bankName)
    .reduce((s, p) => s + signedPaymentAmount(p), 0);
}
export function totalBankBalance(payments: Payment[]): number {
  return payments.filter((p) => p.method !== 'Cash').reduce((s, p) => s + signedPaymentAmount(p), 0);
}

export function customerById(id: string) {
  return customers.find((c) => c.id === id);
}
export function invoiceById(id: string) {
  return invoices.find((i) => i.id === id);
}
export function billById(id: string) {
  return supplierBills.find((b) => b.id === id);
}
export function paymentById(id: string) {
  return payments.find((p) => p.id === id);
}
