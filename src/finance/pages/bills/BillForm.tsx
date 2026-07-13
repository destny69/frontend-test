import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import FormSelectField from '../../components/FormSelectField';
import { useFinance } from '../../store/FinanceStore';
import { useProcurement } from '../../../procurement/store/ProcurementStore';
import { useInventory } from '../../../inventory/store/InventoryStore';
import { ApiError } from '../../../shared/api/client';

export default function BillForm() {
  const navigate = useNavigate();
  const { addBill } = useFinance();
  const { purchaseOrders, grns } = useProcurement();
  const { items: catalogItems } = useInventory();
  const materialName = (code: string) => catalogItems.find((ci) => ci.id === code)?.name ?? code;

  // A bill can only be matched against a PO the vendor has actually been sent and
  // started delivering against — Draft/Pending Approval/Approved/Cancelled orders
  // have nothing to bill for yet.
  const billablePOs = purchaseOrders.filter(
    (p) => p.status === 'Sent' || p.status === 'Partially Received' || p.status === 'Completed',
  );

  const [poId, setPoId] = useState(billablePOs[0]?.id ?? '');
  const [grnId, setGrnId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');

  const po = billablePOs.find((p) => p.id === poId);
  const relatedGrns = po ? grns.filter((g) => g.poNumber === po.poNumber) : [];

  const lines = useMemo(
    () => (po ? po.items.map((it) => ({
      product: materialName(it.product),
      batchNumber: relatedGrns[0]?.items[0]?.batchNumber ?? '—',
      quantity: it.qty,
      unitCost: it.unitPrice,
      vat: it.vat,
    })) : []),
    [po, relatedGrns, catalogItems],
  );

  const amount = lines.reduce((sum, l) => {
    const base = l.quantity * l.unitCost;
    return sum + base + (base * l.vat) / 100;
  }, 0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const canSubmit = dueDate !== '' && dueDate >= invoiceDate;

  const handleSubmit = async () => {
    if (!po) return;
    setSubmitted(true);
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    setFieldErrors({});
    try {
      const id = await addBill({
        vendorId: po.vendorId,
        poId: po.id,
        grnId: grnId || undefined,
        invoiceDate,
        dueDate,
        lines,
      });
      navigate(`/finance/bills/${id}`);
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        const fe: Record<string, string> = {};
        for (const k in e.errors) fe[k] = e.errors[k][0];
        setFieldErrors(fe);
      } else {
        setError(e instanceof ApiError ? e.message : 'Could not record the bill.');
      }
      setSubmitting(false);
    }
  };

  if (!po) {
    return (
      <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1400px' } }}>
        <PageHeader
          title="Record Supplier Bill"
          subtitle="Match against a purchase order and goods receipt"
          actions={<Button onClick={() => navigate('/finance/bills')}>Cancel</Button>}
        />
        <Alert severity="info">
          No purchase orders are ready to bill against yet — a supplier bill needs one that's been sent to the
          vendor and has started receiving.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1400px' } }}>
      <PageHeader
        title="Record Supplier Bill"
        subtitle="Match against a purchase order and goods receipt"
        actions={<Button onClick={() => navigate('/finance/bills')}>Cancel</Button>}
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
                <FormField fullWidth label="Bill Number" value="Auto-generated" disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth label="Supplier" value={po.vendorName} disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField fullWidth label="Purchase Order" value={poId} onChange={(e) => { setPoId(e.target.value); setGrnId(''); }}>
                  {billablePOs.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.poNumber} — {p.vendorName}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField fullWidth label="GRN Reference" value={grnId} onChange={(e) => setGrnId(e.target.value)}>
                  <MenuItem value="">Not yet received</MenuItem>
                  {relatedGrns.map((g) => (
                    <MenuItem key={g.id} value={g.id}>{g.grnNumber}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth required type="date" label="Invoice Date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField
                  fullWidth
                  required
                  type="date"
                  label="Due Date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  error={!!fieldErrors.dueDate || (submitted && (dueDate === '' || dueDate < invoiceDate))}
                  helperText={
                    fieldErrors.dueDate ||
                    (submitted && dueDate === ''
                      ? 'Due date is required'
                      : submitted && dueDate < invoiceDate
                        ? 'Must be on or after the invoice date'
                        : undefined)
                  }
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardHeader title="Products" slotProps={{ title: { variant: 'subtitle2' } }} />
          <CardContent sx={{ pt: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Batch</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Unit Cost</TableCell>
                  <TableCell align="right">VAT</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((l, i) => {
                  const base = l.quantity * l.unitCost;
                  const total = base + (base * l.vat) / 100;
                  return (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{l.product}</TableCell>
                      <TableCell>{l.batchNumber}</TableCell>
                      <TableCell align="right">{l.quantity.toLocaleString()}</TableCell>
                      <TableCell align="right">NPR {l.unitCost}</TableCell>
                      <TableCell align="right">{l.vat}%</TableCell>
                      <TableCell align="right">NPR {total.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardHeader title="Verification" slotProps={{ title: { variant: 'subtitle2' } }} />
              <CardContent sx={{ pt: 0 }}>
                <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                  <Chip size="small" color={grnId !== '' ? 'success' : 'default'} label={grnId !== '' ? 'GRN Matched' : 'Awaiting GRN'} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardHeader title="Payment" slotProps={{ title: { variant: 'subtitle2' } }} />
              <CardContent sx={{ pt: 0 }}>
                <Stack spacing={1}>
                  <Typography variant="body2">Outstanding Amount: <strong>NPR {amount.toFixed(2)}</strong></Typography>
                  <Typography variant="body2">Due Date: {dueDate || '—'}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="outlined" onClick={() => navigate('/finance/bills')}>Cancel</Button>
          <Button variant="contained" disabled={submitting} loading={submitting} onClick={handleSubmit}>Record Bill</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
