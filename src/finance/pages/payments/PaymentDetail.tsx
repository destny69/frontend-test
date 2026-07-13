import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ReceiptRoundedIcon from '@mui/icons-material/ReceiptRounded';
import PageHeader from '../../components/PageHeader';
import StatusChip from '../../components/StatusChip';
import DetailTabs from '../../components/DetailTabs';
import { useFinance } from '../../store/FinanceStore';
import DetailPageSkeleton from '../../../shared/components/DetailPageSkeleton';

function LabeledValue({ label, value }: { label: string; value?: string | number }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || '—'}</Typography>
    </Box>
  );
}

export default function PaymentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { payments, loading } = useFinance();
  const payment = payments.find((p) => p.id === id);

  if (loading && !payment) {
    return <DetailPageSkeleton />;
  }

  if (!payment) {
    return (
      <Box>
        <Typography>Payment not found.</Typography>
        <Button onClick={() => navigate('/finance/payments')}>Back to list</Button>
      </Box>
    );
  }

  const targetPath = payment.type === 'Customer Payment'
    ? `/finance/invoices?search=${payment.invoiceOrBillRef}`
    : `/finance/bills?search=${payment.invoiceOrBillRef}`;

  const overviewTab = (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>General</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Payment ID" value={payment.paymentNo} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Type" value={payment.type} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Customer / Supplier" value={payment.partyName} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Date" value={payment.date} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Method" value={payment.method} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Bank" value={payment.bank} /></Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Status</Typography>
            <StatusChip status={payment.status} />
            <Box sx={{ mt: 2 }}>
              <LabeledValue label="Amount" value={`NPR ${payment.amount.toLocaleString()}`} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const allocationTab = (
    <Card variant="outlined">
      <CardContent>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <LabeledValue label="Invoice / Bill" value={payment.invoiceOrBillRef} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}><LabeledValue label="Outstanding Balance" value={`NPR ${payment.outstandingBalance.toLocaleString()}`} /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><LabeledValue label="Paid Amount" value={`NPR ${payment.amount.toLocaleString()}`} /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><LabeledValue label="Remaining Balance" value={`NPR ${payment.remainingBalance.toLocaleString()}`} /></Grid>
        </Grid>
        <Button variant="text" sx={{ mt: 2 }} onClick={() => navigate(targetPath)}>
          View {payment.type === 'Customer Payment' ? 'invoice' : 'bill'} →
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title={payment.paymentNo}
        subtitle={payment.partyName}
        actions={
          <>
            <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/finance/payments')}>Back</Button>
            {(payment.type === 'Customer Payment' || payment.type === 'Supplier Payment') && (
              <Button variant="contained" startIcon={<ReceiptRoundedIcon />} onClick={() => navigate(`/finance/payments/${payment.id}/voucher`)}>
                {payment.type === 'Customer Payment' ? 'Receipt Voucher' : 'Payment Voucher'}
              </Button>
            )}
          </>
        }
      />
      <DetailTabs
        tabs={[
          { label: 'Overview', content: overviewTab },
          { label: 'Allocation', content: allocationTab },
        ]}
      />
    </Box>
  );
}
