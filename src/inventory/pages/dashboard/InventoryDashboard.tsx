import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import Category2RoundedIcon from '@mui/icons-material/CategoryRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import PageHeader from '../../components/PageHeader';
import KpiCard from '../../components/KpiCard';
import StatusChip from '../../components/StatusChip';
import { daysUntil } from '../../components/expiryUtils';
import { useInventory } from '../../store/InventoryStore';
import { itemById, warehouseById } from '../../data/mockData';

const quickActions = [
  { label: 'Add Product', icon: <Inventory2RoundedIcon />, path: '/inventory/items/new' },
  { label: 'Receive Stock (non-PO)', icon: <ArrowDownwardRoundedIcon />, path: '/inventory/stock/new' },
  { label: 'Issue Stock', icon: <ArrowDownwardRoundedIcon />, path: '/inventory/stock/out' },
  { label: 'Transfer Stock', icon: <SyncAltRoundedIcon />, path: '/inventory/transfers/new' },
  { label: 'Adjust Stock', icon: <WarningAmberRoundedIcon />, path: '/inventory/adjustments/new' },
];

function RecentActivity() {
  const [tab, setTab] = React.useState(0);
  const navigate = useNavigate();
  const { batches, transfers, adjustments } = useInventory();
  const recentBatches = [...batches].reverse();

  const panels = [
    {
      label: 'Latest Stock Received',
      items: recentBatches.slice(0, 5).map((b) => ({
        id: b.id,
        primary: `${itemById(b.itemId)?.name} · ${b.batchNumber}`,
        secondary: `${b.grnNumber} · ${b.receivedQty.toLocaleString()} received`,
        status: b.qcStatus,
        path: `/inventory/stock/${b.id}`,
      })),
    },
    {
      label: 'Recent Transfers',
      items: transfers.slice(0, 5).map((t) => ({
        id: t.id,
        primary: `${t.transferNumber} · ${warehouseById(t.fromWarehouseId)?.name} → ${warehouseById(t.toWarehouseId)?.name}`,
        secondary: `${t.transferDate} · ${t.requestedBy}`,
        status: t.status,
        path: `/inventory/transfers/${t.id}`,
      })),
    },
    {
      label: 'Recent Adjustments',
      items: adjustments.slice(0, 5).map((a) => ({
        id: a.id,
        primary: `${a.adjustmentNo} · ${a.reason}`,
        secondary: `${a.date} · ${a.createdBy}`,
        status: a.status,
        path: `/inventory/adjustments/${a.id}`,
      })),
    },
    {
      label: 'Recent Expired Items',
      items: batches
        .filter((b) => daysUntil(b.expiryDate) < 0)
        .map((b) => ({
          id: b.id,
          primary: `${itemById(b.itemId)?.name} · ${b.batchNumber}`,
          secondary: `Expired ${b.expiryDate}`,
          status: 'Expired',
          path: `/inventory/stock/${b.id}`,
        })),
    },
    {
      label: 'Latest Batch Created',
      items: recentBatches
        .slice(0, 5)
        .map((b) => ({
          id: b.id,
          primary: `${b.batchNumber} · ${itemById(b.itemId)?.name}`,
          secondary: `Mfg ${b.manufacturingDate}`,
          status: b.qcStatus,
          path: `/inventory/stock/${b.id}`,
        })),
    },
  ];

  return (
    <Card variant="outlined">
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        {panels.map((p) => (
          <Tab key={p.label} label={p.label} />
        ))}
      </Tabs>
      <List dense disablePadding>
        {panels[tab].items.length === 0 && (
          <ListItem><ListItemText primary="Nothing here right now" /></ListItem>
        )}
        {panels[tab].items.map((item, i) => (
          <React.Fragment key={item.id}>
            <ListItem
              onClick={() => navigate(item.path)}
              sx={{ cursor: 'pointer', py: 1.25, '&:hover': { bgcolor: 'action.hover' } }}
              secondaryAction={<StatusChip status={item.status} />}
            >
              <ListItemText primary={item.primary} secondary={item.secondary} />
            </ListItem>
            {i < panels[tab].items.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Card>
  );
}

export default function InventoryDashboard() {
  const navigate = useNavigate();
  const { items, batches, transfers } = useInventory();

  const lowStockCount = items.filter((it) => {
    const totalAvailable = batches
      .filter((b) => b.itemId === it.id)
      .reduce((sum, b) => sum + b.availableQty, 0);
    return totalAvailable > 0 && totalAvailable <= it.reorderLevel;
  }).length;

  const outOfStockCount = items.filter((it) => {
    const totalAvailable = batches
      .filter((b) => b.itemId === it.id)
      .reduce((sum, b) => sum + b.availableQty, 0);
    return totalAvailable === 0;
  }).length;

  const onHandOf = (itemId: string) =>
    batches.filter((b) => b.itemId === itemId).reduce((sum, b) => sum + b.availableQty, 0);

  // Goods received from GRN but not yet signed off by QC — sit invisible in the
  // grid otherwise; surfaced here so nothing gets missed after a receipt.
  const pendingReleaseCount = batches.filter((b) => b.qcStatus === 'Under Inspection').length;

  const belowSafetyCount = items.filter((it) => {
    const oh = onHandOf(it.id);
    return oh > 0 && oh <= it.safetyStock;
  }).length;

  const overstockCount = items.filter((it) => {
    const oh = onHandOf(it.id);
    return it.maximumStock > 0 && oh >= it.maximumStock;
  }).length;

  // Real on-hand count + valuation broken down by stock type.
  const byType = items.reduce<Record<string, { count: number; value: number; onHand: number }>>((acc, it) => {
    const oh = onHandOf(it.id);
    const bucket = acc[it.stockType] ?? { count: 0, value: 0, onHand: 0 };
    bucket.count += 1;
    bucket.onHand += oh;
    bucket.value += oh * it.averageCost;
    acc[it.stockType] = bucket;
    return acc;
  }, {});
  const byTypeRows = Object.entries(byType).sort((a, b) => b[1].value - a[1].value);

  const expiring30 = batches.filter((b) => {
    const d = daysUntil(b.expiryDate);
    return d >= 0 && d <= 30;
  }).length;

  const pendingTransfers = transfers.filter((t) =>
    ['Draft', 'Pending Approval', 'Approved', 'In Transit'].includes(t.status),
  ).length;

  const totalValue = batches.reduce((sum, b) => {
    const item = itemById(b.itemId);
    return sum + (item ? item.averageCost * b.availableQty : 0);
  }, 0);

  const kpis = [
    {
      title: 'Pending Release',
      value: `${pendingReleaseCount}`,
      icon: <PendingActionsRoundedIcon />,
      color: 'info' as const,
      helper: 'Received, awaiting QC release',
      onClick: () => navigate('/inventory/stock?level=Under Inspection'),
    },
    { title: 'Total Inventory Value', value: `NPR ${Math.round(totalValue).toLocaleString()}`, icon: <Inventory2RoundedIcon />, color: 'success' as const },
    { title: 'Total Products', value: `${items.length}`, icon: <Category2RoundedIcon />, color: 'primary' as const, helper: `${items.filter((i) => i.status === 'Active').length} active` },
    { title: 'Low Stock Items', value: `${lowStockCount}`, icon: <WarningAmberRoundedIcon />, color: 'warning' as const, helper: 'Below reorder level' },
    { title: 'Below Safety Stock', value: `${belowSafetyCount}`, icon: <WarningAmberRoundedIcon />, color: 'error' as const, helper: 'At or below safety level' },
    { title: 'Out of Stock', value: `${outOfStockCount}`, icon: <ErrorOutlineRoundedIcon />, color: 'error' as const, helper: 'Needs reordering' },
    { title: 'Overstock Items', value: `${overstockCount}`, icon: <Inventory2RoundedIcon />, color: 'warning' as const, helper: 'At or above maximum' },
    { title: 'Expiring Within 30 Days', value: `${expiring30}`, icon: <EventBusyRoundedIcon />, color: 'error' as const, helper: 'Check Expiry Monitoring' },
    { title: 'Pending Transfers', value: `${pendingTransfers}`, icon: <SyncAltRoundedIcon />, color: 'warning' as const, helper: 'Awaiting action' },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Inventory Dashboard"
        subtitle="Everything physically inside the warehouse — stock, batches, expiry"
      />

      <Grid container spacing={2} columns={12} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid key={kpi.title} size={{ xs: 12, sm: 6, lg: 3 }}>
            <KpiCard {...kpi} />
          </Grid>
        ))}
      </Grid>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography component="h2" variant="subtitle2" gutterBottom>
            Quick actions
          </Typography>
          <Stack direction="row" sx={{ gap: 1.5, flexWrap: 'wrap' }}>
            {quickActions.map((qa) => (
              <Button
                key={qa.label}
                variant="outlined"
                startIcon={<AddRoundedIcon fontSize="small" />}
                onClick={() => navigate(qa.path)}
              >
                {qa.label}
              </Button>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography component="h2" variant="subtitle2">Inventory by Stock Type</Typography>
            <Button size="small" onClick={() => navigate('/inventory/alerts')}>Stock Monitoring →</Button>
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Stock Type</TableCell>
                <TableCell align="right">Products</TableCell>
                <TableCell align="right">On Hand</TableCell>
                <TableCell align="right">Valuation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {byTypeRows.map(([type, v]) => (
                <TableRow key={type} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{type}</TableCell>
                  <TableCell align="right">{v.count.toLocaleString()}</TableCell>
                  <TableCell align="right">{v.onHand.toLocaleString()}</TableCell>
                  <TableCell align="right">NPR {Math.round(v.value).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Recent Activity
      </Typography>
      <RecentActivity />
    </Box>
  );
}
