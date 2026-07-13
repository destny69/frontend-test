import Chip, { ChipProps } from '@mui/material/Chip';

type ChipColor = ChipProps['color'];

const STATUS_COLOR: Record<string, ChipColor> = {
  // items
  Active: 'success',
  Inactive: 'default',
  'In Stock': 'success',
  'Low Stock': 'warning',
  'Out of Stock': 'error',
  // batches
  Available: 'success',
  Quarantined: 'warning',
  'Under Inspection': 'info',
  Released: 'success',
  Expired: 'error',
  Recalled: 'error',
  // transfers / adjustments
  Draft: 'default',
  'Pending Approval': 'warning',
  Approved: 'success',
  'In Transit': 'info',
  Completed: 'success',
  Cancelled: 'default',
  Rejected: 'error',
  Pending: 'default',
  // stock
  Reserved: 'info',
  Damaged: 'error',
  'Pending Inspection': 'warning',
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
