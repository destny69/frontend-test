import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PageHeader from '../../components/PageHeader';
import StatusChip from '../../components/StatusChip';
import DetailTabs from '../../components/DetailTabs';
import { ExpiryChip } from '../../components/expiryUtils';
import { MovementChip, SignedQty } from '../../components/movementUtils';
import PipelineTracker from '../../../procurement/components/PipelineTracker';
import { useInventory } from '../../store/InventoryStore';
import { useProcurement } from '../../../procurement/store/ProcurementStore';
import { itemById, warehouseById } from '../../data/mockData';
import DetailPageSkeleton from '../../../shared/components/DetailPageSkeleton';

function LabeledValue({ label, value }: { label: string; value?: string | number }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || '—'}</Typography>
    </Box>
  );
}

export default function StockDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, batches, movements, updateBatchBin, recallBatch, disposeBatch, releaseBatch } = useInventory();
  const { purchaseOrders, grns, rfqs } = useProcurement();
  const batch = batches.find((b) => b.id === (id ?? ''));
  const linkedPo = batch ? purchaseOrders.find((p) => p.poNumber === batch.poNumber) : undefined;
  const linkedGrn = batch ? grns.find((g) => g.grnNumber === batch.grnNumber) : undefined;
  const linkedRfq = linkedPo?.rfqId ? rfqs.find((r) => r.id === linkedPo.rfqId) : undefined;
  const [binDraft, setBinDraft] = useState(batch?.bin ?? '');
  const [confirmAction, setConfirmAction] = useState<null | 'recall' | 'dispose' | 'release'>(null);

  if (loading && !batch) {
    return <DetailPageSkeleton />;
  }

  if (!batch) {
    return (
      <Box>
        <Typography>Stock entry not found.</Typography>
        <Button onClick={() => navigate('/inventory/stock')}>Back to list</Button>
      </Box>
    );
  }

  const item = itemById(batch.itemId);
  const warehouse = warehouseById(batch.warehouseId);
  const passed = batch.inspectionResult.toLowerCase().startsWith('pass');
  const pendingQty = batch.receivedQty - batch.availableQty - batch.reservedQty;
  // Recall / dispose act on live stock; a batch already recalled or expired is terminal.
  const canModify = batch.qcStatus !== 'Recalled' && batch.qcStatus !== 'Expired';
  const canRelease = canModify && batch.qcStatus !== 'Released' && batch.qcStatus !== 'Available' && pendingQty > 0;
  // The available/low/out chip only means something once stock is actually usable —
  // while under inspection (or written off) it would just duplicate/contradict the QC chip.
  const level =
    batch.qcStatus === 'Released' || batch.qcStatus === 'Available'
      ? batch.availableQty === 0
        ? 'Out of Stock'
        : batch.availableQty <= (item?.reorderLevel ?? 0)
          ? 'Low Stock'
          : 'In Stock'
      : null;

  // Always-visible "what's next" banner, same pattern as RFQ/PO detail pages.
  const nextStepBanner = canRelease ? (
    <Alert
      severity="info"
      action={
        <Button color="inherit" size="small" variant="outlined" onClick={() => setConfirmAction('release')}>
          Release to Stock
        </Button>
      }
    >
      {pendingQty.toLocaleString()} unit(s) received but not usable yet — pending QC release. Check the Inspection
      tab, then release when ready.
    </Alert>
  ) : batch.qcStatus === 'Recalled' ? (
    <Alert severity="warning">
      This batch has been recalled — its stock was pulled from circulation and it can no longer be used.
    </Alert>
  ) : batch.qcStatus === 'Expired' ? (
    <Alert severity="error">
      This batch is expired / disposed — its stock was written off and it can no longer be used.
    </Alert>
  ) : (
    <Alert severity="success">
      Released — {batch.availableQty.toLocaleString()} unit(s) available for reservation, issue, or transfer.
    </Alert>
  );

  // Real movement history for this batch at this warehouse, newest first.
  const batchMovements = movements
    .filter((m) => m.batchNumber === batch.batchNumber && m.warehouseId === batch.warehouseId)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id.localeCompare(a.id)));

  const overviewTab = (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>General</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Product" value={item?.name} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Warehouse" value={warehouse?.name} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Batch" value={batch.batchNumber} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Supplier" value={batch.supplierName} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Purchase Order" value={batch.poNumber} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="GRN" value={batch.grnNumber} /></Grid>
            </Grid>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Manufacturing</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 6, sm: 3 }}><LabeledValue label="Manufacturing Date" value={batch.manufacturingDate} /></Grid>
              <Grid size={{ xs: 6, sm: 3 }}><LabeledValue label="Expiry Date" value={batch.expiryDate} /></Grid>
              <Grid size={{ xs: 6, sm: 3 }}><LabeledValue label="Shelf Life" value={`${batch.shelfLifeMonths} months`} /></Grid>
              <Grid size={{ xs: 6, sm: 3 }}><LabeledValue label="Country of Origin" value={batch.countryOfOrigin} /></Grid>
            </Grid>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Bin & Rack Location</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5, alignItems: { sm: 'center' }, mt: 1 }}>
              <TextField
                label="Bin Location"
                size="small"
                value={binDraft}
                onChange={(e) => setBinDraft(e.target.value)}
                placeholder="e.g. WH01-A2-R1-S3"
                sx={{ minWidth: 260 }}
              />
              <Button
                variant="contained"
                disabled={binDraft.trim() === '' || binDraft === batch.bin}
                onClick={() => updateBatchBin(batch.id, binDraft.trim())}
              >
                Save Location
              </Button>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Format: Warehouse-Aisle-Rack-Shelf.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Inventory</Typography>
            <Stack direction="row" sx={{ gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {level && <StatusChip status={level} />}
              <StatusChip status={batch.qcStatus} />
              <ExpiryChip dateStr={batch.expiryDate} />
            </Stack>
            <Stack sx={{ gap: 1.5 }}>
              <LabeledValue label="Received Qty" value={batch.receivedQty.toLocaleString()} />
              <LabeledValue label="Available Qty" value={batch.availableQty.toLocaleString()} />
              <LabeledValue label="Reserved Qty" value={batch.reservedQty.toLocaleString()} />
              <LabeledValue label="Pending Inspection" value={pendingQty.toLocaleString()} />
              <LabeledValue label="Damaged Qty" value={batch.damagedQty.toLocaleString()} />
              <LabeledValue label="Total Value" value={item ? `NPR ${(item.averageCost * batch.availableQty).toLocaleString()}` : '—'} />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const movementTab = (
    <Card variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell>Reference</TableCell>
            <TableCell>By</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {batchMovements.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} sx={{ color: 'text.secondary' }}>No movements recorded for this batch.</TableCell>
            </TableRow>
          )}
          {batchMovements.map((m) => (
            <TableRow key={m.id} hover>
              <TableCell>{m.date}</TableCell>
              <TableCell><MovementChip type={m.type} /></TableCell>
              <TableCell align="right"><SignedQty qty={m.qty} /></TableCell>
              <TableCell>{m.reference}</TableCell>
              <TableCell>{m.by || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  const inspectionTab = (
    <Card variant="outlined">
      <CardContent>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}><LabeledValue label="QC Status" value={batch.qcStatus} /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><LabeledValue label="Approved By" value={batch.approvedBy} /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><LabeledValue label="Released Date" value={batch.releasedDate} /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><LabeledValue label="Certificates" value="COA on file" /></Grid>
        </Grid>
        <List sx={{ mt: 2 }}>
          <ListItem divider>
            <ListItemIcon>
              {passed ? <CheckCircleRoundedIcon color="success" /> : <CancelRoundedIcon color="error" />}
            </ListItemIcon>
            <ListItemText primary="Inspection Result" secondary={batch.inspectionResult} />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );

  const purchaseHistoryTab = (
    <Card variant="outlined">
      <CardContent>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}><LabeledValue label="Purchase Order" value={batch.poNumber} /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><LabeledValue label="GRN" value={batch.grnNumber} /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><LabeledValue label="Supplier" value={batch.supplierName} /></Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title={`${item?.name} · ${batch.batchNumber}`}
        subtitle={`${warehouse?.name} · ${batch.bin}`}
        actions={
          <>
            <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/inventory/stock')}>Back</Button>
            <Button variant="outlined" onClick={() => navigate(`/inventory/ledger?batch=${batch.batchNumber}`)}>
              View in Stock Ledger
            </Button>
            {canRelease && (
              <Button variant="contained" color="success" onClick={() => setConfirmAction('release')}>
                Release to Stock
              </Button>
            )}
            {canModify && (
              <>
                <Button variant="outlined" color="warning" onClick={() => setConfirmAction('recall')}>Recall</Button>
                <Button variant="outlined" color="error" onClick={() => setConfirmAction('dispose')}>Dispose</Button>
              </>
            )}
          </>
        }
      />
      <PipelineTracker
        current="stock"
        requisitionId={linkedRfq?.requisitionId}
        rfqId={linkedRfq?.id}
        poId={linkedPo?.id}
        grnId={linkedGrn?.id}
        stockId={batch.id}
      />
      <Box sx={{ mb: 2 }}>{nextStepBanner}</Box>
      <DetailTabs
        tabs={[
          { label: 'Overview', content: overviewTab },
          { label: 'Movement', content: movementTab },
          { label: 'Inspection', content: inspectionTab },
          { label: 'Purchase History', content: purchaseHistoryTab },
        ]}
      />

      <Dialog open={confirmAction !== null} onClose={() => setConfirmAction(null)} fullWidth maxWidth="xs">
        <DialogTitle>
          {confirmAction === 'release' ? 'Release Batch to Stock' : confirmAction === 'recall' ? 'Recall Batch' : 'Dispose Batch'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {confirmAction === 'release'
              ? `Release batch ${batch.batchNumber}? ${pendingQty.toLocaleString()} unit(s) pending inspection become available stock, and the batch is marked Released.`
              : confirmAction === 'recall'
                ? `Recall batch ${batch.batchNumber}? Its available and reserved stock is pulled from circulation into damaged and the batch is flagged Recalled.`
                : `Dispose batch ${batch.batchNumber}? Its available and reserved stock is written off into damaged and the batch is marked Expired.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAction(null)}>Cancel</Button>
          <Button
            variant="contained"
            color={confirmAction === 'release' ? 'success' : confirmAction === 'recall' ? 'warning' : 'error'}
            onClick={() => {
              if (confirmAction === 'release') releaseBatch(batch.id, 'Grace Liu');
              else if (confirmAction === 'recall') recallBatch(batch.id);
              else if (confirmAction === 'dispose') disposeBatch(batch.id);
              setConfirmAction(null);
            }}
          >
            {confirmAction === 'release' ? 'Release' : confirmAction === 'recall' ? 'Recall' : 'Dispose'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
