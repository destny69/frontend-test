import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { GridColDef } from '@mui/x-data-grid';
import PageHeader from '../../components/PageHeader';
import InventoryDataGrid from '../../components/InventoryDataGrid';
import { useInventory } from '../../store/InventoryStore';
import { warehouses } from '../../data/mockData';

const columns: GridColDef[] = [
  { field: 'code', headerName: 'Warehouse Code', flex: 0.8, minWidth: 130 },
  { field: 'name', headerName: 'Warehouse Name', flex: 1.2, minWidth: 180 },
  { field: 'location', headerName: 'Location', flex: 1, minWidth: 160 },
  { field: 'manager', headerName: 'Manager', flex: 1, minWidth: 140 },
  {
    field: 'capacity',
    headerName: 'Capacity',
    minWidth: 110,
    headerAlign: 'right',
    align: 'right',
    valueFormatter: (value: number) => value.toLocaleString(),
  },
  {
    field: 'utilization',
    headerName: 'Current Utilization',
    flex: 1,
    minWidth: 180,
    renderCell: (params) => (
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, width: '100%', height: '100%' }}>
        <LinearProgress
          variant="determinate"
          value={params.value}
          sx={{
            flexGrow: 1,
            [`& .${linearProgressClasses.bar}`]: {
              backgroundColor: params.value > 85 ? 'error.main' : params.value > 65 ? 'warning.main' : 'success.main',
            },
          }}
        />
        <Typography variant="caption" sx={{ minWidth: 32 }}>{params.value}%</Typography>
      </Stack>
    ),
  },
];

export default function WarehouseList() {
  const navigate = useNavigate();
  const { loading } = useInventory();

  const rows = warehouses.map((w) => ({
    id: w.id,
    code: w.code,
    name: w.name,
    location: w.location,
    manager: w.manager,
    capacity: w.totalCapacity,
    utilization: Math.round((w.occupied / w.totalCapacity) * 100),
  }));

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title="Warehouses"
        subtitle="Every warehouse and storage location, zone to bin"
      />

      <Card variant="outlined" sx={{ height: 560 }}>
        <InventoryDataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          onRowClick={(params) => navigate(`/inventory/warehouses/${params.id}`)}
          sx={{ cursor: 'pointer' }}
        />
      </Card>
    </Box>
  );
}
