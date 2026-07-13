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
import { customers, customerById, invoiceBalance } from '../../data/mockData';
import type { InvoiceStatus } from '../../data/types';

const statuses: InvoiceStatus[] = ['Draft', 'Proforma', 'Sent', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'];

const columns: GridColDef[] = [
  { field: 'invoiceNo', headerName: 'Invoice No.', flex: 1, minWidth: 150 },
  { field: 'customerName', headerName: 'Customer', flex: 1.2, minWidth: 190 },
  { field: 'invoiceDate', headerName: 'Invoice Date', flex: 1, minWidth: 120 },
  { field: 'dueDate', headerName: 'Due Date', flex: 1, minWidth: 120 },
  {
    field: 'amount',
    headerName: 'Amount',
    minWidth: 110,
    headerAlign: 'right',
    align: 'right',
    valueFormatter: (value: number) => `NPR ${value.toLocaleString()}`,
  },
  {
    field: 'paid',
    headerName: 'Paid',
    minWidth: 100,
    headerAlign: 'right',
    align: 'right',
    valueFormatter: (value: number) => `NPR ${value.toLocaleString()}`,
  },
  {
    field: 'balance',
    headerName: 'Balance',
    minWidth: 110,
    headerAlign: 'right',
    align: 'right',
    valueFormatter: (value: number) => `NPR ${value.toLocaleString()}`,
  },
  {
    field: 'status',
    headerName: 'Status',
    minWidth: 140,
    renderCell: (params) => <StatusChip status={params.value} />,
  },
];

export default function InvoiceList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { invoices, loading } = useFinance();
  const [customer, setCustomer] = useState('All');
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');

  const rows = useMemo(
    () =>
      invoices
        .filter((i) => customer === 'All' || i.customerId === customer)
        .filter((i) => status === 'All' || i.status === status)
        .filter((i) => search === '' || i.invoiceNo.toLowerCase().includes(search.toLowerCase()))
        .map((i) => ({
          id: i.id,
          invoiceNo: i.invoiceNo,
          customerName: customerById(i.customerId)?.name ?? '—',
          invoiceDate: i.invoiceDate,
          dueDate: i.dueDate || '—',
          amount: i.amount,
          paid: i.paid,
          balance: invoiceBalance(i),
          status: i.status,
        })),
    [invoices, customer, status, search],
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Customer Invoices"
        subtitle="Bill customers after products are sold"
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/finance/invoices/new')}>
            Create Invoice
          </Button>
        }
      />

      <FilterBar>
        <TextField
          size="small"
          placeholder="Search invoice no."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <FilterSelect value={customer} onChange={(e) => setCustomer(e.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="All">All Customers</MenuItem>
          {customers.map((c) => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          ))}
        </FilterSelect>
        <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 160 }}>
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
          onRowClick={(params) => navigate(`/finance/invoices/${params.id}`)}
          sx={{ cursor: 'pointer' }}
          loading={loading}
        />
      </Card>
    </Box>
  );
}
