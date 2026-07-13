import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import MoveToInboxRoundedIcon from '@mui/icons-material/MoveToInboxRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import { GridColDef } from '@mui/x-data-grid';
import PageHeader from '../../components/PageHeader';
import KpiCard from '../../components/KpiCard';
import FilterBar from '../../components/FilterBar';
import FilterSelect from '../../components/FilterSelect';
import InventoryDataGrid from '../../components/InventoryDataGrid';
import { useInventory } from '../../store/InventoryStore';
import { exportToCsv } from '../../../shared/exportCsv';

export default function StockAlerts() {
  const navigate = useNavigate();
  const { items, batches } = useInventory();
  const [filter, setFilter] = useState('All');

  const all = useMemo(
    () =>
      items.map((it) => {
        const onHand = batches.filter((b) => b.itemId === it.id).reduce((s, b) => s + b.availableQty, 0);
        const outOfStock = onHand === 0;
        const belowSafety = onHand > 0 && onHand <= it.safetyStock;
        const low = onHand > 0 && onHand <= it.reorderLevel;
        const overstock = it.maximumStock > 0 && onHand >= it.maximumStock;
        return {
          id: it.id,
          product: it.name,
          sku: it.sku,
          stockType: it.stockType,
          onHand,
          reorderLevel: it.reorderLevel,
          safetyStock: it.safetyStock,
          maximumStock: it.maximumStock,
          uom: it.uom,
          outOfStock,
          belowSafety,
          low,
          overstock,
          hasAlert: outOfStock || low || overstock,
        };
      }),
    [items, batches],
  );

  const rows = useMemo(() => {
    switch (filter) {
      case 'Out of Stock':
        return all.filter((r) => r.outOfStock);
      case 'Below Safety':
        return all.filter((r) => r.belowSafety);
      case 'Low':
        return all.filter((r) => r.low);
      case 'Overstock':
        return all.filter((r) => r.overstock);
      case 'Alerts Only':
        return all.filter((r) => r.hasAlert);
      default:
        return all;
    }
  }, [all, filter]);

  const outOfStock = all.filter((r) => r.outOfStock).length;
  const belowSafety = all.filter((r) => r.belowSafety).length;
  const low = all.filter((r) => r.low).length;
  const overstock = all.filter((r) => r.overstock).length;

  const columns: GridColDef[] = [
    { field: 'product', headerName: 'Product', flex: 1.4, minWidth: 220 },
    { field: 'sku', headerName: 'SKU', flex: 0.7, minWidth: 100 },
    { field: 'stockType', headerName: 'Type', flex: 1, minWidth: 140 },
    { field: 'onHand', headerName: 'On Hand', minWidth: 110, headerAlign: 'right', align: 'right', valueFormatter: (v: number) => v.toLocaleString() },
    { field: 'reorderLevel', headerName: 'Reorder', minWidth: 100, headerAlign: 'right', align: 'right', valueFormatter: (v: number) => v.toLocaleString() },
    { field: 'safetyStock', headerName: 'Safety', minWidth: 100, headerAlign: 'right', align: 'right', valueFormatter: (v: number) => v.toLocaleString() },
    { field: 'maximumStock', headerName: 'Maximum', minWidth: 110, headerAlign: 'right', align: 'right', valueFormatter: (v: number) => v.toLocaleString() },
    {
      field: 'alerts',
      headerName: 'Alerts',
      flex: 1.2,
      minWidth: 220,
      sortable: false,
      renderCell: (params) => {
        const r = params.row as (typeof all)[number];
        return (
          <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap', alignItems: 'center', height: '100%' }}>
            {r.outOfStock && <Chip size="small" color="error" label="Out of Stock" />}
            {r.belowSafety && <Chip size="small" color="error" label="Below Safety" />}
            {r.low && !r.belowSafety && <Chip size="small" color="warning" label="Low" />}
            {r.overstock && <Chip size="small" color="warning" label="Overstock" />}
            {!r.hasAlert && <Chip size="small" color="success" label="OK" />}
          </Stack>
        );
      },
    },
  ];

  const handleExport = () =>
    exportToCsv(
      'stock-alerts',
      [
        { header: 'Product', accessor: (r) => r.product },
        { header: 'SKU', accessor: (r) => r.sku },
        { header: 'Type', accessor: (r) => r.stockType },
        { header: 'On Hand', accessor: (r) => r.onHand },
        { header: 'Reorder', accessor: (r) => r.reorderLevel },
        { header: 'Safety', accessor: (r) => r.safetyStock },
        { header: 'Maximum', accessor: (r) => r.maximumStock },
        { header: 'Out of Stock', accessor: (r) => (r.outOfStock ? 'Yes' : '') },
        { header: 'Below Safety', accessor: (r) => (r.belowSafety ? 'Yes' : '') },
        { header: 'Low', accessor: (r) => (r.low ? 'Yes' : '') },
        { header: 'Overstock', accessor: (r) => (r.overstock ? 'Yes' : '') },
      ],
      rows,
    );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Stock Level Monitoring"
        subtitle="Reorder, safety-stock and overstock alerts derived from live on-hand quantity"
        actions={<Button variant="outlined" startIcon={<FileDownloadRoundedIcon />} onClick={handleExport}>Export</Button>}
      />

      <Grid container spacing={2} columns={12} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard title="Out of Stock" value={`${outOfStock}`} icon={<ErrorOutlineRoundedIcon />} color="error" helper="On hand = 0" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard title="Below Safety Stock" value={`${belowSafety}`} icon={<ShieldRoundedIcon />} color="error" helper="At or below safety level" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard title="Low Stock" value={`${low}`} icon={<WarningAmberRoundedIcon />} color="warning" helper="At or below reorder level" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard title="Overstock" value={`${overstock}`} icon={<MoveToInboxRoundedIcon />} color="warning" helper="At or above maximum" />
        </Grid>
      </Grid>

      <FilterBar>
        <FilterSelect value={filter} onChange={(e) => setFilter(e.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="All">All Items</MenuItem>
          <MenuItem value="Alerts Only">Alerts Only</MenuItem>
          <MenuItem value="Out of Stock">Out of Stock</MenuItem>
          <MenuItem value="Below Safety">Below Safety</MenuItem>
          <MenuItem value="Low">Low</MenuItem>
          <MenuItem value="Overstock">Overstock</MenuItem>
        </FilterSelect>
      </FilterBar>

      <Card variant="outlined" sx={{ height: 520 }}>
        <InventoryDataGrid
          rows={rows}
          columns={columns}
          onRowClick={(params) => navigate(`/inventory/items/${params.id}`)}
          sx={{ cursor: 'pointer' }}
        />
      </Card>
    </Box>
  );
}
