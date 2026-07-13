import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import FormSelectField from '../../components/FormSelectField';
import { useProcurement } from '../../store/ProcurementStore';
import { useInventory } from '../../../inventory/store/InventoryStore';
import { warehouses as inventoryWarehouses } from '../../../inventory/data/mockData';
import { ApiError } from '../../../shared/api/client';
import type { GrnItem, GrnInspectionResult, PurchaseOrder } from '../../data/types';

const inspectionChecks = ['Packaging', 'Temperature', 'Damage', 'Quality'];

// Build editable receiving lines from a purchase order's items. A PO already
// partially received (a prior GRN) should only offer the remaining, unreceived
// quantity here - defaulting to the full original order would let a second
// shipment silently double up on what's already been received.
function linesFromPo(po: PurchaseOrder): GrnItem[] {
  return po.items.map((it) => {
    const remaining = Math.max(0, it.qty - (it.receivedQty ?? 0));
    return {
      product: it.product,
      orderedQty: remaining,
      receivedQty: remaining,
      acceptedQty: remaining,
      rejectedQty: 0,
      batchNumber: '',
      expiryDate: '',
    };
  });
}

// Default the receiving warehouse from the PO's warehouse label (e.g. "Main
// Warehouse - WH01") by matching it against the real warehouse catalog.
function resolveWarehouseId(label: string): string {
  const l = label.toLowerCase();
  const match = inventoryWarehouses.find(
    (wh) => l.includes(wh.name.toLowerCase()) || l.includes(wh.code.toLowerCase()),
  );
  return match?.id ?? inventoryWarehouses[0]?.id ?? '';
}

export default function GRNForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromPo = searchParams.get('fromPo');
  const { loading, purchaseOrders, addGrn } = useProcurement();
  const { items: catalogItems, refreshBatches } = useInventory();
  const materialName = (code: string) => catalogItems.find((ci) => ci.id === code)?.name ?? code;

  const today = new Date().toISOString().slice(0, 10);

  // Only POs actually awaiting delivery are valid receiving targets — defaulting to
  // "whichever PO happens to be first" could silently attach a real delivery to a
  // Draft/Completed/Cancelled order with no indication anything was wrong.
  const receivablePOs = purchaseOrders.filter(
    (p) => p.status === 'Sent' || p.status === 'Partially Received' || p.id === fromPo,
  );
  // Purchase orders load asynchronously - on a fresh navigation the list can
  // still be empty here, so this must not assume a PO exists.
  const initialPoId =
    fromPo && purchaseOrders.some((p) => p.id === fromPo)
      ? fromPo
      : (receivablePOs[0] ?? purchaseOrders[0])?.id ?? '';

  const [poId, setPoId] = useState(initialPoId);
  const po = purchaseOrders.find((p) => p.id === poId) ?? purchaseOrders[0];

  const [lines, setLines] = useState<GrnItem[]>(() => (po ? linesFromPo(po) : []));
  const [warehouseId, setWarehouseId] = useState(() => (po ? resolveWarehouseId(po.warehouse) : ''));
  const [receivedDate, setReceivedDate] = useState(today);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [checks, setChecks] = useState<Record<string, string>>({
    Packaging: 'pass',
    Temperature: 'pass',
    Damage: 'pass',
    Quality: 'pass',
  });

  // Purchase orders can still be loading when this page mounts (no PO selected
  // yet) - once they arrive, pick the same default the initial-render logic would
  // have picked had the data already been there.
  useEffect(() => {
    if (poId !== '' || purchaseOrders.length === 0) return;
    const preferred =
      fromPo && purchaseOrders.some((p) => p.id === fromPo)
        ? fromPo
        : (receivablePOs[0] ?? purchaseOrders[0]).id;
    const preferredPo = purchaseOrders.find((p) => p.id === preferred);
    if (!preferredPo) return;
    setPoId(preferred);
    setLines(linesFromPo(preferredPo));
    setWarehouseId(resolveWarehouseId(preferredPo.warehouse));
  }, [purchaseOrders, poId, fromPo, receivablePOs]);

  const handlePoChange = (newId: string) => {
    setPoId(newId);
    const newPo = purchaseOrders.find((p) => p.id === newId) ?? purchaseOrders[0];
    setLines(linesFromPo(newPo));
    setWarehouseId(resolveWarehouseId(newPo.warehouse));
  };

  const updateLine = (index: number, field: keyof GrnItem, value: string | number) =>
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const unaccounted = (l: GrnItem) => l.receivedQty - l.acceptedQty - l.rejectedQty;

  const canSubmit =
    poId !== '' &&
    warehouseId !== '' &&
    receivedDate !== '' &&
    lines.every((l) => l.batchNumber.trim() !== '' && unaccounted(l) === 0);

  const save = async (complete: boolean) => {
    setSubmitted(true);
    if (!canSubmit) return;
    const grnItems: GrnItem[] = lines.map((l) => ({ ...l }));
    const inspection: GrnInspectionResult[] = inspectionChecks.map((check) => ({
      check,
      result: checks[check] === 'fail' ? 'fail' : 'pass',
    }));
    setSubmitting(true);
    setError('');
    setFieldErrors({});
    try {
      const grn = await addGrn(
        {
          poId: po.id,
          warehouseId,
          receivedDate,
          deliveryNote,
          items: grnItems,
          inspection,
        },
        complete,
      );
      // Completing rolls accepted qty onto the PO and creates under-inspection
      // batches server-side - refresh so Inventory sees them right away.
      if (complete) await refreshBatches();
      navigate('/procurement/grn/' + grn.id);
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        const fe: Record<string, string> = {};
        for (const k in e.errors) fe[k] = e.errors[k][0];
        setFieldErrors(fe);
      } else {
        setError(e instanceof ApiError ? e.message : 'Could not save the GRN.');
      }
      setSubmitting(false);
    }
  };

  if (!po) {
    return (
      <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1400px' } }}>
        <PageHeader
          title="Create GRN"
          subtitle="Record and inspect received goods against a purchase order"
          actions={
            <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/procurement/grn')}>Cancel</Button>
          }
        />
        <Alert severity="info">
          {loading ? 'Loading purchase orders…' : 'No purchase orders are available to receive against yet.'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1400px' } }}>
      <PageHeader
        title="Create GRN"
        subtitle="Record and inspect received goods against a purchase order"
        actions={
          <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/procurement/grn')}>Cancel</Button>
        }
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
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth size="small" label="GRN Number" value="Auto-generated" disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField
                  fullWidth
                  size="small"
                  required
                  label="Purchase Order"
                  value={poId}
                  onChange={(e) => handlePoChange(e.target.value)}
                  error={!!fieldErrors.purchaseOrderId}
                  helperText={fieldErrors.purchaseOrderId}
                >
                  {receivablePOs.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.poNumber} — {p.vendorName}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth size="small" label="Vendor" value={po.vendorName} disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField
                  fullWidth
                  size="small"
                  required
                  label="Warehouse"
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  error={!!fieldErrors.warehouseId}
                  helperText={fieldErrors.warehouseId}
                >
                  {inventoryWarehouses.map((w) => (
                    <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField
                  fullWidth
                  size="small"
                  required
                  type="date"
                  label="Received Date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  error={!!fieldErrors.receivedDate || (submitted && receivedDate === '')}
                  helperText={fieldErrors.receivedDate || (submitted && receivedDate === '' ? 'Received date is required' : undefined)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth size="small" label="Delivery Note" placeholder="DN-xxxxx" value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardHeader title="Received Items" slotProps={{ title: { variant: 'subtitle2' } }} />
          <CardContent sx={{ pt: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Ordered Qty</TableCell>
                  <TableCell align="right">Received Qty</TableCell>
                  <TableCell align="right">Accepted Qty</TableCell>
                  <TableCell align="right">Rejected Qty</TableCell>
                  <TableCell align="right">Unaccounted</TableCell>
                  <TableCell>Batch Number <Box component="span" sx={{ color: 'error.main' }}>*</Box></TableCell>
                  <TableCell>Expiry Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((line, i) => {
                  const delta = unaccounted(line);
                  return (
                    <TableRow key={i}>
                      <TableCell sx={{ fontWeight: 500 }}>{materialName(line.product)}</TableCell>
                      <TableCell align="right">{line.orderedQty} {po.items[i]?.unit}</TableCell>
                      <TableCell align="right"><TextField variant="standard" type="number" value={line.receivedQty} onChange={(e) => updateLine(i, 'receivedQty', Number(e.target.value))} sx={{ width: 90 }} /></TableCell>
                      <TableCell align="right"><TextField variant="standard" type="number" value={line.acceptedQty} onChange={(e) => updateLine(i, 'acceptedQty', Number(e.target.value))} sx={{ width: 90 }} /></TableCell>
                      <TableCell align="right"><TextField variant="standard" type="number" value={line.rejectedQty} onChange={(e) => updateLine(i, 'rejectedQty', Number(e.target.value))} sx={{ width: 90 }} /></TableCell>
                      <TableCell align="right" sx={{ color: delta !== 0 ? 'error.main' : 'text.secondary', fontWeight: delta !== 0 ? 600 : 400 }}>
                        {delta}
                      </TableCell>
                      <TableCell>
                        <TextField
                          variant="standard"
                          value={line.batchNumber}
                          onChange={(e) => updateLine(i, 'batchNumber', e.target.value)}
                          placeholder="e.g. LM-26071"
                          error={submitted && line.batchNumber.trim() === ''}
                          helperText={submitted && line.batchNumber.trim() === '' ? 'Required' : undefined}
                          sx={{ width: 120 }}
                        />
                      </TableCell>
                      <TableCell><TextField variant="standard" type="date" value={line.expiryDate} onChange={(e) => updateLine(i, 'expiryDate', e.target.value)} sx={{ width: 150 }} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {submitted && lines.some((l) => unaccounted(l) !== 0) && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Accepted + Rejected must equal Received on every line before this GRN can be saved.
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardHeader title="Inspection" slotProps={{ title: { variant: 'subtitle2' } }} />
          <CardContent sx={{ pt: 0 }}>
            <Stack spacing={2}>
              {inspectionChecks.map((check) => (
                <Stack key={check} direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{check}</Typography>
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={checks[check]}
                    onChange={(_, v) => v && setChecks((prev) => ({ ...prev, [check]: v }))}
                  >
                    <ToggleButton value="pass" color="success">Pass</ToggleButton>
                    <ToggleButton value="fail" color="error">Fail</ToggleButton>
                  </ToggleButtonGroup>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="outlined" disabled={submitting} loading={submitting} onClick={() => save(false)}>Save as Draft</Button>
          <Button variant="contained" disabled={submitting} loading={submitting} onClick={() => save(true)}>Complete Receipt</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
