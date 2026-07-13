import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Rating from '@mui/material/Rating';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import PageHeader from '../../components/PageHeader';
import DetailTabs from '../../components/DetailTabs';
import { useProcurement } from '../../store/ProcurementStore';
import { vendorPerformance } from '../../data/vendorPerformance';
import { exportToCsv } from '../../../shared/exportCsv';
import type { PurchaseOrder, Vendor } from '../../data/types';

function PendingTable({
  title,
  rows,
  onClick,
}: {
  title: string;
  rows: { id: string; a: string; b: string; c: string }[];
  onClick: (id: string) => void;
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>{title}</Typography>
        <Table size="small">
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => onClick(r.id)}>
                <TableCell sx={{ fontWeight: 500 }}>{r.a}</TableCell>
                <TableCell>{r.b}</TableCell>
                <TableCell align="right" sx={{ color: 'text.secondary' }}>{r.c}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell sx={{ color: 'text.secondary' }}>Nothing pending</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

type CostGroup = 'category' | 'vendor' | 'department';

// Group real (non-cancelled) purchase-order spend by the selected dimension.
function CostAnalysisPanel({
  purchaseOrders,
  vendors,
}: {
  purchaseOrders: PurchaseOrder[];
  vendors: Vendor[];
}) {
  const [group, setGroup] = useState<CostGroup>('category');

  const rows = useMemo(() => {
    const active = purchaseOrders.filter((p) => p.status !== 'Cancelled');
    const map = new Map<string, { orders: number; total: number }>();
    for (const po of active) {
      let key = po.department;
      if (group === 'vendor') key = po.vendorName;
      else if (group === 'category') {
        key = vendors.find((v) => v.id === po.vendorId)?.category ?? 'Uncategorised';
      }
      const cur = map.get(key) ?? { orders: 0, total: 0 };
      cur.orders += 1;
      cur.total += po.amount;
      map.set(key, cur);
    }
    return Array.from(map.entries())
      .map(([label, v]) => ({ label, orders: v.orders, total: v.total }))
      .sort((a, b) => b.total - a.total);
  }, [purchaseOrders, vendors, group]);

  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);

  const exportCost = () =>
    exportToCsv(
      `cost-analysis-by-${group}`,
      [
        { header: group[0].toUpperCase() + group.slice(1), accessor: (r) => r.label },
        { header: 'Orders', accessor: (r) => r.orders },
        { header: 'Total Spend', accessor: (r) => r.total.toFixed(2) },
      ],
      rows,
    );

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <ToggleButtonGroup size="small" exclusive value={group} onChange={(_, v) => v && setGroup(v)}>
            <ToggleButton value="category">By Category</ToggleButton>
            <ToggleButton value="vendor">By Vendor</ToggleButton>
            <ToggleButton value="department">By Department</ToggleButton>
          </ToggleButtonGroup>
          <Button variant="outlined" size="small" startIcon={<FileDownloadRoundedIcon />} onClick={exportCost}>
            Export CSV
          </Button>
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{group[0].toUpperCase() + group.slice(1)}</TableCell>
              <TableCell align="right">Orders</TableCell>
              <TableCell align="right">Total Spend</TableCell>
              <TableCell align="right">Share</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={4} sx={{ color: 'text.secondary' }}>No purchase orders</TableCell></TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.label} hover>
                <TableCell sx={{ fontWeight: 500 }}>{r.label}</TableCell>
                <TableCell align="right">{r.orders}</TableCell>
                <TableCell align="right">NPR {r.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                <TableCell align="right">{grandTotal ? Math.round((r.total / grandTotal) * 100) : 0}%</TableCell>
              </TableRow>
            ))}
            {rows.length > 0 && (
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{rows.reduce((s, r) => s + r.orders, 0)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>NPR {grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>100%</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function ProcurementReports() {
  const navigate = useNavigate();
  const { requisitions, rfqs, purchaseOrders, grns, vendors, procurementEvents } = useProcurement();

  const vendorPerf = useMemo(
    () =>
      vendors
        .map((v) => ({ vendor: v, perf: vendorPerformance(v.id, purchaseOrders, grns) }))
        .filter((row) => row.perf.totalOrders > 0)
        .sort((a, b) => (b.perf.rating ?? -1) - (a.perf.rating ?? -1)),
    [vendors, purchaseOrders, grns],
  );

  const exportPurchases = () =>
    exportToCsv(
      'purchase-orders',
      [
        { header: 'PO Number', accessor: (p) => p.poNumber },
        { header: 'Vendor', accessor: (p) => p.vendorName },
        { header: 'Date', accessor: (p) => p.date },
        { header: 'Expected Delivery', accessor: (p) => p.expectedDelivery },
        { header: 'Department', accessor: (p) => p.department },
        { header: 'Amount', accessor: (p) => p.amount },
        { header: 'Status', accessor: (p) => p.status },
      ],
      purchaseOrders,
    );

  const exportVendorPerf = () =>
    exportToCsv(
      'vendor-performance',
      [
        { header: 'Vendor', accessor: (r) => r.vendor.name },
        { header: 'Orders', accessor: (r) => r.perf.totalOrders },
        { header: 'Total Purchase', accessor: (r) => r.perf.totalPurchase.toFixed(2) },
        { header: 'On-Time %', accessor: (r) => (r.perf.onTimePct ?? '') },
        { header: 'Avg Lead Days', accessor: (r) => (r.perf.avgLeadDays ?? '') },
        { header: 'Rejected %', accessor: (r) => (r.perf.rejectedPct ?? '') },
        { header: 'Rating', accessor: (r) => (r.perf.rating ?? r.perf.ratingLabel ?? '') },
      ],
      vendorPerf,
    );

  const exportAudit = () =>
    exportToCsv(
      'procurement-audit-log',
      [
        { header: 'Date', accessor: (e) => e.date },
        { header: 'Type', accessor: (e) => e.type },
        { header: 'Entity', accessor: (e) => e.entity },
        { header: 'Reference', accessor: (e) => e.ref },
        { header: 'By', accessor: (e) => e.by },
      ],
      procurementEvents,
    );

  const pendingTab = (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <PendingTable
          title="Pending Requisitions"
          rows={requisitions.filter((r) => ['Submitted', 'Pending Approval', 'Draft'].includes(r.status)).map((r) => ({ id: r.id, a: r.requestNo, b: r.department, c: r.status }))}
          onClick={(id) => navigate(`/procurement/requisitions/${id}`)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <PendingTable
          title="Pending RFQs"
          rows={rfqs.filter((r) => ['Sent', 'Receiving Quotes'].includes(r.status)).map((r) => ({ id: r.id, a: r.rfqNo, b: r.title, c: r.status }))}
          onClick={(id) => navigate(`/procurement/rfqs/${id}`)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <PendingTable
          title="Pending Purchase Orders"
          rows={purchaseOrders.filter((p) => ['Pending Approval', 'Draft'].includes(p.status)).map((p) => ({ id: p.id, a: p.poNumber, b: p.vendorName, c: p.status }))}
          onClick={(id) => navigate(`/procurement/purchase-orders/${id}`)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <PendingTable
          title="Pending Deliveries"
          rows={grns.filter((g) => ['Pending', 'Inspection'].includes(g.status)).map((g) => ({ id: g.id, a: g.grnNumber, b: g.vendorName, c: g.status }))}
          onClick={(id) => navigate(`/procurement/grn/${id}`)}
        />
      </Grid>
    </Grid>
  );

  const vendorPerfTab = (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2">Vendor Performance (vendors with orders)</Typography>
          <Button variant="outlined" size="small" startIcon={<FileDownloadRoundedIcon />} onClick={exportVendorPerf}>
            Export CSV
          </Button>
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Vendor</TableCell>
              <TableCell align="right">Orders</TableCell>
              <TableCell align="right">Total Purchase</TableCell>
              <TableCell align="right">On-Time %</TableCell>
              <TableCell align="right">Avg Lead Days</TableCell>
              <TableCell align="right">Rejected %</TableCell>
              <TableCell align="right">Rating</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vendorPerf.length === 0 && (
              <TableRow><TableCell colSpan={7} sx={{ color: 'text.secondary' }}>No vendors with orders yet</TableCell></TableRow>
            )}
            {vendorPerf.map(({ vendor, perf }) => (
              <TableRow key={vendor.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/procurement/vendors/${vendor.id}`)}>
                <TableCell sx={{ fontWeight: 500 }}>{vendor.name}</TableCell>
                <TableCell align="right">{perf.totalOrders}</TableCell>
                <TableCell align="right">NPR {perf.totalPurchase.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                <TableCell align="right">{perf.onTimePct === null ? '—' : `${perf.onTimePct}%`}</TableCell>
                <TableCell align="right">{perf.avgLeadDays === null ? '—' : perf.avgLeadDays}</TableCell>
                <TableCell align="right">{perf.rejectedPct === null ? '—' : `${perf.rejectedPct}%`}</TableCell>
                <TableCell align="right">
                  {perf.rating === null ? (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{perf.ratingLabel}</Typography>
                  ) : (
                    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Rating value={perf.rating} precision={0.1} max={5} size="small" readOnly />
                      <Typography variant="caption">{perf.rating.toFixed(1)}</Typography>
                    </Stack>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const costTab = <CostAnalysisPanel purchaseOrders={purchaseOrders} vendors={vendors} />;

  const auditTab = (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2">Audit Log ({procurementEvents.length} events this session)</Typography>
          <Button variant="outlined" size="small" startIcon={<FileDownloadRoundedIcon />} disabled={procurementEvents.length === 0} onClick={exportAudit}>
            Export CSV
          </Button>
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date / Time</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell>By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {procurementEvents.length === 0 && (
              <TableRow><TableCell colSpan={5} sx={{ color: 'text.secondary' }}>No events yet — create, approve, amend, award or receive to populate the trail</TableCell></TableRow>
            )}
            {procurementEvents.map((e) => (
              <TableRow key={e.id} hover>
                <TableCell>{new Date(e.date).toLocaleString()}</TableCell>
                <TableCell>{e.type}</TableCell>
                <TableCell>{e.entity}</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{e.ref}</TableCell>
                <TableCell>{e.by}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Procurement Reports"
        subtitle="Live metrics derived from current procurement data"
        actions={
          <Button variant="outlined" startIcon={<FileDownloadRoundedIcon />} onClick={exportPurchases}>
            Export Purchase Orders (CSV)
          </Button>
        }
      />
      <DetailTabs
        tabs={[
          { label: 'Pending Items', content: pendingTab },
          { label: 'Vendor Performance', content: vendorPerfTab },
          { label: 'Cost Analysis', content: costTab },
          { label: 'Audit', content: auditTab },
        ]}
      />
    </Box>
  );
}
