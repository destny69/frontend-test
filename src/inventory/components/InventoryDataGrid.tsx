import { DataGrid, DataGridProps } from '@mui/x-data-grid';

export default function InventoryDataGrid(props: DataGridProps) {
  return (
    <DataGrid
      density="compact"
      disableColumnResize
      pageSizeOptions={[10, 25, 50]}
      getRowClassName={(params) =>
        params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
      }
      initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      slotProps={{
        filterPanel: {
          filterFormProps: {
            logicOperatorInputProps: { variant: 'outlined', size: 'small' },
            columnInputProps: { variant: 'outlined', size: 'small', sx: { mt: 'auto' } },
            operatorInputProps: { variant: 'outlined', size: 'small', sx: { mt: 'auto' } },
            valueInputProps: { InputComponentProps: { variant: 'outlined', size: 'small' } },
          },
        },
      }}
      {...props}
    />
  );
}
