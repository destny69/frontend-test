import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import PageHeader from '../../components/PageHeader';
import FilterBar from '../../components/FilterBar';
import FilterSelect from '../../components/FilterSelect';
import DetailTabs from '../../components/DetailTabs';
import { ExpiryChip, daysUntil, expirySeverity } from '../../components/expiryUtils';
import { MovementChip, SignedQty } from '../../components/movementUtils';
import { useInventory } from '../../store/InventoryStore';
import { warehouses, itemById, warehouseById } from '../../data/mockData';
import { exportToCsv } from '../../../shared/exportCsv';

function ExportBar({ onExport }: { onExport: () => void }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 1 }}>
      <Button size="small" startIcon={<FileDownloadRoundedIcon />} onClick={onExport}>Export</Button>
    </Stack>
  );
}

export default function InventoryReports() {
  const { items, batches, movements } = useInventory();
  const [stockWarehouse, setStockWarehouse] = useState('all');
  const expirySorted = [...batches].sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate));
  // Movement / audit views: newest first, straight off the ledger.
  const movementsDesc = [...movements].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id.localeCompare(a.id)));

  // Stock report rows, scoped to the selected warehouse. An item shows only if it has
  // batch stock in that warehouse, and its quantities/valuation reflect that warehouse.
  const stockRows = items
    .map((it) => {
      const itemBatches = batches.filter(
        (b) => b.itemId === it.id && (stockWarehouse === 'all' || b.warehouseId === stockWarehouse),
      );
      const available = itemBatches.reduce((s, b) => s + b.availableQty, 0);
      const reserved = itemBatches.reduce((s, b) => s + b.reservedQty, 0);
      return { item: it, available, reserved, valuation: Math.round(available * it.averageCost), hasStock: itemBatches.length > 0 };
    })
    .filter((r) => stockWarehouse === 'all' || r.hasStock);

  const stockTab = (
    <Stack spacing={2}>
      <FilterBar>
        <FilterSelect value={stockWarehouse} onChange={(e) => setStockWarehouse(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="all">All Warehouses</MenuItem>
          {warehouses.map((w) => (
            <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
          ))}
        </FilterSelect>
      </FilterBar>
      <ExportBar
        onExport={() =>
          exportToCsv(
            'stock-report',
            [
              { header: 'Product', accessor: (r) => r.item.name },
              { header: 'Category', accessor: (r) => r.item.category },
              { header: 'Available', accessor: (r) => r.available },
              { header: 'Reserved', accessor: (r) => r.reserved },
              { header: 'Valuation', accessor: (r) => r.valuation },
            ],
            stockRows,
          )
        }
      />
      <Card variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Available</TableCell>
              <TableCell align="right">Reserved</TableCell>
              <TableCell align="right">Valuation</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stockRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={{ color: 'text.secondary' }}>No stock in this warehouse.</TableCell>
              </TableRow>
            )}
            {stockRows.map((r) => (
              <TableRow key={r.item.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{r.item.name}</TableCell>
                <TableCell>{r.item.category}</TableCell>
                <TableCell align="right">{r.available.toLocaleString()}</TableCell>
                <TableCell align="right">{r.reserved.toLocaleString()}</TableCell>
                <TableCell align="right">NPR {r.valuation.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Stack>
  );

  const movementTab = (
    <Stack spacing={2}>
      <ExportBar
        onExport={() =>
          exportToCsv(
            'movement-report',
            [
              { header: 'Date', accessor: (m) => m.date },
              { header: 'Type', accessor: (m) => m.type },
              { header: 'Product', accessor: (m) => itemById(m.itemId)?.name ?? '' },
              { header: 'Batch', accessor: (m) => m.batchNumber },
              { header: 'Warehouse', accessor: (m) => warehouseById(m.warehouseId)?.name ?? '' },
              { header: 'Qty', accessor: (m) => m.qty },
              { header: 'Reference', accessor: (m) => m.reference },
              { header: 'By', accessor: (m) => m.by },
            ],
            movementsDesc,
          )
        }
      />
      <Card variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Batch</TableCell>
              <TableCell>Warehouse</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell>Reference</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {movementsDesc.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ color: 'text.secondary' }}>No movements recorded yet.</TableCell>
              </TableRow>
            )}
            {movementsDesc.map((m) => (
              <TableRow key={m.id} hover>
                <TableCell>{m.date}</TableCell>
                <TableCell><MovementChip type={m.type} /></TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{itemById(m.itemId)?.name ?? '—'}</TableCell>
                <TableCell>{m.batchNumber}</TableCell>
                <TableCell>{warehouseById(m.warehouseId)?.name ?? m.warehouseId}</TableCell>
                <TableCell align="right"><SignedQty qty={m.qty} /></TableCell>
                <TableCell>{m.reference}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Stack>
  );

  const auditTab = (
    <Stack spacing={2}>
      <ExportBar
        onExport={() =>
          exportToCsv(
            'audit-trail',
            [
              { header: 'Ref', accessor: (m) => m.id },
              { header: 'Date', accessor: (m) => m.date },
              { header: 'Action', accessor: (m) => m.type },
              { header: 'Product', accessor: (m) => itemById(m.itemId)?.name ?? '' },
              { header: 'Batch', accessor: (m) => m.batchNumber },
              { header: 'Warehouse', accessor: (m) => warehouseById(m.warehouseId)?.name ?? '' },
              { header: 'Qty', accessor: (m) => m.qty },
              { header: 'Reference', accessor: (m) => m.reference },
              { header: 'By', accessor: (m) => m.by },
            ],
            movementsDesc,
          )
        }
      />
      <Card variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Ref</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Product · Batch</TableCell>
              <TableCell>Warehouse</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell>By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {movementsDesc.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} sx={{ color: 'text.secondary' }}>No audit records yet.</TableCell>
              </TableRow>
            )}
            {movementsDesc.map((m) => (
              <TableRow key={m.id} hover>
                <TableCell sx={{ fontFamily: 'monospace' }}>{m.id}</TableCell>
                <TableCell>{m.date}</TableCell>
                <TableCell><MovementChip type={m.type} /></TableCell>
                <TableCell>{(itemById(m.itemId)?.name ?? '—') + ' · ' + m.batchNumber}</TableCell>
                <TableCell>{warehouseById(m.warehouseId)?.name ?? m.warehouseId}</TableCell>
                <TableCell align="right"><SignedQty qty={m.qty} /></TableCell>
                <TableCell>{m.reference}</TableCell>
                <TableCell>{m.by || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Stack>
  );

  const batchTab = (
    <Stack spacing={2}>
      <ExportBar
        onExport={() =>
          exportToCsv(
            'batch-report',
            [
              { header: 'Batch', accessor: (b) => b.batchNumber },
              { header: 'Product', accessor: (b) => itemById(b.itemId)?.name ?? '' },
              { header: 'Supplier', accessor: (b) => b.supplierName },
              { header: 'Mfg Date', accessor: (b) => b.manufacturingDate },
              { header: 'Expiry', accessor: (b) => b.expiryDate },
              { header: 'Valuation', accessor: (b) => { const it = itemById(b.itemId); return it ? Math.round(it.averageCost * b.availableQty) : 0; } },
            ],
            batches,
          )
        }
      />
      <Card variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Batch</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Mfg Date</TableCell>
              <TableCell>Expiry</TableCell>
              <TableCell align="right">Valuation</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {batches.map((b) => {
              const item = itemById(b.itemId);
              return (
                <TableRow key={b.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{b.batchNumber}</TableCell>
                  <TableCell>{item?.name}</TableCell>
                  <TableCell>{b.supplierName}</TableCell>
                  <TableCell>{b.manufacturingDate}</TableCell>
                  <TableCell>{b.expiryDate}</TableCell>
                  <TableCell align="right">NPR {item ? Math.round(item.averageCost * b.availableQty).toLocaleString() : 0}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </Stack>
  );

  const expiryTab = (
    <Stack spacing={2}>
      <ExportBar
        onExport={() =>
          exportToCsv(
            'expiry-report',
            [
              { header: 'Product', accessor: (b) => itemById(b.itemId)?.name ?? '' },
              { header: 'Batch', accessor: (b) => b.batchNumber },
              { header: 'Warehouse', accessor: (b) => warehouseById(b.warehouseId)?.name ?? '' },
              { header: 'Available Qty', accessor: (b) => b.availableQty },
              { header: 'Expiry', accessor: (b) => b.expiryDate },
              { header: 'Status', accessor: (b) => expirySeverity(daysUntil(b.expiryDate)).label },
            ],
            expirySorted,
          )
        }
      />
      <Card variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Batch</TableCell>
              <TableCell>Warehouse</TableCell>
              <TableCell align="right">Available Qty</TableCell>
              <TableCell>Expiry</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expirySorted.map((b) => (
                <TableRow key={b.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{itemById(b.itemId)?.name}</TableCell>
                  <TableCell>{b.batchNumber}</TableCell>
                  <TableCell>{warehouseById(b.warehouseId)?.name}</TableCell>
                  <TableCell align="right">{b.availableQty.toLocaleString()}</TableCell>
                  <TableCell>{b.expiryDate}</TableCell>
                  <TableCell><ExpiryChip dateStr={b.expiryDate} /></TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
    </Stack>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Inventory Reports"
        subtitle="Search, filter, export — every report supports PDF/Excel and date ranges"
      />
      <DetailTabs
        tabs={[
          { label: 'Stock Reports', content: stockTab },
          { label: 'Movement Reports', content: movementTab },
          { label: 'Audit Trail', content: auditTab },
          { label: 'Batch Reports', content: batchTab },
          { label: 'Expiry Reports', content: expiryTab },
        ]}
      />
    </Box>
  );
}
