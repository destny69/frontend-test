import Chip, { ChipProps } from '@mui/material/Chip';

type ChipColor = ChipProps['color'];

const STATUS_COLOR: Record<string, ChipColor> = {
  // requisitions
  Draft: 'default',
  Submitted: 'info',
  'Pending Approval': 'warning',
  Approved: 'success',
  Rejected: 'error',
  Cancelled: 'default',
  Completed: 'success',
  // rfq
  Sent: 'info',
  'Receiving Quotes': 'warning',
  Closed: 'default',
  Awarded: 'success',
  // po
  'Partially Received': 'warning',
  // grn
  Pending: 'default',
  Inspection: 'warning',
  Accepted: 'success',
  // vendor
  Active: 'success',
  'On Hold': 'warning',
  Blacklisted: 'error',
  // priority
  Low: 'default',
  Medium: 'info',
  High: 'warning',
  Urgent: 'error',
  // docs
  Valid: 'success',
  Expiring: 'warning',
  Expired: 'error',
  Missing: 'default',
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
