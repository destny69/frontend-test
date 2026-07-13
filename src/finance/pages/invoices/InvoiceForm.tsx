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
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import FormSelectField from '../../components/FormSelectField';
import { useFinance } from '../../store/FinanceStore';
import { ApiError } from '../../../shared/api/client';
import { customers, customerById } from '../../data/mockData';
import type { InvoiceLine, PaymentMethod } from '../../data/types';

const methods: PaymentMethod[] = ['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Online Payment', 'Mobile Wallet'];

let rowId = 0;
function blankLine(): InvoiceLine & { key: number } {
  rowId += 1;
  return { key: rowId, product: '', batchNumber: '', quantity: 0, unitPrice: 0, discount: 0, vat: 0 };
}

function lineTotal(line: InvoiceLine) {
  const base = line.quantity * line.unitPrice;
  const discounted = base - (base * line.discount) / 100;
  return discounted + (discounted * line.vat) / 100;
}

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { addInvoice } = useFinance();

  const [customerId, setCustomerId] = useState(customers[0].id);
  const [salesperson, setSalesperson] = useState('Riley Carter');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [shipping, setShipping] = useState(0);
  const [lines, setLines] = useState([blankLine()]);

  const customer = customerById(customerId);

  const updateLine = (key: number, field: keyof InvoiceLine, value: string | number) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, [field]: value } : l)));
  };

  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0), [lines]);
  const discountTotal = useMemo(
    () => lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice * l.discount) / 100, 0),
    [lines],
  );
  const vatTotal = useMemo(
    () =>
      lines.reduce((sum, l) => {
        const discounted = l.quantity * l.unitPrice - (l.quantity * l.unitPrice * l.discount) / 100;
        return sum + (discounted * l.vat) / 100;
      }, 0),
    [lines],
  );
  const grandTotal = subtotal - discountTotal + vatTotal + shipping;

  const canSubmit =
    dueDate !== '' && lines.every((l) => l.product.trim() !== '' && l.quantity > 0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const save = async (status: 'Draft' | 'Sent' | 'Proforma') => {
    setSubmitted(true);
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    setFieldErrors({});
    try {
      const id = await addInvoice(
        {
          customerId,
          invoiceDate: new Date().toISOString().slice(0, 10),
          dueDate,
          salesperson,
          referenceNumber,
          paymentMethod,
          amount: grandTotal,
          shippingAmount: shipping,
          lines: lines.map((l) => ({
            product: l.product,
            batchNumber: l.batchNumber,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            discount: l.discount,
            vat: l.vat,
          })),
        },
        status,
      );
      navigate(`/finance/invoices/${id}`);
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        const fe: Record<string, string> = {};
        for (const k in e.errors) fe[k] = e.errors[k][0];
        setFieldErrors(fe);
      } else {
        setError(e instanceof ApiError ? e.message : 'Could not save the invoice.');
      }
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1400px' } }}>
      <PageHeader
        title="Create Invoice"
        subtitle="Bill a customer for products sold"
        actions={<Button onClick={() => navigate('/finance/invoices')}>Cancel</Button>}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        <Card variant="outlined">
          <CardHeader title="Customer Information" slotProps={{ title: { variant: 'subtitle2' } }} />
          <CardContent sx={{ pt: 0 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth label="Invoice Number" value="INV-2026-1043 (auto)" disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField
                  fullWidth
                  required
                  label="Customer"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  error={!!fieldErrors.customerId}
                  helperText={fieldErrors.customerId}
                >
                  {customers.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth label="Salesperson" value={salesperson} onChange={(e) => setSalesperson(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormField fullWidth label="Billing Address" value={customer?.billingAddress ?? ''} disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormField fullWidth label="Shipping Address" value={customer?.shippingAddress ?? ''} disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormField fullWidth label="Reference Number" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="e.g. SO-2026-0330" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardHeader
            title="Products"
            slotProps={{ title: { variant: 'subtitle2' } }}
            action={
              <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setLines((prev) => [...prev, blankLine()])}>
                Add Item
              </Button>
            }
          />
          <CardContent sx={{ pt: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product <Box component="span" sx={{ color: 'error.main' }}>*</Box></TableCell>
                  <TableCell>Batch Number</TableCell>
                  <TableCell width={90}>Qty <Box component="span" sx={{ color: 'error.main' }}>*</Box></TableCell>
                  <TableCell width={100}>Unit Price</TableCell>
                  <TableCell width={90}>Discount %</TableCell>
                  <TableCell width={80}>VAT %</TableCell>
                  <TableCell width={110} align="right">Total</TableCell>
                  <TableCell width={50} />
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell>
                      <TextField
                        variant="standard"
                        fullWidth
                        placeholder="Paracetamol 500mg Tablets"
                        value={row.product}
                        onChange={(e) => updateLine(row.key, 'product', e.target.value)}
                        error={submitted && row.product.trim() === ''}
                        helperText={submitted && row.product.trim() === '' ? 'Required' : undefined}
                      />
                    </TableCell>
                    <TableCell><TextField variant="standard" fullWidth value={row.batchNumber} onChange={(e) => updateLine(row.key, 'batchNumber', e.target.value)} /></TableCell>
                    <TableCell>
                      <TextField
                        variant="standard"
                        type="number"
                        fullWidth
                        value={row.quantity}
                        onChange={(e) => updateLine(row.key, 'quantity', Number(e.target.value))}
                        error={submitted && row.quantity <= 0}
                        helperText={submitted && row.quantity <= 0 ? 'Must be > 0' : undefined}
                      />
                    </TableCell>
                    <TableCell><TextField variant="standard" type="number" fullWidth value={row.unitPrice} onChange={(e) => updateLine(row.key, 'unitPrice', Number(e.target.value))} /></TableCell>
                    <TableCell><TextField variant="standard" type="number" fullWidth value={row.discount} onChange={(e) => updateLine(row.key, 'discount', Number(e.target.value))} /></TableCell>
                    <TableCell><TextField variant="standard" type="number" fullWidth value={row.vat} onChange={(e) => updateLine(row.key, 'vat', Number(e.target.value))} /></TableCell>
                    <TableCell align="right">NPR {lineTotal(row).toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" disabled={lines.length === 1} onClick={() => setLines((prev) => prev.filter((l) => l.key !== row.key))}>
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardHeader title="Payment Terms" slotProps={{ title: { variant: 'subtitle2' } }} />
              <CardContent sx={{ pt: 0 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormField
                      fullWidth
                      required
                      type="date"
                      label="Due Date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      error={!!fieldErrors.dueDate || (submitted && dueDate === '')}
                      helperText={fieldErrors.dueDate || (submitted && dueDate === '' ? 'Due date is required' : undefined)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormSelectField fullWidth label="Payment Method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                      {methods.map((m) => (
                        <MenuItem key={m} value={m}>{m}</MenuItem>
                      ))}
                    </FormSelectField>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardHeader title="Summary" slotProps={{ title: { variant: 'subtitle2' } }} />
              <CardContent sx={{ pt: 0 }}>
                <Stack spacing={1}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2">Subtotal</Typography>
                    <Typography variant="body2">NPR {subtotal.toFixed(2)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2">Discount</Typography>
                    <Typography variant="body2">-NPR {discountTotal.toFixed(2)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2">VAT</Typography>
                    <Typography variant="body2">NPR {vatTotal.toFixed(2)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Shipping</Typography>
                    <TextField variant="standard" type="number" size="small" value={shipping} onChange={(e) => setShipping(Number(e.target.value))} sx={{ width: 100 }} />
                  </Stack>
                  <Divider />
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">Grand Total</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>NPR {grandTotal.toFixed(2)}</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'right' }}>
          Draft = save without sending &middot; Proforma = a quote, not a bill yet &middot; Send = the customer owes this now
        </Typography>
        <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="outlined" disabled={!canSubmit || submitting} loading={submitting} onClick={() => save('Draft')}>Save as Draft</Button>
          <Button variant="outlined" disabled={!canSubmit || submitting} loading={submitting} onClick={() => save('Proforma')}>Save as Proforma</Button>
          <Button variant="contained" disabled={!canSubmit || submitting} loading={submitting} onClick={() => save('Sent')}>Send Invoice</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
