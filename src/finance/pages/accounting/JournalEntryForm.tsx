import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import FormSelectField from '../../components/FormSelectField';
import { useFinance } from '../../store/FinanceStore';
import { costCenters } from '../../data/mockData';

export default function JournalEntryForm() {
  const navigate = useNavigate();
  const { addJournalEntry, chartOfAccounts } = useFinance();

  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [debitAccount, setDebitAccount] = useState(chartOfAccounts[0].name);
  const [creditAccount, setCreditAccount] = useState(chartOfAccounts[1].name);
  const [amount, setAmount] = useState(0);
  const [costCenter, setCostCenter] = useState('');

  const canSubmit = description.trim() !== '' && amount > 0 && debitAccount !== creditAccount;
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    if (!canSubmit) return;
    addJournalEntry({ reference, description, date, debitAccount, creditAccount, amount, costCenter: costCenter || undefined });
    navigate('/finance/accounting');
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1000px' } }}>
      <PageHeader
        title="Create Journal Entry"
        subtitle="Post a manual double-entry transaction to the general ledger"
        actions={<Button onClick={() => navigate('/finance/accounting')}>Cancel</Button>}
      />

      <Stack spacing={2}>
        <Card variant="outlined">
          <CardHeader title="Journal" slotProps={{ title: { variant: 'subtitle2' } }} />
          <CardContent sx={{ pt: 0 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormField fullWidth label="Reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. INV-2026-1042" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormField fullWidth type="date" label="Date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormField
                  fullWidth
                  required
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Revenue recognition — MedLife Pharmacy invoice"
                  error={submitted && description.trim() === ''}
                  helperText={submitted && description.trim() === '' ? 'Description is required' : undefined}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField fullWidth required label="Debit Account" value={debitAccount} onChange={(e) => setDebitAccount(e.target.value)}>
                  {chartOfAccounts.map((a) => (
                    <MenuItem key={a.code} value={a.name}>{a.name}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField
                  fullWidth
                  required
                  label="Credit Account"
                  value={creditAccount}
                  onChange={(e) => setCreditAccount(e.target.value)}
                  error={submitted && creditAccount === debitAccount}
                  helperText={submitted && creditAccount === debitAccount ? 'Must differ from the debit account' : undefined}
                >
                  {chartOfAccounts.map((a) => (
                    <MenuItem key={a.code} value={a.name}>{a.name}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField
                  fullWidth
                  required
                  type="number"
                  label="Amount"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  error={submitted && amount <= 0}
                  helperText={submitted && amount <= 0 ? 'Must be greater than 0' : undefined}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField fullWidth label="Cost Centre (optional)" value={costCenter} onChange={(e) => setCostCenter(e.target.value)}>
                  <MenuItem value="">Unassigned</MenuItem>
                  {costCenters.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="outlined" onClick={() => navigate('/finance/accounting')}>Cancel</Button>
          <Button variant="contained" disabled={!canSubmit} onClick={handleSubmit}>Post Journal Entry</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
