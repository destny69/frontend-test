export type InvoiceStatus = 'Draft' | 'Proforma' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
export type BillStatus =
  | 'Draft'
  | 'Pending Verification'
  | 'Approved'
  | 'Partially Paid'
  | 'Paid'
  | 'Cancelled';
export type PaymentType = 'Customer Payment' | 'Supplier Payment' | 'Advance Payment' | 'Refund' | 'Adjustment';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Cheque' | 'Credit Card' | 'Online Payment' | 'Mobile Wallet';
export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface Customer {
  id: string;
  name: string;
  type: string;
  email: string;
  phone: string;
  billingAddress: string;
  shippingAddress: string;
  paymentTerms: string;
}

export interface InvoiceLine {
  product: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  vat: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  customerId: string;
  invoiceDate: string;
  dueDate: string;
  salesperson: string;
  referenceNumber: string;
  paymentMethod: PaymentMethod;
  status: InvoiceStatus;
  amount: number;
  paid: number;
  // Amount neutralised by credit notes / applied customer advances. Reduces outstanding.
  credited?: number;
  lines: InvoiceLine[];
}

export interface BillLine {
  product: string;
  batchNumber: string;
  quantity: number;
  unitCost: number;
  vat: number;
}

export interface SupplierBill {
  id: string;
  billNo: string;
  vendorId: string;
  vendorName: string;
  poNumber: string;
  grnNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: BillStatus;
  amount: number;
  paid: number;
  poMatch: boolean;
  grnMatch: boolean;
  invoiceMatch: boolean;
  difference: number;
  // Amount neutralised by debit notes / applied supplier advances. Reduces outstanding.
  credited?: number;
  lines: BillLine[];
}

export interface Payment {
  id: string;
  paymentNo: string;
  date: string;
  type: PaymentType;
  partyName: string;
  invoiceOrBillRef: string;
  method: PaymentMethod;
  outstandingBalance: number;
  amount: number;
  remainingBalance: number;
  bank: string;
  referenceNumber: string;
  transactionId: string;
  notes: string;
  status: 'Completed' | 'Pending' | 'Failed';
}

export interface Account {
  code: string;
  name: string;
  type: AccountType;
  balance: number;
  status: 'Active' | 'Inactive';
}

export interface JournalEntry {
  id: string;
  journalNo: string;
  date: string;
  reference: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  costCenter?: string;
  status: 'Draft' | 'Posted';
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  currency: string;
  balance: number;
  status: 'Active' | 'Inactive';
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  transactionId: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reconciled: boolean;
}

// A customer credit note reduces the outstanding balance of a target invoice
// and posts the reverse of the original sale to the ledger (AR down, Revenue down).
export interface CreditNote {
  id: string;
  creditNoteNo: string;
  date: string;
  customerId: string;
  invoiceNo: string;
  reason: string;
  amount: number;
  status: 'Issued';
}

// A supplier debit note reduces the outstanding balance of a target bill
// and posts the reverse of the original purchase accrual (AP down, COGS down).
export interface DebitNote {
  id: string;
  debitNoteNo: string;
  date: string;
  vendorId: string;
  vendorName: string;
  billNo: string;
  reason: string;
  amount: number;
  status: 'Issued';
}

// An advance is an unallocated credit held for a party until applied against a document.
export interface Advance {
  id: string;
  advanceNo: string;
  date: string;
  direction: 'Customer' | 'Supplier';
  partyName: string;
  method: PaymentMethod;
  bank: string;
  amount: number;
  allocated: number;
  notes: string;
}

// A record of an advance being applied against an invoice or bill.
export interface AdvanceApplication {
  id: string;
  advanceId: string;
  advanceNo: string;
  date: string;
  targetRef: string;
  amount: number;
}

// Immutable audit-trail entry appended by every create / approve / pay / post action.
export interface FinanceEvent {
  id: string;
  date: string;
  type: string;
  entity: string;
  ref: string;
  by: string;
}
