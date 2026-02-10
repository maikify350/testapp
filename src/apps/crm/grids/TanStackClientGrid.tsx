import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table'
import type { SortingState, ColumnFiltersState, Column, ColumnSizingState } from '@tanstack/react-table'
import type { ClientGridProps } from './ClientGridProps'
import type { Client } from '../types'
import './TanStackClientGrid.css'

const columnHelper = createColumnHelper<Client>()

// --- Debounced input for filter fields ---
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 200,
  ...props
}: {
  value: string
  onChange: (value: string) => void
  debounce?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  const [value, setValue] = useState(initialValue)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setValue(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(val), debounce)
  }

  return <input {...props} value={value} onChange={handleChange} />
}

// --- Filter operator types ---
type FilterOperator = 'contains' | 'startsWith' | 'endsWith' | 'equals' | 'notEquals'

const FILTER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts with' },
  { value: 'endsWith', label: 'Ends with' },
  { value: 'equals', label: 'Is equal to' },
  { value: 'notEquals', label: 'Is not equal to' },
]

// --- Per-column filter with operator dropdown ---
function ColumnFilter({ column }: { column: Column<Client, unknown> }) {
  const filterValue = column.getFilterValue() as { operator: FilterOperator; value: string } | undefined
  const [operator, setOperator] = useState<FilterOperator>(filterValue?.operator ?? 'contains')
  const [text, setText] = useState(filterValue?.value ?? '')
  const [showOperator, setShowOperator] = useState(false)

  const apply = useCallback((op: FilterOperator, val: string) => {
    if (!val) {
      column.setFilterValue(undefined)
    } else {
      column.setFilterValue({ operator: op, value: val })
    }
  }, [column])

  return (
    <div className="k-filter-cell">
      <div className="k-filter-row">
        <button
          className="k-filter-operator-btn"
          title={FILTER_OPERATORS.find(o => o.value === operator)?.label}
          onClick={(e) => { e.stopPropagation(); setShowOperator(!showOperator) }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 1h14l-5.5 6.5V14l-3-2V7.5z" />
          </svg>
        </button>
        <DebouncedInput
          className="k-filter-input"
          value={text}
          onChange={(val) => { setText(val); apply(operator, val) }}
          placeholder=""
        />
        {text && (
          <button
            className="k-filter-clear-btn"
            onClick={(e) => { e.stopPropagation(); setText(''); apply(operator, '') }}
          >
            ×
          </button>
        )}
      </div>
      {showOperator && (
        <div className="k-filter-operator-menu">
          {FILTER_OPERATORS.map(op => (
            <button
              key={op.value}
              className={`k-filter-operator-item ${op.value === operator ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setOperator(op.value)
                apply(op.value, text)
                setShowOperator(false)
              }}
            >
              {op.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Custom filter function ---
function operatorFilterFn(
  row: { getValue: (columnId: string) => unknown },
  columnId: string,
  filterValue: { operator: FilterOperator; value: string } | undefined,
) {
  if (!filterValue?.value) return true
  const cellValue = String(row.getValue(columnId) ?? '').toLowerCase()
  const search = filterValue.value.toLowerCase()
  switch (filterValue.operator) {
    case 'contains': return cellValue.includes(search)
    case 'startsWith': return cellValue.startsWith(search)
    case 'endsWith': return cellValue.endsWith(search)
    case 'equals': return cellValue === search
    case 'notEquals': return cellValue !== search
    default: return true
  }
}

// --- Column resize handle ---
function ResizeHandle({
  header,
  isResizing,
}: {
  header: { getResizeHandler: () => (event: unknown) => void }
  isResizing: boolean
}) {
  return (
    <div
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      className={`k-resize-handle ${isResizing ? 'k-resizing' : ''}`}
    />
  )
}

export default function TanStackClientGrid({ clients, onEdit, onDelete }: ClientGridProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Name',
      filterFn: operatorFilterFn,
      size: 160,
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      filterFn: operatorFilterFn,
      size: 220,
    }),
    columnHelper.accessor('phone', {
      header: 'Phone',
      filterFn: operatorFilterFn,
      size: 150,
    }),
    columnHelper.accessor('company', {
      header: 'Company',
      filterFn: operatorFilterFn,
      size: 200,
    }),
    columnHelper.accessor('created_at', {
      header: 'Created',
      filterFn: operatorFilterFn,
      size: 120,
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      size: 110,
      enableResizing: false,
      cell: ({ row }) => (
        <div className="k-actions">
          <button className="k-action-btn k-edit" onClick={() => onEdit(row.original)}>Edit</button>
          <button className="k-action-btn k-delete" onClick={() => onDelete(row.original.id)}>Delete</button>
        </div>
      ),
    }),
  ], [onEdit, onDelete])

  const table = useReactTable({
    data: clients,
    columns,
    state: { sorting, columnFilters, columnSizing, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnSizingChange: setColumnSizing,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableMultiSort: true,
    columnResizeMode: 'onChange',
    initialState: { pagination: { pageSize: 50 } },
  })

  const { pageIndex, pageSize } = table.getState().pagination
  const totalFiltered = table.getFilteredRowModel().rows.length
  const rangeStart = pageIndex * pageSize + 1
  const rangeEnd = Math.min((pageIndex + 1) * pageSize, totalFiltered)

  return (
    <div className="k-grid">
      {/* Toolbar */}
      <div className="k-toolbar">
        <div className="k-toolbar-left">
          <span className="k-toolbar-label">TanStack Table</span>
          {sorting.length > 0 && (
            <button className="k-clear-sort-btn" onClick={() => setSorting([])}>
              Clear sort
            </button>
          )}
        </div>
        <div className="k-toolbar-right">
          <input
            className="k-global-search"
            placeholder="Search all columns..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="k-grid-content">
        <table className="k-table" style={{ width: table.getCenterTotalSize() }}>
          {/* Header row */}
          <thead>
            <tr className="k-header-row">
              {table.getHeaderGroups()[0].headers.map((header) => (
                <th
                  key={header.id}
                  className="k-header-cell"
                  style={{ width: header.getSize() }}
                >
                  <div
                    className={`k-header-content ${header.column.getCanSort() ? 'k-sortable' : ''}`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <span className="k-header-text">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </span>
                    {header.column.getIsSorted() && (
                      <span className="k-sort-badge">
                        <span className="k-sort-arrow">
                          {header.column.getIsSorted() === 'asc' ? '▲' : '▼'}
                        </span>
                        {sorting.length > 1 && (
                          <span className="k-sort-index">{header.column.getSortIndex() + 1}</span>
                        )}
                      </span>
                    )}
                  </div>
                  {header.column.getCanResize() && (
                    <ResizeHandle
                      header={header}
                      isResizing={header.column.getIsResizing()}
                    />
                  )}
                </th>
              ))}
            </tr>
            {/* Filter row */}
            <tr className="k-filter-header-row">
              {table.getHeaderGroups()[0].headers.map((header) => (
                <th key={`filter-${header.id}`} className="k-filter-header-cell">
                  {header.column.getCanFilter() ? (
                    <ColumnFilter column={header.column} />
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <tr key={row.id} className={`k-row ${i % 2 === 1 ? 'k-alt' : ''}`}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="k-cell" style={{ width: cell.column.getSize() }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pager */}
      <div className="k-pager">
        <div className="k-pager-nav">
          <button
            className="k-pager-btn"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            ⟨⟨
          </button>
          <button
            className="k-pager-btn"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            ⟨
          </button>
          {/* Page number buttons */}
          {Array.from({ length: Math.min(table.getPageCount(), 7) }, (_, i) => {
            const pageCount = table.getPageCount()
            let page: number
            if (pageCount <= 7) {
              page = i
            } else if (pageIndex < 4) {
              page = i
            } else if (pageIndex > pageCount - 5) {
              page = pageCount - 7 + i
            } else {
              page = pageIndex - 3 + i
            }
            return (
              <button
                key={page}
                className={`k-pager-num ${page === pageIndex ? 'k-active' : ''}`}
                onClick={() => table.setPageIndex(page)}
              >
                {page + 1}
              </button>
            )
          })}
          <button
            className="k-pager-btn"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            ⟩
          </button>
          <button
            className="k-pager-btn"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            ⟩⟩
          </button>
        </div>
        <div className="k-pager-info">
          <span>{rangeStart} - {rangeEnd} of {totalFiltered} items</span>
          <select
            className="k-pager-size"
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[20, 50, 100, 200].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span>items per page</span>
        </div>
      </div>
    </div>
  )
}
