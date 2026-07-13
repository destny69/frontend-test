import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import PageHeader from '../../components/PageHeader';
import KpiCard from '../../components/KpiCard';
import { useFinance } from '../../store/FinanceStore';
import { exportToCsv } from '../../../shared/exportCsv';

const CASH_ACCOUNT = 'Cash on Hand';

interface CashRow {
  date: string;
  particulars: string;
  reference: string;
  cashIn: number;
  cashOut: number;
}

export default function CashBook() {
  const { payments, advances, journalEntries, chartOfAccounts } = useFinance();

  const closingBalance = chartOfAccounts.find((a) => a.code === '1000')?.balance ?? 0;

  // All real cash movements: cash-method payments, cash-method advances, and any
  // journal entry that touches the 'Cash on Hand' ledger account.
  const movements = useMemo<CashRow[]>(() => {
    const rows: CashRow[] = [];

    payments
      .filter((p) => p.method === 'Cash')
      .forEach((p) => {
        const isIn = p.type === 'Customer Payment';
        rows.push({
          date: p.date,
          particulars: `${p.type} — ${p.partyName}`,
          reference: p.paymentNo,
          cashIn: isIn ? p.amount : 0,
          cashOut: isIn ? 0 : p.amount,
        });
      });

    advances
      .filter((a) => a.method === 'Cash')
      .forEach((a) => {
        const isIn = a.direction === 'Customer';
        rows.push({
          date: a.date,
          particulars: `Advance (${a.direction}) — ${a.partyName}`,
          reference: a.advanceNo,
          cashIn: isIn ? a.amount : 0,
          cashOut: isIn ? 0 : a.amount,
        });
      });

    journalEntries
      .filter((j) => j.debitAccount === CASH_ACCOUNT || j.creditAccount === CASH_ACCOUNT)
      .forEach((j) => {
        const isIn = j.debitAccount === CASH_ACCOUNT;
        rows.push({
          date: j.date,
          particulars: j.description,
          reference: j.journalNo,
          cashIn: isIn ? j.amount : 0,
          cashOut: isIn ? 0 : j.amount,
        });
      });

    return rows.sort((a, b) => a.date.localeCompare(b.date));
  }, [payments, advances, journalEntries]);

  const totalIn = movements.reduce((s, m) => s + m.cashIn, 0);
  const totalOut = movements.reduce((s, m) => s + m.cashOut, 0);
  const netMovement = totalIn - totalOut;
  // Opening derived so the cash book reconciles to the ledger's Cash on Hand balance.
  const openingBalance = closingBalance - netMovement;

  const withRunning = useMemo(() => {
    let running = openingBalance;
    return movements.map((m) => {
      running += m.cashIn - m.cashOut;
      return { ...m, balance: running };
    });
  }, [movements, openingBalance]);

  const exportCashBook = () =>
    exportToCsv(
      'cash-book',
      [
        { header: 'Date', accessor: (r) => r.date },
        { header: 'Particulars', accessor: (r) => r.particulars },
        { header: 'Reference', accessor: (r) => r.reference },
        { header: 'Cash In', accessor: (r) => r.cashIn || '' },
        { header: 'Cash Out', accessor: (r) => r.cashOut || '' },
        { header: 'Balance', accessor: (r) => r.balance },
      ],
      withRunning,
    );

  const kpis = [
    { title: 'Cash on Hand', value: `NPR ${closingBalance.toLocaleString()}`, icon: <PaidRoundedIcon />, color: 'primary' as const },
    { title: 'Total Cash In', value: `NPR ${totalIn.toLocaleString()}`, icon: <TrendingUpRoundedIcon />, color: 'success' as const },
    { title: 'Total Cash Out', value: `NPR ${totalOut.toLocaleString()}`, icon: <TrendingDownRoundedIcon />, color: 'warning' as const },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader title="Cash Book" subtitle="Every cash movement with a running balance, reconciled to the Cash on Hand ledger" />

      <Grid container spacing={2} columns={12} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid key={kpi.title} size={{ xs: 12, sm: 6, lg: 3 }}>
            <KpiCard {...kpi} />
          </Grid>
        ))}
      </Grid>

      <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 1 }}>
        <Button size="small" startIcon={<FileDownloadRoundedIcon />} onClick={exportCashBook}>Export</Button>
      </Stack>

      <Card variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Particulars</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell align="right">Cash In</TableCell>
              <TableCell align="right">Cash Out</TableCell>
              <TableCell align="right">Balance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell colSpan={5} sx={{ fontWeight: 600 }}>Opening Balance</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>NPR {openingBalance.toLocaleString()}</TableCell>
            </TableRow>
            {withRunning.map((m, i) => (
              <TableRow key={i} hover>
                <TableCell>{m.date}</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{m.particulars}</TableCell>
                <TableCell>{m.reference}</TableCell>
                <TableCell align="right">{m.cashIn ? `NPR ${m.cashIn.toLocaleString()}` : '—'}</TableCell>
                <TableCell align="right">{m.cashOut ? `NPR ${m.cashOut.toLocaleString()}` : '—'}</TableCell>
                <TableCell align="right">NPR {m.balance.toLocaleString()}</TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 700 }}>Closing Balance</TableCell>
              <TableCell colSpan={2} />
              <TableCell align="right" sx={{ fontWeight: 700 }}>NPR {totalIn.toLocaleString()}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>NPR {totalOut.toLocaleString()}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>NPR {closingBalance.toLocaleString()}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </Box>
  );
}
