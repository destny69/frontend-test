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
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import PageHeader from '../../components/PageHeader';
import KpiCard from '../../components/KpiCard';
import StatusChip from '../../components/StatusChip';
import { useFinance } from '../../store/FinanceStore';
import { customerById, invoiceBalance, billBalance, cashOnHandBalance, totalBankBalance } from '../../data/mockData';

const quickActions = [
  { label: 'Create Invoice', icon: <ReceiptLongRoundedIcon />, path: '/finance/invoices/new' },
  { label: 'Record Supplier Bill', icon: <RequestQuoteRoundedIcon />, path: '/finance/bills/new' },
  { label: 'Record Payment', icon: <PaidRoundedIcon />, path: '/finance/payments/new' },
  { label: 'Issue Credit Note', icon: <UndoRoundedIcon />, path: '/finance/credit-notes/new' },
  { label: 'Issue Debit Note', icon: <UndoRoundedIcon />, path: '/finance/debit-notes/new' },
];

function RecentActivity() {
  const [tab, setTab] = React.useState(0);
  const navigate = useNavigate();
  const { invoices, supplierBills, payments, creditNotes, debitNotes } = useFinance();

  const panels = [
    {
      label: 'Recent Invoices',
      items: invoices.slice(0, 5).map((inv) => ({
        id: inv.id,
        primary: `${inv.invoiceNo} · ${customerById(inv.customerId)?.name}`,
        secondary: `${inv.invoiceDate} · NPR ${inv.amount.toLocaleString()}`,
        status: inv.status,
        path: `/finance/invoices/${inv.id}`,
      })),
    },
    {
      label: 'Recent Supplier Bills',
      items: supplierBills.slice(0, 5).map((b) => ({
        id: b.id,
        primary: `${b.billNo} · ${b.vendorName}`,
        secondary: `${b.invoiceDate} · NPR ${b.amount.toLocaleString()}`,
        status: b.status,
        path: `/finance/bills/${b.id}`,
      })),
    },
    {
      label: 'Recent Payments',
      items: payments.slice(0, 5).map((p) => ({
        id: p.id,
        primary: `${p.paymentNo} · ${p.partyName}`,
        secondary: `${p.date} · NPR ${p.amount.toLocaleString()}`,
        status: p.status,
        path: `/finance/payments/${p.id}`,
      })),
    },
    {
      label: 'Recent Credit Notes',
      items: creditNotes.slice(0, 5).map((c) => ({
        id: c.id,
        primary: `${c.creditNoteNo} · ${customerById(c.customerId)?.name}`,
        secondary: `${c.date} · NPR ${c.amount.toLocaleString()}`,
        status: c.status,
        path: `/finance/credit-notes`,
      })),
    },
    {
      label: 'Recent Debit Notes',
      items: debitNotes.slice(0, 5).map((d) => ({
        id: d.id,
        primary: `${d.debitNoteNo} · ${d.vendorName}`,
        secondary: `${d.date} · NPR ${d.amount.toLocaleString()}`,
        status: d.status,
        path: `/finance/debit-notes`,
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

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const { invoices, supplierBills, bankAccounts, payments } = useFinance();

  const outstandingReceivables = invoices
    .filter((i) => !['Paid', 'Cancelled', 'Draft', 'Proforma'].includes(i.status))
    .reduce((sum, i) => sum + invoiceBalance(i), 0);
  const outstandingPayables = supplierBills
    .filter((b) => !['Paid', 'Cancelled', 'Draft'].includes(b.status))
    .reduce((sum, b) => sum + billBalance(b), 0);
  const cashBalance = cashOnHandBalance(payments);
  const bankBalance = totalBankBalance(payments);
  const pendingPayments =
    invoices.filter((i) => ['Sent', 'Partially Paid', 'Overdue'].includes(i.status)).length +
    supplierBills.filter((b) => ['Pending Verification', 'Approved', 'Partially Paid'].includes(b.status)).length;

  const kpis = [
    { title: 'Outstanding Receivables', value: `NPR ${outstandingReceivables.toLocaleString()}`, icon: <TrendingUpRoundedIcon />, color: 'warning' as const, helper: `${invoices.filter((i) => i.status === 'Overdue').length} overdue` },
    { title: 'Outstanding Payables', value: `NPR ${outstandingPayables.toLocaleString()}`, icon: <TrendingDownRoundedIcon />, color: 'warning' as const },
    { title: 'Cash Balance', value: `NPR ${cashBalance.toLocaleString()}`, icon: <PaidRoundedIcon />, color: 'primary' as const },
    { title: 'Bank Balance', value: `NPR ${bankBalance.toLocaleString()}`, icon: <AccountBalanceRoundedIcon />, color: 'primary' as const, helper: `${bankAccounts.length} accounts` },
    { title: 'Pending Payments', value: `${pendingPayments}`, icon: <PendingActionsRoundedIcon />, color: 'info' as const },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Finance Dashboard"
        subtitle="Customer billing, supplier billing, payments, accounting and banking in one place"
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

      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Recent Activity
      </Typography>
      <RecentActivity />
    </Box>
  );
}
