import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import { GridColDef } from '@mui/x-data-grid';
import PageHeader from '../../components/PageHeader';
import FilterBar from '../../components/FilterBar';
import FilterSelect from '../../components/FilterSelect';
import StatusChip from '../../components/StatusChip';
import InventoryDataGrid from '../../components/InventoryDataGrid';
import { ExpiryChip } from '../../components/expiryUtils';
import { printBarcode } from '../../components/Barcode';
import { useInventory } from '../../store/InventoryStore';
import { itemById, warehouseById, warehouses, categories } from '../../data/mockData';
import type { StockType } from '../../data/types';
import { exportToCsv } from '../../../shared/exportCsv';

const stockTypes: StockType[] = ['Raw Material', 'Packaging', 'Work-in-Progress', 'Finished Goods'];

interface ReserveTarget {
  itemId: string;
  warehouseId: string;
  product: string;
  availableQty: number;
}

function RowActions({ stockId, itemId, onReserve }: { stockId: string; itemId: string; onReserve: () => void }) {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const handlePrintBarcode = () => {
    const item = itemById(itemId);
    if (item) {
      printBarcode({ title: item.name, subtitle: `${item.sku} · ${item.category}`, value: item.barcode || item.sku });
    }
    setAnchor(null);
  };

  return (
    <>
      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAnchor(e.currentTarget); }}>
        <MoreVertRoundedIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        <MenuItem onClick={() => { navigate(`/inventory/stock/${stockId}`); setAnchor(null); }}>View Details</MenuItem>
        <MenuItem onClick={() => { navigate('/inventory/transfers/new'); setAnchor(null); }}>Transfer</MenuItem>
        <MenuItem onClick={() => { navigate('/inventory/adjustments/new'); setAnchor(null); }}>Adjust Quantity</MenuItem>
        <MenuItem onClick={() => { onReserve(); setAnchor(null); }}>Reserve Stock</MenuItem>
        <MenuItem onClick={handlePrintBarcode}>Print Barcode</MenuItem>
      </Menu>
    </>
  );
}

export default function StockList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, stockEntries, batches, reserveStock } = useInventory();
  const [warehouse, setWarehouse] = useState('All');
  const [category, setCategory] = useState('All');
  const [stockType, setStockType] = useState('All');
  const [stockLevel, setStockLevel] = useState(searchParams.get('level') ?? 'All');
  const [reserveTarget, setReserveTarget] = useState<ReserveTarget | null>(null);
  const [reserveQty, setReserveQty] = useState(0);

  const rows = useMemo(
    () =>
      stockEntries
        .map((s) => {
          const item = itemById(s.itemId);
          const total = s.availableQty + s.reservedQty;
          // Zero available qty means genuinely out of stock UNLESS it's just awaiting QC
          // release — that's a different, temporary state and shouldn't look identical.
          const level =
            s.pendingInspectionQty > 0
              ? 'Under Inspection'
              : s.availableQty === 0
                ? 'Out of Stock'
                : s.availableQty <= (item?.reorderLevel ?? 0)
                  ? 'Low Stock'
                  : 'In Stock';
          return {
            id: s.id,
            itemId: s.itemId,
            product: item?.name ?? '—',
            sku: item?.sku ?? '—',
            category: item?.category ?? '—',
            stockType: item?.stockType ?? '—',
            batchNumber: s.batchNumber,
            warehouseId: s.warehouseId,
            warehouse: warehouseById(s.warehouseId)?.name ?? '—',
            bin: s.bin,
            availableQty: s.availableQty,
            reservedQty: s.reservedQty,
            totalQty: total,
            expiryDate: s.expiryDate,
            status: level,
          };
        })
        .filter((r) => warehouse === 'All' || r.warehouseId === warehouse)
        .filter((r) => category === 'All' || r.category === category)
        .filter((r) => stockType === 'All' || r.stockType === stockType)
        .filter((r) => stockLevel === 'All' || r.status === stockLevel),
    [stockEntries, warehouse, category, stockType, stockLevel],
  );

  type StockRow = (typeof rows)[number];

  const openReserve = (row: StockRow) => {
    // FEFO reserves across the item's batches at this warehouse, so surface the total on-hand.
    const totalAvailable = batches
      .filter((b) => b.itemId === row.itemId && b.warehouseId === row.warehouseId)
      .reduce((sum, b) => sum + b.availableQty, 0);
    setReserveTarget({
      itemId: row.itemId,
      warehouseId: row.warehouseId,
      product: row.product,
      availableQty: totalAvailable,
    });
    setReserveQty(0);
  };

  const confirmReserve = async () => {
    if (reserveTarget && reserveQty > 0) {
      await reserveStock(reserveTarget.itemId, reserveTarget.warehouseId, reserveQty);
    }
    setReserveTarget(null);
  };

  const handleExport = () => {
    exportToCsv(
      'stock',
      [
        { header: 'Product', accessor: (r) => r.product },
        { header: 'SKU', accessor: (r) => r.sku },
        { header: 'Type', accessor: (r) => r.stockType },
        { header: 'Batch', accessor: (r) => r.batchNumber },
        { header: 'Warehouse', accessor: (r) => r.warehouse },
        { header: 'Location', accessor: (r) => r.bin },
        { header: 'Available Qty', accessor: (r) => r.availableQty },
        { header: 'Reserved Qty', accessor: (r) => r.reservedQty },
        { header: 'Total Qty', accessor: (r) => r.totalQty },
        { header: 'Expiry Date', accessor: (r) => r.expiryDate },
        { header: 'Status', accessor: (r) => r.status },
      ],
      rows,
    );
  };

  const columns: GridColDef[] = [
    {
      field: 'product',
      headerName: 'Product',
      flex: 1.3,
      minWidth: 200,
    },
    { field: 'sku', headerName: 'SKU', flex: 0.7, minWidth: 100 },
    { field: 'stockType', headerName: 'Type', flex: 1, minWidth: 140 },
    { field: 'batchNumber', headerName: 'Batch', flex: 0.8, minWidth: 120 },
    { field: 'warehouse', headerName: 'Warehouse', flex: 1, minWidth: 140 },
    { field: 'bin', headerName: 'Location', flex: 1, minWidth: 150 },
    {
      field: 'availableQty',
      headerName: 'Available Qty',
      minWidth: 120,
      headerAlign: 'right',
      align: 'right',
      valueFormatter: (value: number) => value.toLocaleString(),
    },
    {
      field: 'reservedQty',
      headerName: 'Reserved Qty',
      minWidth: 120,
      headerAlign: 'right',
      align: 'right',
      valueFormatter: (value: number) => value.toLocaleString(),
    },
    {
      field: 'totalQty',
      headerName: 'Total Qty',
      minWidth: 110,
      headerAlign: 'right',
      align: 'right',
      valueFormatter: (value: number) => value.toLocaleString(),
    },
    {
      field: 'expiryDate',
      headerName: 'Expiry Date',
      minWidth: 140,
      renderCell: (params) => <ExpiryChip dateStr={params.value} />,
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 130,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: (params) => <RowActions stockId={params.id as string} itemId={(params.row as StockRow).itemId} onReserve={() => openReserve(params.row as StockRow)} />,
    },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Stock"
        subtitle="Live inventory — one row per batch in one warehouse"
        actions={
          <>
            <Button variant="outlined" startIcon={<FileDownloadRoundedIcon />} onClick={handleExport}>Export</Button>
            <Button variant="outlined" startIcon={<RemoveRoundedIcon />} onClick={() => navigate('/inventory/stock/out')}>Stock Out</Button>
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/inventory/stock/new')}>Stock In</Button>
          </>
        }
      />

      <FilterBar>
        <FilterSelect value={warehouse} onChange={(e) => setWarehouse(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="All">All Warehouses</MenuItem>
          {warehouses.map((w) => (
            <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
          ))}
        </FilterSelect>
        <FilterSelect value={category} onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="All">All Categories</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c} value={c}>{c}</MenuItem>
          ))}
        </FilterSelect>
        <FilterSelect value={stockType} onChange={(e) => setStockType(e.target.value)} sx={{ minWidth: 170 }}>
          <MenuItem value="All">All Stock Types</MenuItem>
          {stockTypes.map((t) => (
            <MenuItem key={t} value={t}>{t}</MenuItem>
          ))}
        </FilterSelect>
        <FilterSelect value={stockLevel} onChange={(e) => setStockLevel(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="All">All Stock Levels</MenuItem>
          <MenuItem value="In Stock">In Stock</MenuItem>
          <MenuItem value="Low Stock">Low Stock</MenuItem>
          <MenuItem value="Out of Stock">Out of Stock</MenuItem>
          <MenuItem value="Under Inspection">Under Inspection</MenuItem>
        </FilterSelect>
      </FilterBar>

      <Card variant="outlined" sx={{ height: 560 }}>
        <InventoryDataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          onRowClick={(params) => navigate(`/inventory/stock/${params.id}`)}
          sx={{ cursor: 'pointer' }}
        />
      </Card>

      <Dialog open={!!reserveTarget} onClose={() => setReserveTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Reserve Stock</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Product"
              value={reserveTarget?.product ?? ''}
              size="small"
              fullWidth
              disabled
            />
            <TextField
              label="Warehouse"
              value={reserveTarget ? (warehouseById(reserveTarget.warehouseId)?.name ?? '') : ''}
              size="small"
              fullWidth
              disabled
            />
            <TextField
              label="Quantity to reserve"
              type="number"
              value={reserveQty}
              onChange={(e) => setReserveQty(Number(e.target.value))}
              size="small"
              fullWidth
              autoFocus
              helperText={reserveTarget ? `${reserveTarget.availableQty.toLocaleString()} available across batches` : ''}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              We'll use the stock that expires soonest first, so nothing goes to waste.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReserveTarget(null)}>Cancel</Button>
          <Button variant="contained" disabled={reserveQty <= 0} onClick={confirmReserve}>Reserve</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
