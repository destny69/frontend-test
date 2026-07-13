import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import PageHeader from '../../components/PageHeader';
import KpiCard from '../../components/KpiCard';
import DetailTabs from '../../components/DetailTabs';
import FormField from '../../components/FormField';
import FormSelectField from '../../components/FormSelectField';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import { useFinance } from '../../store/FinanceStore';
import { customerById, invoiceBalance, billBalance } from '../../data/mockData';
import type { Advance } from '../../data/types';

export default function AdvancesList() {
  const navigate = useNavigate();
  const { advances, advanceApplications, invoices, supplierBills, applyAdvance } = useFinance();

  const [dialogAdvance, setDialogAdvance] = useState<Advance | null>(null);
  const [targetRef, setTargetRef] = useState('');
  const [applyAmount, setApplyAmount] = useState(0);
  const [applyAttempted, setApplyAttempted] = useState(false);

  const remainingOf = (a: Advance) => a.amount - a.allocated;
  const totalUnallocated = advances.reduce((s, a) => s + remainingOf(a), 0);
  const customerAdvances = advances.filter((a) => a.direction === 'Customer').reduce((s, a) => s + remainingOf(a), 0);
  const supplierAdvances = advances.filter((a) => a.direction === 'Supplier').reduce((s, a) => s + remainingOf(a), 0);

  const openTargets = useMemo(() => {
    if (!dialogAdvance) return [] as { ref: string; label: string; balance: number }[];
    if (dialogAdvance.direction === 'Customer') {
      return invoices
        .filter((i) => invoiceBalance(i) > 0 && !['Draft', 'Proforma', 'Cancelled'].includes(i.status))
        .map((i) => ({ ref: i.invoiceNo, label: `${i.invoiceNo} — ${customerById(i.customerId)?.name}`, balance: invoiceBalance(i) }));
    }
    return supplierBills
      .filter((b) => billBalance(b) > 0 && b.status !== 'Draft' && b.status !== 'Cancelled')
      .map((b) => ({ ref: b.billNo, label: `${b.billNo} — ${b.vendorName}`, balance: billBalance(b) }));
  }, [dialogAdvance, invoices, supplierBills]);

  const selectedTarget = openTargets.find((t) => t.ref === targetRef);
  const maxApplicable = dialogAdvance
    ? Math.min(remainingOf(dialogAdvance), selectedTarget?.balance ?? 0)
    : 0;

  const openDialog = (a: Advance) => {
    setDialogAdvance(a);
    const targets = a.direction === 'Customer'
      ? invoices.filter((i) => invoiceBalance(i) > 0 && !['Draft', 'Proforma', 'Cancelled'].includes(i.status)).map((i) => i.invoiceNo)
      : supplierBills.filter((b) => billBalance(b) > 0 && b.status !== 'Draft' && b.status !== 'Cancelled').map((b) => b.billNo);
    setTargetRef(targets[0] ?? '');
    setApplyAmount(0);
    setApplyAttempted(false);
  };

  const confirmApply = () => {
    setApplyAttempted(true);
    if (!dialogAdvance || !targetRef || applyAmount <= 0 || applyAmount > maxApplicable) return;
    applyAdvance(dialogAdvance.id, targetRef, applyAmount);
    setDialogAdvance(null);
  };

  const advancesTab = (
    <Card variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Advance No.</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Direction</TableCell>
            <TableCell>Party</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell align="right">Allocated</TableCell>
            <TableCell align="right">Remaining</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {advances.length === 0 && (
            <TableRow><TableCell colSpan={8} align="center" sx={{ color: 'text.secondary' }}>No advances recorded</TableCell></TableRow>
          )}
          {advances.map((a) => {
            const remaining = remainingOf(a);
            return (
              <TableRow key={a.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{a.advanceNo}</TableCell>
                <TableCell>{a.date}</TableCell>
                <TableCell>{a.direction}</TableCell>
                <TableCell>{a.partyName}</TableCell>
                <TableCell align="right">NPR {a.amount.toLocaleString()}</TableCell>
                <TableCell align="right">NPR {a.allocated.toLocaleString()}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>NPR {remaining.toLocaleString()}</TableCell>
                <TableCell align="right">
                  <Button size="small" disabled={remaining <= 0} onClick={() => openDialog(a)}>Apply</Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );

  const applicationsTab = (
    <Card variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Advance No.</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Applied To</TableCell>
            <TableCell align="right">Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {advanceApplications.length === 0 && (
            <TableRow><TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>No advances applied yet</TableCell></TableRow>
          )}
          {advanceApplications.map((ap) => (
            <TableRow key={ap.id} hover>
              <TableCell sx={{ fontWeight: 500 }}>{ap.advanceNo}</TableCell>
              <TableCell>{ap.date}</TableCell>
              <TableCell>{ap.targetRef}</TableCell>
              <TableCell align="right">NPR {ap.amount.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  const kpis = [
    { title: 'Unallocated Advances', value: `NPR ${totalUnallocated.toLocaleString()}`, icon: <AccountBalanceWalletRoundedIcon />, color: 'primary' as const },
    { title: 'Customer Advances', value: `NPR ${customerAdvances.toLocaleString()}`, icon: <PaidRoundedIcon />, color: 'success' as const },
    { title: 'Supplier Advances', value: `NPR ${supplierAdvances.toLocaleString()}`, icon: <PaidRoundedIcon />, color: 'warning' as const },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Advance Payments"
        subtitle="Unallocated credits held for customers and suppliers, applied against open documents"
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/finance/payments/new?type=Advance%20Payment')}>
            Record Advance
          </Button>
        }
      />

      <Grid container spacing={2} columns={12} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid key={kpi.title} size={{ xs: 12, sm: 6, lg: 3 }}>
            <KpiCard {...kpi} />
          </Grid>
        ))}
      </Grid>

      <DetailTabs
        tabs={[
          { label: 'Advances', content: advancesTab },
          { label: 'Applications', content: applicationsTab },
        ]}
      />

      <Dialog open={!!dialogAdvance} onClose={() => setDialogAdvance(null)} fullWidth maxWidth="sm">
        <DialogTitle>Apply Advance {dialogAdvance?.advanceNo}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {dialogAdvance?.partyName} · Remaining ${dialogAdvance ? remainingOf(dialogAdvance).toLocaleString() : 0}
            </Typography>
            <FormSelectField
              fullWidth
              required
              label={dialogAdvance?.direction === 'Customer' ? 'Apply to Invoice' : 'Apply to Bill'}
              value={targetRef}
              onChange={(e) => setTargetRef(e.target.value)}
              error={applyAttempted && !targetRef}
              helperText={applyAttempted && !targetRef ? 'Select a target document' : undefined}
            >
              {openTargets.length === 0 && <MenuItem value="">No open documents</MenuItem>}
              {openTargets.map((t) => (
                <MenuItem key={t.ref} value={t.ref}>{t.label} (bal ${t.balance.toLocaleString()})</MenuItem>
              ))}
            </FormSelectField>
            <FormField
              fullWidth
              required
              type="number"
              label={`Amount to Apply (max NPR ${maxApplicable.toLocaleString()})`}
              value={applyAmount}
              onChange={(e) => setApplyAmount(Number(e.target.value))}
              error={applyAttempted && (applyAmount <= 0 || applyAmount > maxApplicable)}
              helperText={
                applyAttempted && applyAmount <= 0
                  ? 'Must be greater than 0'
                  : applyAttempted && applyAmount > maxApplicable
                    ? 'Exceeds the applicable maximum'
                    : undefined
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAdvance(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!targetRef || applyAmount <= 0 || applyAmount > maxApplicable}
            onClick={confirmApply}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
