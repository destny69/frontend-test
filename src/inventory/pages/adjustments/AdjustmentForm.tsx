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
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import FormSelectField from '../../components/FormSelectField';
import { useInventory } from '../../store/InventoryStore';
import { ApiError } from '../../../shared/api/client';
import { warehouses } from '../../data/mockData';
import type { AdjustmentItem, AdjustmentReason } from '../../data/types';

const reasons: AdjustmentReason[] = ['Damage', 'Loss', 'Theft', 'Counting Error', 'Expired Items', 'Quality Rejection'];

let rowId = 0;
function blankItem(): AdjustmentItem & { key: number } {
  rowId += 1;
  return { key: rowId, itemId: '', batchNumber: '', currentQty: 0, actualQty: 0 };
}

export default function AdjustmentForm() {
  const navigate = useNavigate();
  const { items: catalogItems, batches, addAdjustment } = useInventory();

  const [warehouseId, setWarehouseId] = useState(warehouses[0].id);
  const [type, setType] = useState<'Increase' | 'Decrease'>('Decrease');
  const [reason, setReason] = useState<AdjustmentReason>(reasons[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [createdBy] = useState('Riley Carter');
  const [rows, setRows] = useState([blankItem()]);

  const updateRow = (key: number, field: keyof AdjustmentItem, value: string | number) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  };

  // currentQty always reflects the real system stock of the selected batch — never
  // hand-typed — so a wrong manual baseline can't silently corrupt the adjustment diff.
  const selectItem = (key: number, itemId: string) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, itemId, batchNumber: '', currentQty: 0 } : r)));
  };

  const selectBatch = (key: number, batchNumber: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const batch = batches.find((b) => b.itemId === r.itemId && b.warehouseId === warehouseId && b.batchNumber === batchNumber);
        return { ...r, batchNumber, currentQty: batch?.availableQty ?? 0 };
      }),
    );
  };

  const canSubmit =
    reference.trim() !== '' && rows.every((r) => r.itemId.trim() !== '' && r.batchNumber.trim() !== '');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const id = await addAdjustment({
        warehouseId,
        type,
        reason,
        reference,
        notes,
        date: new Date().toISOString().slice(0, 10),
        createdBy,
        items: rows.map((r) => ({
          itemId: r.itemId,
          batchNumber: r.batchNumber,
          currentQty: r.currentQty,
          actualQty: r.actualQty,
        })),
      });
      navigate(`/inventory/adjustments/${id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save the adjustment.');
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1400px' } }}>
      <PageHeader
        title="Create Adjustment"
        subtitle="Reconcile physical stock against system stock"
        actions={<Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/inventory/adjustments')}>Cancel</Button>}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        <Card variant="outlined">
          <CardHeader title="General" slotProps={{ title: { variant: 'subtitle2' } }} />
          <CardContent sx={{ pt: 0 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormSelectField
                  fullWidth
                  label="Warehouse"
                  value={warehouseId}
                  onChange={(e) => {
                    setWarehouseId(e.target.value);
                    setRows((prev) => prev.map((r) => ({ ...r, batchNumber: '', currentQty: 0 })));
                  }}
                >
                  {warehouses.map((w) => (
                    <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormSelectField fullWidth label="Adjustment Type" value={type} onChange={(e) => setType(e.target.value as 'Increase' | 'Decrease')}>
                  <MenuItem value="Increase">Increase</MenuItem>
                  <MenuItem value="Decrease">Decrease</MenuItem>
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormSelectField fullWidth label="Reason" value={reason} onChange={(e) => setReason(e.target.value as AdjustmentReason)}>
                  {reasons.map((r) => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormField
                  fullWidth
                  required
                  label="Reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. GRN or cycle count ref."
                  error={submitted && reference.trim() === ''}
                  helperText={submitted && reference.trim() === '' ? 'Reference is required' : undefined}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormField fullWidth multiline minRows={2} label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardHeader
            title="Items"
            slotProps={{ title: { variant: 'subtitle2' } }}
            action={
              <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setRows((prev) => [...prev, blankItem()])}>
                Add Item
              </Button>
            }
          />
          <CardContent sx={{ pt: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product <Box component="span" sx={{ color: 'error.main' }}>*</Box></TableCell>
                  <TableCell>Batch <Box component="span" sx={{ color: 'error.main' }}>*</Box></TableCell>
                  <TableCell width={110}>Current Qty</TableCell>
                  <TableCell width={110}>Actual Qty</TableCell>
                  <TableCell width={100} align="right">Difference</TableCell>
                  <TableCell width={50} />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
                  const diff = row.actualQty - row.currentQty;
                  const batchOptions = batches.filter((b) => b.itemId === row.itemId && b.warehouseId === warehouseId);
                  return (
                    <TableRow key={row.key}>
                      <TableCell>
                        <TextField
                          select
                          variant="standard"
                          fullWidth
                          value={row.itemId}
                          onChange={(e) => selectItem(row.key, e.target.value)}
                          error={submitted && row.itemId === ''}
                          helperText={submitted && row.itemId === '' ? 'Required' : undefined}
                          slotProps={{ select: { displayEmpty: true } }}
                        >
                          <MenuItem value="" disabled>
                            Select item
                          </MenuItem>
                          {catalogItems.map((ci) => (
                            <MenuItem key={ci.id} value={ci.id}>{ci.name}</MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          variant="standard"
                          fullWidth
                          value={row.batchNumber}
                          onChange={(e) => selectBatch(row.key, e.target.value)}
                          error={submitted && row.batchNumber.trim() === ''}
                          helperText={
                            submitted && row.batchNumber.trim() === ''
                              ? 'Required'
                              : row.itemId !== '' && batchOptions.length === 0
                                ? 'No batches at this warehouse'
                                : undefined
                          }
                          disabled={row.itemId === ''}
                          slotProps={{ select: { displayEmpty: true } }}
                        >
                          <MenuItem value="" disabled>
                            Select batch
                          </MenuItem>
                          {batchOptions.map((b) => (
                            <MenuItem key={b.id} value={b.batchNumber}>
                              {b.batchNumber} (avail: {b.availableQty.toLocaleString()})
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell><TextField variant="standard" type="number" fullWidth value={row.currentQty} disabled /></TableCell>
                      <TableCell><TextField variant="standard" type="number" fullWidth value={row.actualQty} onChange={(e) => updateRow(row.key, 'actualQty', Number(e.target.value))} /></TableCell>
                      <TableCell align="right" sx={{ color: diff < 0 ? 'error.main' : diff > 0 ? 'success.main' : 'text.secondary', fontWeight: 600 }}>
                        {diff > 0 ? `+${diff}` : diff}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" disabled={rows.length === 1} onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}>
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="outlined" onClick={() => navigate('/inventory/adjustments')}>Cancel</Button>
          <Button variant="contained" disabled={!canSubmit || submitting} loading={submitting} onClick={handleSubmit}>Submit for Approval</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
