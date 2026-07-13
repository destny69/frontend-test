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
import { ApiError } from '../../../shared/api/client';
import { customerById, invoiceBalance } from '../../data/mockData';

export default function CreditNoteForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { invoices, addCreditNote } = useFinance();

  // Credit notes only make sense against invoices with real outstanding balance.
  const openInvoices = useMemo(
    () => invoices.filter((i) => !['Draft', 'Proforma', 'Cancelled'].includes(i.status) && invoiceBalance(i) > 0),
    [invoices],
  );

  const [invoiceNo, setInvoiceNo] = useState(searchParams.get('invoice') ?? openInvoices[0]?.invoiceNo ?? '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState(0);

  const selected = invoices.find((i) => i.invoiceNo === invoiceNo);
  const outstanding = selected ? invoiceBalance(selected) : 0;
  const customer = selected ? customerById(selected.customerId) : undefined;
  const canSubmit = !!selected && amount > 0 && amount <= outstanding;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!selected) return;
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    setFieldErrors({});
    try {
      await addCreditNote({
        date,
        customerId: selected.customerId,
        invoiceId: selected.id,
        invoiceNo: selected.invoiceNo,
        reason,
        amount,
      });
      navigate('/finance/credit-notes');
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        const fe: Record<string, string> = {};
        for (const k in e.errors) fe[k] = e.errors[k][0];
        setFieldErrors(fe);
      } else {
        setError(e instanceof ApiError ? e.message : 'Could not issue the credit note.');
      }
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1000px' } }}>
      <PageHeader
        title="Create Credit Note"
        subtitle="Reduce a customer invoice's outstanding balance and reverse the sale in the ledger"
        actions={<Button onClick={() => navigate('/finance/credit-notes')}>Cancel</Button>}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        <Card variant="outlined">
          <CardHeader title="Credit Note" slotProps={{ title: { variant: 'subtitle2' } }} />
          <CardContent sx={{ pt: 0 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth label="Credit Note Number" value="CN-2026 (auto)" disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField
                  fullWidth
                  required
                  type="date"
                  label="Date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  error={submitted && date === ''}
                  helperText={submitted && date === '' ? 'Date is required' : undefined}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField
                  fullWidth
                  required
                  label="Invoice"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  error={!!fieldErrors.invoiceId || (submitted && !selected)}
                  helperText={fieldErrors.invoiceId || (submitted && !selected ? 'Select an invoice' : undefined)}
                >
                  {openInvoices.length === 0 && <MenuItem value="">No open invoices</MenuItem>}
                  {openInvoices.map((i) => (
                    <MenuItem key={i.id} value={i.invoiceNo}>{i.invoiceNo} — {customerById(i.customerId)?.name}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth label="Customer" value={customer?.name ?? ''} disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth label="Outstanding Balance" value={`NPR ${outstanding.toFixed(2)}`} disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField
                  fullWidth
                  required
                  type="number"
                  label="Credit Amount"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  error={!!fieldErrors.amount || (submitted && (amount <= 0 || amount > outstanding))}
                  helperText={
                    fieldErrors.amount ||
                    (submitted && amount <= 0
                      ? 'Must be greater than 0'
                      : submitted && amount > outstanding
                        ? 'Cannot exceed the outstanding balance'
                        : undefined)
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormField fullWidth label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Returned goods, pricing correction" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {!canSubmit && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Enter a credit amount greater than zero and no more than the outstanding balance.
          </Typography>
        )}

        <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="outlined" onClick={() => navigate('/finance/credit-notes')}>Cancel</Button>
          <Button variant="contained" disabled={!canSubmit || submitting} loading={submitting} onClick={handleSubmit}>Issue Credit Note</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
