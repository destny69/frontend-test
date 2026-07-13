import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Rating from '@mui/material/Rating';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import StatusChip from '../../components/StatusChip';
import DetailTabs from '../../components/DetailTabs';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import FormSelectField from '../../components/FormSelectField';
import { useProcurement } from '../../store/ProcurementStore';
import { vendorPerformance } from '../../data/vendorPerformance';
import DetailPageSkeleton from '../../../shared/components/DetailPageSkeleton';
import type { Vendor, VendorDoc } from '../../data/types';

function LabeledValue({ label, value }: { label: string; value?: string | number }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value ?? '—'}</Typography>
    </Box>
  );
}

const docStatuses: VendorDoc['status'][] = ['Valid', 'Expiring', 'Expired', 'Missing'];

// Add / remove supplier documents in memory.
function DocumentsPanel({ vendor }: { vendor: Vendor }) {
  const { addVendorDoc, removeVendorDoc } = useProcurement();
  const [name, setName] = useState('');
  const [status, setStatus] = useState<VendorDoc['status']>('Valid');
  const [expiry, setExpiry] = useState('');

  const add = () => {
    if (!name.trim()) return;
    addVendorDoc(vendor.id, { name: name.trim(), status, expiry: expiry || undefined });
    setName('');
    setStatus('Valid');
    setExpiry('');
  };

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <List>
          {vendor.documents.length === 0 && (
            <ListItem><ListItemText primary="No documents on file" /></ListItem>
          )}
          {vendor.documents.map((doc, i) => (
            <ListItem
              key={doc.id ?? `${doc.name}-${i}`}
              divider
              secondaryAction={
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                  <StatusChip status={doc.status} />
                  <IconButton
                    edge="end"
                    size="small"
                    disabled={!doc.id}
                    onClick={() => doc.id && removeVendorDoc(vendor.id, doc.id)}
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              }
            >
              <ListItemIcon><DescriptionRoundedIcon /></ListItemIcon>
              <ListItemText primary={doc.name} secondary={doc.expiry ? `Expires ${doc.expiry}` : undefined} />
            </ListItem>
          ))}
        </List>
      </Card>

      <Card variant="outlined">
        <CardHeader title="Add Document" slotProps={{ title: { variant: 'subtitle2' } }} />
        <CardContent sx={{ pt: 0 }}>
          <Grid container spacing={2} sx={{ alignItems: 'flex-end' }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormField fullWidth size="small" required label="Document Name" placeholder="e.g. GMP Certificate" value={name} onChange={(e) => setName(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormSelectField fullWidth size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value as VendorDoc['status'])}>
                {docStatuses.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </FormSelectField>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormField fullWidth size="small" type="date" label="Expiry" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <Button fullWidth variant="contained" startIcon={<AddRoundedIcon />} disabled={!name.trim()} onClick={add}>
                Add
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default function VendorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vendors, purchaseOrders, rfqs, grns, setVendorStatus, loading } = useProcurement();
  const vendor = vendors.find((v) => v.id === id);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [confirmBlacklist, setConfirmBlacklist] = useState(false);

  if (loading && !vendor) {
    return <DetailPageSkeleton />;
  }

  if (!vendor) {
    return (
      <Box>
        <Typography>Vendor not found.</Typography>
        <Button onClick={() => navigate('/procurement/vendors')}>Back to list</Button>
      </Box>
    );
  }

  const changeStatus = async (status: Vendor['status']) => {
    setUpdatingStatus(true);
    setStatusError('');
    try {
      await setVendorStatus(vendor.id, status);
    } catch {
      setStatusError('Could not update the vendor status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const vendorPOs = purchaseOrders.filter((p) => p.vendorId === vendor.id);
  const vendorRFQs = rfqs.filter((r) => r.invitedVendors.includes(vendor.id));
  const perf = vendorPerformance(vendor.id, purchaseOrders, grns);

  const overviewTab = (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card variant="outlined">
          <CardHeader title="Company Information" slotProps={{ title: { variant: 'subtitle2' } }} />
          <CardContent sx={{ pt: 0 }}>
            <Stack spacing={1.5}>
              <LabeledValue label="Vendor Code" value={vendor.vendorCode} />
              <LabeledValue label="Company Name" value={vendor.name} />
              <LabeledValue label="Registration Number" value={vendor.registrationNumber} />
              <LabeledValue label="VAT Number" value={vendor.vatNumber} />
              <LabeledValue label="Business Type" value={vendor.businessType} />
              <LabeledValue label="Established Date" value={vendor.establishedDate} />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card variant="outlined">
          <CardHeader title="Contact" slotProps={{ title: { variant: 'subtitle2' } }} />
          <CardContent sx={{ pt: 0 }}>
            <Stack spacing={1.5}>
              <LabeledValue label="Primary Contact" value={vendor.primaryContact} />
              <LabeledValue label="Phone" value={vendor.phone} />
              <LabeledValue label="Email" value={vendor.email} />
              <LabeledValue label="Website" value={vendor.website} />
              <LabeledValue label="Address" value={vendor.address} />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card variant="outlined">
          <CardHeader title="Financial" slotProps={{ title: { variant: 'subtitle2' } }} />
          <CardContent sx={{ pt: 0 }}>
            <Stack spacing={1.5}>
              <LabeledValue label="Payment Terms" value={vendor.paymentTerms} />
              <LabeledValue label="Currency" value={vendor.currency} />
              <LabeledValue label="Bank Account" value={vendor.bankAccount} />
              <LabeledValue label="Credit Limit" value={`NPR ${vendor.creditLimit.toLocaleString()}`} />
              <LabeledValue label="Outstanding Balance" value={`NPR ${vendor.outstandingBalance.toLocaleString()}`} />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const performanceTab = (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardHeader title="Overall Rating" slotProps={{ title: { variant: 'subtitle2' } }} />
          <CardContent sx={{ pt: 0 }}>
            {perf.rating !== null ? (
              <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
                <Typography variant="h3" component="p">{perf.rating.toFixed(1)}</Typography>
                <Rating value={perf.rating} precision={0.1} max={5} readOnly />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Derived from {perf.matchedGrns} matched receipt{perf.matchedGrns === 1 ? '' : 's'}
                </Typography>
              </Stack>
            ) : (
              <Stack spacing={1}>
                <Typography variant="h6">{perf.ratingLabel}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {perf.ratingLabel === 'Not yet rated'
                    ? 'No purchase orders on record for this vendor.'
                    : 'Orders exist but no goods have been received yet.'}
                </Typography>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardHeader title="Performance Metrics" slotProps={{ title: { variant: 'subtitle2' } }} />
          <CardContent sx={{ pt: 0 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Total Orders" value={perf.totalOrders} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Total Purchase" value={`NPR ${perf.totalPurchase.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Matched Receipts" value={perf.matchedGrns} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="On-Time Delivery" value={perf.onTimePct === null ? '—' : `${perf.onTimePct}%`} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Avg Lead Time" value={perf.avgLeadDays === null ? '—' : `${perf.avgLeadDays} days`} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Rejected Qty" value={perf.rejectedPct === null ? '—' : `${perf.rejectedPct}%`} /></Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const poTab = (
    <Card variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>PO Number</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Expected Delivery</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vendorPOs.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>
                <Stack sx={{ alignItems: 'center', py: 2, gap: 1.5 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>No purchase orders yet</Typography>
                  <Button variant="outlined" size="small" onClick={() => navigate(`/procurement/purchase-orders/new?vendor=${vendor.id}`)}>
                    Create Purchase Order
                  </Button>
                </Stack>
              </TableCell>
            </TableRow>
          )}
          {vendorPOs.map((po) => (
            <TableRow key={po.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/procurement/purchase-orders/${po.id}`)}>
              <TableCell sx={{ fontWeight: 500 }}>{po.poNumber}</TableCell>
              <TableCell>{po.date}</TableCell>
              <TableCell>{po.expectedDelivery}</TableCell>
              <TableCell align="right">NPR {po.amount.toLocaleString()}</TableCell>
              <TableCell><StatusChip status={po.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  const rfqTab = (
    <Card variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>RFQ Number</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Closing Date</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vendorRFQs.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>
                <Stack sx={{ alignItems: 'center', py: 2, gap: 1.5 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Not invited to any RFQs</Typography>
                  <Button variant="outlined" size="small" onClick={() => navigate(`/procurement/rfqs/new?vendor=${vendor.id}`)}>
                    Create RFQ
                  </Button>
                </Stack>
              </TableCell>
            </TableRow>
          )}
          {vendorRFQs.map((r) => (
            <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/procurement/rfqs/${r.id}`)}>
              <TableCell sx={{ fontWeight: 500 }}>{r.rfqNo}</TableCell>
              <TableCell>{r.title}</TableCell>
              <TableCell>{r.closingDate}</TableCell>
              <TableCell><StatusChip status={r.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  const documentsTab = <DocumentsPanel vendor={vendor} />;

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title={vendor.name}
        subtitle={`${vendor.vendorCode} · ${vendor.category} · ${vendor.country}`}
        actions={
          <>
            <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/procurement/vendors')}>
              Back
            </Button>
            {vendor.status === 'Pending Approval' && (
              <Button variant="contained" color="success" disabled={updatingStatus} loading={updatingStatus} onClick={() => changeStatus('Active')}>
                Approve
              </Button>
            )}
            {vendor.status === 'Active' && (
              <>
                <Button variant="outlined" color="warning" disabled={updatingStatus} onClick={() => changeStatus('On Hold')}>Put On Hold</Button>
                <Button variant="outlined" color="error" disabled={updatingStatus} onClick={() => setConfirmBlacklist(true)}>Blacklist</Button>
              </>
            )}
            {vendor.status === 'On Hold' && (
              <>
                <Button variant="contained" color="success" disabled={updatingStatus} loading={updatingStatus} onClick={() => changeStatus('Active')}>Reactivate</Button>
                <Button variant="outlined" color="error" disabled={updatingStatus} onClick={() => setConfirmBlacklist(true)}>Blacklist</Button>
              </>
            )}
            {vendor.status === 'Blacklisted' && (
              <Button variant="outlined" color="success" disabled={updatingStatus} loading={updatingStatus} onClick={() => changeStatus('Active')}>Reactivate</Button>
            )}
          </>
        }
      />
      {statusError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setStatusError('')}>
          {statusError}
        </Alert>
      )}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2, alignItems: { sm: 'center' } }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: '1.4rem' }}>
              {vendor.name.charAt(0)}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{vendor.primaryContact}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Primary contact</Typography>
            </Box>
            <Stack direction="row" sx={{ gap: 2, alignItems: 'center' }}>
              {perf.rating !== null ? (
                <Stack sx={{ alignItems: 'flex-end' }}>
                  <Rating value={perf.rating} precision={0.1} max={5} size="small" readOnly />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{perf.rating.toFixed(1)} / 5</Typography>
                </Stack>
              ) : (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{perf.ratingLabel}</Typography>
              )}
              <StatusChip status={vendor.status} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      <DetailTabs
        tabs={[
          { label: 'Overview', content: overviewTab },
          { label: 'Performance', content: performanceTab },
          { label: 'Purchase Orders', content: poTab },
          { label: 'RFQs', content: rfqTab },
          { label: 'Documents', content: documentsTab },
        ]}
      />

      <Dialog open={confirmBlacklist} onClose={() => setConfirmBlacklist(false)} fullWidth maxWidth="xs">
        <DialogTitle>Blacklist Vendor</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Blacklist {vendor.name}? This vendor will no longer be eligible for new RFQs or purchase orders until it is
            reactivated.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmBlacklist(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={updatingStatus}
            onClick={() => {
              setConfirmBlacklist(false);
              changeStatus('Blacklisted');
            }}
          >
            Blacklist
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
