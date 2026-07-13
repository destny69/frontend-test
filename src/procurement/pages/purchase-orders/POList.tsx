import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import PageHeader from '../../components/PageHeader';
import FilterBar from '../../components/FilterBar';
import FilterSelect from '../../components/FilterSelect';
import StatusChip from '../../components/StatusChip';
import ProcurementDataGrid from '../../components/ProcurementDataGrid';
import { useProcurement } from '../../store/ProcurementStore';
import { departments } from '../../data/mockData';
import type { PoStatus } from '../../data/types';

const statuses: PoStatus[] = ['Draft', 'Pending Approval', 'Approved', 'Sent', 'Partially Received', 'Completed', 'Cancelled'];

const columns: GridColDef[] = [
  { field: 'poNumber', headerName: 'PO Number', flex: 1, minWidth: 150 },
  { field: 'vendorName', headerName: 'Vendor', flex: 1.2, minWidth: 190 },
  { field: 'date', headerName: 'Date', flex: 1, minWidth: 110 },
  { field: 'expectedDelivery', headerName: 'Expected Delivery', flex: 1, minWidth: 140 },
  {
    field: 'amount',
    headerName: 'Amount',
    minWidth: 130,
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
  { field: 'createdBy', headerName: 'Created By', flex: 1, minWidth: 130 },
];

export default function POList() {
  const navigate = useNavigate();
  const { vendors, purchaseOrders, approvePurchaseOrder, loading } = useProcurement();
  const [vendor, setVendor] = useState('All');
  const [status, setStatus] = useState('All');
  const [department, setDepartment] = useState('All');
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set(),
  });
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState('');

  const rows = useMemo(
    () =>
      purchaseOrders
        .filter((p) => vendor === 'All' || p.vendorId === vendor)
        .filter((p) => status === 'All' || p.status === status)
        .filter((p) => department === 'All' || p.department === department)
        .map((p) => ({
          id: p.id,
          poNumber: p.poNumber,
          vendorName: p.vendorName,
          date: p.date,
          expectedDelivery: p.expectedDelivery,
          amount: p.amount,
          status: p.status,
          createdBy: p.createdBy,
        })),
    [purchaseOrders, vendor, status, department],
  );

  // Only POs awaiting approval are eligible for the bulk action; the grid's
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
        await approvePurchaseOrder(id);
      }
      setSelectionModel({ type: 'include', ids: new Set() });
    } catch {
      setApproveError('Failed to approve one or more purchase orders. Please try again.');
    } finally {
      setApproving(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Purchase Orders"
        subtitle="Official purchasing contracts issued to vendors"
        actions={
          <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => navigate('/procurement/purchase-orders/new')}>
            Create Purchase Order
          </Button>
        }
      />

      <Alert
        severity="info"
        sx={{ mb: 2 }}
        action={
          <Button color="inherit" size="small" variant="outlined" onClick={() => navigate('/procurement/guided-purchase')}>
            Guided Purchase
          </Button>
        }
      >
        Most purchase orders come from awarding an RFQ. Only create one directly here if you already know the
        vendor and price.
      </Alert>

      <FilterBar>
        <FilterSelect value={vendor} onChange={(e) => setVendor(e.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="All">All Vendors</MenuItem>
          {vendors.map((v) => (
            <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
          ))}
        </FilterSelect>
        <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 170 }}>
          <MenuItem value="All">All Statuses</MenuItem>
          {statuses.map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </FilterSelect>
        <FilterSelect value={department} onChange={(e) => setDepartment(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="All">All Departments</MenuItem>
          {departments.map((d) => (
            <MenuItem key={d} value={d}>{d}</MenuItem>
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
            {selectedIds.length} purchase order{selectedIds.length === 1 ? '' : 's'} selected
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
          onRowClick={(params) => navigate(`/procurement/purchase-orders/${params.id}`)}
          sx={{ cursor: 'pointer' }}
        />
      </Card>
    </Box>
  );
}
