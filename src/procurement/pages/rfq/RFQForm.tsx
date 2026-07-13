import { useState } from 'react';
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
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import FormSelectField from '../../components/FormSelectField';
import { useProcurement } from '../../store/ProcurementStore';
import { useInventory } from '../../../inventory/store/InventoryStore';
import { ApiError } from '../../../shared/api/client';
import type { RequisitionItem, VendorCategory } from '../../data/types';

const categories: VendorCategory[] = ['API Supplier', 'Excipients', 'Packaging', 'Lab Equipment', 'Logistics', 'MRO'];

type ItemRow = RequisitionItem & { key: number };

let rowId = 0;
function blankItem(): ItemRow {
  rowId += 1;
  return { key: rowId, item: '', description: '', requiredQty: 0, unit: 'kg', currentStock: 0, requiredDate: '' };
}
function toRow(item: RequisitionItem): ItemRow {
  rowId += 1;
  return { ...item, key: rowId };
}

export default function RFQForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromReq = searchParams.get('fromReq');
  const fromVendor = searchParams.get('vendor');
  const { vendors, requisitions, addRfq } = useProcurement();
  const { items: catalogItems } = useInventory();

  const today = new Date().toISOString().slice(0, 10);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<VendorCategory>(categories[0]);
  const [closingDate, setClosingDate] = useState('');
  const [currency, setCurrency] = useState('NPR');
  const [items, setItems] = useState<ItemRow[]>(() => {
    if (fromReq) {
      const req = requisitions.find((r) => r.id === fromReq);
      if (req && req.items.length) return req.items.map(toRow);
    }
    return [blankItem()];
  });
  const [selectedVendors, setSelectedVendors] = useState<string[]>(fromVendor ? [fromVendor] : []);

  const toggleVendor = (id: string) =>
    setSelectedVendors((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));

  const updateItem = (key: number, field: keyof RequisitionItem, value: string | number) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, [field]: value } : it)));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const canSubmit =
    title.trim() !== '' && closingDate !== '' && items.every((it) => it.item !== '') && selectedVendors.length > 0;

  const save = async (send: boolean) => {
    setSubmitted(true);
    if (!canSubmit) return;
    const cleanItems: RequisitionItem[] = items.map(({ key: _key, ...rest }) => rest);
    setSubmitting(true);
    setError('');
    setFieldErrors({});
    try {
      const id = await addRfq(
        {
          requisitionId: fromReq ?? undefined,
          title,
          category,
          createdDate: today,
          closingDate,
          currency,
          invitedVendors: selectedVendors,
          items: cleanItems,
        },
        send,
      );
      navigate('/procurement/rfqs/' + id);
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        const fe: Record<string, string> = {};
        for (const k in e.errors) fe[k] = e.errors[k][0];
        setFieldErrors(fe);
      } else {
        setError(e instanceof ApiError ? e.message : 'Could not save the RFQ.');
      }
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1400px' } }}>
      <PageHeader
        title="Create RFQ"
        subtitle="Invite vendors to quote and compare their offers"
        actions={
          <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/procurement/rfqs')}>Cancel</Button>
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
                <FormField fullWidth size="small" label="RFQ Number" value="RFQ-2026-0032 (auto)" disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField
                  fullWidth
                  size="small"
                  required
                  label="Title"
                  placeholder="e.g. Lactose Monohydrate — Q3 Supply"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  error={!!fieldErrors.title || (submitted && title.trim() === '')}
                  helperText={fieldErrors.title || (submitted && title.trim() === '' ? 'Title is required' : undefined)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField
                  fullWidth
                  size="small"
                  required
                  label="Purchase Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as VendorCategory)}
                  error={!!fieldErrors.vendorCategoryId}
                  helperText={fieldErrors.vendorCategoryId}
                >
                  {categories.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField
                  fullWidth
                  size="small"
                  required
                  type="date"
                  label="Closing Date"
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  error={!!fieldErrors.closingDate || (submitted && closingDate === '')}
                  helperText={fieldErrors.closingDate || (submitted && closingDate === '' ? 'Closing date is required' : undefined)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField fullWidth size="small" label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {['NPR'].map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardHeader
            title="Items"
            slotProps={{ title: { variant: 'subtitle2' } }}
            action={
              <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setItems((prev) => [...prev, blankItem()])}>
                Add Item
              </Button>
            }
          />
          <CardContent sx={{ pt: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item <Box component="span" sx={{ color: 'error.main' }}>*</Box></TableCell>
                  <TableCell width={100}>Qty</TableCell>
                  <TableCell width={90}>Unit</TableCell>
                  <TableCell width={150}>Required Date</TableCell>
                  <TableCell>Specifications</TableCell>
                  <TableCell width={60} />
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell>
                      <TextField
                        select
                        variant="standard"
                        fullWidth
                        value={row.item}
                        onChange={(e) => updateItem(row.key, 'item', e.target.value)}
                        error={submitted && row.item === ''}
                        helperText={submitted && row.item === '' ? 'Required' : undefined}
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
                    <TableCell><TextField variant="standard" type="number" fullWidth value={row.requiredQty} onChange={(e) => updateItem(row.key, 'requiredQty', Number(e.target.value))} /></TableCell>
                    <TableCell><TextField variant="standard" fullWidth value={row.unit} onChange={(e) => updateItem(row.key, 'unit', e.target.value)} /></TableCell>
                    <TableCell><TextField variant="standard" type="date" fullWidth value={row.requiredDate} onChange={(e) => updateItem(row.key, 'requiredDate', e.target.value)} /></TableCell>
                    <TableCell><TextField variant="standard" fullWidth placeholder="Pharma grade, DC fine" value={row.description} onChange={(e) => updateItem(row.key, 'description', e.target.value)} /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" disabled={items.length === 1} onClick={() => setItems((prev) => prev.filter((it) => it.key !== row.key))}>
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardHeader
            title={<>Select Vendors <Box component="span" sx={{ color: 'error.main' }}>*</Box></>}
            slotProps={{ title: { variant: 'subtitle2' } }}
            subheader={`${selectedVendors.length} selected`}
          />
          <CardContent sx={{ pt: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>Vendor</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vendors.map((v) => (
                  <TableRow key={v.id} hover onClick={() => toggleVendor(v.id)} sx={{ cursor: 'pointer' }}>
                    <TableCell padding="checkbox">
                      <Checkbox checked={selectedVendors.includes(v.id)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>{v.name.charAt(0)}</Avatar>
                        {v.name}
                      </Stack>
                    </TableCell>
                    <TableCell>{v.category}</TableCell>
                    <TableCell>{v.country}</TableCell>
                    <TableCell><Chip size="small" label={v.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {submitted && selectedVendors.length === 0 && (
              <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mt: 1 }}>
                Select at least one vendor to invite.
              </Typography>
            )}
          </CardContent>
        </Card>

        <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="outlined" disabled={submitting} loading={submitting} onClick={() => save(false)}>Save as Draft</Button>
          <Button
            variant="contained"
            disabled={submitting}
            loading={submitting}
            onClick={() => save(true)}
          >
            Send to Vendors
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
