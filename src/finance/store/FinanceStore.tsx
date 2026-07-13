import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  invoices as seedInvoices,
  supplierBills as seedBills,
  payments as seedPayments,
  journalEntries as seedJournalEntries,
  chartOfAccounts as seedAccounts,
  bankAccounts as seedBankAccounts,
  bankTransactions as seedBankTransactions,
  creditNotes as seedCreditNotes,
  debitNotes as seedDebitNotes,
  advances as seedAdvances,
  advanceApplications as seedAdvanceApplications,
  financeEvents as seedFinanceEvents,
  customers as mockCustomers,
} from '../data/mockData';
import { fetchCustomers } from './customerApi';
import { fetchInvoices, createInvoice, convertProformaApi, cancelInvoiceApi, type CreateInvoiceInput } from './invoiceApi';
import { fetchBills, createBill, approveBillApi, cancelBillApi } from './billApi';
import { fetchPayments, createPayment, type CreatePaymentInput } from './paymentApi';
import { fetchFinanceEvents } from './financeEventApi';
import { fetchCreditNotes, createCreditNote } from './creditNoteApi';
import { fetchDebitNotes, createDebitNote } from './debitNoteApi';
import type {
  Invoice,
  SupplierBill,
  Payment,
  JournalEntry,
  InvoiceLine,
  Account,
  BankAccount,
  BankTransaction,
  CreditNote,
  DebitNote,
  Advance,
  AdvanceApplication,
  FinanceEvent,
  PaymentMethod,
  PaymentType,
} from '../data/types';

type NewInvoiceStatus = 'Draft' | 'Sent' | 'Proforma';
type NewInvoiceInput = Omit<Invoice, 'id' | 'invoiceNo' | 'status' | 'paid'> & {
  lines: InvoiceLine[];
  shippingAmount?: number;
};
// vendorName/poNumber/grnNumber labels aren't sent - poId/grnId (real backend ids) are,
// and the backend resolves + returns the full nested record.
type NewBillInput = {
  vendorId: string;
  poId?: string;
  grnId?: string;
  invoiceDate: string;
  dueDate: string;
  lines: SupplierBill['lines'];
};
type NewPaymentInput = Omit<Payment, 'id' | 'paymentNo' | 'remainingBalance' | 'status'>;
type NewJournalInput = Omit<JournalEntry, 'id' | 'journalNo' | 'status'>;
type NewCreditNoteInput = Omit<CreditNote, 'id' | 'creditNoteNo' | 'status'> & { invoiceId: string };
type NewDebitNoteInput = Omit<DebitNote, 'id' | 'debitNoteNo' | 'status'> & { billId: string };
type NewAdvanceInput = Omit<Advance, 'id' | 'advanceNo' | 'allocated'>;

// Actor recorded against every audit-trail entry.
const CURRENT_USER = 'Finance Manager';
const today = () => new Date().toISOString().slice(0, 10);

interface FinanceContextValue {
  loading: boolean;
  invoices: Invoice[];
  supplierBills: SupplierBill[];
  payments: Payment[];
  journalEntries: JournalEntry[];
  chartOfAccounts: Account[];
  bankAccounts: BankAccount[];
  bankTransactions: BankTransaction[];
  creditNotes: CreditNote[];
  debitNotes: DebitNote[];
  advances: Advance[];
  advanceApplications: AdvanceApplication[];
  financeEvents: FinanceEvent[];
  addInvoice: (input: NewInvoiceInput, status: NewInvoiceStatus) => Promise<string>;
  convertProforma: (id: string) => Promise<void>;
  cancelInvoice: (id: string) => Promise<void>;
  addBill: (input: NewBillInput) => Promise<string>;
  approveBill: (id: string) => Promise<void>;
  cancelBill: (id: string) => Promise<void>;
  addPayment: (input: NewPaymentInput) => Promise<string>;
  addJournalEntry: (input: NewJournalInput) => string;
  addCreditNote: (input: NewCreditNoteInput) => Promise<string>;
  addDebitNote: (input: NewDebitNoteInput) => Promise<string>;
  addAdvance: (input: NewAdvanceInput) => string;
  applyAdvance: (advanceId: string, targetRef: string, amount: number) => void;
  toggleReconciled: (txnId: string) => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

let journalSeq = seedJournalEntries.length;
let bankTxnSeq = seedBankTransactions.length;
let advanceSeq = seedAdvances.length;
let advanceAppSeq = seedAdvanceApplications.length;
let eventSeq = seedFinanceEvents.length;

// Double-entry balance effect of debiting/crediting an account, by account nature.
function applyEntry(account: Account, isDebit: boolean, amount: number): Account {
  const debitPositive = account.type === 'Asset' || account.type === 'Expense';
  const sign = isDebit === debitPositive ? 1 : -1;
  return { ...account, balance: account.balance + sign * amount };
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>(seedInvoices);
  const [supplierBills, setSupplierBills] = useState<SupplierBill[]>(seedBills);
  const [payments, setPayments] = useState<Payment[]>(seedPayments);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(seedJournalEntries);
  const [chartOfAccounts, setChartOfAccounts] = useState<Account[]>(seedAccounts);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(seedBankAccounts);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>(seedBankTransactions);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(seedCreditNotes);
  const [debitNotes, setDebitNotes] = useState<DebitNote[]>(seedDebitNotes);
  const [advances, setAdvances] = useState<Advance[]>(seedAdvances);
  const [advanceApplications, setAdvanceApplications] = useState<AdvanceApplication[]>(seedAdvanceApplications);
  const [financeEvents, setFinanceEvents] = useState<FinanceEvent[]>(seedFinanceEvents);

  useEffect(() => {
    Promise.allSettled([
      // `customers` has no create route (read-only reference data) - mutated in
      // place here rather than lifted into context, same as `warehouses`/`mockItems`,
      // so pages that already do `import { customers } from '../data/mockData'`
      // keep working unchanged and see the real rows once this resolves.
      fetchCustomers()
        .then((rows) => mockCustomers.splice(0, mockCustomers.length, ...rows))
        .catch((e) => console.error('Failed to load customers', e)),
      fetchInvoices().then(setInvoices).catch((e) => console.error('Failed to load invoices', e)),
      fetchBills().then(setSupplierBills).catch((e) => console.error('Failed to load supplier bills', e)),
      fetchPayments().then(setPayments).catch((e) => console.error('Failed to load payments', e)),
      fetchCreditNotes().then(setCreditNotes).catch((e) => console.error('Failed to load credit notes', e)),
      fetchDebitNotes().then(setDebitNotes).catch((e) => console.error('Failed to load debit notes', e)),
      fetchFinanceEvents().then(setFinanceEvents).catch((e) => console.error('Failed to load finance events', e)),
    ]).then(() => setLoading(false));
  }, []);

  // Append an audit-trail entry. The event object is built OUTSIDE the state
  // updater (counter incremented here, not inside the updater) to stay StrictMode-safe.
  const logEvent = (type: string, entity: string, ref: string, date: string = today()) => {
    eventSeq += 1;
    const event: FinanceEvent = {
      id: `EVT-${String(eventSeq).padStart(3, '0')}`,
      date,
      type,
      entity,
      ref,
      by: CURRENT_USER,
    };
    setFinanceEvents((prev) => [event, ...prev]);
  };

  const INVOICE_STATUS_VALUE: Record<NewInvoiceStatus, CreateInvoiceInput['status']> = {
    Draft: 'draft',
    Sent: 'sent',
    Proforma: 'proforma',
  };
  const METHOD_VALUE: Record<PaymentMethod, string> = {
    Cash: 'cash',
    'Bank Transfer': 'bank_transfer',
    Cheque: 'cheque',
    'Credit Card': 'credit_card',
    'Online Payment': 'online_payment',
    'Mobile Wallet': 'mobile_wallet',
  };

  const addInvoice: FinanceContextValue['addInvoice'] = async (input, status) => {
    const invoice = await createInvoice({
      customerId: Number(input.customerId),
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate,
      status: INVOICE_STATUS_VALUE[status],
      salesperson: input.salesperson,
      referenceNumber: input.referenceNumber,
      paymentMethod: METHOD_VALUE[input.paymentMethod],
      shippingAmount: input.shippingAmount,
      lines: input.lines.map((l) => ({
        product: l.product,
        batchNumber: l.batchNumber,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discountPercent: l.discount,
        vatPercent: l.vat,
      })),
    });
    setInvoices((prev) => [invoice, ...prev]);
    logEvent('Created', status === 'Proforma' ? 'Proforma Invoice' : 'Invoice', invoice.invoiceNo, input.invoiceDate);
    return invoice.id;
  };

  // Turn a proforma invoice into a real Sent invoice so it begins counting toward AR.
  const convertProforma: FinanceContextValue['convertProforma'] = async (id) => {
    const updated = await convertProformaApi(id);
    setInvoices((prev) => prev.map((i) => (i.id === id ? updated : i)));
    logEvent('Converted', 'Invoice', updated.invoiceNo);
  };

  const cancelInvoice: FinanceContextValue['cancelInvoice'] = async (id) => {
    const updated = await cancelInvoiceApi(id);
    setInvoices((prev) => prev.map((i) => (i.id === id ? updated : i)));
    logEvent('Cancelled', 'Invoice', updated.invoiceNo);
  };

  const addBill: FinanceContextValue['addBill'] = async (input) => {
    const bill = await createBill({
      vendorId: Number(input.vendorId),
      purchaseOrderId: input.poId ? Number(input.poId) : undefined,
      grnId: input.grnId ? Number(input.grnId) : undefined,
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate,
      lines: input.lines.map((l) => ({
        product: l.product,
        batchNumber: l.batchNumber,
        quantity: l.quantity,
        unitCost: l.unitCost,
        vatPercent: l.vat,
      })),
    });
    setSupplierBills((prev) => [bill, ...prev]);
    logEvent('Created', 'Bill', bill.billNo, input.invoiceDate);
    return bill.id;
  };

  const approveBill: FinanceContextValue['approveBill'] = async (id) => {
    const updated = await approveBillApi(id);
    setSupplierBills((prev) => prev.map((b) => (b.id === id ? updated : b)));
    logEvent('Approved', 'Bill', updated.billNo);
  };

  const cancelBill: FinanceContextValue['cancelBill'] = async (id) => {
    const updated = await cancelBillApi(id);
    setSupplierBills((prev) => prev.map((b) => (b.id === id ? updated : b)));
    logEvent('Cancelled', 'Bill', updated.billNo);
  };

  const PAYMENT_TYPE_VALUE: Record<PaymentType, CreatePaymentInput['type']> = {
    'Customer Payment': 'customer_payment',
    'Supplier Payment': 'supplier_payment',
    'Advance Payment': 'advance_payment',
    Refund: 'refund',
    Adjustment: 'adjustment',
  };
  const PAYMENT_METHOD_VALUE: Record<PaymentMethod, CreatePaymentInput['method']> = {
    Cash: 'cash',
    'Bank Transfer': 'bank_transfer',
    Cheque: 'cheque',
    'Credit Card': 'credit_card',
    'Online Payment': 'online_payment',
    'Mobile Wallet': 'mobile_wallet',
  };

  const addPayment: FinanceContextValue['addPayment'] = async (input) => {
    const payment = await createPayment({
      date: input.date,
      type: PAYMENT_TYPE_VALUE[input.type],
      method: PAYMENT_METHOD_VALUE[input.method],
      amount: input.amount,
      partyName: input.partyName,
      invoiceOrBillRef: input.invoiceOrBillRef,
      outstandingBalance: input.outstandingBalance,
      bank: input.bank,
      referenceNumber: input.referenceNumber,
      transactionId: input.transactionId,
      notes: input.notes,
    });
    setPayments((prev) => [payment, ...prev]);

    // The backend settles the target invoice/bill server-side - refresh so the
    // new paid amount/status shows up without a full page reload.
    if (input.type === 'Customer Payment') {
      fetchInvoices().then(setInvoices).catch((e) => console.error('Failed to refresh invoices', e));
    } else if (input.type === 'Supplier Payment') {
      fetchBills().then(setSupplierBills).catch((e) => console.error('Failed to refresh supplier bills', e));
    }

    // Record the cash movement - no backend ledger exists for this, so it stays
    // a local-only simulation layered on top of the real payment record above.
    const inflow = input.type === 'Customer Payment' || input.type === 'Advance Payment';
    const outflow = input.type === 'Supplier Payment' || input.type === 'Refund';
    if (input.method === 'Cash' && (inflow || outflow)) {
      // Cash payments move the 'Cash on Hand' ledger account so the cash book reconciles.
      const delta = inflow ? input.amount : -input.amount;
      setChartOfAccounts((prev) =>
        prev.map((a) => (a.code === '1000' ? { ...a, balance: a.balance + delta } : a)),
      );
    } else {
      const bank = bankAccounts.find((b) => b.bankName === input.bank);
      if ((inflow || outflow) && bank && input.bank !== '—') {
        const newBalance = bank.balance + (inflow ? input.amount : -input.amount);
        bankTxnSeq += 1;
        const txn: BankTransaction = {
          id: `BTX-${String(bankTxnSeq).padStart(3, '0')}`,
          bankAccountId: bank.id,
          transactionId: input.transactionId || `TXN-${90000 + bankTxnSeq}`,
          date: input.date,
          description: `${input.type} — ${input.partyName || input.invoiceOrBillRef}`,
          debit: outflow ? input.amount : 0,
          credit: inflow ? input.amount : 0,
          balance: newBalance,
          reconciled: false,
        };
        setBankTransactions((prevTxns) => [txn, ...prevTxns]);
        setBankAccounts((prevBanks) =>
          prevBanks.map((b) => (b.id === bank.id ? { ...b, balance: newBalance } : b)),
        );
      }
    }
    logEvent('Payment', 'Payment', payment.paymentNo, input.date);
    return payment.id;
  };

  // Posting a journal entry moves the two affected chart-of-account balances.
  const addJournalEntry: FinanceContextValue['addJournalEntry'] = (input) => {
    journalSeq += 1;
    const id = `JE-${String(journalSeq).padStart(3, '0')}`;
    const journalNo = `JE-2026-08${13 + (journalSeq - seedJournalEntries.length)}`;
    const entry: JournalEntry = { ...input, id, journalNo, status: 'Posted' };
    setJournalEntries((prev) => [entry, ...prev]);
    setChartOfAccounts((prev) =>
      prev.map((acc) => {
        if (acc.name === input.debitAccount) return applyEntry(acc, true, input.amount);
        if (acc.name === input.creditAccount) return applyEntry(acc, false, input.amount);
        return acc;
      }),
    );
    logEvent('Posted', 'Journal', journalNo, input.date);
    return id;
  };

  // Customer credit note: neutralises part of a target invoice's outstanding balance and
  // posts the reverse of the original sale (Accounts Receivable down, Sales Revenue down).
  const addCreditNote: FinanceContextValue['addCreditNote'] = async (input) => {
    const note = await createCreditNote({
      date: input.date,
      customerId: Number(input.customerId),
      invoiceId: Number(input.invoiceId),
      reason: input.reason,
      amount: input.amount,
    });
    setCreditNotes((prev) => [note, ...prev]);

    // The backend already reconciled the target invoice's credited/status server-side.
    fetchInvoices().then(setInvoices).catch((e) => console.error('Failed to refresh invoices', e));

    // Reverse ledger effect: reduce AR (1200, asset -> credit) and Sales Revenue (4000 ->
    // debit). No backend chart of accounts exists, so this stays local-only.
    setChartOfAccounts((prev) =>
      prev.map((acc) => {
        if (acc.code === '1200') return applyEntry(acc, false, input.amount);
        if (acc.code === '4000') return applyEntry(acc, true, input.amount);
        return acc;
      }),
    );
    logEvent('Credit Note', 'Credit Note', note.creditNoteNo, input.date);
    return note.id;
  };

  // Supplier debit note: neutralises part of a target bill's outstanding balance and
  // posts the reverse of the original purchase accrual (Accounts Payable down, COGS down).
  const addDebitNote: FinanceContextValue['addDebitNote'] = async (input) => {
    const note = await createDebitNote({
      date: input.date,
      vendorId: Number(input.vendorId),
      supplierBillId: Number(input.billId),
      reason: input.reason,
      amount: input.amount,
    });
    setDebitNotes((prev) => [note, ...prev]);

    // The backend already reconciled the target bill's credited/status server-side.
    fetchBills().then(setSupplierBills).catch((e) => console.error('Failed to refresh supplier bills', e));

    // Reverse ledger effect: reduce AP (2000, liability -> debit) and COGS (5000 -> credit).
    // No backend chart of accounts exists, so this stays local-only.
    setChartOfAccounts((prev) =>
      prev.map((acc) => {
        if (acc.code === '2000') return applyEntry(acc, true, input.amount);
        if (acc.code === '5000') return applyEntry(acc, false, input.amount);
        return acc;
      }),
    );
    logEvent('Debit Note', 'Debit Note', note.debitNoteNo, input.date);
    return note.id;
  };

  // Record an advance receipt/payment as an unallocated credit held for a party.
  const addAdvance: FinanceContextValue['addAdvance'] = (input) => {
    advanceSeq += 1;
    const id = `ADV-${String(advanceSeq).padStart(3, '0')}`;
    const advanceNo = `ADV-2026-${String(advanceSeq).padStart(3, '0')}`;
    const advance: Advance = { ...input, id, advanceNo, allocated: 0 };
    setAdvances((prev) => [advance, ...prev]);

    // Cash side: a customer advance is an inflow, a supplier advance an outflow.
    const inflow = input.direction === 'Customer';
    if (input.method === 'Cash') {
      const delta = inflow ? input.amount : -input.amount;
      setChartOfAccounts((prev) =>
        prev.map((a) => (a.code === '1000' ? { ...a, balance: a.balance + delta } : a)),
      );
    } else {
      const bank = bankAccounts.find((b) => b.bankName === input.bank);
      if (bank && input.bank !== '—') {
        const newBalance = bank.balance + (inflow ? input.amount : -input.amount);
        bankTxnSeq += 1;
        const txn: BankTransaction = {
          id: `BTX-${String(bankTxnSeq).padStart(3, '0')}`,
          bankAccountId: bank.id,
          transactionId: `TXN-${90000 + bankTxnSeq}`,
          date: input.date,
          description: `Advance (${input.direction}) — ${input.partyName}`,
          debit: inflow ? 0 : input.amount,
          credit: inflow ? input.amount : 0,
          balance: newBalance,
          reconciled: false,
        };
        setBankTransactions((prevTxns) => [txn, ...prevTxns]);
        setBankAccounts((prevBanks) =>
          prevBanks.map((b) => (b.id === bank.id ? { ...b, balance: newBalance } : b)),
        );
      }
    }
    logEvent('Advance', 'Advance', advanceNo, input.date);
    return id;
  };

  // Apply an unallocated advance against an open invoice (customer) or bill (supplier),
  // reducing that document's outstanding balance.
  const applyAdvance: FinanceContextValue['applyAdvance'] = (advanceId, targetRef, amount) => {
    const advance = advances.find((a) => a.id === advanceId);
    if (!advance || amount <= 0) return;
    const remaining = advance.amount - advance.allocated;
    const applied = Math.min(amount, remaining);
    if (applied <= 0) return;

    setAdvances((prev) =>
      prev.map((a) => (a.id === advanceId ? { ...a, allocated: a.allocated + applied } : a)),
    );

    advanceAppSeq += 1;
    const application: AdvanceApplication = {
      id: `ADVAP-${String(advanceAppSeq).padStart(3, '0')}`,
      advanceId,
      advanceNo: advance.advanceNo,
      date: today(),
      targetRef,
      amount: applied,
    };
    setAdvanceApplications((prev) => [application, ...prev]);

    if (advance.direction === 'Customer') {
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.invoiceNo !== targetRef) return inv;
          const credited = (inv.credited ?? 0) + applied;
          const settled = inv.paid + credited;
          const status = settled >= inv.amount && inv.amount > 0 ? 'Paid' : inv.status;
          return { ...inv, credited, status };
        }),
      );
    } else {
      setSupplierBills((prev) =>
        prev.map((bill) => {
          if (bill.billNo !== targetRef) return bill;
          const credited = (bill.credited ?? 0) + applied;
          const settled = bill.paid + credited;
          const status = settled >= bill.amount && bill.amount > 0 ? 'Paid' : bill.status;
          return { ...bill, credited, status };
        }),
      );
    }
    logEvent('Advance Applied', 'Advance', `${advance.advanceNo} → ${targetRef}`);
  };

  // Flip the reconciled flag on a bank transaction (bank reconciliation).
  const toggleReconciled: FinanceContextValue['toggleReconciled'] = (txnId) => {
    const target = bankTransactions.find((t) => t.id === txnId);
    setBankTransactions((prev) =>
      prev.map((t) => (t.id === txnId ? { ...t, reconciled: !t.reconciled } : t)),
    );
    if (target) logEvent(target.reconciled ? 'Unreconciled' : 'Reconciled', 'Bank Txn', target.transactionId);
  };

  return (
    <FinanceContext.Provider
      value={{
        loading,
        invoices,
        supplierBills,
        payments,
        journalEntries,
        chartOfAccounts,
        bankAccounts,
        bankTransactions,
        creditNotes,
        debitNotes,
        advances,
        advanceApplications,
        financeEvents,
        addInvoice,
        convertProforma,
        cancelInvoice,
        addBill,
        approveBill,
        cancelBill,
        addPayment,
        addJournalEntry,
        addCreditNote,
        addDebitNote,
        addAdvance,
        applyAdvance,
        toggleReconciled,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
