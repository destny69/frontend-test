import Chip, { ChipProps } from '@mui/material/Chip';
import Box from '@mui/material/Box';
import type { MovementType } from '../data/types';

const MOVEMENT_COLOR: Record<MovementType, ChipProps['color']> = {
  In: 'success',
  Out: 'error',
  Transfer: 'info',
  Adjustment: 'warning',
  Reserve: 'default',
  Return: 'warning',
  'Write-off': 'error',
};

export function MovementChip({ type }: { type: MovementType }) {
  return <Chip size="small" label={type} color={MOVEMENT_COLOR[type] ?? 'default'} variant="filled" />;
}

// Signed quantity rendered green (in) / red (out), right-aligned for tables.
export function SignedQty({ qty }: { qty: number }) {
  const positive = qty >= 0;
  return (
    <Box component="span" sx={{ color: positive ? 'success.main' : 'error.main', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
      {positive ? '+' : '−'}
      {Math.abs(qty).toLocaleString()}
    </Box>
  );
}
