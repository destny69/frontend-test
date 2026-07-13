import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { GridColDef } from '@mui/x-data-grid';
import PageHeader from '../../components/PageHeader';
import FilterBar from '../../components/FilterBar';
import FilterSelect from '../../components/FilterSelect';
import StatusChip from '../../components/StatusChip';
import ProcurementDataGrid from '../../components/ProcurementDataGrid';
import { useProcurement } from '../../store/ProcurementStore';
import type { RfqStatus } from '../../data/types';

const statuses: RfqStatus[] = ['Draft', 'Sent', 'Receiving Quotes', 'Closed', 'Awarded', 'Cancelled'];

const columns: GridColDef[] = [
  { field: 'rfqNo', headerName: 'RFQ Number', flex: 1, minWidth: 150 },
  { field: 'title', headerName: 'Title', flex: 1.5, minWidth: 220 },
  { field: 'createdDate', headerName: 'Created Date', flex: 1, minWidth: 120 },
  { field: 'closingDate', headerName: 'Closing Date', flex: 1, minWidth: 120 },
  { field: 'invitedVendors', headerName: 'Invited Vendors', width: 130, headerAlign: 'right', align: 'right' },
  { field: 'responses', headerName: 'Responses', width: 110, headerAlign: 'right', align: 'right' },
  {
    field: 'status',
    headerName: 'Status',
    minWidth: 150,
    renderCell: (params) => <StatusChip status={params.value} />,
  },
];

export default function RFQList() {
  const navigate = useNavigate();
  const { rfqs, loading } = useProcurement();
  const [status, setStatus] = useState('All');

  const rows = useMemo(
    () =>
      rfqs
        .filter((r) => status === 'All' || r.status === status)
        .map((r) => ({
          id: r.id,
          rfqNo: r.rfqNo,
          title: r.title,
          createdDate: r.createdDate,
          closingDate: r.closingDate,
          invitedVendors: r.invitedVendors.length,
          responses: r.quotes.filter((q) => q.submitted).length,
          status: r.status,
        })),
    [rfqs, status],
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="RFQs"
        subtitle="Request for quotation — compare suppliers before buying"
        actions={
          <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => navigate('/procurement/rfqs/new')}>
            Create RFQ
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
        Most purchases start with Guided Purchase — it creates the requisition and RFQ together in one go.
      </Alert>

      <FilterBar>
        <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="All">All Statuses</MenuItem>
          {statuses.map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </FilterSelect>
      </FilterBar>

      <Card variant="outlined" sx={{ height: 560 }}>
        <ProcurementDataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          onRowClick={(params) => navigate(`/procurement/rfqs/${params.id}`)}
          sx={{ cursor: 'pointer' }}
        />
      </Card>
    </Box>
  );
}
