import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Rating from '@mui/material/Rating';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import PageHeader from '../../components/PageHeader';
import FilterBar from '../../components/FilterBar';
import FilterSelect from '../../components/FilterSelect';
import StatusChip from '../../components/StatusChip';
import ProcurementDataGrid from '../../components/ProcurementDataGrid';
import { useProcurement } from '../../store/ProcurementStore';
import { vendorPerformance } from '../../data/vendorPerformance';
import type { VendorCategory } from '../../data/types';

const categories: VendorCategory[] = ['API Supplier', 'Excipients', 'Packaging', 'Lab Equipment', 'Logistics', 'MRO'];

const columns: GridColDef[] = [
  {
    field: 'name',
    headerName: 'Vendor Name',
    flex: 1.4,
    minWidth: 220,
    renderCell: (params) => (
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.2, height: '100%' }}>
        <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: 'primary.main' }}>
          {params.value.charAt(0)}
        </Avatar>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{params.value}</Typography>
      </Stack>
    ),
  },
  { field: 'category', headerName: 'Category', flex: 1, minWidth: 130 },
  { field: 'phone', headerName: 'Phone', flex: 1, minWidth: 140 },
  { field: 'email', headerName: 'Email', flex: 1.2, minWidth: 190 },
  {
    field: 'outstandingBalance',
    headerName: 'Outstanding Balance',
    minWidth: 160,
    headerAlign: 'right',
    align: 'right',
    valueFormatter: (value: number) => `NPR ${value.toLocaleString()}`,
  },
  {
    field: 'rating',
    headerName: 'Rating',
    minWidth: 170,
    sortComparator: (a, b) => (a ?? -1) - (b ?? -1),
    renderCell: (params) =>
      params.value == null ? (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {params.row.ratingLabel}
        </Typography>
      ) : (
        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, height: '100%' }}>
          <Rating value={params.value} precision={0.1} max={5} size="small" readOnly />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {params.value.toFixed(1)}
          </Typography>
        </Stack>
      ),
  },
  {
    field: 'status',
    headerName: 'Status',
    minWidth: 150,
    renderCell: (params) => <StatusChip status={params.value} />,
  },
];

export default function VendorList() {
  const navigate = useNavigate();
  const { vendors, purchaseOrders, grns, setVendorStatus, loading } = useProcurement();
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [country, setCountry] = useState('All');
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set(),
  });
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState('');

  const countries = useMemo(() => Array.from(new Set(vendors.map((v) => v.country))), [vendors]);

  const rows = useMemo(
    () =>
      vendors
        .filter((v) => category === 'All' || v.category === category)
        .filter((v) => status === 'All' || v.status === status)
        .filter((v) => country === 'All' || v.country === country)
        .map((v) => {
          const perf = vendorPerformance(v.id, purchaseOrders, grns);
          return {
            id: v.id,
            name: v.name,
            category: v.category,
            phone: v.phone,
            email: v.email,
            outstandingBalance: v.outstandingBalance,
            rating: perf.rating,
            ratingLabel: perf.ratingLabel,
            status: v.status,
          };
        }),
    [vendors, purchaseOrders, grns, category, status, country],
  );

  // Only vendors awaiting approval are eligible for the bulk action; the grid's
  // isRowSelectable keeps other rows from ever entering the selection model, but
  // we also filter here defensively when resolving the model to an id list.
  const eligibleIds = useMemo(
    () => rows.filter((r) => r.status === 'Pending Approval').map((r) => r.id),
    [rows],
  );
  const selectedIds = useMemo(
    () =>
      selectionModel.type === 'include'
        ? eligibleIds.filter((id) => selectionModel.ids.has(id))
        : eligibleIds.filter((id) => !selectionModel.ids.has(id)),
    [selectionModel, eligibleIds],
  );

  const handleBulkApprove = async () => {
    setApproving(true);
    setApproveError('');
    try {
      for (const id of selectedIds) {
        await setVendorStatus(id, 'Active');
      }
      setSelectionModel({ type: 'include', ids: new Set() });
    } catch {
      setApproveError('Failed to approve one or more vendors. Please try again.');
    } finally {
      setApproving(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Vendors"
        subtitle="Supplier database, performance and compliance"
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/procurement/vendors/new')}>
            Add Vendor
          </Button>
        }
      />

      <FilterBar>
        <FilterSelect value={category} onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 170 }}>
          <MenuItem value="All">All Categories</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c} value={c}>{c}</MenuItem>
          ))}
        </FilterSelect>
        <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="All">All Statuses</MenuItem>
          {['Active', 'On Hold', 'Blacklisted', 'Pending Approval'].map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </FilterSelect>
        <FilterSelect value={country} onChange={(e) => setCountry(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="All">All Countries</MenuItem>
          {countries.map((c) => (
            <MenuItem key={c} value={c}>{c}</MenuItem>
          ))}
        </FilterSelect>
      </FilterBar>

      {approveError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setApproveError('')}>
          {approveError}
        </Alert>
      )}

      {selectedIds.length > 0 && (
        <Card
          variant="outlined"
          sx={{ mb: 2, p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {selectedIds.length} vendor{selectedIds.length === 1 ? '' : 's'} selected
          </Typography>
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<CheckRoundedIcon />}
            loading={approving}
            disabled={approving}
            onClick={handleBulkApprove}
          >
            Approve {selectedIds.length} selected
          </Button>
        </Card>
      )}

      <Card variant="outlined" sx={{ height: 560 }}>
        <ProcurementDataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          checkboxSelection
          isRowSelectable={(params) => params.row.status === 'Pending Approval'}
          rowSelectionModel={selectionModel}
          onRowSelectionModelChange={setSelectionModel}
          onRowClick={(params) => navigate(`/procurement/vendors/${params.id}`)}
          sx={{ cursor: 'pointer' }}
        />
      </Card>
    </Box>
  );
}
