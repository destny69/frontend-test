import { useMemo } from 'react';
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
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import PageHeader from '../../components/PageHeader';
import KpiCard from '../../components/KpiCard';
import DetailTabs from '../../components/DetailTabs';
import { useFinance } from '../../store/FinanceStore';
import { exportToCsv } from '../../../shared/exportCsv';

function ExportBar({ onExport }: { onExport: () => void }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 1 }}>
      <Button size="small" startIcon={<FileDownloadRoundedIcon />} onClick={onExport}>Export</Button>
    </Stack>
  );
}

const EXCLUDED_INVOICE_STATUSES = ['Draft', 'Proforma', 'Cancelled'];

export default function AnalyticsHub() {
  const { invoices, journalEntries, chartOfAccounts } = useFinance();

  // Revenue by product — real, from recognised (non-draft/proforma) invoice lines.
  const revenueByProduct = useMemo(() => {
    const map = new Map<string, { units: number; revenue: number }>();
    invoices
      .filter((i) => !EXCLUDED_INVOICE_STATUSES.includes(i.status))
      .flatMap((i) => i.lines)
      .forEach((l) => {
        const net = l.quantity * l.unitPrice * (1 - l.discount / 100);
        const cur = map.get(l.product) ?? { units: 0, revenue: 0 };
        map.set(l.product, { units: cur.units + l.quantity, revenue: cur.revenue + net });
      });
    return [...map.entries()].map(([product, v]) => ({ product, ...v })).sort((a, b) => b.revenue - a.revenue);
  }, [invoices]);

  const revenueAccounts = chartOfAccounts.filter((a) => a.type === 'Revenue');
  const expenseAccounts = chartOfAccounts.filter((a) => a.type === 'Expense');
  const totalRevenue = revenueAccounts.reduce((s, a) => s + a.balance, 0);
  const totalExpense = expenseAccounts.reduce((s, a) => s + a.balance, 0);

  // Cost-centre report — group posted journal amounts by cost centre.
  const byCostCenter = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    journalEntries.forEach((j) => {
      const key = j.costCenter ?? 'Unassigned';
      const cur = map.get(key) ?? { count: 0, total: 0 };
      map.set(key, { count: cur.count + 1, total: cur.total + j.amount });
    });
    return [...map.entries()].map(([costCenter, v]) => ({ costCenter, ...v })).sort((a, b) => b.total - a.total);
  }, [journalEntries]);

  const kpis = [
    { title: 'Total Revenue', value: `NPR ${totalRevenue.toLocaleString()}`, icon: <TrendingUpRoundedIcon />, color: 'success' as const },
    { title: 'Total Expense', value: `NPR ${totalExpense.toLocaleString()}`, icon: <TrendingDownRoundedIcon />, color: 'warning' as const },
    { title: 'Cost Centres', value: `${byCostCenter.filter((c) => c.costCenter !== 'Unassigned').length}`, icon: <AccountTreeRoundedIcon />, color: 'primary' as const },
  ];

  const revenueTab = (
    <Stack spacing={2}>
      <ExportBar
        onExport={() =>
          exportToCsv(
            'revenue-analysis',
            [
              { header: 'Product', accessor: (r) => r.product },
              { header: 'Units', accessor: (r) => r.units },
              { header: 'Revenue', accessor: (r) => r.revenue.toFixed(2) },
            ],
            revenueByProduct,
          )
        }
      />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>Revenue by Product</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow><TableCell>Product</TableCell><TableCell align="right">Units</TableCell><TableCell align="right">Revenue</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {revenueByProduct.length === 0 && (
                    <TableRow><TableCell colSpan={3} align="center" sx={{ color: 'text.secondary' }}>No recognised revenue</TableCell></TableRow>
                  )}
                  {revenueByProduct.map((r) => (
                    <TableRow key={r.product} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{r.product}</TableCell>
                      <TableCell align="right">{r.units.toLocaleString()}</TableCell>
                      <TableCell align="right">NPR {r.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>Revenue Accounts</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow><TableCell>Account</TableCell><TableCell align="right">Balance</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {revenueAccounts.map((a) => (
                    <TableRow key={a.code} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{a.name}</TableCell>
                      <TableCell align="right">NPR {a.balance.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );

  const expenseTab = (
    <Stack spacing={2}>
      <ExportBar
        onExport={() =>
          exportToCsv(
            'expense-analysis',
            [
              { header: 'Account', accessor: (a) => a.name },
              { header: 'Balance', accessor: (a) => a.balance },
            ],
            expenseAccounts,
          )
        }
      />
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>Expense Accounts</Typography>
          <Table size="small">
            <TableHead>
              <TableRow><TableCell>Account</TableCell><TableCell align="right">Balance</TableCell><TableCell align="right">% of Total</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {expenseAccounts.map((a) => (
                <TableRow key={a.code} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{a.name}</TableCell>
                  <TableCell align="right">NPR {a.balance.toLocaleString()}</TableCell>
                  <TableCell align="right">{totalExpense ? ((a.balance / totalExpense) * 100).toFixed(1) : '0.0'}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );

  const costCenterTab = (
    <Stack spacing={2}>
      <ExportBar
        onExport={() =>
          exportToCsv(
            'cost-center-report',
            [
              { header: 'Cost Centre', accessor: (r) => r.costCenter },
              { header: 'Entries', accessor: (r) => r.count },
              { header: 'Total', accessor: (r) => r.total },
            ],
            byCostCenter,
          )
        }
      />
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>Journal Amounts by Cost Centre</Typography>
          <Table size="small">
            <TableHead>
              <TableRow><TableCell>Cost Centre</TableCell><TableCell align="right">Entries</TableCell><TableCell align="right">Total Amount</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {byCostCenter.map((r) => (
                <TableRow key={r.costCenter} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{r.costCenter}</TableCell>
                  <TableCell align="right">{r.count}</TableCell>
                  <TableCell align="right">NPR {r.total.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader title="Analytics" subtitle="Revenue, expense and cost-centre analysis derived from live records" />

      <Grid container spacing={2} columns={12} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid key={kpi.title} size={{ xs: 12, sm: 6, lg: 3 }}>
            <KpiCard {...kpi} />
          </Grid>
        ))}
      </Grid>

      <DetailTabs
        tabs={[
          { label: 'Revenue Analysis', content: revenueTab },
          { label: 'Expense Analysis', content: expenseTab },
          { label: 'Cost Centre Report', content: costCenterTab },
        ]}
      />
    </Box>
  );
}
