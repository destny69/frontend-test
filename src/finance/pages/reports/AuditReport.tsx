import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import { GridColDef } from '@mui/x-data-grid';
import PageHeader from '../../components/PageHeader';
import FilterBar from '../../components/FilterBar';
import FilterSelect from '../../components/FilterSelect';
import FinanceDataGrid from '../../components/FinanceDataGrid';
import { useFinance } from '../../store/FinanceStore';
import { exportToCsv } from '../../../shared/exportCsv';

const columns: GridColDef[] = [
  { field: 'date', headerName: 'Date', flex: 1, minWidth: 120 },
  { field: 'type', headerName: 'Action', flex: 1, minWidth: 140 },
  { field: 'entity', headerName: 'Entity', flex: 1, minWidth: 140 },
  { field: 'ref', headerName: 'Reference', flex: 1.4, minWidth: 200 },
  { field: 'by', headerName: 'By', flex: 1, minWidth: 150 },
];

export default function AuditReport() {
  const { financeEvents } = useFinance();
  const [entity, setEntity] = useState('All');
  const [type, setType] = useState('All');

  const entities = useMemo(() => [...new Set(financeEvents.map((e) => e.entity))].sort(), [financeEvents]);
  const types = useMemo(() => [...new Set(financeEvents.map((e) => e.type))].sort(), [financeEvents]);

  const filtered = useMemo(
    () =>
      financeEvents
        .filter((e) => entity === 'All' || e.entity === entity)
        .filter((e) => type === 'All' || e.type === type),
    [financeEvents, entity, type],
  );

  const rows = filtered.map((e) => ({ id: e.id, date: e.date, type: e.type, entity: e.entity, ref: e.ref, by: e.by }));

  const exportAudit = () =>
    exportToCsv(
      'audit-trail',
      [
        { header: 'Date', accessor: (e) => e.date },
        { header: 'Action', accessor: (e) => e.type },
        { header: 'Entity', accessor: (e) => e.entity },
        { header: 'Reference', accessor: (e) => e.ref },
        { header: 'By', accessor: (e) => e.by },
      ],
      filtered,
    );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Audit Report"
        subtitle="Immutable trail of every create, approve, pay, post and adjustment action"
        actions={
          <Button variant="outlined" startIcon={<FileDownloadRoundedIcon />} onClick={exportAudit}>Export</Button>
        }
      />

      <FilterBar>
        <FilterSelect value={entity} onChange={(e) => setEntity(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="All">All Entities</MenuItem>
          {entities.map((x) => (
            <MenuItem key={x} value={x}>{x}</MenuItem>
          ))}
        </FilterSelect>
        <FilterSelect value={type} onChange={(e) => setType(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="All">All Actions</MenuItem>
          {types.map((x) => (
            <MenuItem key={x} value={x}>{x}</MenuItem>
          ))}
        </FilterSelect>
      </FilterBar>

      <Card variant="outlined" sx={{ height: 560 }}>
        <FinanceDataGrid rows={rows} columns={columns} />
      </Card>
    </Box>
  );
}
