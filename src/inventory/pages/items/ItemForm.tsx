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
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import FormSelectField from '../../components/FormSelectField';
import { useInventory } from '../../store/InventoryStore';
import { categories, brands } from '../../data/mockData';
import { ApiError } from '../../../shared/api/client';
import type { CostingMethod, StockType } from '../../data/types';

const costingMethods: CostingMethod[] = ['FEFO', 'FIFO'];
const stockTypes: StockType[] = ['Raw Material', 'Packaging', 'Work-in-Progress', 'Finished Goods'];

const suppliers = [
  'Alpine Pharma Chemicals',
  'MeridianExcipients Ltd.',
  'ClearPack Industries',
  'Nordic Lab Instruments',
  'Vertex Fine Chemicals',
  'Danube Excipient Works',
];
const currencies = ['NPR'];
const uoms = ['kg', 'g', 'pcs', 'roll', 'vial', 'box', 'litre'];

export default function ItemForm() {
  const navigate = useNavigate();
  const { addItem } = useInventory();

  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [brand, setBrand] = useState(brands[0]);
  const [manufacturer, setManufacturer] = useState('');
  const [description, setDescription] = useState('');

  const [uom, setUom] = useState(uoms[0]);
  const [reorderLevel, setReorderLevel] = useState(0);
  const [safetyStock, setSafetyStock] = useState(0);
  const [maximumStock, setMaximumStock] = useState(0);
  const [storageCondition, setStorageCondition] = useState('Ambient, dry');
  const [stockType, setStockType] = useState<StockType>(stockTypes[0]);
  const [costingMethod, setCostingMethod] = useState<CostingMethod>(costingMethods[0]);
  const [barcode, setBarcode] = useState('');

  const [batchTracking, setBatchTracking] = useState(true);
  const [expiryTracking, setExpiryTracking] = useState(true);
  const [shelfLifeMonths, setShelfLifeMonths] = useState(24);

  const [preferredSupplier, setPreferredSupplier] = useState(suppliers[0]);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [currency, setCurrency] = useState(currencies[0]);

  const canSubmit = name.trim() !== '' && category !== '' && uom !== '';
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    setFieldErrors({});
    try {
      const id = await addItem({
        name,
        category,
        brand,
        manufacturer,
        description,
        uom,
        reorderLevel,
        safetyStock,
        maximumStock,
        storageCondition,
        stockType,
        costingMethod,
        barcode,
        batchTracking,
        expiryTracking,
        shelfLifeMonths,
        preferredSupplier,
        purchasePrice,
        averageCost: purchasePrice,
        currency,
      });
      navigate(`/inventory/items/${id}`);
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        const fe: Record<string, string> = {};
        for (const k in e.errors) fe[k] = e.errors[k][0];
        setFieldErrors(fe);
      } else {
        setError(e instanceof ApiError ? e.message : 'Could not save the item.');
      }
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1400px' } }}>
      <PageHeader
        title="Add Product"
        subtitle="Create a new item in the master database"
        actions={<Button onClick={() => navigate('/inventory/items')}>Cancel</Button>}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        <Card variant="outlined">
          <CardHeader title="General Information" slotProps={{ title: { variant: 'subtitle2' } }} />
          <CardContent sx={{ pt: 0 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth label="SKU" value="Auto-generated" disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField
                  fullWidth
                  required
                  label="Product Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Paracetamol API"
                  error={!!fieldErrors.materialName || (submitted && name.trim() === '')}
                  helperText={fieldErrors.materialName || (submitted && name.trim() === '' ? 'Product name is required' : undefined)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField
                  fullWidth
                  required
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  error={!!fieldErrors.category}
                  helperText={fieldErrors.category}
                >
                  {categories.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField fullWidth label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)}>
                  {brands.map((b) => (
                    <MenuItem key={b} value={b}>{b}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth label="Manufacturer" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardHeader title="Inventory" slotProps={{ title: { variant: 'subtitle2' } }} />
          <CardContent sx={{ pt: 0 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField
                  fullWidth
                  required
                  label="Unit of Measure"
                  value={uom}
                  onChange={(e) => setUom(e.target.value)}
                  error={!!fieldErrors.unitOfMeasure}
                  helperText={fieldErrors.unitOfMeasure}
                >
                  {uoms.map((u) => (
                    <MenuItem key={u} value={u}>{u}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField fullWidth label="Stock Type" value={stockType} onChange={(e) => setStockType(e.target.value as StockType)}>
                  {stockTypes.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField fullWidth label="Costing Method" value={costingMethod} onChange={(e) => setCostingMethod(e.target.value as CostingMethod)}>
                  {costingMethods.map((m) => (
                    <MenuItem key={m} value={m}>{m === 'FEFO' ? 'FEFO (First-Expired-First-Out)' : 'FIFO (First-In-First-Out)'}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth label="Storage Condition" value={storageCondition} onChange={(e) => setStorageCondition(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth label="Barcode / QR value" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="e.g. 8901072000101" />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth type="number" label="Reorder Level" value={reorderLevel} onChange={(e) => setReorderLevel(Number(e.target.value))} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth type="number" label="Safety Stock" value={safetyStock} onChange={(e) => setSafetyStock(Number(e.target.value))} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth type="number" label="Maximum Stock" value={maximumStock} onChange={(e) => setMaximumStock(Number(e.target.value))} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardHeader title="Batch Settings" slotProps={{ title: { variant: 'subtitle2' } }} />
          <CardContent sx={{ pt: 0 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControlLabel control={<Switch checked={batchTracking} onChange={(e) => setBatchTracking(e.target.checked)} />} label="Batch Tracking" />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControlLabel control={<Switch checked={expiryTracking} onChange={(e) => setExpiryTracking(e.target.checked)} />} label="Expiry Tracking" />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth type="number" label="Shelf Life (months)" value={shelfLifeMonths} onChange={(e) => setShelfLifeMonths(Number(e.target.value))} disabled={!expiryTracking} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardHeader title="Purchasing" slotProps={{ title: { variant: 'subtitle2' } }} />
          <CardContent sx={{ pt: 0 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField fullWidth label="Preferred Supplier" value={preferredSupplier} onChange={(e) => setPreferredSupplier(e.target.value)}>
                  {suppliers.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth type="number" label="Purchase Price" value={purchasePrice} onChange={(e) => setPurchasePrice(Number(e.target.value))} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField fullWidth label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {currencies.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="outlined" onClick={() => navigate('/inventory/items')}>Cancel</Button>
          <Button variant="contained" disabled={!canSubmit || submitting} loading={submitting} onClick={handleSubmit}>Save Product</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
