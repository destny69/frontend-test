import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
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
import { MovementChip, SignedQty } from '../../components/movementUtils';
import { useInventory } from '../../store/InventoryStore';
import { itemById, warehouseById, warehouses } from '../../data/mockData';
import { exportToCsv } from '../../../shared/exportCsv';

export default function StockLedger() {
  const { items, movements, batches } = useInventory();
  const [searchParams] = useSearchParams();
  const itemParam = searchParams.get('item');
  const batchParam = searchParams.get('batch');
  // Pre-select from deep links: ?item=<id> selects that product; ?batch=<number>
  // selects the batch and the product that owns it.
  const initialItemId =
    (itemParam && items.some((it) => it.id === itemParam) ? itemParam : '') ||
    (batchParam ? batches.find((b) => b.batchNumber === batchParam)?.itemId ?? '' : '') ||
    items[0]?.id ||
    '';
  const [itemId, setItemId] = useState(initialItemId);
  const [warehouse, setWarehouse] = useState('All');
  const [batch, setBatch] = useState(batchParam ?? 'All');

  // Batch numbers available for the selected item (drives the batch filter).
  const batchNumbers = useMemo(
    () => Array.from(new Set(movements.filter((m) => m.itemId === itemId).map((m) => m.batchNumber))).sort(),
    [movements, itemId],
  );

  // Per-item running ledger: chronological, with a running balance of signed qty.
  const rows = useMemo(() => {
    const filtered = movements
      .filter((m) => m.itemId === itemId)
      .filter((m) => warehouse === 'All' || m.warehouseId === warehouse)
      .filter((m) => batch === 'All' || m.batchNumber === batch)
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id.localeCompare(b.id)));
    let balance = 0;
    return filtered.map((m) => {
      balance += m.qty;
      return { ...m, balance, warehouseName: warehouseById(m.warehouseId)?.name ?? m.warehouseId };
    });
  }, [movements, itemId, warehouse, batch]);

  const item = itemById(itemId);

  const handleExport = () =>
    exportToCsv(
      'stock-ledger',
      [
        { header: 'Date', accessor: (r) => r.date },
        { header: 'Type', accessor: (r) => r.type },
        { header: 'Batch', accessor: (r) => r.batchNumber },
        { header: 'Warehouse', accessor: (r) => r.warehouseName },
        { header: 'Reference', accessor: (r) => r.reference },
        { header: 'Qty', accessor: (r) => r.qty },
        { header: 'Balance', accessor: (r) => r.balance },
        { header: 'By', accessor: (r) => r.by },
      ],
      rows,
    );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Stock Ledger"
        subtitle="Running per-item movement history — every in, out, transfer, adjustment and write-off"
        actions={<Button variant="outlined" startIcon={<FileDownloadRoundedIcon />} onClick={handleExport}>Export</Button>}
      />

      <FilterBar>
        <FilterSelect value={itemId} onChange={(e) => { setItemId(e.target.value); setBatch('All'); }} sx={{ minWidth: 240 }}>
          {items.map((it) => (
            <MenuItem key={it.id} value={it.id}>{it.name}</MenuItem>
          ))}
        </FilterSelect>
        <FilterSelect value={warehouse} onChange={(e) => setWarehouse(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="All">All Warehouses</MenuItem>
          {warehouses.map((w) => (
            <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
          ))}
        </FilterSelect>
        <FilterSelect value={batch} onChange={(e) => setBatch(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="All">All Batches</MenuItem>
          {batchNumbers.map((b) => (
            <MenuItem key={b} value={b}>{b}</MenuItem>
          ))}
        </FilterSelect>
      </FilterBar>

      <Card variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Batch</TableCell>
              <TableCell>Warehouse</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Balance</TableCell>
              <TableCell>By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} sx={{ color: 'text.secondary' }}>
                  No recorded movements for this selection.
                </TableCell>
              </TableRow>
            )}
            {rows.map((m) => (
              <TableRow key={m.id} hover>
                <TableCell>{m.date}</TableCell>
                <TableCell><MovementChip type={m.type} /></TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{m.batchNumber}</TableCell>
                <TableCell>{m.warehouseName}</TableCell>
                <TableCell>{m.reference}</TableCell>
                <TableCell align="right"><SignedQty qty={m.qty} /></TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {m.balance.toLocaleString()} {item?.uom ?? ''}
                </TableCell>
                <TableCell>{m.by || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Box>
  );
}
