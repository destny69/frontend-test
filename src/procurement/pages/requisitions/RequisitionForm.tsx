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
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import FormSelectField from '../../components/FormSelectField';
import { useProcurement } from '../../store/ProcurementStore';
import { useInventory } from '../../../inventory/store/InventoryStore';
import { departments } from '../../data/mockData';
import { ApiError } from '../../../shared/api/client';
import type { Priority, RequisitionItem } from '../../data/types';

const priorities: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];

let rowId = 0;
function blankItem(itemId = ''): RequisitionItem & { key: number } {
  rowId += 1;
  return {
    key: rowId,
    item: itemId,
    description: '',
    requiredQty: 0,
    unit: 'kg',
    currentStock: 0,
    requiredDate: '',
    remarks: '',
  };
}

export default function RequisitionForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromItem = searchParams.get('item') ?? '';
  const { addRequisition } = useProcurement();
  const { items: catalogItems } = useInventory();
  const [items, setItems] = useState([blankItem(fromItem)]);
  const [department, setDepartment] = useState(departments[0]);
  const [requester, setRequester] = useState('Riley Carter');
  const [requiredDate, setRequiredDate] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  const updateItem = (key: number, field: keyof RequisitionItem, value: string | number) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, [field]: value } : it)));
  };

  const canSubmit =
    department !== '' && requester.trim() !== '' && purpose.trim() !== '' && items.every((it) => it.item !== '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const save = async (submit: boolean) => {
    setSubmitted(true);
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    setFieldErrors({});
    try {
      const id = await addRequisition(
        {
          department,
          requestedBy: requester,
          requestDate: new Date().toISOString().slice(0, 10),
          requiredDate,
          priority,
          purpose,
          notes: notes || undefined,
          items: items.map((it) => ({
            item: it.item,
            description: it.description,
            requiredQty: it.requiredQty,
            unit: it.unit,
            currentStock: it.currentStock,
            requiredDate: it.requiredDate,
            remarks: it.remarks,
          })),
        },
        submit,
      );
      navigate(`/procurement/requisitions/${id}`);
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        const fe: Record<string, string> = {};
        for (const k in e.errors) fe[k] = e.errors[k][0];
        setFieldErrors(fe);
      } else {
        setError(e instanceof ApiError ? e.message : 'Could not save the requisition.');
      }
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1400px' } }}>
      <PageHeader
        title="Create Requisition"
        subtitle="Request materials for your department"
        actions={
          <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/procurement/requisitions')}>
            Cancel
          </Button>
        }
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
                <FormField fullWidth size="small" label="Requisition Number" value="REQ-2026-0143 (auto)" disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField
                  fullWidth
                  size="small"
                  required
                  label="Department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  error={!!fieldErrors.departmentId}
                  helperText={fieldErrors.departmentId}
                >
                  {departments.map((d) => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField
                  fullWidth
                  size="small"
                  required
                  label="Requester"
                  value={requester}
                  onChange={(e) => setRequester(e.target.value)}
                  error={submitted && requester.trim() === ''}
                  helperText={submitted && requester.trim() === '' ? 'Requester is required' : undefined}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField fullWidth size="small" type="date" label="Required Date" value={requiredDate} onChange={(e) => setRequiredDate(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormSelectField fullWidth size="small" label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                  {priorities.map((p) => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </FormSelectField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormField
                  fullWidth
                  size="small"
                  required
                  label="Purpose"
                  placeholder="e.g. Batch B-2207 production"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  error={!!fieldErrors.purposeRemarks || (submitted && purpose.trim() === '')}
                  helperText={fieldErrors.purposeRemarks || (submitted && purpose.trim() === '' ? 'Purpose is required' : undefined)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormField fullWidth size="small" label="Notes" multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
                  <TableCell>Description</TableCell>
                  <TableCell width={110}>Required Qty</TableCell>
                  <TableCell width={90}>Unit</TableCell>
                  <TableCell width={110}>Current Stock</TableCell>
                  <TableCell width={150}>Required Date</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell width={90} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell>
                      <TextField
                        select
                        variant="standard"
                        value={row.item}
                        onChange={(e) => updateItem(row.key, 'item', e.target.value)}
                        fullWidth
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
                    <TableCell>
                      <TextField variant="standard" placeholder="Grade / spec" value={row.description} onChange={(e) => updateItem(row.key, 'description', e.target.value)} fullWidth />
                    </TableCell>
                    <TableCell>
                      <TextField variant="standard" type="number" value={row.requiredQty} onChange={(e) => updateItem(row.key, 'requiredQty', Number(e.target.value))} fullWidth />
                    </TableCell>
                    <TableCell>
                      <TextField variant="standard" value={row.unit} onChange={(e) => updateItem(row.key, 'unit', e.target.value)} fullWidth />
                    </TableCell>
                    <TableCell>
                      <TextField variant="standard" type="number" value={row.currentStock} onChange={(e) => updateItem(row.key, 'currentStock', Number(e.target.value))} fullWidth />
                    </TableCell>
                    <TableCell>
                      <TextField variant="standard" type="date" value={row.requiredDate} onChange={(e) => updateItem(row.key, 'requiredDate', e.target.value)} fullWidth />
                    </TableCell>
                    <TableCell>
                      <TextField variant="standard" value={row.remarks} onChange={(e) => updateItem(row.key, 'remarks', e.target.value)} fullWidth />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => setItems((prev) => [...prev, { ...row, key: (rowId += 1) }])}>
                        <ContentCopyRoundedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={items.length === 1}
                        onClick={() => setItems((prev) => prev.filter((it) => it.key !== row.key))}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="outlined" disabled={!canSubmit || submitting} loading={submitting} onClick={() => save(false)}>Save as Draft</Button>
          <Button variant="contained" disabled={!canSubmit || submitting} loading={submitting} onClick={() => save(true)}>Submit for Approval</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
