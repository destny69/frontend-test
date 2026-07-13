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
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PageHeader from '../../components/PageHeader';
import StatusChip from '../../components/StatusChip';
import DetailTabs from '../../components/DetailTabs';
import PipelineTracker from '../../components/PipelineTracker';
import { useProcurement } from '../../store/ProcurementStore';
import { useInventory } from '../../../inventory/store/InventoryStore';
import { ApiError } from '../../../shared/api/client';
import DetailPageSkeleton from '../../../shared/components/DetailPageSkeleton';

function LabeledValue({ label, value }: { label: string; value?: string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || '—'}</Typography>
    </Box>
  );
}

function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
}

export default function GRNDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { grns, purchaseOrders, rfqs, acceptGrn, loading } = useProcurement();
  const { items: catalogItems, batches, refreshBatches } = useInventory();
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');
  const materialName = (code: string) => catalogItems.find((ci) => ci.id === code)?.name ?? code;
  const grn = grns.find((g) => g.id === id);
  const linkedPo = grn ? purchaseOrders.find((p) => p.poNumber === grn.poNumber) : undefined;
  const linkedRfq = linkedPo?.rfqId ? rfqs.find((r) => r.id === linkedPo.rfqId) : undefined;
  const linkedBatch = grn ? batches.find((b) => b.grnNumber === grn.grnNumber) : undefined;

  if (loading && !grn) {
    return <DetailPageSkeleton />;
  }

  if (!grn) {
    return (
      <Box>
        <Typography>GRN not found.</Typography>
        <Button onClick={() => navigate('/procurement/grn')}>Back to list</Button>
      </Box>
    );
  }

  // Delivery tracking: compare receivedDate to the matching PO's expectedDelivery.
  const matchedPo = purchaseOrders.find((p) => p.poNumber === grn.poNumber);
  const deliveryDelta = matchedPo
    ? daysBetween(matchedPo.expectedDelivery, grn.receivedDate)
    : null;
  const onTime = deliveryDelta !== null && deliveryDelta <= 0;

  // Cross-module bridge: goods received here don't become usable stock until someone
  // releases the batch in Inventory — surface that as the always-visible next step.
  const pendingBatches = batches.filter((b) => b.grnNumber === grn.grnNumber && b.qcStatus === 'Under Inspection');
  const nextStepBanner =
    grn.status === 'Completed' && pendingBatches.length > 0 ? (
      <Alert
        severity="info"
        action={
          <Button
            color="inherit"
            size="small"
            variant="outlined"
            onClick={() =>
              navigate(
                pendingBatches.length === 1
                  ? `/inventory/stock/${pendingBatches[0].id}`
                  : '/inventory/stock?level=Under Inspection',
              )
            }
          >
            {pendingBatches.length === 1 ? 'Release Batch' : 'View Pending Batches'}
          </Button>
        }
      >
        Goods received — {pendingBatches.length} batch{pendingBatches.length === 1 ? '' : 'es'} pending QC release
        in Inventory before they're usable stock.
      </Alert>
    ) : null;

  // Complete a draft/pending GRN - the backend rolls accepted qty onto the PO and
  // creates under-inspection batches server-side, in one transaction.
  const handleComplete = async () => {
    setCompleting(true);
    setError('');
    try {
      await acceptGrn(grn.id);
      await refreshBatches();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not complete the GRN.');
    } finally {
      setCompleting(false);
    }
  };

  const overviewTab = (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>General Information</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="GRN Number" value={grn.grnNumber} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Purchase Order" value={grn.poNumber} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Vendor" value={grn.vendorName} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Warehouse" value={grn.warehouse} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Received Date" value={grn.receivedDate} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Received By" value={grn.receivedBy} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Delivery Note" value={grn.deliveryNote} /></Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Status</Typography>
            <StatusChip status={grn.status} />
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Delivery Tracking</Typography>
              {matchedPo ? (
                <Stack spacing={1}>
                  <LabeledValue label="Expected Delivery" value={matchedPo.expectedDelivery} />
                  <LabeledValue label="Actual Receipt" value={grn.receivedDate} />
                  <Chip
                    size="small"
                    color={onTime ? 'success' : 'error'}
                    label={
                      onTime
                        ? deliveryDelta === 0
                          ? 'On time'
                          : `On time (${Math.abs(deliveryDelta!)}d early)`
                        : `Late by ${deliveryDelta}d`
                    }
                    sx={{ alignSelf: 'flex-start' }}
                  />
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No matching purchase order on file
                </Typography>
              )}
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
            <TableCell align="right">Ordered Qty</TableCell>
            <TableCell align="right">Received Qty</TableCell>
            <TableCell align="right">Accepted Qty</TableCell>
            <TableCell align="right">Rejected Qty</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {grn.items.map((item, i) => (
            <TableRow key={i} hover>
              <TableCell sx={{ fontWeight: 500 }}>{materialName(item.product)}</TableCell>
              <TableCell align="right">{item.orderedQty}</TableCell>
              <TableCell align="right">{item.receivedQty}</TableCell>
              <TableCell align="right">{item.acceptedQty}</TableCell>
              <TableCell align="right" sx={{ color: item.rejectedQty > 0 ? 'error.main' : undefined }}>{item.rejectedQty}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  const inspectionTab = (
    <Card variant="outlined">
      <CardContent>
        {grn.inspection && grn.inspection.length > 0 ? (
          <Stack spacing={1.5}>
            {grn.inspection.map((check) => (
              <Stack
                key={check.check}
                direction="row"
                sx={{ alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Typography variant="body2">{check.check}</Typography>
                <Chip
                  size="small"
                  color={check.result === 'pass' ? 'success' : 'error'}
                  icon={check.result === 'pass' ? <CheckCircleRoundedIcon /> : <CancelRoundedIcon />}
                  label={check.result === 'pass' ? 'Pass' : 'Fail'}
                />
              </Stack>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No inspection results recorded for this receipt.
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const batchTab = (
    <Card variant="outlined">
      <CardContent>
        <Grid container spacing={2}>
          {grn.items.map((item, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>{materialName(item.product)}</Typography>
                  <Stack spacing={1}>
                    <LabeledValue label="Batch Number" value={item.batchNumber} />
                    <LabeledValue label="Expiry Date" value={item.expiryDate} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title={grn.grnNumber}
        subtitle={`${grn.vendorName} · ${grn.poNumber}`}
        actions={
          <>
            <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/procurement/grn')}>Back</Button>
            {grn.status !== 'Completed' && (
              <Button
                variant="contained"
                startIcon={<CheckCircleRoundedIcon />}
                disabled={completing}
                loading={completing}
                onClick={handleComplete}
              >
                Complete Receipt
              </Button>
            )}
          </>
        }
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      <PipelineTracker
        current="grn"
        requisitionId={linkedRfq?.requisitionId}
        rfqId={linkedRfq?.id}
        poId={linkedPo?.id}
        grnId={grn.id}
        stockId={linkedBatch?.id}
      />
      {nextStepBanner && <Box sx={{ mb: 2 }}>{nextStepBanner}</Box>}
      <DetailTabs
        tabs={[
          { label: 'Overview', content: overviewTab },
          { label: 'Items', content: itemsTab },
          { label: 'Inspection', content: inspectionTab },
          { label: 'Batch Details', content: batchTab },
        ]}
      />
    </Box>
  );
}
