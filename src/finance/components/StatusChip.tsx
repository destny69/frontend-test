import Chip, { ChipProps } from '@mui/material/Chip';

type ChipColor = ChipProps['color'];

const STATUS_COLOR: Record<string, ChipColor> = {
  // invoices / bills
  Draft: 'default',
  Proforma: 'secondary',
  Sent: 'info',
  'Pending Verification': 'warning',
  Approved: 'success',
  'Partially Paid': 'warning',
  Paid: 'success',
  Overdue: 'error',
  Cancelled: 'default',
  // credit / debit notes
  Issued: 'info',
  // payments
  Completed: 'success',
  Pending: 'default',
  Failed: 'error',
  // reconciliation
  Matched: 'success',
  Unmatched: 'warning',
  Reconciled: 'success',
  // journal
  Posted: 'success',
};

export default function StatusChip({
  status,
  size = 'small',
}: {
  status: string;
  size?: ChipProps['size'];
}) {
  return (
    <Chip
      label={status}
      color={STATUS_COLOR[status] ?? 'default'}
      size={size}
      variant={STATUS_COLOR[status] ? 'filled' : 'outlined'}
    />
  );
}
