import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import FormSelectField from '../../components/FormSelectField';
import { useFinance } from '../../store/FinanceStore';
import { useProcurement } from '../../../procurement/store/ProcurementStore';
import { ApiError } from '../../../shared/api/client';
import { customers, customerById, invoiceBalance, billBalance } from '../../data/mockData';
import type { PaymentMethod, PaymentType } from '../../data/types';

const types: PaymentType[] = ['Customer Payment', 'Supplier Payment', 'Advance Payment'];
const methods: PaymentMethod[] = ['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Online Payment', 'Mobile Wallet'];
const banks = ['Nepal Investment Bank', 'Standard Chartered Nepal', '—'];

export default function PaymentForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { invoices, supplierBills, addPayment, addAdvance } = useFinance();
  const { vendors } = useProcurement();

  const openInvoices = useMemo(
    () => invoices.filter((i) => invoiceBalance(i) > 0 && !['Draft', 'Proforma', 'Cancelled'].includes(i.status)),
    [invoices],
  );
  const openBills = useMemo(
    () => supplierBills.filter((b) => billBalance(b) > 0 && b.status !== 'Draft' && b.status !== 'Cancelled'),
    [supplierBills],
  );

  // Context passed in via the URL. useSearchParams decodes percent-encoding, so
  // ?type=Advance%20Payment arrives here as the 'Advance Payment' string.
  // ?invoice=/?bill= preselect an open document (and imply the matching type);
  // if the referenced doc isn't open, we fall back to the defaults below.
  const invoiceParam = searchParams.get('invoice');
  const billParam = searchParams.get('bill');
  const typeParam = searchParams.get('type');
  const matchedInvoice = invoiceParam ? openInvoices.find((i) => i.invoiceNo === invoiceParam) : undefined;
  const matchedBill = billParam ? openBills.find((b) => b.billNo === billParam) : undefined;

  const [type, setType] = useState<PaymentType>(() => {
    if (matchedInvoice) return 'Customer Payment';
    if (matchedBill) return 'Supplier Payment';
    if (typeParam && types.includes(typeParam as PaymentType)) return typeParam as PaymentType;
    return 'Customer Payment';
  });
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const [invoiceRef, setInvoiceRef] = useState(() => matchedInvoice?.invoiceNo ?? openInvoices[0]?.invoiceNo ?? '');
  const [billRef, setBillRef] = useState(() => matchedBill?.billNo ?? openBills[0]?.billNo ?? '');
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>('Bank Transfer');
  const [bank, setBank] = useState(banks[0]);
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');

  // Advance-specific fields.
  const [advanceDirection, setAdvanceDirection] = useState<'Customer' | 'Supplier'>('Customer');
  const [advanceCustomerId, setAdvanceCustomerId] = useState(customers[0].id);
  const [advanceVendorId, setAdvanceVendorId] = useState(vendors[0]?.id ?? '');

  const isCustomer = type === 'Customer Payment';
  const isAdvance = type === 'Advance Payment';
  const selectedInvoice = openInvoices.find((i) => i.invoiceNo === invoiceRef);
  const selectedBill = openBills.find((b) => b.billNo === billRef);
  const partyName = isCustomer
    ? (selectedInvoice ? customerById(selectedInvoice.customerId)?.name : '') ?? ''
    : selectedBill?.vendorName ?? '';
  const outstandingBalance = isCustomer
    ? (selectedInvoice ? invoiceBalance(selectedInvoice) : 0)
    : (selectedBill ? billBalance(selectedBill) : 0);
  const remainingBalance = outstandingBalance - amount;

  const advancePartyName = advanceDirection === 'Customer'
    ? customerById(advanceCustomerId)?.name ?? ''
    : vendors.find((v) => v.id === advanceVendorId)?.name ?? '';

  const canSubmit = isAdvance
    ? amount > 0 && advancePartyName !== ''
    : amount > 0 && (isCustomer ? !!selectedInvoice : !!selectedBill);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!canSubmit) return;
    if (isAdvance) {
      addAdvance({
        date,
        direction: advanceDirection,
        partyName: advancePartyName,
        method,
        bank,
        amount,
        notes,
      });
      navigate('/finance/advances');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const id = await addPayment({
        date,
        type,
        partyName,
        invoiceOrBillRef: isCustomer ? invoiceRef : billRef,
        method,
        outstandingBalance,
        amount,
        bank,
        referenceNumber: '',
        transactionId,
        notes,
      });
      navigate(`/finance/payments/${id}`);
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        const fe: Record<string, string> = {};
        for (const k in e.errors) fe[k] = e.errors[k][0];
        setFieldErrors(fe);
      } else {
        setError(e instanceof ApiError ? e.message : 'Could not record the payment.');
      }
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1200px' } }}>
      <PageHeader
        title="Record Payment"
        subtitle="Allocate an incoming or outgoing payment, or bank an unallocated advance"
        actions={<Button onClick={() => navigate('/finance/payments')}>Cancel</Button>}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        <Card variant="outlined">
          <CardHeader title="General" slotProps={{ title: { variant: 'subtitle2' } }} />
          <CardContent sx={{ pt: 0 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth label="Payment Number" value="PAY-2026-3302 (auto)" disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField
                  fullWidth
                  required
                  type="date"
                  label="Date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  error={!!fieldErrors.date || (submitted && date === '')}
                  helperText={fieldErrors.date || (submitted && date === '' ? 'Date is required' : undefined)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField fullWidth label="Payment Type" value={type} onChange={(e) => setType(e.target.value as PaymentType)}>
                  {types.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {isAdvance ? (
          <Card variant="outlined">
            <CardHeader title="Advance" slotProps={{ title: { variant: 'subtitle2' } }} />
            <CardContent sx={{ pt: 0 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormSelectField fullWidth label="Direction" value={advanceDirection} onChange={(e) => setAdvanceDirection(e.target.value as 'Customer' | 'Supplier')}>
                    <MenuItem value="Customer">From Customer (received)</MenuItem>
                    <MenuItem value="Supplier">To Supplier (paid)</MenuItem>
                  </FormSelectField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  {advanceDirection === 'Customer' ? (
                    <FormSelectField fullWidth label="Customer" value={advanceCustomerId} onChange={(e) => setAdvanceCustomerId(e.target.value)}>
                      {customers.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                      ))}
                    </FormSelectField>
                  ) : (
                    <FormSelectField fullWidth label="Supplier" value={advanceVendorId} onChange={(e) => setAdvanceVendorId(e.target.value)}>
                      {vendors.map((v) => (
                        <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                      ))}
                    </FormSelectField>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormField
                    fullWidth
                    required
                    type="number"
                    label="Advance Amount"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    error={submitted && amount <= 0}
                    helperText={submitted && amount <= 0 ? 'Must be greater than 0' : undefined}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ) : (
          <Card variant="outlined">
            <CardHeader title="Allocation" slotProps={{ title: { variant: 'subtitle2' } }} />
            <CardContent sx={{ pt: 0 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {isCustomer ? (
                    <FormSelectField fullWidth label="Invoice" value={invoiceRef} onChange={(e) => setInvoiceRef(e.target.value)}>
                      {openInvoices.map((i) => (
                        <MenuItem key={i.id} value={i.invoiceNo}>{i.invoiceNo} — {customerById(i.customerId)?.name}</MenuItem>
                      ))}
                    </FormSelectField>
                  ) : (
                    <FormSelectField fullWidth label="Bill" value={billRef} onChange={(e) => setBillRef(e.target.value)}>
                      {openBills.map((b) => (
                        <MenuItem key={b.id} value={b.billNo}>{b.billNo} — {b.vendorName}</MenuItem>
                      ))}
                    </FormSelectField>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormField fullWidth label={isCustomer ? 'Customer' : 'Supplier'} value={partyName} disabled />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormField fullWidth label="Outstanding Balance" value={`NPR ${outstandingBalance.toFixed(2)}`} disabled />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormField
                    fullWidth
                    required
                    type="number"
                    label="Paid Amount"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    error={fieldErrors.amount != null || (submitted && amount <= 0)}
                    helperText={fieldErrors.amount || (submitted && amount <= 0 ? 'Must be greater than 0' : undefined)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormField fullWidth label="Remaining Balance" value={`NPR ${remainingBalance.toFixed(2)}`} disabled />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        <Card variant="outlined">
          <CardHeader title="Bank Details" slotProps={{ title: { variant: 'subtitle2' } }} />
          <CardContent sx={{ pt: 0 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField fullWidth required label="Method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                  {methods.map((m) => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField fullWidth label="Bank" value={bank} onChange={(e) => setBank(e.target.value)}>
                  {banks.map((b) => (
                    <MenuItem key={b} value={b}>{b}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth label="Transaction ID" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} disabled={isAdvance} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormField fullWidth multiline minRows={2} label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {!canSubmit && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {isAdvance
              ? 'Enter an advance amount greater than zero and choose a party to continue.'
              : `Enter a paid amount greater than zero against an open ${isCustomer ? 'invoice' : 'bill'} to continue.`}
          </Typography>
        )}

        <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="outlined" onClick={() => navigate('/finance/payments')}>Cancel</Button>
          <Button variant="contained" disabled={!canSubmit || submitting} loading={submitting} onClick={handleSubmit}>
            {isAdvance ? 'Record Advance' : 'Record Payment'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
