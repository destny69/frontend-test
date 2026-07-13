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
import type { TransferStatus } from '../../data/types';

const statuses: TransferStatus[] = ['Draft', 'Pending Approval', 'Approved', 'In Transit', 'Completed', 'Cancelled'];

const columns: GridColDef[] = [
  { field: 'transferNumber', headerName: 'Transfer Number', flex: 1, minWidth: 160 },
  { field: 'fromWarehouse', headerName: 'From Warehouse', flex: 1, minWidth: 160 },
  { field: 'toWarehouse', headerName: 'To Warehouse', flex: 1, minWidth: 160 },
  { field: 'requestedBy', headerName: 'Created By', flex: 1, minWidth: 130 },
  { field: 'transferDate', headerName: 'Transfer Date', flex: 1, minWidth: 130 },
  {
    field: 'status',
    headerName: 'Status',
    minWidth: 150,
    renderCell: (params) => <StatusChip status={params.value} />,
  },
];

export default function TransferList() {
  const navigate = useNavigate();
  const { loading, transfers } = useInventory();
  const [warehouse, setWarehouse] = useState('All');
  const [status, setStatus] = useState('All');

  const rows = useMemo(
    () =>
      transfers
        .filter((t) => warehouse === 'All' || t.fromWarehouseId === warehouse || t.toWarehouseId === warehouse)
        .filter((t) => status === 'All' || t.status === status)
        .map((t) => ({
          id: t.id,
          transferNumber: t.transferNumber,
          fromWarehouse: warehouseById(t.fromWarehouseId)?.name ?? '—',
          toWarehouse: warehouseById(t.toWarehouseId)?.name ?? '—',
          requestedBy: t.requestedBy,
          transferDate: t.transferDate,
          status: t.status,
        })),
    [transfers, warehouse, status],
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Transfers"
        subtitle="Move inventory between warehouses or storage locations"
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/inventory/transfers/new')}>
            Create Transfer
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
        <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="All">All Statuses</MenuItem>
          {statuses.map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </FilterSelect>
      </FilterBar>

      <Card variant="outlined" sx={{ height: 560 }}>
        <InventoryDataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          onRowClick={(params) => navigate(`/inventory/transfers/${params.id}`)}
          sx={{ cursor: 'pointer' }}
        />
      </Card>
    </Box>
  );
}
