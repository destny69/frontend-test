import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { GridColDef } from '@mui/x-data-grid';
import PageHeader from '../../components/PageHeader';
import FilterBar from '../../components/FilterBar';
import FilterSelect from '../../components/FilterSelect';
import StatusChip from '../../components/StatusChip';
import FinanceDataGrid from '../../components/FinanceDataGrid';
import { useFinance } from '../../store/FinanceStore';
import { useProcurement } from '../../../procurement/store/ProcurementStore';
import type { BillStatus } from '../../data/types';

const statuses: BillStatus[] = ['Draft', 'Pending Verification', 'Approved', 'Partially Paid', 'Paid', 'Cancelled'];

const columns: GridColDef[] = [
  { field: 'billNo', headerName: 'Bill Number', flex: 1, minWidth: 150 },
  { field: 'vendorName', headerName: 'Supplier', flex: 1.2, minWidth: 190 },
  { field: 'poNumber', headerName: 'Purchase Order', flex: 1, minWidth: 150 },
  { field: 'invoiceDate', headerName: 'Invoice Date', flex: 1, minWidth: 120 },
  { field: 'dueDate', headerName: 'Due Date', flex: 1, minWidth: 120 },
  {
    field: 'amount',
    headerName: 'Amount',
    minWidth: 120,
    headerAlign: 'right',
    align: 'right',
    valueFormatter: (value: number) => `NPR ${value.toLocaleString()}`,
  },
  {
    field: 'status',
    headerName: 'Status',
    minWidth: 160,
    renderCell: (params) => <StatusChip status={params.value} />,
  },
];

export default function BillList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { supplierBills, loading } = useFinance();
  const { vendors } = useProcurement();
  const [vendor, setVendor] = useState('All');
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');

  const rows = useMemo(
    () =>
      supplierBills
        .filter((b) => vendor === 'All' || b.vendorId === vendor)
        .filter((b) => status === 'All' || b.status === status)
        .filter((b) => search === '' || b.billNo.toLowerCase().includes(search.toLowerCase()))
        .map((b) => ({
          id: b.id,
          billNo: b.billNo,
          vendorName: b.vendorName,
          poNumber: b.poNumber,
          invoiceDate: b.invoiceDate,
          dueDate: b.dueDate,
          amount: b.amount,
          status: b.status,
        })),
    [supplierBills, vendor, status, search],
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Supplier Bills"
        subtitle="Bills received from vendors after purchases"
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/finance/bills/new')}>
            Record Supplier Bill
          </Button>
        }
      />

      <FilterBar>
        <TextField
          size="small"
          placeholder="Search bill no."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <FilterSelect value={vendor} onChange={(e) => setVendor(e.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="All">All Suppliers</MenuItem>
          {vendors.map((v) => (
            <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
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
        <FinanceDataGrid
          rows={rows}
          columns={columns}
          onRowClick={(params) => navigate(`/finance/bills/${params.id}`)}
          sx={{ cursor: 'pointer' }}
          loading={loading}
        />
      </Card>
    </Box>
  );
}
