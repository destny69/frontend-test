import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PageHeader from '../../components/PageHeader';
import StatusChip from '../../components/StatusChip';
import DetailTabs from '../../components/DetailTabs';
import { useInventory } from '../../store/InventoryStore';
import { itemById, warehouseById } from '../../data/mockData';
import DetailPageSkeleton from '../../../shared/components/DetailPageSkeleton';

const CURRENT_APPROVER = 'David Kim';

function LabeledValue({ label, value }: { label: string; value?: string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || '—'}</Typography>
    </Box>
  );
}

export default function AdjustmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, adjustments, approveAdjustment, rejectAdjustment } = useInventory();
  const adjustment = adjustments.find((a) => a.id === id);

  if (loading && !adjustment) {
    return <DetailPageSkeleton />;
  }

  if (!adjustment) {
    return (
      <Box>
        <Typography>Adjustment not found.</Typography>
        <Button onClick={() => navigate('/inventory/adjustments')}>Back to list</Button>
      </Box>
    );
  }

  const overviewTab = (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>General</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Adjustment No." value={adjustment.adjustmentNo} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Warehouse" value={warehouseById(adjustment.warehouseId)?.name} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Type" value={adjustment.type} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Reason" value={adjustment.reason} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Reference" value={adjustment.reference} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Date" value={adjustment.date} /></Grid>
              <Grid size={{ xs: 12 }}><LabeledValue label="Notes" value={adjustment.notes} /></Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Status</Typography>
            <StatusChip status={adjustment.status} />
            <Box sx={{ mt: 2 }}>
              <LabeledValue label="Created By" value={adjustment.createdBy} />
            </Box>
            <Box sx={{ mt: 1.5 }}>
              <LabeledValue label="Approver" value={adjustment.approver} />
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
            <TableCell>Batch</TableCell>
            <TableCell align="right">Current Qty</TableCell>
            <TableCell align="right">Actual Qty</TableCell>
            <TableCell align="right">Difference</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {adjustment.items.map((it, i) => {
            const diff = it.actualQty - it.currentQty;
            return (
              <TableRow key={i} hover>
                <TableCell sx={{ fontWeight: 500 }}>{itemById(it.itemId)?.name ?? it.itemId}</TableCell>
                <TableCell>{it.batchNumber}</TableCell>
                <TableCell align="right">{it.currentQty.toLocaleString()}</TableCell>
                <TableCell align="right">{it.actualQty.toLocaleString()}</TableCell>
                <TableCell align="right" sx={{ color: diff < 0 ? 'error.main' : diff > 0 ? 'success.main' : 'text.secondary', fontWeight: 600 }}>
                  {diff > 0 ? `+${diff}` : diff}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title={adjustment.adjustmentNo}
        subtitle={adjustment.reason}
        actions={
          <>
            <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/inventory/adjustments')}>Back</Button>
            {adjustment.status === 'Pending Approval' && (
              <>
                <Button variant="outlined" color="error" startIcon={<CloseRoundedIcon />} onClick={() => rejectAdjustment(adjustment.id)}>
                  Reject
                </Button>
                <Button variant="contained" color="success" startIcon={<CheckRoundedIcon />} onClick={() => approveAdjustment(adjustment.id, CURRENT_APPROVER)}>
                  Approve
                </Button>
              </>
            )}
          </>
        }
      />
      <DetailTabs
        tabs={[
          { label: 'Overview', content: overviewTab },
          { label: 'Items', content: itemsTab },
        ]}
      />
    </Box>
  );
}
