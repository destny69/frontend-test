import { useState } from 'react';
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
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PageHeader from '../../components/PageHeader';
import StatusChip from '../../components/StatusChip';
import DetailTabs from '../../components/DetailTabs';
import { useInventory } from '../../store/InventoryStore';
import { itemById, warehouseById } from '../../data/mockData';
import DetailPageSkeleton from '../../../shared/components/DetailPageSkeleton';

function LabeledValue({ label, value }: { label: string; value?: string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || '—'}</Typography>
    </Box>
  );
}

const STEPS = ['Draft', 'Pending Approval', 'Approved', 'In Transit', 'Completed'];

export default function TransferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, transfers, approveTransfer, completeTransfer, cancelTransfer } = useInventory();
  const transfer = transfers.find((t) => t.id === id);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (loading && !transfer) {
    return <DetailPageSkeleton />;
  }

  if (!transfer) {
    return (
      <Box>
        <Typography>Transfer not found.</Typography>
        <Button onClick={() => navigate('/inventory/transfers')}>Back to list</Button>
      </Box>
    );
  }

  const activeStep = STEPS.indexOf(transfer.status) === -1 ? 0 : STEPS.indexOf(transfer.status);
  const canAct = transfer.status === 'Pending Approval' || transfer.status === 'Approved';

  const overviewTab = (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>General</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Transfer Number" value={transfer.transferNumber} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Source Warehouse" value={warehouseById(transfer.fromWarehouseId)?.name} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Destination Warehouse" value={warehouseById(transfer.toWarehouseId)?.name} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Requested By" value={transfer.requestedBy} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Approver" value={transfer.approver} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Transfer Date" value={transfer.transferDate} /></Grid>
              <Grid size={{ xs: 12 }}><LabeledValue label="Reason" value={transfer.reason} /></Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Status</Typography>
            <StatusChip status={transfer.status} />
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
            <TableCell>Product / Item ID</TableCell>
            <TableCell>Batch</TableCell>
            <TableCell>Current Location</TableCell>
            <TableCell align="right">Quantity</TableCell>
            <TableCell>Destination Bin</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transfer.items.map((it, i) => (
            <TableRow key={i} hover>
              <TableCell sx={{ fontWeight: 500 }}>{itemById(it.itemId)?.name ?? it.itemId}</TableCell>
              <TableCell>{it.batchNumber}</TableCell>
              <TableCell>{it.currentBin}</TableCell>
              <TableCell align="right">{it.quantity.toLocaleString()}</TableCell>
              <TableCell>{it.destinationBin}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  const trackingTab = (
    <Card variant="outlined">
      <CardContent>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
        <Typography variant="body2" sx={{ mt: 3, color: 'text.secondary' }}>
          {transfer.status === 'Cancelled'
            ? 'This transfer was cancelled.'
            : `Currently: ${transfer.status}. Requested by ${transfer.requestedBy} on ${transfer.transferDate}.`}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title={transfer.transferNumber}
        subtitle={transfer.reason}
        actions={
          <>
            <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/inventory/transfers')}>Back</Button>
            {canAct && (
              <>
                <Button variant="outlined" color="error" onClick={() => setConfirmCancel(true)}>Cancel Transfer</Button>
                <Button variant="contained" onClick={() => approveTransfer(transfer.id)}>
                  {transfer.status === 'Pending Approval' ? 'Approve' : 'Mark In Transit'}
                </Button>
              </>
            )}
            {transfer.status === 'In Transit' && (
              <Button variant="contained" onClick={() => completeTransfer(transfer.id)}>
                Mark as Completed
              </Button>
            )}
          </>
        }
      />
      <DetailTabs
        tabs={[
          { label: 'Overview', content: overviewTab },
          { label: 'Items', content: itemsTab },
          { label: 'Tracking', content: trackingTab },
        ]}
      />

      <Dialog open={confirmCancel} onClose={() => setConfirmCancel(false)} fullWidth maxWidth="xs">
        <DialogTitle>Cancel Transfer</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Cancel transfer {transfer.transferNumber}? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCancel(false)}>Back</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              cancelTransfer(transfer.id);
              setConfirmCancel(false);
            }}
          >
            Cancel Transfer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
