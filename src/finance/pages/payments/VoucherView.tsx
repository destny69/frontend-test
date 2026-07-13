import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import { useFinance } from '../../store/FinanceStore';

function Field({ label, value }: { label: string; value?: string | number }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || '—'}</Typography>
    </Box>
  );
}

// Very small integer-to-words helper for the voucher's "amount in words" line.
function amountInWords(n: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const chunk = (num: number): string => {
    if (num === 0) return '';
    if (num < 20) return ones[num];
    if (num < 100) return `${tens[Math.floor(num / 10)]}${num % 10 ? ' ' + ones[num % 10] : ''}`;
    return `${ones[Math.floor(num / 100)]} Hundred${num % 100 ? ' ' + chunk(num % 100) : ''}`;
  };
  const whole = Math.floor(n);
  if (whole === 0) return 'Zero';
  const scales = [
    { value: 1_000_000, name: 'Million' },
    { value: 1_000, name: 'Thousand' },
    { value: 1, name: '' },
  ];
  let remaining = whole;
  const parts: string[] = [];
  for (const s of scales) {
    if (remaining >= s.value) {
      const count = Math.floor(remaining / s.value);
      parts.push(`${chunk(count)}${s.name ? ' ' + s.name : ''}`);
      remaining %= s.value;
    }
  }
  return parts.join(' ').trim();
}

export default function VoucherView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { payments } = useFinance();
  const payment = payments.find((p) => p.id === id);

  if (!payment) {
    return (
      <Box>
        <Typography>Payment not found.</Typography>
        <Button onClick={() => navigate('/finance/payments')}>Back to list</Button>
      </Box>
    );
  }

  const isReceipt = payment.type === 'Customer Payment';
  const voucherTitle = isReceipt ? 'Receipt Voucher' : 'Payment Voucher';
  const partyLabel = isReceipt ? 'Received From' : 'Paid To';

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '900px' } }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2 }} className="voucher-toolbar">
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(`/finance/payments/${payment.id}`)}>Back</Button>
        <Button variant="contained" startIcon={<PrintRoundedIcon />} onClick={() => window.print()}>Print</Button>
      </Stack>

      <Card variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>PharmaCorp Ltd.</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Kathmandu, Nepal</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{voucherTitle}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>{payment.paymentNo}</Typography>
            </Box>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 6 }}><Field label={partyLabel} value={payment.partyName} /></Grid>
            <Grid size={{ xs: 6 }}><Field label="Date" value={payment.date} /></Grid>
            <Grid size={{ xs: 6 }}><Field label="Payment Method" value={payment.method} /></Grid>
            <Grid size={{ xs: 6 }}><Field label="Bank" value={payment.bank} /></Grid>
            <Grid size={{ xs: 6 }}><Field label="Against" value={payment.invoiceOrBillRef} /></Grid>
            <Grid size={{ xs: 6 }}><Field label="Transaction ID" value={payment.transactionId} /></Grid>
          </Grid>

          <Card variant="outlined" sx={{ mt: 3, bgcolor: 'action.hover' }}>
            <CardContent>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1">Amount</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>NPR {payment.amount.toLocaleString()}</Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {amountInWords(payment.amount)} dollars only
              </Typography>
            </CardContent>
          </Card>

          {payment.notes && (
            <Box sx={{ mt: 3 }}>
              <Field label="Notes" value={payment.notes} />
            </Box>
          )}

          <Grid container spacing={2} sx={{ mt: 6 }}>
            <Grid size={{ xs: 6 }}>
              <Divider />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{isReceipt ? 'Received By' : 'Authorised By'}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Divider />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Signature</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
