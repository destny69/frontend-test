import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { GridColDef } from '@mui/x-data-grid';
import PageHeader from '../../components/PageHeader';
import StatusChip from '../../components/StatusChip';
import FinanceDataGrid from '../../components/FinanceDataGrid';
import { useFinance } from '../../store/FinanceStore';
import { customerById } from '../../data/mockData';

const columns: GridColDef[] = [
  { field: 'creditNoteNo', headerName: 'Credit Note No.', flex: 1, minWidth: 150 },
  { field: 'date', headerName: 'Date', flex: 1, minWidth: 120 },
  { field: 'customerName', headerName: 'Customer', flex: 1.2, minWidth: 190 },
  { field: 'invoiceNo', headerName: 'Invoice', flex: 1, minWidth: 150 },
  { field: 'reason', headerName: 'Reason', flex: 1.4, minWidth: 200 },
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
    minWidth: 120,
    renderCell: (params) => <StatusChip status={params.value} />,
  },
];

export default function CreditNoteList() {
  const navigate = useNavigate();
  const { creditNotes, loading } = useFinance();

  const rows = useMemo(
    () =>
      creditNotes.map((n) => ({
        id: n.id,
        creditNoteNo: n.creditNoteNo,
        date: n.date,
        customerName: customerById(n.customerId)?.name ?? '—',
        invoiceNo: n.invoiceNo,
        reason: n.reason || '—',
        amount: n.amount,
        status: n.status,
      })),
    [creditNotes],
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Credit Notes"
        subtitle="Customer credits that reduce receivables and reverse recognised revenue"
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/finance/credit-notes/new')}>
            Create Credit Note
          </Button>
        }
      />

      <Card variant="outlined" sx={{ height: 560 }}>
        <FinanceDataGrid rows={rows} columns={columns} loading={loading} />
      </Card>
    </Box>
  );
}
