import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Avatar from '@mui/material/Avatar';
import Checkbox from '@mui/material/Checkbox';
import Alert from '@mui/material/Alert';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import FormSelectField from '../../components/FormSelectField';
import { useProcurement } from '../../store/ProcurementStore';
import { useInventory } from '../../../inventory/store/InventoryStore';
import { departments } from '../../data/mockData';
import { ApiError } from '../../../shared/api/client';
import type { Priority, RequisitionItem, VendorCategory } from '../../data/types';

const priorities: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];
const categories: VendorCategory[] = ['API Supplier', 'Excipients', 'Packaging', 'Lab Equipment', 'Logistics', 'MRO'];
const APPROVER = 'Grace Liu';

type ItemRow = RequisitionItem & { key: number };

let rowId = 0;
function blankItem(): ItemRow {
  rowId += 1;
  return { key: rowId, item: '', description: '', requiredQty: 0, unit: 'kg', currentStock: 0, requiredDate: '', remarks: '' };
}

const STEPS = ['Request Materials', 'Get Quotes'];

// Real vendor quotes come back over hours or days, not in one sitting — so this wizard's
// job ends at sending the RFQ. Entering quotes, awarding a vendor, and creating the PO
// happen later, whenever quotes actually arrive, on the RFQ's own detail page.
export default function ProcurementWizard() {
  const navigate = useNavigate();
  const { vendors, addRequisition, approveRequisition, addRfq } = useProcurement();
  const { items: catalogItems } = useInventory();

  const today = new Date().toISOString().slice(0, 10);
  const [activeStep, setActiveStep] = useState(0);

  // Step 1 — Request Materials (becomes the Requisition, and the item list Get Quotes reuses)
  const [department, setDepartment] = useState(departments[0]);
  const [requester, setRequester] = useState('Riley Carter');
  const [requiredDate, setRequiredDate] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [purpose, setPurpose] = useState('');
  const [items, setItems] = useState<ItemRow[]>([blankItem()]);

  const updateItem = (key: number, field: keyof RequisitionItem, value: string | number) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, [field]: value } : it)));

  // Step 2 — Get Quotes (becomes the RFQ)
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<VendorCategory>(categories[0]);
  const [closingDate, setClosingDate] = useState('');
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);

  const toggleVendor = (id: string) =>
    setSelectedVendors((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));

  // Validation gates — Next/Send RFQ stays disabled until the step's minimum viable info is filled.
  const step0Valid = department !== '' && requester.trim() !== '' && purpose.trim() !== '' && requiredDate !== '' && items.some((it) => it.item.trim() !== '');
  const step1Valid = title.trim() !== '' && closingDate !== '' && selectedVendors.length > 0;
  const stepValid = [step0Valid, step1Valid][activeStep];

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const sendRfq = async () => {
    const cleanItems: RequisitionItem[] = items.map(({ key: _key, ...rest }) => rest);

    setSubmitting(true);
    setError('');
    try {
      const reqId = await addRequisition(
        {
          department,
          requestedBy: requester,
          requestDate: today,
          requiredDate,
          priority,
          purpose,
          items: cleanItems,
        },
        true,
      );
      await approveRequisition(reqId, APPROVER);

      const rfqId = await addRfq(
        {
          requisitionId: reqId,
          title,
          category,
          createdDate: today,
          closingDate,
          currency: 'NPR',
          invitedVendors: selectedVendors,
          items: cleanItems,
        },
        true,
      );
      navigate(`/procurement/rfqs/${rfqId}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not send the RFQ.');
      setSubmitting(false);
    }
  };

  const requestStep = (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardHeader title="1. What do you need?" slotProps={{ title: { variant: 'subtitle2' } }} />
        <CardContent sx={{ pt: 0 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormSelectField fullWidth size="small" required label="Department" value={department} onChange={(e) => setDepartment(e.target.value)}>
                {departments.map((d) => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </FormSelectField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormField fullWidth size="small" required label="Requester" value={requester} onChange={(e) => setRequester(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormSelectField fullWidth size="small" label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                {priorities.map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </FormSelectField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormField fullWidth size="small" required type="date" label="Required Date" value={requiredDate} onChange={(e) => setRequiredDate(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <FormField fullWidth size="small" required label="Purpose" placeholder="e.g. Batch B-2207 production" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
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
                <TableCell width={100}>Qty</TableCell>
                <TableCell width={90}>Unit</TableCell>
                <TableCell width={50} />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.key}>
                  <TableCell>
                    <TextField
                      variant="standard"
                      select
                      value={row.item}
                      onChange={(e) => updateItem(row.key, 'item', e.target.value)}
                      fullWidth
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
    </Stack>
  );

  const quotesStep = (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardHeader title="2. Ask vendors to quote" slotProps={{ title: { variant: 'subtitle2' } }} />
        <CardContent sx={{ pt: 0 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormField fullWidth size="small" required label="Title" placeholder="e.g. Lactose Monohydrate — Q3 Supply" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormSelectField fullWidth size="small" required label="Purchase Category" value={category} onChange={(e) => setCategory(e.target.value as VendorCategory)}>
                {categories.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </FormSelectField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormField fullWidth size="small" required type="date" label="Closing Date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader
          title={<>Select vendors to invite <Box component="span" sx={{ color: 'error.main' }}>*</Box></>}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );

  const stepContent = [requestStep, quotesStep][activeStep];

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1400px' } }}>
      <PageHeader
        title="Guided Purchase"
        subtitle="Request materials and send an RFQ to vendors in one go"
        actions={
          <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/procurement')}>
            Cancel
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {stepContent}

      <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 3 }}>
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          disabled={activeStep === 0}
          onClick={() => setActiveStep((s) => s - 1)}
        >
          Back
        </Button>
        {activeStep < STEPS.length - 1 ? (
          <Button
            variant="contained"
            endIcon={<ArrowForwardRoundedIcon />}
            disabled={!stepValid}
            onClick={() => setActiveStep((s) => s + 1)}
          >
            Next
          </Button>
        ) : (
          <Button variant="contained" color="success" disabled={!stepValid || submitting} loading={submitting} onClick={sendRfq}>
            Send RFQ
          </Button>
        )}
      </Stack>
    </Box>
  );
}
