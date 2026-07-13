import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ReceiptRoundedIcon from '@mui/icons-material/ReceiptRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import PageHeader from '../../components/PageHeader';
import KpiCard from '../../components/KpiCard';
import DetailTabs from '../../components/DetailTabs';
import { useFinance } from '../../store/FinanceStore';
import { customerById } from '../../data/mockData';
import { exportToCsv } from '../../../shared/exportCsv';

function lineVat(base: number, vat: number) {
  return (base * vat) / 100;
}

function invoiceVat(lines: { quantity: number; unitPrice: number; discount: number; vat: number }[]) {
  return lines.reduce((s, l) => s + lineVat(l.quantity * l.unitPrice * (1 - l.discount / 100), l.vat), 0);
}
function billVat(lines: { quantity: number; unitCost: number; vat: number }[]) {
  return lines.reduce((s, l) => s + lineVat(l.quantity * l.unitCost, l.vat), 0);
}

export default function TaxesHub() {
  const { invoices, supplierBills } = useFinance();

  // Proforma invoices are not real sales and are excluded from VAT.
  const taxableInvoices = invoices.filter((i) => !['Proforma', 'Cancelled'].includes(i.status));

  const vatCollected = taxableInvoices.reduce((sum, inv) => sum + invoiceVat(inv.lines), 0);
  const vatPaid = supplierBills
    .filter((b) => b.status !== 'Cancelled')
    .reduce((sum, b) => sum + billVat(b.lines), 0);
  const taxPayable = vatCollected - vatPaid;

  // Period VAT summary — Sales VAT vs Purchase VAT vs net payable, grouped by month.
  const vatByPeriod = (() => {
    const map = new Map<string, { salesVat: number; purchaseVat: number }>();
    const bump = (month: string, key: 'salesVat' | 'purchaseVat', amt: number) => {
      const cur = map.get(month) ?? { salesVat: 0, purchaseVat: 0 };
      cur[key] += amt;
      map.set(month, cur);
    };
    taxableInvoices.forEach((i) => bump(i.invoiceDate.slice(0, 7), 'salesVat', invoiceVat(i.lines)));
    supplierBills
      .filter((b) => b.status !== 'Cancelled')
      .forEach((b) => bump(b.invoiceDate.slice(0, 7), 'purchaseVat', billVat(b.lines)));
    return [...map.entries()]
      .map(([month, v]) => ({ month, salesVat: v.salesVat, purchaseVat: v.purchaseVat, net: v.salesVat - v.purchaseVat }))
      .sort((a, b) => a.month.localeCompare(b.month));
  })();

  const exportVatReport = () =>
    exportToCsv(
      'vat-report',
      [
        { header: 'Period', accessor: (r) => r.month },
        { header: 'Sales VAT', accessor: (r) => r.salesVat.toFixed(2) },
        { header: 'Purchase VAT', accessor: (r) => r.purchaseVat.toFixed(2) },
        { header: 'Net VAT Payable', accessor: (r) => r.net.toFixed(2) },
      ],
      vatByPeriod,
    );

  const kpis = [
    { title: 'VAT Collected', value: `NPR ${vatCollected.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: <ReceiptRoundedIcon />, color: 'success' as const },
    { title: 'VAT Paid', value: `NPR ${vatPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: <PaidRoundedIcon />, color: 'primary' as const },
    { title: 'Tax Payable', value: `${taxPayable < 0 ? '-' : ''}NPR ${Math.abs(taxPayable).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: <AccountBalanceWalletRoundedIcon />, color: 'warning' as const },
  ];

  const purchaseVatTab = (
    <Card variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Supplier</TableCell>
            <TableCell>Invoice</TableCell>
            <TableCell align="right">VAT Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {supplierBills.map((b) => {
            const vat = b.lines.reduce((s, l) => s + lineVat(l.quantity * l.unitCost, l.vat), 0);
            return (
              <TableRow key={b.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{b.vendorName}</TableCell>
                <TableCell>{b.billNo}</TableCell>
                <TableCell align="right">NPR {vat.toFixed(2)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );

  const salesVatTab = (
    <Card variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Customer</TableCell>
            <TableCell>Invoice</TableCell>
            <TableCell align="right">VAT Amount</TableCell>
            <TableCell align="right">Collected VAT</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {taxableInvoices.filter((i) => i.lines.length > 0).map((i) => {
            const vat = invoiceVat(i.lines);
            return (
              <TableRow key={i.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{customerById(i.customerId)?.name}</TableCell>
                <TableCell>{i.invoiceNo}</TableCell>
                <TableCell align="right">NPR {vat.toFixed(2)}</TableCell>
                <TableCell align="right">NPR {(i.status === 'Paid' || i.status === 'Partially Paid' ? vat : 0).toFixed(2)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );

  const vatReportTab = (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
        <Button size="small" startIcon={<FileDownloadRoundedIcon />} onClick={exportVatReport}>Export</Button>
      </Stack>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>VAT Return by Period</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell align="right">Sales VAT (output)</TableCell>
                <TableCell align="right">Purchase VAT (input)</TableCell>
                <TableCell align="right">Net VAT Payable</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vatByPeriod.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>No VAT activity</TableCell></TableRow>
              )}
              {vatByPeriod.map((r) => (
                <TableRow key={r.month} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{r.month}</TableCell>
                  <TableCell align="right">NPR {r.salesVat.toFixed(2)}</TableCell>
                  <TableCell align="right">NPR {r.purchaseVat.toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{r.net < 0 ? '-' : ''}${Math.abs(r.net).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            {vatByPeriod.length > 0 && (
              <TableBody>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>NPR {vatCollected.toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>NPR {vatPaid.toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{taxPayable < 0 ? '-' : ''}${Math.abs(taxPayable).toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            )}
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader title="Taxes" subtitle="Automate VAT and tax reporting" />

      <Grid container spacing={2} columns={12} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid key={kpi.title} size={{ xs: 12, sm: 6, lg: 3 }}>
            <KpiCard {...kpi} />
          </Grid>
        ))}
      </Grid>

      <DetailTabs
        tabs={[
          { label: 'VAT Report', content: vatReportTab },
          { label: 'Purchase VAT', content: purchaseVatTab },
          { label: 'Sales VAT', content: salesVatTab },
        ]}
      />
    </Box>
  );
}
