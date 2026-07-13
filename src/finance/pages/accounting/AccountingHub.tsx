import type { ReactElement } from 'react';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import PageHeader from '../../components/PageHeader';
import KpiCard from '../../components/KpiCard';
import StatusChip from '../../components/StatusChip';
import DetailTabs from '../../components/DetailTabs';
import { useFinance } from '../../store/FinanceStore';
import { customerById, invoiceBalance, billBalance } from '../../data/mockData';
import { daysUntil } from '../../../inventory/components/expiryUtils';

export default function AccountingHub() {
  const navigate = useNavigate();
  const { invoices, supplierBills, journalEntries, chartOfAccounts } = useFinance();

  const totalAssets = chartOfAccounts.filter((a) => a.type === 'Asset').reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = chartOfAccounts.filter((a) => a.type === 'Liability').reduce((s, a) => s + a.balance, 0);
  const totalEquity = chartOfAccounts.filter((a) => a.type === 'Equity').reduce((s, a) => s + a.balance, 0);
  const totalRevenue = chartOfAccounts.filter((a) => a.type === 'Revenue').reduce((s, a) => s + a.balance, 0);
  const totalExpense = chartOfAccounts.filter((a) => a.type === 'Expense').reduce((s, a) => s + a.balance, 0);
  const netIncome = totalRevenue - totalExpense;
  const isBalanced = totalAssets === totalLiabilities + totalEquity + netIncome;
  const ar = chartOfAccounts.find((a) => a.code === '1200')?.balance ?? 0;
  const ap = chartOfAccounts.find((a) => a.code === '2000')?.balance ?? 0;

  const kpis: { title: string; value: string; icon: ReactElement<SvgIconProps>; color: 'primary' | 'info' | 'success' | 'warning' }[] = [
    { title: 'General Ledger Balance', value: `NPR ${totalAssets.toLocaleString()}`, icon: <AccountBalanceRoundedIcon />, color: 'primary' },
    { title: 'Accounts Receivable', value: `NPR ${ar.toLocaleString()}`, icon: <TrendingUpRoundedIcon />, color: 'success' },
    { title: 'Accounts Payable', value: `NPR ${ap.toLocaleString()}`, icon: <TrendingDownRoundedIcon />, color: 'warning' },
    { title: 'Trial Balance Status', value: isBalanced ? 'Balanced' : 'Review', icon: <FactCheckRoundedIcon />, color: isBalanced ? 'success' : 'warning' },
  ];

  const chartOfAccountsTab = (
    <Card variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Account Code</TableCell>
            <TableCell>Account Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="right">Balance</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {chartOfAccounts.map((a) => (
            <TableRow key={a.code} hover>
              <TableCell>{a.code}</TableCell>
              <TableCell sx={{ fontWeight: 500 }}>{a.name}</TableCell>
              <TableCell>{a.type}</TableCell>
              <TableCell align="right">NPR {a.balance.toLocaleString()}</TableCell>
              <TableCell><StatusChip status={a.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  const journalTab = (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 1.5 }}>
        <Button variant="contained" size="small" startIcon={<AddRoundedIcon />} onClick={() => navigate('/finance/accounting/journal/new')}>
          New Journal
        </Button>
      </Stack>
      <Card variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Journal No.</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell>Debit Account</TableCell>
              <TableCell>Credit Account</TableCell>
              <TableCell>Cost Centre</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {journalEntries.map((j) => (
              <TableRow key={j.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{j.journalNo}</TableCell>
                <TableCell>{j.date}</TableCell>
                <TableCell>{j.reference}</TableCell>
                <TableCell>{j.debitAccount}</TableCell>
                <TableCell>{j.creditAccount}</TableCell>
                <TableCell>{j.costCenter ?? '—'}</TableCell>
                <TableCell align="right">NPR {j.amount.toLocaleString()}</TableCell>
                <TableCell><StatusChip status={j.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Box>
  );

  const generalLedgerTab = (
    <Card variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Account</TableCell>
            <TableCell align="right">Opening Balance</TableCell>
            <TableCell align="right">Debit</TableCell>
            <TableCell align="right">Credit</TableCell>
            <TableCell align="right">Closing Balance</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {chartOfAccounts.map((a) => {
            const debit = journalEntries.filter((j) => j.debitAccount === a.name).reduce((s, j) => s + j.amount, 0);
            const credit = journalEntries.filter((j) => j.creditAccount === a.name).reduce((s, j) => s + j.amount, 0);
            const opening = a.balance - debit + credit;
            return (
              <TableRow key={a.code} hover>
                <TableCell sx={{ fontWeight: 500 }}>{a.name}</TableCell>
                <TableCell align="right">NPR {opening.toLocaleString()}</TableCell>
                <TableCell align="right">NPR {debit.toLocaleString()}</TableCell>
                <TableCell align="right">NPR {credit.toLocaleString()}</TableCell>
                <TableCell align="right">NPR {a.balance.toLocaleString()}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );

  const arTab = (
    <Card variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Customer</TableCell>
            <TableCell>Invoice</TableCell>
            <TableCell align="right">Outstanding</TableCell>
            <TableCell align="right">Days Due</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoices.filter((i) => invoiceBalance(i) > 0 && !['Draft', 'Proforma'].includes(i.status)).map((i) => {
            const days = i.dueDate ? -daysUntil(i.dueDate) : 0;
            return (
              <TableRow key={i.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{customerById(i.customerId)?.name}</TableCell>
                <TableCell>{i.invoiceNo}</TableCell>
                <TableCell align="right">NPR {invoiceBalance(i).toLocaleString()}</TableCell>
                <TableCell align="right">{days > 0 ? `${days}d overdue` : `${-days}d left`}</TableCell>
                <TableCell><StatusChip status={i.status} /></TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => navigate(`/finance/invoices/${i.id}`)}>View</Button>
                  <Button size="small" onClick={() => navigate(`/finance/payments/new?invoice=${i.invoiceNo}`)}>Record Payment</Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );

  const apTab = (
    <Card variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Supplier</TableCell>
            <TableCell>Bill</TableCell>
            <TableCell align="right">Outstanding</TableCell>
            <TableCell>Due Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {supplierBills.filter((b) => billBalance(b) > 0 && b.status !== 'Draft').map((b) => (
            <TableRow key={b.id} hover>
              <TableCell sx={{ fontWeight: 500 }}>{b.vendorName}</TableCell>
              <TableCell>{b.billNo}</TableCell>
              <TableCell align="right">NPR {billBalance(b).toLocaleString()}</TableCell>
              <TableCell>{b.dueDate}</TableCell>
              <TableCell><StatusChip status={b.status} /></TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => navigate(`/finance/bills/${b.id}`)}>View</Button>
                <Button size="small" onClick={() => navigate(`/finance/payments/new?bill=${b.billNo}`)}>Pay Bill</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader title="Accounting" subtitle="The accounting engine — ledgers, journals and balances" />

      <Grid container spacing={2} columns={12} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid key={kpi.title} size={{ xs: 12, sm: 6, lg: 2.4 }}>
            <KpiCard {...kpi} />
          </Grid>
        ))}
      </Grid>

      <DetailTabs
        tabs={[
          { label: 'Chart of Accounts', content: chartOfAccountsTab },
          { label: 'Journal Entries', content: journalTab },
          { label: 'General Ledger', content: generalLedgerTab },
          { label: 'Accounts Receivable', content: arTab },
          { label: 'Accounts Payable', content: apTab },
        ]}
      />
    </Box>
  );
}
