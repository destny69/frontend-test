import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
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
import { warehouseById, warehouses } from '../../data/mockData';
import type { AdjustmentReason } from '../../data/types';

const reasons: AdjustmentReason[] = ['Damage', 'Loss', 'Theft', 'Counting Error', 'Expired Items', 'Quality Rejection'];

const columns: GridColDef[] = [
  { field: 'adjustmentNo', headerName: 'Adjustment No.', flex: 1, minWidth: 150 },
  { field: 'warehouse', headerName: 'Warehouse', flex: 1, minWidth: 150 },
  { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 140 },
  { field: 'date', headerName: 'Date', flex: 1, minWidth: 120 },
  { field: 'createdBy', headerName: 'Created By', flex: 1, minWidth: 130 },
  {
    field: 'status',
    headerName: 'Status',
    minWidth: 150,
    renderCell: (params) => <StatusChip status={params.value} />,
  },
];

export default function AdjustmentList() {
  const navigate = useNavigate();
  const { loading, adjustments } = useInventory();
  const [warehouse, setWarehouse] = useState('All');
  const [reason, setReason] = useState('All');

  const rows = useMemo(
    () =>
      adjustments
        .filter((a) => warehouse === 'All' || a.warehouseId === warehouse)
        .filter((a) => reason === 'All' || a.reason === reason)
        .map((a) => ({
          id: a.id,
          adjustmentNo: a.adjustmentNo,
          warehouse: warehouseById(a.warehouseId)?.name ?? '—',
          reason: a.reason,
          date: a.date,
          createdBy: a.createdBy,
          status: a.status,
        })),
    [adjustments, warehouse, reason],
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Stock Adjustment"
        subtitle="Used when physical stock differs from system stock"
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/inventory/adjustments/new')}>
            Create Adjustment
          </Button>
        }
      />

      <FilterBar>
        <FilterSelect value={warehouse} onChange={(e) => setWarehouse(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="All">All Warehouses</MenuItem>
          {warehouses.map((w) => (
            <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
          ))}
        </FilterSelect>
        <FilterSelect value={reason} onChange={(e) => setReason(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="All">All Reasons</MenuItem>
          {reasons.map((r) => (
            <MenuItem key={r} value={r}>{r}</MenuItem>
          ))}
        </FilterSelect>
      </FilterBar>

      <Card variant="outlined" sx={{ height: 560 }}>
        <InventoryDataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          onRowClick={(params) => navigate(`/inventory/adjustments/${params.id}`)}
          sx={{ cursor: 'pointer' }}
        />
      </Card>
    </Box>
  );
}
