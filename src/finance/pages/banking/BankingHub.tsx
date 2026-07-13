import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Checkbox from '@mui/material/Checkbox';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import RuleRoundedIcon from '@mui/icons-material/RuleRounded';
import PageHeader from '../../components/PageHeader';
import KpiCard from '../../components/KpiCard';
import StatusChip from '../../components/StatusChip';
import DetailTabs from '../../components/DetailTabs';
import { useFinance } from '../../store/FinanceStore';

export default function BankingHub() {
  const { bankAccounts, bankTransactions, chartOfAccounts, toggleReconciled } = useFinance();

  const totalBank = bankAccounts.reduce((s, a) => s + a.balance, 0);
  const totalCash = chartOfAccounts.find((a) => a.code === '1000')?.balance ?? 0;
  const pendingReconciliation = bankTransactions.filter((t) => !t.reconciled).length;

  const kpis = [
    { title: 'Total Cash', value: `NPR ${totalCash.toLocaleString()}`, icon: <PaidRoundedIcon />, color: 'primary' as const },
    { title: 'Total Bank Balance', value: `NPR ${totalBank.toLocaleString()}`, icon: <AccountBalanceRoundedIcon />, color: 'primary' as const },
    { title: 'Pending Reconciliation', value: `${pendingReconciliation}`, icon: <RuleRoundedIcon />, color: 'warning' as const },
  ];

  const accountsTab = (
    <Card variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Bank Name</TableCell>
            <TableCell>Account Number</TableCell>
            <TableCell>Currency</TableCell>
            <TableCell align="right">Current Balance</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bankAccounts.map((a) => (
            <TableRow key={a.id} hover>
              <TableCell sx={{ fontWeight: 500 }}>{a.bankName}</TableCell>
              <TableCell>{a.accountNumber}</TableCell>
              <TableCell>{a.currency}</TableCell>
              <TableCell align="right">NPR {a.balance.toLocaleString()}</TableCell>
              <TableCell><StatusChip status={a.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  const transactionsTab = (
    <Card variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Transaction ID</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Description</TableCell>
            <TableCell align="right">Debit</TableCell>
            <TableCell align="right">Credit</TableCell>
            <TableCell align="right">Balance</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bankTransactions.map((t) => (
            <TableRow key={t.id} hover>
              <TableCell sx={{ fontWeight: 500 }}>{t.transactionId}</TableCell>
              <TableCell>{t.date}</TableCell>
              <TableCell>{t.description}</TableCell>
              <TableCell align="right">{t.debit ? `NPR ${t.debit.toLocaleString()}` : '—'}</TableCell>
              <TableCell align="right">{t.credit ? `NPR ${t.credit.toLocaleString()}` : '—'}</TableCell>
              <TableCell align="right">NPR {t.balance.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  const reconciliationTab = (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Matched Transactions</Typography>
            <List dense>
              {bankTransactions.filter((t) => t.reconciled).map((t) => (
                <ListItem key={t.id} divider secondaryAction={<StatusChip status="Matched" />}>
                  <ListItemIcon sx={{ minWidth: 0, mr: 1 }}>
                    <Checkbox edge="start" checked={t.reconciled} onChange={() => toggleReconciled(t.id)} />
                  </ListItemIcon>
                  <ListItemText primary={t.description} secondary={`${t.date} · ${t.transactionId}`} />
                </ListItem>
              ))}
              {bankTransactions.every((t) => !t.reconciled) && (
                <ListItem><ListItemText primary="No matched transactions" /></ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Unmatched Transactions</Typography>
            <List dense>
              {bankTransactions.filter((t) => !t.reconciled).map((t) => (
                <ListItem key={t.id} divider secondaryAction={<StatusChip status="Unmatched" />}>
                  <ListItemIcon sx={{ minWidth: 0, mr: 1 }}>
                    <Checkbox edge="start" checked={t.reconciled} onChange={() => toggleReconciled(t.id)} />
                  </ListItemIcon>
                  <ListItemText primary={t.description} secondary={`${t.date} · ${t.transactionId}`} />
                </ListItem>
              ))}
              {bankTransactions.every((t) => t.reconciled) && (
                <ListItem><ListItemText primary="Everything is reconciled" /></ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader title="Banking" subtitle="Manage cash and bank accounts" />

      <Grid container spacing={2} columns={12} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid key={kpi.title} size={{ xs: 12, sm: 6, lg: 3 }}>
            <KpiCard {...kpi} />
          </Grid>
        ))}
      </Grid>

      <DetailTabs
        tabs={[
          { label: 'Accounts', content: accountsTab },
          { label: 'Transactions', content: transactionsTab },
          { label: 'Reconciliation', content: reconciliationTab },
        ]}
      />
    </Box>
  );
}
