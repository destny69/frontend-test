import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import PageHeader from '../../components/PageHeader';
import StatusChip from '../../components/StatusChip';
import DetailTabs from '../../components/DetailTabs';
import { useFinance } from '../../store/FinanceStore';
import { customerById, invoiceBalance } from '../../data/mockData';
import { ApiError } from '../../../shared/api/client';
import DetailPageSkeleton from '../../../shared/components/DetailPageSkeleton';

function LabeledValue({ label, value }: { label: string; value?: string | number }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || '—'}</Typography>
    </Box>
  );
}

function lineTotal(line: { quantity: number; unitPrice: number; discount: number; vat: number }) {
  const base = line.quantity * line.unitPrice;
  const discounted = base - (base * line.discount) / 100;
  return discounted + (discounted * line.vat) / 100;
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoices, payments, creditNotes, convertProforma, cancelInvoice, loading } = useFinance();
  const invoice = invoices.find((i) => i.id === id);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  if (loading && !invoice) {
    return <DetailPageSkeleton />;
  }

  if (!invoice) {
    return (
      <Box>
        <Typography>Invoice not found.</Typography>
        <Button onClick={() => navigate('/finance/invoices')}>Back to list</Button>
      </Box>
    );
  }

  const customer = customerById(invoice.customerId);
  const credited = invoice.credited ?? 0;
  const balance = invoiceBalance(invoice);
  const relatedPayments = payments.filter((p) => p.invoiceOrBillRef === invoice.invoiceNo);
  const relatedCreditNotes = creditNotes.filter((n) => n.invoiceNo === invoice.invoiceNo);
  const canSettle = balance > 0 && !['Draft', 'Proforma', 'Cancelled'].includes(invoice.status);
  const canCancel = ['Draft', 'Proforma', 'Sent'].includes(invoice.status);

  const confirmCancel = async () => {
    setCancelling(true);
    setCancelError('');
    try {
      await cancelInvoice(invoice.id);
      setCancelOpen(false);
    } catch (e) {
      setCancelError(e instanceof ApiError ? e.message : 'Could not cancel the invoice.');
    } finally {
      setCancelling(false);
    }
  };

  const overviewTab = (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Customer Information</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Invoice Number" value={invoice.invoiceNo} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Customer" value={customer?.name} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Salesperson" value={invoice.salesperson} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Invoice Date" value={invoice.invoiceDate} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Due Date" value={invoice.dueDate} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Reference Number" value={invoice.referenceNumber} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Billing Address" value={customer?.billingAddress} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Shipping Address" value={customer?.shippingAddress} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Payment Method" value={invoice.paymentMethod} /></Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Status</Typography>
            <StatusChip status={invoice.status} />
            <Stack sx={{ mt: 2, gap: 1.5 }}>
              <LabeledValue label="Amount" value={`NPR ${invoice.amount.toLocaleString()}`} />
              <LabeledValue label="Paid" value={`NPR ${invoice.paid.toLocaleString()}`} />
              {credited > 0 && <LabeledValue label="Credited" value={`NPR ${credited.toLocaleString()}`} />}
              <LabeledValue label="Balance" value={`NPR ${balance.toLocaleString()}`} />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const productsTab = (
    <Card variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Product</TableCell>
            <TableCell>Batch Number</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell align="right">Unit Price</TableCell>
            <TableCell align="right">Discount</TableCell>
            <TableCell align="right">VAT</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoice.lines.length === 0 && (
            <TableRow><TableCell colSpan={7} align="center" sx={{ color: 'text.secondary' }}>No line items yet</TableCell></TableRow>
          )}
          {invoice.lines.map((line, i) => (
            <TableRow key={i} hover>
              <TableCell sx={{ fontWeight: 500 }}>{line.product}</TableCell>
              <TableCell>{line.batchNumber}</TableCell>
              <TableCell align="right">{line.quantity.toLocaleString()}</TableCell>
              <TableCell align="right">NPR {line.unitPrice}</TableCell>
              <TableCell align="right">{line.discount}%</TableCell>
              <TableCell align="right">{line.vat}%</TableCell>
              <TableCell align="right">NPR {lineTotal(line).toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  const paymentsTab = (
    <Card variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Payment No.</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Method</TableCell>
            <TableCell align="right">Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {relatedPayments.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>
                <Stack sx={{ alignItems: 'center', py: 2, gap: 1.5 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>No payments recorded yet</Typography>
                  {canSettle && (
                    <Button variant="outlined" size="small" onClick={() => navigate(`/finance/payments/new?invoice=${invoice.invoiceNo}`)}>
                      Record Payment
                    </Button>
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          )}
          {relatedPayments.map((p) => (
            <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/finance/payments/${p.id}`)}>
              <TableCell sx={{ fontWeight: 500 }}>{p.paymentNo}</TableCell>
              <TableCell>{p.date}</TableCell>
              <TableCell>{p.method}</TableCell>
              <TableCell align="right">NPR {p.amount.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  const creditNotesTab = (
    <Card variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Credit Note No.</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {relatedCreditNotes.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>
                <Stack sx={{ alignItems: 'center', py: 2, gap: 1.5 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>No credit notes issued</Typography>
                  {canSettle && (
                    <Button variant="outlined" size="small" onClick={() => navigate(`/finance/credit-notes/new?invoice=${invoice.invoiceNo}`)}>
                      Create Credit Note
                    </Button>
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          )}
          {relatedCreditNotes.map((n) => (
            <TableRow key={n.id} hover>
              <TableCell sx={{ fontWeight: 500 }}>{n.creditNoteNo}</TableCell>
              <TableCell>{n.date}</TableCell>
              <TableCell>{n.reason || '—'}</TableCell>
              <TableCell align="right">NPR {n.amount.toLocaleString()}</TableCell>
              <TableCell><StatusChip status={n.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title={invoice.invoiceNo}
        subtitle={customer?.name}
        actions={
          <>
            <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/finance/invoices')}>Back</Button>
            {invoice.status === 'Proforma' && (
              <Button variant="contained" onClick={() => convertProforma(invoice.id)}>Convert to Invoice</Button>
            )}
            {balance > 0 && !['Draft', 'Proforma', 'Cancelled'].includes(invoice.status) && (
              <>
                <Button variant="outlined" startIcon={<ReceiptLongRoundedIcon />} onClick={() => navigate(`/finance/credit-notes/new?invoice=${invoice.invoiceNo}`)}>
                  Create Credit Note
                </Button>
                <Button variant="contained" onClick={() => navigate(`/finance/payments/new?invoice=${invoice.invoiceNo}`)}>Record Payment</Button>
              </>
            )}
            {canCancel && (
              <Button color="error" startIcon={<CancelRoundedIcon />} onClick={() => setCancelOpen(true)}>Cancel Invoice</Button>
            )}
          </>
        }
      />
      {cancelError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCancelError('')}>
          {cancelError}
        </Alert>
      )}
      <DetailTabs
        tabs={[
          { label: 'Overview', content: overviewTab },
          { label: 'Products', content: productsTab },
          { label: 'Payments', content: paymentsTab },
          { label: 'Credit Notes', content: creditNotesTab },
        ]}
      />

      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Cancel Invoice</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Cancel {invoice.invoiceNo}? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)}>Back</Button>
          <Button variant="contained" color="error" loading={cancelling} disabled={cancelling} onClick={confirmCancel}>
            Cancel Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
