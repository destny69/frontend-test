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
import type { PaymentType } from '../../data/types';

const types: PaymentType[] = ['Customer Payment', 'Supplier Payment', 'Advance Payment', 'Refund', 'Adjustment'];

const columns: GridColDef[] = [
  { field: 'paymentNo', headerName: 'Payment ID', flex: 1, minWidth: 150 },
  { field: 'type', headerName: 'Type', flex: 1, minWidth: 150 },
  { field: 'partyName', headerName: 'Customer / Supplier', flex: 1.2, minWidth: 190 },
  { field: 'invoiceOrBillRef', headerName: 'Invoice', flex: 1, minWidth: 140 },
  {
    field: 'amount',
    headerName: 'Amount',
    minWidth: 110,
    headerAlign: 'right',
    align: 'right',
    valueFormatter: (value: number) => `NPR ${value.toLocaleString()}`,
  },
  { field: 'method', headerName: 'Method', flex: 1, minWidth: 130 },
  {
    field: 'status',
    headerName: 'Status',
    minWidth: 120,
    renderCell: (params) => <StatusChip status={params.value} />,
  },
  { field: 'date', headerName: 'Date', flex: 1, minWidth: 120 },
];

export default function PaymentList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { payments, loading } = useFinance();
  const [type, setType] = useState('All');
  const [party, setParty] = useState('All');
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');

  const parties = useMemo(
    () => Array.from(new Set(payments.map((p) => p.partyName))).sort(),
    [payments],
  );

  const rows = useMemo(
    () =>
      payments
        .filter((p) => type === 'All' || p.type === type)
        .filter((p) => party === 'All' || p.partyName === party)
        .filter((p) => search === '' || p.paymentNo.toLowerCase().includes(search.toLowerCase()))
        .map((p) => ({
          id: p.id,
          paymentNo: p.paymentNo,
          type: p.type,
          partyName: p.partyName,
          invoiceOrBillRef: p.invoiceOrBillRef,
          amount: p.amount,
          method: p.method,
          status: p.status,
          date: p.date,
        })),
    [payments, type, party, search],
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Payments"
        subtitle="Central place to manage incoming and outgoing money"
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/finance/payments/new')}>
            Record Payment
          </Button>
        }
      />

      <FilterBar>
        <TextField
          size="small"
          placeholder="Search payment no."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <FilterSelect value={party} onChange={(e) => setParty(e.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="All">All Customers / Suppliers</MenuItem>
          {parties.map((p) => (
            <MenuItem key={p} value={p}>{p}</MenuItem>
          ))}
        </FilterSelect>
        <FilterSelect value={type} onChange={(e) => setType(e.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="All">All Payment Types</MenuItem>
          {types.map((t) => (
            <MenuItem key={t} value={t}>{t}</MenuItem>
          ))}
        </FilterSelect>
      </FilterBar>

      <Card variant="outlined" sx={{ height: 560 }}>
        <FinanceDataGrid
          rows={rows}
          columns={columns}
          onRowClick={(params) => navigate(`/finance/payments/${params.id}`)}
          sx={{ cursor: 'pointer' }}
          loading={loading}
        />
      </Card>
    </Box>
  );
}
