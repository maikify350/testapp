import { useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import type { ClientGridProps } from './ClientGridProps'
import type { Client } from '../types'

ModuleRegistry.registerModules([AllCommunityModule])

export default function AgGridClientGrid({ clients, onEdit, onDelete }: ClientGridProps) {
  const defaultColDef = useMemo<ColDef>(() => ({
    flex: 1,
    minWidth: 100,
    filter: true,
    floatingFilter: true,
    sortable: true,
  }), [])

  const colDefs = useMemo<ColDef<Client>[]>(() => [
    { field: 'name', filter: 'agTextColumnFilter' },
    { field: 'email', filter: 'agTextColumnFilter' },
    { field: 'phone', filter: 'agTextColumnFilter' },
    { field: 'company', filter: 'agTextColumnFilter' },
    {
      field: 'created_at',
      headerName: 'Created',
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : '',
    },
    {
      headerName: 'Actions',
      filter: false,
      sortable: false,
      floatingFilter: false,
      minWidth: 140,
      flex: 0,
      cellRenderer: (params: ICellRendererParams<Client>) => {
        if (!params.data) return null
        const client = params.data
        return (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => onEdit(client)}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(client.id)}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Delete
            </button>
          </div>
        )
      },
    },
  ], [onEdit, onDelete])

  return (
    <div className="ag-theme-quartz-dark" style={{ height: 600, width: '100%' }}>
      <AgGridReact
        rowData={clients}
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
        animateRows={true}
        pagination={true}
        paginationPageSize={50}
        paginationPageSizeSelector={[25, 50, 100]}
      />
    </div>
  )
}
