import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
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
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import PageHeader from '../../components/PageHeader';
import StatusChip from '../../components/StatusChip';
import DetailTabs from '../../components/DetailTabs';
import { useFinance } from '../../store/FinanceStore';
import { billBalance } from '../../data/mockData';
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

export default function BillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { supplierBills, approveBill, cancelBill, payments, debitNotes, loading } = useFinance();
  const bill = supplierBills.find((b) => b.id === id);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  if (loading && !bill) {
    return <DetailPageSkeleton />;
  }

  if (!bill) {
    return (
      <Box>
        <Typography>Supplier bill not found.</Typography>
        <Button onClick={() => navigate('/finance/bills')}>Back to list</Button>
      </Box>
    );
  }

  const credited = bill.credited ?? 0;
  const balance = billBalance(bill);
  const relatedPayments = payments.filter((p) => p.invoiceOrBillRef === bill.billNo);
  const relatedDebitNotes = debitNotes.filter((n) => n.billNo === bill.billNo);
  const canSettle = balance > 0 && ['Approved', 'Partially Paid'].includes(bill.status);
  const canCancel = ['Draft', 'Pending Verification', 'Approved'].includes(bill.status);

  const confirmCancel = async () => {
    setCancelling(true);
    setCancelError('');
    try {
      await cancelBill(bill.id);
      setCancelOpen(false);
    } catch (e) {
      setCancelError(e instanceof ApiError ? e.message : 'Could not cancel the bill.');
    } finally {
      setCancelling(false);
    }
  };

  const overviewTab = (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>General</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Bill Number" value={bill.billNo} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Supplier" value={bill.vendorName} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Purchase Order" value={bill.poNumber} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="GRN Reference" value={bill.grnNumber} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Invoice Date" value={bill.invoiceDate} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Due Date" value={bill.dueDate} /></Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Status</Typography>
            <StatusChip status={bill.status} />
            <Stack sx={{ mt: 2, gap: 1.5 }}>
              <LabeledValue label="Amount" value={`NPR ${bill.amount.toLocaleString()}`} />
              <LabeledValue label="Paid" value={`NPR ${bill.paid.toLocaleString()}`} />
              {credited > 0 && <LabeledValue label="Debited" value={`NPR ${credited.toLocaleString()}`} />}
              <LabeledValue label="Balance" value={`NPR ${balance.toLocaleString()}`} />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const purchaseDetailsTab = (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip size="small" color={bill.poMatch ? 'success' : 'default'} label="PO Match" />
          <Chip size="small" color={bill.grnMatch ? 'success' : 'warning'} label="GRN Match" />
          <Chip size="small" color={bill.invoiceMatch ? 'success' : 'error'} label="Invoice Match" />
          <Chip size="small" label={`Difference: NPR ${bill.difference.toLocaleString()}`} />
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Batch</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Unit Cost</TableCell>
              <TableCell align="right">VAT</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bill.lines.map((l, i) => (
              <TableRow key={i} hover>
                <TableCell sx={{ fontWeight: 500 }}>{l.product}</TableCell>
                <TableCell>{l.batchNumber}</TableCell>
                <TableCell align="right">{l.quantity.toLocaleString()}</TableCell>
                <TableCell align="right">NPR {l.unitCost}</TableCell>
                <TableCell align="right">{l.vat}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
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
                    <Button variant="outlined" size="small" onClick={() => navigate(`/finance/payments/new?bill=${bill.billNo}`)}>
                      Pay Bill
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

  const debitNotesTab = (
    <Card variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Debit Note No.</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {relatedDebitNotes.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>
                <Stack sx={{ alignItems: 'center', py: 2, gap: 1.5 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>No debit notes issued</Typography>
                  {canSettle && (
                    <Button variant="outlined" size="small" onClick={() => navigate(`/finance/debit-notes/new?bill=${bill.billNo}`)}>
                      Create Debit Note
                    </Button>
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          )}
          {relatedDebitNotes.map((n) => (
            <TableRow key={n.id} hover>
              <TableCell sx={{ fontWeight: 500 }}>{n.debitNoteNo}</TableCell>
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
        title={bill.billNo}
        subtitle={bill.vendorName}
        actions={
          <>
            <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/finance/bills')}>Back</Button>
            {bill.status === 'Pending Verification' && (
              <Button variant="contained" color="success" startIcon={<CheckRoundedIcon />} onClick={() => approveBill(bill.id)}>
                Approve
              </Button>
            )}
            {balance > 0 && ['Approved', 'Partially Paid'].includes(bill.status) && (
              <>
                <Button variant="outlined" startIcon={<ReceiptLongRoundedIcon />} onClick={() => navigate(`/finance/debit-notes/new?bill=${bill.billNo}`)}>
                  Create Debit Note
                </Button>
                <Button variant="contained" onClick={() => navigate(`/finance/payments/new?bill=${bill.billNo}`)}>Pay Bill</Button>
              </>
            )}
            {canCancel && (
              <Button color="error" startIcon={<CancelRoundedIcon />} onClick={() => setCancelOpen(true)}>Cancel Bill</Button>
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
          { label: 'Purchase Details', content: purchaseDetailsTab },
          { label: 'Payments', content: paymentsTab },
          { label: 'Debit Notes', content: debitNotesTab },
        ]}
      />

      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Cancel Supplier Bill</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Cancel {bill.billNo}? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)}>Back</Button>
          <Button variant="contained" color="error" loading={cancelling} disabled={cancelling} onClick={confirmCancel}>
            Cancel Bill
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
