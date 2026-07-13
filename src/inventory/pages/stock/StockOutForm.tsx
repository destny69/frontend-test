import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import FormSelectField from '../../components/FormSelectField';
import { useInventory } from '../../store/InventoryStore';
import type { StockOutLine } from '../../store/InventoryStore';
import { ApiError } from '../../../shared/api/client';
import { warehouses, itemById } from '../../data/mockData';
import { allocateByCosting } from '../../data/costing';

const reasons = ['Production Issue', 'Sales Order', 'QC Sampling', 'Write-off', 'Wastage', 'Internal Use'];

let lineId = 0;
interface OutRow extends StockOutLine {
  key: number;
  reason: string;
}
function blankLine(warehouseId: string): OutRow {
  lineId += 1;
  return { key: lineId, itemId: '', warehouseId, quantity: 0, reason: reasons[0], reference: '' };
}

export default function StockOutForm() {
  const navigate = useNavigate();
  const { items, batches, stockOut } = useInventory();
  const [rows, setRows] = useState<OutRow[]>([blankLine(warehouses[0].id)]);

  const updateRow = (key: number, field: keyof OutRow, value: string | number) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  };

  // FEFO/FIFO allocation preview for a line — shows which batches will actually be issued.
  const previewFor = (row: OutRow) => {
    if (!row.itemId || row.quantity <= 0) return null;
    const method = itemById(row.itemId)?.costingMethod ?? 'FEFO';
    const pool = batches.filter((b) => b.itemId === row.itemId && b.warehouseId === row.warehouseId);
    return { method, ...allocateByCosting(pool, method, row.quantity) };
  };

  const isComplete = (r: OutRow) => r.itemId !== '' && r.quantity > 0;
  const canSubmit = rows.some(isComplete);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!canSubmit) return;
    const lines: StockOutLine[] = rows.filter(isComplete).map((r) => ({
      itemId: r.itemId,
      warehouseId: r.warehouseId,
      quantity: r.quantity,
      reference: [r.reason, r.reference].filter(Boolean).join(' · '),
    }));
    setSubmitting(true);
    setError('');
    try {
      await stockOut(lines);
      navigate('/inventory/stock');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not issue stock.');
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1400px' } }}>
      <PageHeader
        title="Stock Out"
        subtitle="Issue or consume stock — deducts on-hand FEFO/FIFO and records an Out movement"
        actions={<Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/inventory/stock')}>Cancel</Button>}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        {rows.map((row, index) => {
          const preview = previewFor(row);
          return (
            <Card key={row.key} variant="outlined">
              <CardHeader
                title={`Issue Line ${index + 1}`}
                slotProps={{ title: { variant: 'subtitle2' } }}
                action={
                  <IconButton size="small" disabled={rows.length === 1} onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}>
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                }
              />
              <CardContent sx={{ pt: 0 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormSelectField
                      fullWidth
                      required
                      label="Product"
                      value={row.itemId}
                      onChange={(e) => updateRow(row.key, 'itemId', e.target.value)}
                      error={submitted && row.itemId === ''}
                      helperText={submitted && row.itemId === '' ? 'Required' : undefined}
                    >
                      <MenuItem value="">Select a product</MenuItem>
                      {items.map((it) => (
                        <MenuItem key={it.id} value={it.id}>{it.name}</MenuItem>
                      ))}
                    </FormSelectField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormSelectField fullWidth required label="Warehouse" value={row.warehouseId} onChange={(e) => updateRow(row.key, 'warehouseId', e.target.value)}>
                      {warehouses.map((w) => (
                        <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                      ))}
                    </FormSelectField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormField
                      fullWidth
                      required
                      type="number"
                      label="Quantity"
                      value={row.quantity}
                      onChange={(e) => updateRow(row.key, 'quantity', Number(e.target.value))}
                      error={submitted && row.quantity <= 0}
                      helperText={submitted && row.quantity <= 0 ? 'Must be greater than 0' : undefined}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormSelectField fullWidth label="Reason" value={row.reason} onChange={(e) => updateRow(row.key, 'reason', e.target.value)}>
                      {reasons.map((r) => (
                        <MenuItem key={r} value={r}>{r}</MenuItem>
                      ))}
                    </FormSelectField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <FormField fullWidth label="Reference" value={row.reference} onChange={(e) => updateRow(row.key, 'reference', e.target.value)} placeholder="e.g. WO-2026-0142, SO-2026-0088" />
                  </Grid>
                </Grid>

                {preview && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {preview.method} allocation
                    </Typography>
                    {preview.allocations.length === 0 ? (
                      <Typography variant="body2" sx={{ color: 'error.main' }}>No available stock for this item at this warehouse.</Typography>
                    ) : (
                      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                        {preview.allocations.map((a) => (
                          <Chip
                            key={a.batch.id}
                            size="small"
                            label={`${a.batch.batchNumber}: ${a.take.toLocaleString()}${a.batch.expiryDate ? ` · exp ${a.batch.expiryDate}` : ''}`}
                          />
                        ))}
                      </Stack>
                    )}
                    {preview.shortfall > 0 && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        Short by {preview.shortfall.toLocaleString()} — only the available quantity will be issued.
                      </Alert>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}

        <Box>
          <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setRows((prev) => [...prev, blankLine(warehouses[0].id)])}>
            Add Line
          </Button>
        </Box>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Stock is issued from the earliest-expiring batch first (FEFO) or earliest received (FIFO), based on each item's costing method.
        </Typography>

        <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="outlined" onClick={() => navigate('/inventory/stock')}>Cancel</Button>
          <Button variant="contained" disabled={!canSubmit || submitting} loading={submitting} onClick={handleSubmit}>Issue Stock</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
