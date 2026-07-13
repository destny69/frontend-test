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
import ProcurementDataGrid from '../../components/ProcurementDataGrid';
import { useProcurement } from '../../store/ProcurementStore';
import type { GrnStatus } from '../../data/types';

const statuses: GrnStatus[] = ['Pending', 'Inspection', 'Accepted', 'Rejected', 'Completed'];

const columns: GridColDef[] = [
  { field: 'grnNumber', headerName: 'GRN Number', flex: 1, minWidth: 150 },
  { field: 'poNumber', headerName: 'Purchase Order', flex: 1, minWidth: 150 },
  { field: 'vendorName', headerName: 'Vendor', flex: 1.2, minWidth: 190 },
  { field: 'warehouse', headerName: 'Warehouse', flex: 1, minWidth: 170 },
  { field: 'receivedDate', headerName: 'Received Date', flex: 1, minWidth: 130 },
  {
    field: 'status',
    headerName: 'Status',
    minWidth: 140,
    renderCell: (params) => <StatusChip status={params.value} />,
  },
];

export default function GRNList() {
  const navigate = useNavigate();
  const { grns, loading } = useProcurement();
  const [status, setStatus] = useState('All');
  const [warehouse, setWarehouse] = useState('All');

  const warehouses = useMemo(() => Array.from(new Set(grns.map((g) => g.warehouse))), [grns]);

  const rows = useMemo(
    () =>
      grns
        .filter((g) => status === 'All' || g.status === status)
        .filter((g) => warehouse === 'All' || g.warehouse === warehouse)
        .map((g) => ({
          id: g.id,
          grnNumber: g.grnNumber,
          poNumber: g.poNumber,
          vendorName: g.vendorName,
          warehouse: g.warehouse,
          receivedDate: g.receivedDate,
          status: g.status,
        })),
    [grns, status, warehouse],
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Goods Receipt (GRN)"
        subtitle="Confirm items arrived and pass quality inspection"
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/procurement/grn/new')}>
            Receive Goods
          </Button>
        }
      />

      <FilterBar>
        <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="All">All Statuses</MenuItem>
          {statuses.map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </FilterSelect>
        <FilterSelect value={warehouse} onChange={(e) => setWarehouse(e.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="All">All Warehouses</MenuItem>
          {warehouses.map((w) => (
            <MenuItem key={w} value={w}>{w}</MenuItem>
          ))}
        </FilterSelect>
      </FilterBar>

      <Card variant="outlined" sx={{ height: 560 }}>
        <ProcurementDataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          onRowClick={(params) => navigate(`/procurement/grn/${params.id}`)}
          sx={{ cursor: 'pointer' }}
        />
      </Card>
    </Box>
  );
}
