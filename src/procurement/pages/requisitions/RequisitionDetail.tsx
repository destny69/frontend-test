import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
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
import Alert from '@mui/material/Alert';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PageHeader from '../../components/PageHeader';
import StatusChip from '../../components/StatusChip';
import DetailTabs from '../../components/DetailTabs';
import FormField from '../../components/FormField';
import { useProcurement } from '../../store/ProcurementStore';
import { useInventory } from '../../../inventory/store/InventoryStore';
import DetailPageSkeleton from '../../../shared/components/DetailPageSkeleton';

const CURRENT_APPROVER = 'Grace Liu';

function LabeledValue({ label, value }: { label: string; value?: string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

const APPROVAL_STEPS = ['Submitted', 'Manager Review', 'Purchasing Notified', 'Approved'];

export default function RequisitionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requisitions, submitRequisition, approveRequisition, rejectRequisition, completeRequisition, loading } = useProcurement();
  const { items: catalogItems } = useInventory();
  const req = requisitions.find((r) => r.id === id);
  const materialName = (code: string) => catalogItems.find((ci) => ci.id === code)?.name ?? code;
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (loading && !req) {
    return <DetailPageSkeleton />;
  }

  if (!req) {
    return (
      <Box>
        <Typography>Requisition not found.</Typography>
        <Button onClick={() => navigate('/procurement/requisitions')}>Back to list</Button>
      </Box>
    );
  }

  const awaitingApproval = req.status === 'Submitted' || req.status === 'Pending Approval';

  const activeStep =
    req.status === 'Draft'
      ? 0
      : req.status === 'Submitted'
        ? 1
        : req.status === 'Pending Approval'
          ? 2
          : ['Approved', 'Completed'].includes(req.status)
            ? 4
            : 1;

  const overview = (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>General Information</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Requisition Number" value={req.requestNo} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Department" value={req.department} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Requester" value={req.requestedBy} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Request Date" value={req.requestDate} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Required Date" value={req.requiredDate} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Priority" value={req.priority} /></Grid>
              <Grid size={{ xs: 12 }}><LabeledValue label="Purpose" value={req.purpose} /></Grid>
              <Grid size={{ xs: 12 }}><LabeledValue label="Notes" value={req.notes} /></Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Status</Typography>
            <StatusChip status={req.status} />
            {awaitingApproval && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Awaiting approval from {CURRENT_APPROVER} (Procurement Manager)
              </Alert>
            )}
            <Stack sx={{ mt: 3, gap: 1.5 }}>
              <LabeledValue label="Approver" value={req.approvedBy} />
              <LabeledValue label="Items" value={`${req.items.length}`} />
            </Stack>
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
            <TableCell>Item</TableCell>
            <TableCell>Description</TableCell>
            <TableCell align="right">Required Qty</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell align="right">Current Stock</TableCell>
            <TableCell>Required Date</TableCell>
            <TableCell>Remarks</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {req.items.map((item, i) => (
            <TableRow key={i} hover>
              <TableCell sx={{ fontWeight: 500 }}>{materialName(item.item)}</TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell align="right">{item.requiredQty}</TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell align="right">{item.currentStock}</TableCell>
              <TableCell>{item.requiredDate}</TableCell>
              <TableCell>{item.remarks ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  const approvalTab = (
    <Card variant="outlined">
      <CardContent>
        <Stepper activeStep={activeStep} alternativeLabel>
          {APPROVAL_STEPS.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
        <Stack sx={{ mt: 4, gap: 1 }}>
          <Typography variant="body2">
            <strong>{req.requestedBy}</strong> submitted this requisition on {req.requestDate}.
          </Typography>
          {awaitingApproval && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Waiting on <strong>{CURRENT_APPROVER}</strong> to approve or reject. Use the buttons at the
              top of this page to act on it.
            </Typography>
          )}
          {req.approvedBy && (
            <Typography variant="body2">
              <strong>{req.approvedBy}</strong> {req.status === 'Rejected' ? 'rejected' : 'reviewed'} this requisition.
              {req.notes ? ` "${req.notes}"` : ''}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title={req.requestNo}
        subtitle={req.purpose}
        actions={
          <>
            <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/procurement/requisitions')}>
              Back
            </Button>
            {req.status === 'Draft' && (
              <Button variant="contained" onClick={() => submitRequisition(req.id)}>
                Submit for Approval
              </Button>
            )}
            {awaitingApproval && (
              <>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CloseRoundedIcon />}
                  onClick={() => setRejectOpen(true)}
                >
                  Reject
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckRoundedIcon />}
                  onClick={() => approveRequisition(req.id, CURRENT_APPROVER)}
                >
                  Approve
                </Button>
              </>
            )}
            {req.status === 'Approved' && (
              <>
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<CheckRoundedIcon />}
                  onClick={() => completeRequisition(req.id)}
                >
                  Mark Completed
                </Button>
                <Button variant="contained" onClick={() => navigate(`/procurement/rfqs/new?fromReq=${req.id}`)}>
                  Create RFQ
                </Button>
              </>
            )}
          </>
        }
      />
      <DetailTabs
        tabs={[
          { label: 'Overview', content: overview },
          { label: 'Items', content: itemsTab },
          { label: 'Approval History', content: approvalTab },
        ]}
      />

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Reject requisition {req.requestNo}</DialogTitle>
        <DialogContent>
          <FormField
            fullWidth
            required
            label="Reason for rejection"
            multiline
            minRows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Duplicate of an existing request"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={!rejectReason.trim()}
            onClick={() => {
              rejectRequisition(req.id, CURRENT_APPROVER, rejectReason);
              setRejectOpen(false);
              setRejectReason('');
            }}
          >
            Reject Requisition
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
