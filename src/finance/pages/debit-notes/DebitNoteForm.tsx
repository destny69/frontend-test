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
import { billBalance } from '../../data/mockData';

export default function DebitNoteForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { supplierBills, addDebitNote } = useFinance();

  const openBills = useMemo(
    () => supplierBills.filter((b) => b.status !== 'Draft' && b.status !== 'Cancelled' && billBalance(b) > 0),
    [supplierBills],
  );

  const [billNo, setBillNo] = useState(searchParams.get('bill') ?? openBills[0]?.billNo ?? '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState(0);

  const selected = supplierBills.find((b) => b.billNo === billNo);
  const outstanding = selected ? billBalance(selected) : 0;
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
      await addDebitNote({
        date,
        vendorId: selected.vendorId,
        billId: selected.id,
        vendorName: selected.vendorName,
        billNo: selected.billNo,
        reason,
        amount,
      });
      navigate('/finance/debit-notes');
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        const fe: Record<string, string> = {};
        for (const k in e.errors) fe[k] = e.errors[k][0];
        setFieldErrors(fe);
      } else {
        setError(e instanceof ApiError ? e.message : 'Could not issue the debit note.');
      }
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1000px' } }}>
      <PageHeader
        title="Create Debit Note"
        subtitle="Reduce a supplier bill's outstanding balance and reverse the purchase accrual"
        actions={<Button onClick={() => navigate('/finance/debit-notes')}>Cancel</Button>}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        <Card variant="outlined">
          <CardHeader title="Debit Note" slotProps={{ title: { variant: 'subtitle2' } }} />
          <CardContent sx={{ pt: 0 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth label="Debit Note Number" value="DN-2026 (auto)" disabled />
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
                  label="Bill"
                  value={billNo}
                  onChange={(e) => setBillNo(e.target.value)}
                  error={!!fieldErrors.supplierBillId || (submitted && !selected)}
                  helperText={fieldErrors.supplierBillId || (submitted && !selected ? 'Select a bill' : undefined)}
                >
                  {openBills.length === 0 && <MenuItem value="">No open bills</MenuItem>}
                  {openBills.map((b) => (
                    <MenuItem key={b.id} value={b.billNo}>{b.billNo} — {b.vendorName}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth label="Supplier" value={selected?.vendorName ?? ''} disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth label="Outstanding Balance" value={`NPR ${outstanding.toFixed(2)}`} disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField
                  fullWidth
                  required
                  type="number"
                  label="Debit Amount"
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
                <FormField fullWidth label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Damaged goods returned, short delivery" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {!canSubmit && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Enter a debit amount greater than zero and no more than the outstanding balance.
          </Typography>
        )}

        <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="outlined" onClick={() => navigate('/finance/debit-notes')}>Cancel</Button>
          <Button variant="contained" disabled={!canSubmit || submitting} loading={submitting} onClick={handleSubmit}>Issue Debit Note</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
