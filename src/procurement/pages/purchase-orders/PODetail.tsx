import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import PageHeader from '../../components/PageHeader';
import StatusChip from '../../components/StatusChip';
import DetailTabs from '../../components/DetailTabs';
import PipelineTracker from '../../components/PipelineTracker';
import { useProcurement } from '../../store/ProcurementStore';
import { useInventory } from '../../../inventory/store/InventoryStore';
import { ApiError } from '../../../shared/api/client';
import DetailPageSkeleton from '../../../shared/components/DetailPageSkeleton';
import type { PoItem } from '../../data/types';

function LabeledValue({ label, value }: { label: string; value?: string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || '—'}</Typography>
    </Box>
  );
}

const PO_STEPS = ['Draft', 'Approved', 'Sent', 'Receiving', 'Completed'];

function lineTotal(item: PoItem) {
  const base = item.qty * item.unitPrice;
  const discounted = base - (base * item.discount) / 100;
  return discounted + (discounted * item.vat) / 100;
}

function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
}

export default function PODetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { purchaseOrders, rfqs, grns, approvePurchaseOrder, sendPurchaseOrder, amendPurchaseOrder, cancelPurchaseOrder, loading } =
    useProcurement();
  const { batches, items: catalogItems } = useInventory();
  const materialName = (code: string) => catalogItems.find((ci) => ci.id === code)?.name ?? code;
  const po = purchaseOrders.find((p) => p.id === id);
  const linkedRfq = po?.rfqId ? rfqs.find((r) => r.id === po.rfqId) : undefined;
  const linkedGrn = po ? grns.find((g) => g.poNumber === po.poNumber) : undefined;
  const linkedBatch = po ? batches.find((b) => b.poNumber === po.poNumber) : undefined;

  const [amendOpen, setAmendOpen] = useState(false);
  const [draftItems, setDraftItems] = useState<PoItem[]>([]);
  const [amendNote, setAmendNote] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  if (loading && !po) {
    return <DetailPageSkeleton />;
  }

  if (!po) {
    return (
      <Box>
        <Typography>Purchase order not found.</Typography>
        <Button onClick={() => navigate('/procurement/purchase-orders')}>Back to list</Button>
      </Box>
    );
  }

  const canAmend = po.status === 'Draft' || po.status === 'Pending Approval';
  const canCancel = ['Draft', 'Pending Approval', 'Approved', 'Sent'].includes(po.status);
  const poGrns = grns.filter((g) => g.poNumber === po.poNumber);

  const confirmCancel = async () => {
    setCancelling(true);
    setCancelError('');
    try {
      await cancelPurchaseOrder(po.id);
      setCancelOpen(false);
    } catch (e) {
      setCancelError(e instanceof ApiError ? e.message : 'Could not cancel the purchase order.');
    } finally {
      setCancelling(false);
    }
  };

  const openAmend = () => {
    setDraftItems(po.items.map((it) => ({ ...it })));
    setAmendNote('');
    setAmendOpen(true);
  };

  const updateDraft = (index: number, field: 'qty' | 'unitPrice' | 'discount' | 'vat', value: number) =>
    setDraftItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));

  const draftTotal = draftItems.reduce((sum, it) => sum + lineTotal(it), 0);

  const saveAmend = () => {
    amendPurchaseOrder(po.id, draftItems, amendNote.trim() || 'Line items amended');
    setAmendOpen(false);
  };

  const activeStep =
    po.status === 'Draft' || po.status === 'Pending Approval'
      ? 0
      : po.status === 'Approved'
        ? 1
        : po.status === 'Sent'
          ? 2
          : po.status === 'Partially Received'
            ? 3
            : po.status === 'Completed'
              ? 4
              : 0;

  const overviewTab = (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Order Information</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="PO Number" value={po.poNumber} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Vendor" value={po.vendorName} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Currency" value={po.currency} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Date" value={po.date} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Expected Delivery" value={po.expectedDelivery} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Warehouse" value={po.warehouse} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Department" value={po.department} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Created By" value={po.createdBy} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Amount" value={`NPR ${po.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} /></Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Status</Typography>
            <StatusChip status={po.status} />
            <Box sx={{ mt: 3 }}>
              <Stepper activeStep={activeStep} orientation="vertical">
                {PO_STEPS.map((label) => (
                  <Step key={label}><StepLabel>{label}</StepLabel></Step>
                ))}
              </Stepper>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const itemsTab = (
    <Card variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Product</TableCell>
            <TableCell>Description</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell align="right">Unit Price</TableCell>
            <TableCell align="right">Discount</TableCell>
            <TableCell align="right">VAT</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {po.items.map((item, i) => (
            <TableRow key={i} hover>
              <TableCell sx={{ fontWeight: 500 }}>{materialName(item.product)}</TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell align="right">{item.qty}</TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell align="right">NPR {item.unitPrice}</TableCell>
              <TableCell align="right">{item.discount}%</TableCell>
              <TableCell align="right">{item.vat}%</TableCell>
              <TableCell align="right">NPR {lineTotal(item).toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  const receiptsTab = (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>Receiving Progress</Typography>
          {po.items.map((item, i) => {
            const received = item.receivedQty ?? 0;
            const pct = Math.min(100, Math.round((received / item.qty) * 100));
            return (
              <Box key={i} sx={{ mb: 2 }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{materialName(item.product)}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>{received} / {item.qty} {item.unit}</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={pct} color={pct === 100 ? 'success' : 'primary'} />
              </Box>
            );
          })}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>Delivery Tracking</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Expected delivery {po.expectedDelivery}
          </Typography>
          <Table size="small" sx={{ mt: 1 }}>
            <TableHead>
              <TableRow>
                <TableCell>GRN</TableCell>
                <TableCell>Received Date</TableCell>
                <TableCell>Delivery</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {poGrns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ color: 'text.secondary' }}>
                    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                      <span>No goods received yet</span>
                      {(po.status === 'Sent' || po.status === 'Partially Received') && (
                        <Button size="small" variant="outlined" onClick={() => navigate(`/procurement/grn/new?fromPo=${po.id}`)}>
                          Receive Goods
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
              {poGrns.map((g) => {
                const delta = daysBetween(po.expectedDelivery, g.receivedDate);
                const onTime = delta <= 0;
                return (
                  <TableRow key={g.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/procurement/grn/${g.id}`)}>
                    <TableCell sx={{ fontWeight: 500 }}>{g.grnNumber}</TableCell>
                    <TableCell>{g.receivedDate}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={onTime ? 'success' : 'error'}
                        label={onTime ? (delta === 0 ? 'On time' : `${Math.abs(delta)}d early`) : `Late ${delta}d`}
                      />
                    </TableCell>
                    <TableCell><StatusChip status={g.status} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );

  const amendmentsTab = (
    <Card variant="outlined">
      <CardContent>
        {po.amendments && po.amendments.length > 0 ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Note</TableCell>
                <TableCell>Changed By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {po.amendments.map((a, i) => (
                <TableRow key={i}>
                  <TableCell>{new Date(a.date).toLocaleString()}</TableCell>
                  <TableCell>{a.note}</TableCell>
                  <TableCell>{a.changedBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No amendments recorded for this purchase order.
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title={po.poNumber}
        subtitle={`${po.vendorName} · ${po.warehouse}`}
        actions={
          <>
            <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/procurement/purchase-orders')}>Back</Button>
            {canAmend && (
              <Button startIcon={<EditRoundedIcon />} onClick={openAmend}>Amend</Button>
            )}
            {po.status === 'Pending Approval' && (
              <Button variant="contained" color="success" onClick={() => approvePurchaseOrder(po.id)}>Approve</Button>
            )}
            {po.status === 'Approved' && (
              <Button variant="contained" onClick={() => sendPurchaseOrder(po.id)}>Send to Vendor</Button>
            )}
            {(po.status === 'Sent' || po.status === 'Partially Received') && (
              <Button variant="contained" onClick={() => navigate(`/procurement/grn/new?fromPo=${po.id}`)}>Receive Goods</Button>
            )}
            {canCancel && (
              <Button color="error" startIcon={<CancelRoundedIcon />} onClick={() => setCancelOpen(true)}>Cancel PO</Button>
            )}
          </>
        }
      />
      {cancelError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCancelError('')}>
          {cancelError}
        </Alert>
      )}
      <PipelineTracker
        current="po"
        requisitionId={linkedRfq?.requisitionId}
        rfqId={linkedRfq?.id}
        poId={po.id}
        grnId={linkedGrn?.id}
        stockId={linkedBatch?.id}
      />
      <DetailTabs
        tabs={[
          { label: 'Overview', content: overviewTab },
          { label: 'Items', content: itemsTab },
          { label: 'Receipts', content: receiptsTab },
          { label: 'Amendments', content: amendmentsTab },
        ]}
      />

      <Dialog open={amendOpen} onClose={() => setAmendOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Amend Purchase Order — {po.poNumber}</DialogTitle>
        <DialogContent dividers>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell width={90} align="right">Qty</TableCell>
                <TableCell width={110} align="right">Unit Price</TableCell>
                <TableCell width={90} align="right">Discount %</TableCell>
                <TableCell width={80} align="right">VAT %</TableCell>
                <TableCell width={110} align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {draftItems.map((item, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ fontWeight: 500 }}>{materialName(item.product)}</TableCell>
                  <TableCell align="right"><TextField variant="standard" type="number" value={item.qty} onChange={(e) => updateDraft(i, 'qty', Number(e.target.value))} sx={{ width: 80 }} /></TableCell>
                  <TableCell align="right"><TextField variant="standard" type="number" value={item.unitPrice} onChange={(e) => updateDraft(i, 'unitPrice', Number(e.target.value))} sx={{ width: 90 }} /></TableCell>
                  <TableCell align="right"><TextField variant="standard" type="number" value={item.discount} onChange={(e) => updateDraft(i, 'discount', Number(e.target.value))} sx={{ width: 70 }} /></TableCell>
                  <TableCell align="right"><TextField variant="standard" type="number" value={item.vat} onChange={(e) => updateDraft(i, 'vat', Number(e.target.value))} sx={{ width: 60 }} /></TableCell>
                  <TableCell align="right">NPR {lineTotal(item).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 1 }}>
            <Typography variant="subtitle2">New Amount: NPR {draftTotal.toFixed(2)}</Typography>
          </Stack>
          <TextField
            fullWidth
            size="small"
            label="Amendment note"
            placeholder="Reason for change"
            value={amendNote}
            onChange={(e) => setAmendNote(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAmendOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveAmend}>Save Amendment</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Cancel Purchase Order</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Cancel {po.poNumber}? This cannot be undone, and the vendor will need a new order if this was sent in error.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)}>Back</Button>
          <Button variant="contained" color="error" loading={cancelling} disabled={cancelling} onClick={confirmCancel}>
            Cancel PO
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
