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
import LinearProgress from '@mui/material/LinearProgress';
import WarehouseRoundedIcon from '@mui/icons-material/WarehouseRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PageHeader from '../../components/PageHeader';
import DetailTabs from '../../components/DetailTabs';
import StatusChip from '../../components/StatusChip';
import { useInventory } from '../../store/InventoryStore';
import { warehouses, itemById } from '../../data/mockData';
import DetailPageSkeleton from '../../../shared/components/DetailPageSkeleton';

function LabeledValue({ label, value }: { label: string; value?: string | number }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value ?? '—'}</Typography>
    </Box>
  );
}

export default function WarehouseProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, batches, transfers } = useInventory();
  const warehouse = warehouses.find((w) => w.id === id);

  if (loading && !warehouse) {
    return <DetailPageSkeleton />;
  }

  if (!warehouse) {
    return (
      <Box>
        <Typography>Warehouse not found.</Typography>
        <Button onClick={() => navigate('/inventory/warehouses')}>Back to list</Button>
      </Box>
    );
  }

  const whBatches = batches.filter((b) => b.warehouseId === warehouse.id);
  const whTransfersOut = transfers.filter((t) => t.fromWarehouseId === warehouse.id);
  const whTransfersIn = transfers.filter((t) => t.toWarehouseId === warehouse.id);
  const utilization = Math.round((warehouse.occupied / warehouse.totalCapacity) * 100);

  const overviewTab = (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>General</Typography>
            <Stack spacing={1.5}>
              <LabeledValue label="Warehouse Name" value={warehouse.name} />
              <LabeledValue label="Code" value={warehouse.code} />
              <LabeledValue label="Address" value={warehouse.address} />
              <LabeledValue label="Manager" value={warehouse.manager} />
              <LabeledValue label="Phone" value={warehouse.phone} />
              <LabeledValue label="Email" value={warehouse.email} />
              <LabeledValue label="Description" value={warehouse.description} />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Capacity</Typography>
            <Stack sx={{ gap: 0.5, mb: 2 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography variant="body2">Occupied</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {warehouse.occupied.toLocaleString()} / {warehouse.totalCapacity.toLocaleString()}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={utilization}
                color={utilization > 85 ? 'error' : utilization > 65 ? 'warning' : 'success'}
              />
            </Stack>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 6 }}><LabeledValue label="Total Capacity" value={warehouse.totalCapacity.toLocaleString()} /></Grid>
              <Grid size={{ xs: 6 }}><LabeledValue label="Available" value={(warehouse.totalCapacity - warehouse.occupied).toLocaleString()} /></Grid>
            </Grid>
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
              {warehouse.temperatureControlled && <Chip size="small" color="info" label="Temperature Controlled" />}
              {warehouse.coldStorage && <Chip size="small" color="info" label="Cold Storage" />}
              {warehouse.hazardStorage && <Chip size="small" color="warning" label="Hazard Storage" />}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Storage Zones</Typography>
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
              {warehouse.zones.map((zone) => (
                <Chip key={zone} size="small" variant="outlined" label={zone} />
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const stockTab = (
    <Card variant="outlined">
      {whBatches.length === 0 ? (
        <Stack sx={{ alignItems: 'center', py: 5, gap: 1.5 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No stock recorded at this warehouse yet.
          </Typography>
          <Stack direction="row" sx={{ gap: 1.5 }}>
            <Button variant="contained" size="small" onClick={() => navigate(`/inventory/stock/new?warehouse=${warehouse.id}`)}>
              Stock In
            </Button>
            <Button variant="outlined" size="small" onClick={() => navigate(`/inventory/transfers/new?from=${warehouse.id}`)}>
              Transfer In Stock
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Batch</TableCell>
              <TableCell align="right">Available</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {whBatches.map((b) => (
              <TableRow key={b.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/inventory/stock/${b.id}`)}>
                <TableCell sx={{ fontWeight: 500 }}>{itemById(b.itemId)?.name}</TableCell>
                <TableCell>{b.batchNumber}</TableCell>
                <TableCell align="right">{b.availableQty.toLocaleString()}</TableCell>
                <TableCell><StatusChip status={b.qcStatus} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );

  const transfersTab = (
    <Card variant="outlined">
      {whTransfersOut.length === 0 && whTransfersIn.length === 0 ? (
        <Stack sx={{ alignItems: 'center', py: 5, gap: 1.5 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No transfers in or out of this warehouse yet.
          </Typography>
          <Button variant="outlined" size="small" onClick={() => navigate(`/inventory/transfers/new?from=${warehouse.id}`)}>
            New Transfer
          </Button>
        </Stack>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Transfer</TableCell>
              <TableCell>Direction</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...whTransfersOut.map((t) => ({ t, dir: 'Outgoing' })), ...whTransfersIn.map((t) => ({ t, dir: 'Incoming' }))].map(({ t, dir }) => (
              <TableRow key={t.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/inventory/transfers/${t.id}`)}>
                <TableCell sx={{ fontWeight: 500 }}>{t.transferNumber}</TableCell>
                <TableCell>{dir}</TableCell>
                <TableCell>{t.transferDate}</TableCell>
                <TableCell><StatusChip status={t.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title={warehouse.name}
        subtitle={`${warehouse.code} · ${warehouse.location}`}
        actions={
          <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/inventory/warehouses')}>Back</Button>
        }
      />
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2, alignItems: { sm: 'center' } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '10px',
                bgcolor: 'primary.main',
                color: 'white',
              }}
            >
              <WarehouseRoundedIcon />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{warehouse.manager}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Manager</Typography>
            </Box>
            <Chip size="small" color={utilization > 85 ? 'error' : utilization > 65 ? 'warning' : 'success'} label={`${utilization}% utilized`} />
          </Stack>
        </CardContent>
      </Card>
      <DetailTabs
        tabs={[
          { label: 'Overview', content: overviewTab },
          { label: 'Stock', content: stockTab },
          { label: 'Transfers', content: transfersTab },
        ]}
      />
    </Box>
  );
}
