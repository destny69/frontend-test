import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import FormSelectField from '../../components/FormSelectField';
import { useInventory } from '../../store/InventoryStore';
import type { StockInLine } from '../../store/InventoryStore';
import { warehouses } from '../../data/mockData';
import type { BatchStatus } from '../../data/types';

const qcStatuses: BatchStatus[] = ['Under Inspection', 'Released', 'Available', 'Quarantined'];

let lineId = 0;
function blankLine(warehouseId: string, itemId = ''): StockInLine & { key: number } {
  lineId += 1;
  return {
    key: lineId,
    itemId,
    batchNumber: '',
    warehouseId,
    quantity: 0,
    expiryDate: '',
    supplierName: '',
    poNumber: '',
    grnNumber: '',
    qcStatus: 'Under Inspection',
  };
}

export default function StockInForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromItem = searchParams.get('item') ?? '';
  const fromWarehouse = searchParams.get('warehouse');
  const { items, receiveStock } = useInventory();
  const [rows, setRows] = useState([blankLine(fromWarehouse ?? warehouses[0].id, fromItem)]);

  const updateRow = (key: number, field: keyof StockInLine, value: string | number) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  };

  const isComplete = (r: StockInLine) => r.itemId !== '' && r.batchNumber.trim() !== '' && r.quantity > 0;
  const canSubmit = rows.some(isComplete);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    if (!canSubmit) return;
    const lines: StockInLine[] = rows.filter(isComplete).map(({ key, ...line }) => line);
    receiveStock(lines);
    navigate('/inventory/stock');
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1400px' } }}>
      <PageHeader
        title="Stock In (non-PO)"
        subtitle="Manual stock-in for goods not tied to a purchase order — opening balances, found stock, etc. Goods ordered through Procurement arrive via Goods Receipt (GRN) instead."
        actions={<Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/inventory/stock')}>Cancel</Button>}
      />

      <Stack spacing={2}>
        {rows.map((row, index) => (
          <Card key={row.key} variant="outlined">
            <CardHeader
              title={`Receiving Line ${index + 1}`}
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
                  <FormField
                    fullWidth
                    required
                    label="Batch Number"
                    value={row.batchNumber}
                    onChange={(e) => updateRow(row.key, 'batchNumber', e.target.value)}
                    placeholder="e.g. LM-26061"
                    error={submitted && row.batchNumber.trim() === ''}
                    helperText={submitted && row.batchNumber.trim() === '' ? 'Required' : undefined}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormSelectField fullWidth label="Warehouse" value={row.warehouseId} onChange={(e) => updateRow(row.key, 'warehouseId', e.target.value)}>
                    {warehouses.map((w) => (
                      <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                    ))}
                  </FormSelectField>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
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
                <Grid size={{ xs: 12, sm: 3 }}>
                  <FormField fullWidth type="date" label="Expiry Date" value={row.expiryDate} onChange={(e) => updateRow(row.key, 'expiryDate', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <FormSelectField fullWidth label="QC Status" value={row.qcStatus ?? 'Under Inspection'} onChange={(e) => updateRow(row.key, 'qcStatus', e.target.value)}>
                    {qcStatuses.map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </FormSelectField>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <FormField fullWidth label="Supplier" value={row.supplierName} onChange={(e) => updateRow(row.key, 'supplierName', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormField fullWidth label="PO Number" value={row.poNumber} onChange={(e) => updateRow(row.key, 'poNumber', e.target.value)} placeholder="e.g. PO-2026-0511" />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormField fullWidth label="GRN Number" value={row.grnNumber} onChange={(e) => updateRow(row.key, 'grnNumber', e.target.value)} placeholder="e.g. GRN-2026-0311" />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}

        <Box>
          <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setRows((prev) => [...prev, blankLine(warehouses[0].id)])}>
            Add Line
          </Button>
        </Box>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Goods marked Released or Available are added to on-hand stock immediately; other statuses are held until inspected.
        </Typography>

        <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="outlined" onClick={() => navigate('/inventory/stock')}>Cancel</Button>
          <Button variant="contained" disabled={!canSubmit} onClick={handleSubmit}>Receive Stock</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
