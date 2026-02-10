import type { Client } from '../types'

export type GridLibrary = 'ag-grid' | 'tanstack' | 'tanstack-v2' | 'mui-datagrid'

export interface ClientGridProps {
  clients: Client[]
  onEdit: (client: Client) => void
  onDelete: (clientId: number) => void
}

export const GRID_OPTIONS: { value: GridLibrary; label: string }[] = [
  { value: 'tanstack-v2', label: 'TanStack Table V2' },
  { value: 'ag-grid', label: 'AG Grid Community' },
  { value: 'tanstack', label: 'TanStack Table' },
  { value: 'mui-datagrid', label: 'MUI DataGrid' },
]
