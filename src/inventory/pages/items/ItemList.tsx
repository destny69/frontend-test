import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { GridColDef } from '@mui/x-data-grid';
import PageHeader from '../../components/PageHeader';
import FilterBar from '../../components/FilterBar';
import FilterSelect from '../../components/FilterSelect';
import StatusChip from '../../components/StatusChip';
import InventoryDataGrid from '../../components/InventoryDataGrid';
import { useInventory } from '../../store/InventoryStore';
import { warehouses, categories, brands } from '../../data/mockData';
import type { StockType } from '../../data/types';

const stockTypes: StockType[] = ['Raw Material', 'Packaging', 'Work-in-Progress', 'Finished Goods'];

const columns: GridColDef[] = [
  { field: 'sku', headerName: 'SKU', flex: 0.8, minWidth: 110 },
  { field: 'name', headerName: 'Product Name', flex: 1.4, minWidth: 220 },
  { field: 'category', headerName: 'Category', flex: 1, minWidth: 120 },
  { field: 'stockType', headerName: 'Type', flex: 1, minWidth: 140 },
  { field: 'brand', headerName: 'Brand', flex: 1, minWidth: 120 },
  { field: 'uom', headerName: 'UOM', width: 80 },
  {
    field: 'currentStock',
    headerName: 'Current Stock',
    minWidth: 130,
    headerAlign: 'right',
    align: 'right',
    valueFormatter: (value: number) => value.toLocaleString(),
  },
  { field: 'warehouse', headerName: 'Warehouse', flex: 1, minWidth: 150 },
  {
    field: 'status',
    headerName: 'Status',
    flex: 1.1,
    minWidth: 200,
    renderCell: (params) => {
      const row = params.row as { currentStock: number; reorderLevel: number };
      const lowStock = row.currentStock <= row.reorderLevel;
      return (
        <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap', alignItems: 'center', height: '100%' }}>
          <StatusChip status={params.value} />
          {lowStock && <Chip size="small" color="warning" label="Low Stock" />}
        </Stack>
      );
    },
  },
];

export default function ItemList() {
  const navigate = useNavigate();
  const { loading, items, batches } = useInventory();
  const [category, setCategory] = useState('All');
  const [warehouse, setWarehouse] = useState('All');
  const [status, setStatus] = useState('All');
  const [brand, setBrand] = useState('All');
  const [stockType, setStockType] = useState('All');

  const rows = useMemo(
    () =>
      items
        .filter((it) => category === 'All' || it.category === category)
        .filter((it) => status === 'All' || it.status === status)
        .filter((it) => brand === 'All' || it.brand === brand)
        .filter((it) => stockType === 'All' || it.stockType === stockType)
        .map((it) => {
          const itemBatches = batches.filter((b) => b.itemId === it.id);
          const currentStock = itemBatches.reduce((sum, b) => sum + b.availableQty, 0);
          const primaryWarehouseId = itemBatches[0]?.warehouseId;
          const wh = warehouses.find((w) => w.id === primaryWarehouseId);
          return {
            id: it.id,
            sku: it.sku,
            name: it.name,
            category: it.category,
            stockType: it.stockType,
            brand: it.brand,
            uom: it.uom,
            currentStock,
            reorderLevel: it.reorderLevel,
            warehouse: wh?.name ?? '—',
            warehouseId: primaryWarehouseId ?? '',
            status: it.status,
          };
        })
        .filter((row) => warehouse === 'All' || row.warehouseId === warehouse),
    [items, batches, category, warehouse, status, brand, stockType],
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Item Master"
        subtitle="Master database for every product tracked in inventory"
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/inventory/items/new')}>
            Add Product
          </Button>
        }
      />

      <FilterBar>
        <FilterSelect value={category} onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="All">All Categories</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c} value={c}>{c}</MenuItem>
          ))}
        </FilterSelect>
        <FilterSelect value={warehouse} onChange={(e) => setWarehouse(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="All">All Warehouses</MenuItem>
          {warehouses.map((w) => (
            <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
          ))}
        </FilterSelect>
        <FilterSelect value={stockType} onChange={(e) => setStockType(e.target.value)} sx={{ minWidth: 170 }}>
          <MenuItem value="All">All Stock Types</MenuItem>
          {stockTypes.map((t) => (
            <MenuItem key={t} value={t}>{t}</MenuItem>
          ))}
        </FilterSelect>
        <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="All">All Statuses</MenuItem>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Inactive">Inactive</MenuItem>
        </FilterSelect>
        <FilterSelect value={brand} onChange={(e) => setBrand(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="All">All Brands</MenuItem>
          {brands.map((b) => (
            <MenuItem key={b} value={b}>{b}</MenuItem>
          ))}
        </FilterSelect>
      </FilterBar>

      <Card variant="outlined" sx={{ height: 560 }}>
        <InventoryDataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          onRowClick={(params) => navigate(`/inventory/items/${params.id}`)}
          sx={{ cursor: 'pointer' }}
        />
      </Card>
    </Box>
  );
}
