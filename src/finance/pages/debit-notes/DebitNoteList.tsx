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

const columns: GridColDef[] = [
  { field: 'debitNoteNo', headerName: 'Debit Note No.', flex: 1, minWidth: 150 },
  { field: 'date', headerName: 'Date', flex: 1, minWidth: 120 },
  { field: 'vendorName', headerName: 'Supplier', flex: 1.2, minWidth: 190 },
  { field: 'billNo', headerName: 'Bill', flex: 1, minWidth: 150 },
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

export default function DebitNoteList() {
  const navigate = useNavigate();
  const { debitNotes, loading } = useFinance();

  const rows = useMemo(
    () =>
      debitNotes.map((n) => ({
        id: n.id,
        debitNoteNo: n.debitNoteNo,
        date: n.date,
        vendorName: n.vendorName,
        billNo: n.billNo,
        reason: n.reason || '—',
        amount: n.amount,
        status: n.status,
      })),
    [debitNotes],
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Debit Notes"
        subtitle="Supplier debits that reduce payables and reverse recognised purchase cost"
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/finance/debit-notes/new')}>
            Create Debit Note
          </Button>
        }
      />

      <Card variant="outlined" sx={{ height: 560 }}>
        <FinanceDataGrid rows={rows} columns={columns} loading={loading} />
      </Card>
    </Box>
  );
}
