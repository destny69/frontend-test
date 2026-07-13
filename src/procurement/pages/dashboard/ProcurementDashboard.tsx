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
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import PageHeader from '../../components/PageHeader';
import KpiCard from '../../components/KpiCard';
import StatusChip from '../../components/StatusChip';
import { useProcurement } from '../../store/ProcurementStore';

const quickActions = [
  { label: 'Guided Purchase', icon: <RequestQuoteRoundedIcon />, path: '/procurement/guided-purchase' },
  { label: 'Create Purchase Order', icon: <ShoppingCartRoundedIcon />, path: '/procurement/purchase-orders/new' },
  { label: 'Receive Goods', icon: <Inventory2RoundedIcon />, path: '/procurement/grn/new' },
];

function RecentActivity() {
  const [tab, setTab] = React.useState(0);
  const navigate = useNavigate();
  const { requisitions, vendors, purchaseOrders, grns } = useProcurement();

  const panels = [
    {
      label: 'Latest Purchase Orders',
      items: purchaseOrders.slice(0, 5).map((po) => ({
        id: po.id,
        primary: `${po.poNumber} · ${po.vendorName}`,
        secondary: `${po.date} · NPR ${po.amount.toLocaleString()}`,
        status: po.status,
        path: `/procurement/purchase-orders/${po.id}`,
      })),
    },
    {
      label: 'Latest Requisitions',
      items: requisitions.slice(0, 5).map((r) => ({
        id: r.id,
        primary: `${r.requestNo} · ${r.department}`,
        secondary: `${r.requestDate} · ${r.requestedBy}`,
        status: r.status,
        path: `/procurement/requisitions/${r.id}`,
      })),
    },
    {
      label: 'Recent Deliveries',
      items: grns.slice(0, 5).map((g) => ({
        id: g.id,
        primary: `${g.grnNumber} · ${g.vendorName}`,
        secondary: `${g.receivedDate} · ${g.poNumber}`,
        status: g.status,
        path: `/procurement/grn/${g.id}`,
      })),
    },
    {
      label: 'Recent Vendor Registrations',
      items: vendors.slice(0, 5).map((v) => ({
        id: v.id,
        primary: `${v.vendorCode} · ${v.name}`,
        secondary: `${v.category} · ${v.country}`,
        status: v.status,
        path: `/procurement/vendors/${v.id}`,
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

export default function ProcurementDashboard() {
  const navigate = useNavigate();
  const { requisitions, purchaseOrders, grns } = useProcurement();

  const pendingRequisitions = requisitions.filter((r) =>
    ['Submitted', 'Pending Approval'].includes(r.status),
  );
  const posPendingApproval = purchaseOrders.filter((p) => p.status === 'Pending Approval');
  const pendingGrns = grns.filter((g) => ['Pending', 'Inspection'].includes(g.status));

  const kpis = [
    {
      title: 'Pending Requisitions',
      value: `${pendingRequisitions.length}`,
      icon: <AssignmentRoundedIcon />,
      color: 'info' as const,
      helper: `${pendingRequisitions.filter((r) => r.status === 'Pending Approval').length} need approval today`,
    },
    {
      title: 'POs Pending Approval',
      value: `${posPendingApproval.length}`,
      icon: <ShoppingCartRoundedIcon />,
      color: 'primary' as const,
      helper: 'Awaiting sign-off',
    },
    {
      title: 'GRNs Pending',
      value: `${pendingGrns.length}`,
      icon: <LocalShippingRoundedIcon />,
      color: 'warning' as const,
      helper: `${grns.filter((g) => g.status === 'Inspection').length} in inspection`,
    },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Procurement Dashboard"
        subtitle="Overview of requisitions, sourcing, orders and deliveries"
      />

      <Grid container spacing={2} columns={12} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid key={kpi.title} size={{ xs: 12, sm: 6, md: 4 }}>
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

      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Recent Activity
      </Typography>
      <RecentActivity />
    </Box>
  );
}
