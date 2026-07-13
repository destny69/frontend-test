import Chip from '@mui/material/Chip';

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysUntil(dateStr: string, today = new Date('2026-07-04')): number {
  const target = new Date(dateStr);
  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

export function expirySeverity(days: number): {
  label: string;
  color: 'success' | 'warning' | 'error' | 'default';
  dot: string;
} {
  if (days < 0) return { label: 'Expired', color: 'default', dot: '#111827' };
  if (days < 30) return { label: `${days}d left`, color: 'error', dot: '#ef4444' };
  if (days < 90) return { label: `${days}d left`, color: 'warning', dot: '#f97316' };
  if (days < 180) return { label: `${days}d left`, color: 'warning', dot: '#eab308' };
  return { label: `${days}d left`, color: 'success', dot: '#22c55e' };
}

export function ExpiryChip({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr);
  const severity = expirySeverity(days);
  return (
    <Chip
      size="small"
      label={days < 0 ? 'Expired' : severity.label}
      sx={{
        bgcolor: `${severity.dot}1a`,
        color: severity.dot,
        fontWeight: 600,
        border: '1px solid',
        borderColor: `${severity.dot}55`,
      }}
    />
  );
}
