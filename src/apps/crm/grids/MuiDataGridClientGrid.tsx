import { useMemo } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef } from '@mui/x-data-grid'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import type { ClientGridProps } from './ClientGridProps'

const darkTheme = createTheme({ palette: { mode: 'dark' } })

export default function MuiDataGridClientGrid({ clients, onEdit, onDelete }: ClientGridProps) {
  const columns = useMemo<GridColDef[]>(() => [
    { field: 'name', headerName: 'Name', flex: 1, filterable: true },
    { field: 'email', headerName: 'Email', flex: 1, filterable: true },
    { field: 'phone', headerName: 'Phone', flex: 1, filterable: true },
    { field: 'company', headerName: 'Company', flex: 1, filterable: true },
    {
      field: 'created_at',
      headerName: 'Created',
      flex: 1,
      filterable: true,
      valueFormatter: (value: string) => value ? new Date(value).toLocaleDateString() : '',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.7,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onEdit(params.row)}
            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(params.row.id)}
            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ], [onEdit, onDelete])

  return (
    <ThemeProvider theme={darkTheme}>
      <p style={{ color: '#666', fontSize: '0.8rem', fontStyle: 'italic', margin: '0 0 0.5rem' }}>
        Note: Multi-column sort requires MUI DataGrid Pro (paid). Single-column sort and filter available.
      </p>
      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={clients}
          columns={columns}
          pageSizeOptions={[25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 50 } } }}
          disableRowSelectionOnClick
        />
      </div>
    </ThemeProvider>
  )
}
