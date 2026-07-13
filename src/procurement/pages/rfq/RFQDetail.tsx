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
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Checkbox from '@mui/material/Checkbox';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import PageHeader from '../../components/PageHeader';
import StatusChip from '../../components/StatusChip';
import DetailTabs from '../../components/DetailTabs';
import PipelineTracker from '../../components/PipelineTracker';
import { useProcurement } from '../../store/ProcurementStore';
import { useInventory } from '../../../inventory/store/InventoryStore';
import { ApiError } from '../../../shared/api/client';
import DetailPageSkeleton from '../../../shared/components/DetailPageSkeleton';
import type { Rfq, Vendor } from '../../data/types';

const TAB_INDEX = { overview: 0, items: 1, invited: 2, quotations: 3, comparison: 4, award: 5 };

function LabeledValue({ label, value }: { label: string; value?: string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || '—'}</Typography>
    </Box>
  );
}

type QuoteDraft = { price: string; deliveryDays: string; paymentTerms: string; qualityRating: string };

// Interactive quote capture — one editable row per invited vendor. Real entered
// values are pushed into the store via submitQuote, which re-scores the RFQ.
function QuotationsPanel({
  rfq,
  vendors,
  onSubmit,
}: {
  rfq: Rfq;
  vendors: Vendor[];
  onSubmit: (vendorId: string, vendorName: string, draft: QuoteDraft) => Promise<void>;
}) {
  const [drafts, setDrafts] = useState<Record<string, QuoteDraft>>(() => {
    const initial: Record<string, QuoteDraft> = {};
    rfq.invitedVendors.forEach((vid) => {
      const q = rfq.quotes.find((qt) => qt.vendorId === vid && qt.submitted);
      initial[vid] = {
        price: q ? String(q.price) : '',
        deliveryDays: q ? String(q.deliveryDays) : '',
        paymentTerms: q ? q.paymentTerms : '',
        qualityRating: q ? String(q.qualityRating) : '',
      };
    });
    return initial;
  });
  const [submittingVid, setSubmittingVid] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const update = (vid: string, field: keyof QuoteDraft, value: string) =>
    setDrafts((prev) => ({ ...prev, [vid]: { ...prev[vid], [field]: value } }));

  const submitRow = async (vid: string, vendorName: string, draft: QuoteDraft) => {
    setSubmittingVid(vid);
    setRowErrors((prev) => ({ ...prev, [vid]: '' }));
    try {
      await onSubmit(vid, vendorName, draft);
    } catch (e) {
      setRowErrors((prev) => ({ ...prev, [vid]: e instanceof ApiError ? e.message : 'Could not submit the quote.' }));
    } finally {
      setSubmittingVid(null);
    }
  };

  if (rfq.invitedVendors.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No vendors invited yet — invite vendors when creating the RFQ to capture quotes.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Vendor</TableCell>
            <TableCell width={120} align="right">Price ({rfq.currency}) <Box component="span" sx={{ color: 'error.main' }}>*</Box></TableCell>
            <TableCell width={120} align="right">Delivery (days) <Box component="span" sx={{ color: 'error.main' }}>*</Box></TableCell>
            <TableCell width={140}>Payment Terms</TableCell>
            <TableCell width={130} align="right">Quality (0–5) <Box component="span" sx={{ color: 'error.main' }}>*</Box></TableCell>
            <TableCell width={120} />
          </TableRow>
        </TableHead>
        <TableBody>
          {rfq.invitedVendors.map((vid) => {
            const v = vendors.find((vend) => vend.id === vid);
            const d = drafts[vid] ?? { price: '', deliveryDays: '', paymentTerms: '', qualityRating: '' };
            const submitted = rfq.quotes.some((q) => q.vendorId === vid && q.submitted);

            const priceNum = Number(d.price);
            const deliveryNum = Number(d.deliveryDays);
            const qualityNum = Number(d.qualityRating);
            const priceValid = d.price !== '' && priceNum > 0;
            const deliveryValid = d.deliveryDays !== '' && Number.isInteger(deliveryNum) && deliveryNum >= 1;
            const qualityValid = d.qualityRating !== '' && qualityNum >= 0 && qualityNum <= 5;
            const valid = priceValid && deliveryValid && qualityValid;
            const rowError = rowErrors[vid];

            return (
              <TableRow key={vid}>
                <TableCell>
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>{v?.name.charAt(0)}</Avatar>
                    {v?.name ?? vid}
                    {submitted && <Chip size="small" color="success" label="Submitted" />}
                  </Stack>
                  {rowError && (
                    <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mt: 0.5 }}>
                      {rowError}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <TextField
                    variant="standard"
                    type="number"
                    value={d.price}
                    onChange={(e) => update(vid, 'price', e.target.value)}
                    error={d.price !== '' && !priceValid}
                    helperText={d.price !== '' && !priceValid ? 'Must be > 0' : undefined}
                    sx={{ width: 90 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    variant="standard"
                    type="number"
                    value={d.deliveryDays}
                    onChange={(e) => update(vid, 'deliveryDays', e.target.value)}
                    error={d.deliveryDays !== '' && !deliveryValid}
                    helperText={d.deliveryDays !== '' && !deliveryValid ? 'Whole days, ≥ 1' : undefined}
                    slotProps={{ htmlInput: { min: 1, step: 1 } }}
                    sx={{ width: 90 }}
                  />
                </TableCell>
                <TableCell><TextField variant="standard" placeholder="Net 30" value={d.paymentTerms} onChange={(e) => update(vid, 'paymentTerms', e.target.value)} sx={{ width: 120 }} /></TableCell>
                <TableCell align="right">
                  <TextField
                    variant="standard"
                    type="number"
                    value={d.qualityRating}
                    onChange={(e) => update(vid, 'qualityRating', e.target.value)}
                    error={d.qualityRating !== '' && !qualityValid}
                    helperText={d.qualityRating !== '' && !qualityValid ? 'Must be 0–5' : undefined}
                    slotProps={{ htmlInput: { min: 0, max: 5, step: 0.5 } }}
                    sx={{ width: 80 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="contained"
                    disabled={!valid || submittingVid === vid}
                    loading={submittingVid === vid}
                    onClick={() => submitRow(vid, v?.name ?? vid, d)}
                  >
                    {submitted ? 'Update' : 'Submit'}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

export default function RFQDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { rfqs, vendors, purchaseOrders, submitQuote, awardRfq, inviteRfqVendors, loading } = useProcurement();
  const { items: catalogItems } = useInventory();
  const rfq = rfqs.find((r) => r.id === id);
  const materialName = (code: string) => catalogItems.find((ci) => ci.id === code)?.name ?? code;
  const linkedPo = rfq ? purchaseOrders.find((p) => p.rfqId === rfq.id) : undefined;

  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedNewVendors, setSelectedNewVendors] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  if (loading && !rfq) {
    return <DetailPageSkeleton />;
  }

  if (!rfq) {
    return (
      <Box>
        <Typography>RFQ not found.</Typography>
        <Button onClick={() => navigate('/procurement/rfqs')}>Back to list</Button>
      </Box>
    );
  }

  const submittedQuotes = rfq.quotes.filter((q) => q.submitted);
  const bestQuote = submittedQuotes.length
    ? submittedQuotes.reduce((best, q) => (q.score > best.score ? q : best), submittedQuotes[0])
    : undefined;
  const awardedQuote = rfq.awardedVendor ? submittedQuotes.find((q) => q.vendorId === rfq.awardedVendor) : undefined;

  // Always-visible "what's next" banner — shown above the tabs regardless of which
  // tab is open, so the next action is never buried behind a tab you happen not to be on.
  const nextStepBanner = rfq.awardedVendor ? (
    <Alert
      severity="success"
      action={
        <Button
          color="inherit"
          size="small"
          variant="outlined"
          onClick={() => navigate(`/procurement/purchase-orders/new?fromRfq=${rfq.id}`)}
        >
          Create Purchase Order
        </Button>
      }
    >
      Awarded to <strong>{vendors.find((v) => v.id === rfq.awardedVendor)?.name}</strong> — ready to create the purchase order.
    </Alert>
  ) : submittedQuotes.length === 0 ? (
    <Alert
      severity="info"
      action={
        <Button color="inherit" size="small" variant="outlined" onClick={() => setActiveTab(TAB_INDEX.quotations)}>
          Go to Quotations
        </Button>
      }
    >
      Waiting on vendor quotes — enter each one on the Quotations tab as it arrives. Vendors don't quote in real
      time, so come back to this whenever a vendor gets back to you.
    </Alert>
  ) : (
    <Alert
      severity="info"
      action={
        <Button color="inherit" size="small" variant="outlined" onClick={() => setActiveTab(TAB_INDEX.comparison)}>
          Go to Comparison
        </Button>
      }
    >
      {submittedQuotes.length} of {rfq.invitedVendors.length} vendor{rfq.invitedVendors.length === 1 ? '' : 's'} have
      quoted. Compare and award whenever you're ready — you don't need every vendor to respond.
    </Alert>
  );

  const handleSubmitQuote = async (vendorId: string, vendorName: string, draft: QuoteDraft) => {
    await submitQuote(rfq.id, {
      vendorId,
      vendorName,
      price: Number(draft.price),
      deliveryDays: Number(draft.deliveryDays),
      paymentTerms: draft.paymentTerms || '—',
      qualityRating: Number(draft.qualityRating),
    });
  };

  const uninvitedVendors = vendors.filter((v) => !rfq.invitedVendors.includes(v.id));

  const toggleNewVendor = (vendorId: string) => {
    setSelectedNewVendors((prev) => (prev.includes(vendorId) ? prev.filter((v) => v !== vendorId) : [...prev, vendorId]));
  };

  const confirmInvite = async () => {
    setInviting(true);
    setInviteError('');
    try {
      await inviteRfqVendors(rfq.id, selectedNewVendors);
      setSelectedNewVendors([]);
      setInviteOpen(false);
    } catch (e) {
      setInviteError(e instanceof ApiError ? e.message : 'Could not invite the selected vendors.');
    } finally {
      setInviting(false);
    }
  };

  const overviewTab = (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>RFQ Information</Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="RFQ Number" value={rfq.rfqNo} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Category" value={rfq.category} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Currency" value={rfq.currency} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Created Date" value={rfq.createdDate} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Closing Date" value={rfq.closingDate} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Invited Vendors" value={`${rfq.invitedVendors.length}`} /></Grid>
              <Grid size={{ xs: 12 }}><LabeledValue label="Title" value={rfq.title} /></Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Status</Typography>
            <StatusChip status={rfq.status} />
            <Stack sx={{ mt: 2, gap: 1 }}>
              <LabeledValue label="Responses" value={`${submittedQuotes.length} / ${rfq.invitedVendors.length}`} />
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
            <TableCell>Specifications</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Required Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rfq.items.map((item, i) => (
            <TableRow key={i} hover>
              <TableCell sx={{ fontWeight: 500 }}>{materialName(item.item)}</TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell align="right">{item.requiredQty}</TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell>{item.requiredDate}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  const canInviteVendors = ['Draft', 'Sent', 'Receiving Quotes'].includes(rfq.status);

  const invitedTab = (
    <Card variant="outlined">
      {canInviteVendors && (
        <Stack direction="row" sx={{ justifyContent: 'flex-end', p: 1.5, pb: 0 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PersonAddRoundedIcon />}
            disabled={uninvitedVendors.length === 0}
            onClick={() => setInviteOpen(true)}
          >
            Invite Vendor
          </Button>
        </Stack>
      )}
      <List>
        {rfq.invitedVendors.length === 0 && (
          <ListItem><ListItemText primary="No vendors invited yet" /></ListItem>
        )}
        {rfq.invitedVendors.map((vid) => {
          const v = vendors.find((vend) => vend.id === vid);
          const quote = rfq.quotes.find((q) => q.vendorId === vid);
          return (
            <ListItem
              key={vid}
              divider
              secondaryAction={<StatusChip status={quote?.submitted ? 'Submitted' : 'Pending'} />}
            >
              <ListItemAvatar>
                <Avatar>{v?.name.charAt(0)}</Avatar>
              </ListItemAvatar>
              <ListItemText primary={v?.name ?? vid} secondary={v?.category} />
            </ListItem>
          );
        })}
      </List>
    </Card>
  );

  const quotationsTab = (
    <QuotationsPanel rfq={rfq} vendors={vendors} onSubmit={handleSubmitQuote} />
  );

  const comparisonTab = (
    <Stack spacing={2}>
      <Card variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Vendor</TableCell>
              <TableCell align="right">Price ({rfq.currency})</TableCell>
              <TableCell align="right">Delivery (days)</TableCell>
              <TableCell align="right">Quality Rating</TableCell>
              <TableCell>Payment Terms</TableCell>
              <TableCell align="right">Score</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submittedQuotes.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center" sx={{ color: 'text.secondary' }}>No quotes submitted yet — enter them in the Quotations tab</TableCell></TableRow>
            )}
            {submittedQuotes.map((q) => {
              const isRecommended = q.vendorId === bestQuote?.vendorId;
              const isAwarded = q.vendorId === rfq.awardedVendor;
              return (
                <TableRow key={q.vendorId} hover selected={isAwarded}>
                  <TableCell sx={{ fontWeight: 500 }}>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      {q.vendorName}
                      {isRecommended && <Chip size="small" color="success" label="Recommended" />}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{q.price}</TableCell>
                  <TableCell align="right">{q.deliveryDays}</TableCell>
                  <TableCell align="right">{q.qualityRating}</TableCell>
                  <TableCell>{q.paymentTerms}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{q.score}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant={isAwarded ? 'contained' : 'outlined'}
                      color="success"
                      startIcon={isAwarded ? <EmojiEventsRoundedIcon /> : undefined}
                      onClick={() => awardRfq(rfq.id, q.vendorId)}
                    >
                      {isAwarded ? 'Awarded' : 'Award'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        "Recommended" is just a suggestion based on price, delivery time and quality — award whichever vendor you
        actually want, even if it isn't the top score.
      </Typography>

      {awardedQuote && (
        <Card variant="outlined" sx={{ borderColor: 'success.main' }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'success.main' }}>Awarded Vendor</Typography>
                <Typography variant="h6">{awardedQuote.vendorName}</Typography>
              </Box>
              <Button variant="contained" onClick={() => navigate(`/procurement/purchase-orders/new?fromRfq=${rfq.id}`)}>
                Generate Purchase Order
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );

  const awardTab = (
    <Card variant="outlined">
      <List>
        {rfq.awardedVendor ? (
          <ListItem>
            <ListItemAvatar><Avatar><EmojiEventsRoundedIcon /></Avatar></ListItemAvatar>
            <ListItemText
              primary={`Awarded to ${vendors.find((v) => v.id === rfq.awardedVendor)?.name}`}
              secondary={`Closed ${rfq.closingDate}`}
            />
          </ListItem>
        ) : (
          <ListItem><ListItemText primary="Not awarded yet" secondary="Use the Award button on the Comparison tab to award this RFQ" /></ListItem>
        )}
      </List>
    </Card>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title={rfq.rfqNo}
        subtitle={rfq.title}
        actions={
          <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/procurement/rfqs')}>Back</Button>
        }
      />
      <PipelineTracker current="rfq" requisitionId={rfq.requisitionId} rfqId={rfq.id} poId={linkedPo?.id} />
      <Box sx={{ mb: 2 }}>{nextStepBanner}</Box>
      <DetailTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { label: 'Overview', content: overviewTab },
          { label: 'Items', content: itemsTab },
          { label: 'Invited Vendors', content: invitedTab },
          { label: 'Quotations', content: quotationsTab },
          { label: 'Comparison', content: comparisonTab },
          { label: 'Award History', content: awardTab },
        ]}
      />

      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Invite Vendors — {rfq.rfqNo}</DialogTitle>
        <DialogContent dividers>
          {inviteError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setInviteError('')}>
              {inviteError}
            </Alert>
          )}
          <List dense disablePadding>
            {uninvitedVendors.map((v) => (
              <ListItem key={v.id} disablePadding>
                <Stack
                  direction="row"
                  sx={{ alignItems: 'center', gap: 1, width: '100%', cursor: 'pointer' }}
                  onClick={() => toggleNewVendor(v.id)}
                >
                  <Checkbox checked={selectedNewVendors.includes(v.id)} size="small" />
                  <ListItemText primary={v.name} secondary={v.category} />
                </Stack>
              </ListItem>
            ))}
            {uninvitedVendors.length === 0 && (
              <ListItem><ListItemText primary="Every vendor is already invited" /></ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={selectedNewVendors.length === 0 || inviting}
            loading={inviting}
            onClick={confirmInvite}
          >
            Invite {selectedNewVendors.length > 0 ? selectedNewVendors.length : ''} Vendor{selectedNewVendors.length === 1 ? '' : 's'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
