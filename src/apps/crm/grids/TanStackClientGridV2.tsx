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
import type { SortingState, ColumnFiltersState, Column, ColumnSizingState, ColumnOrderState, RowSelectionState } from '@tanstack/react-table'
import type { ClientGridProps } from './ClientGridProps'
import type { Client } from '../types'
import './TanStackClientGridV2.css'

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
    <div className="k2-filter-cell">
      <div className="k2-filter-row">
        <button
          className="k2-filter-operator-btn"
          title={FILTER_OPERATORS.find(o => o.value === operator)?.label}
          onClick={(e) => { e.stopPropagation(); setShowOperator(!showOperator) }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 1h14l-5.5 6.5V14l-3-2V7.5z" />
          </svg>
        </button>
        <DebouncedInput
          className="k2-filter-input"
          value={text}
          onChange={(val) => { setText(val); apply(operator, val) }}
          placeholder=""
        />
        {text && (
          <button
            className="k2-filter-clear-btn"
            onClick={(e) => { e.stopPropagation(); setText(''); apply(operator, '') }}
          >
            ×
          </button>
        )}
      </div>
      {showOperator && (
        <div className="k2-filter-operator-menu">
          {FILTER_OPERATORS.map(op => (
            <button
              key={op.value}
              className={`k2-filter-operator-item ${op.value === operator ? 'active' : ''}`}
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
      className={`k2-resize-handle ${isResizing ? 'k2-resizing' : ''}`}
    />
  )
}

export default function TanStackClientGridV2({ clients, onEdit, onDelete }: ClientGridProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([
    'select', 'name', 'email', 'phone', 'company', 'created_at', 'actions',
  ])
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [sortZoneActive, setSortZoneActive] = useState(false)
  const [sortChipDragOver, setSortChipDragOver] = useState<string | null>(null)
  const dragColumnRef = useRef<string | null>(null)
  const dragSourceRef = useRef<'header' | 'chip' | null>(null)
  const didDragRef = useRef(false)

  const COLUMN_LABELS: Record<string, string> = {
    name: 'Name', email: 'Email', phone: 'Phone',
    company: 'Company', created_at: 'Created',
  }

  const selectedCount = Object.keys(rowSelection).length

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'select',
      size: 40,
      enableResizing: false,
      enableSorting: false,
      header: ({ table: t }) => (
        <input
          type="checkbox"
          className="k2-checkbox"
          checked={t.getIsAllPageRowsSelected()}
          ref={(el) => { if (el) el.indeterminate = t.getIsSomePageRowsSelected() }}
          onChange={t.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="k2-checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    }),
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
        <div className="k2-actions">
          <button className="k2-action-btn k2-edit" onClick={() => onEdit(row.original)}>Edit</button>
          <button className="k2-action-btn k2-delete" onClick={() => onDelete(row.original.id)}>Delete</button>
        </div>
      ),
    }),
  ], [onEdit, onDelete])

  const table = useReactTable({
    data: clients,
    columns,
    state: { sorting, columnFilters, columnSizing, globalFilter, columnOrder, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnSizingChange: setColumnSizing,
    onGlobalFilterChange: setGlobalFilter,
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
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
    <div className="k2-grid">
      {/* Toolbar */}
      <div className="k2-toolbar">
        <div className="k2-toolbar-left">
          <span className="k2-toolbar-label">TanStack Table V2</span>
          {selectedCount > 0 && (
            <span className="k2-selected-count">
              {selectedCount} selected
              <button className="k2-clear-selection-btn" onClick={() => setRowSelection({})}>×</button>
            </span>
          )}
          {sorting.length > 0 && (
            <button className="k2-clear-sort-btn" onClick={() => setSorting([])}>
              Clear sort
            </button>
          )}
        </div>
        <div className="k2-toolbar-right">
          <input
            className="k2-global-search"
            placeholder="Search all columns..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Sort drop zone */}
      <div
        className={`k2-sort-zone ${sortZoneActive ? 'k2-sort-zone-active' : ''}`}
        onDragOver={(e) => {
          if (dragSourceRef.current === 'header' || dragSourceRef.current === 'chip') {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
            setSortZoneActive(true)
          }
        }}
        onDragLeave={() => setSortZoneActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setSortZoneActive(false)
          const colId = dragColumnRef.current
          if (!colId || colId === 'select' || colId === 'actions') return
          // Only add if coming from header and not already sorted
          if (dragSourceRef.current === 'header') {
            const already = sorting.find(s => s.id === colId)
            if (!already) {
              setSorting(prev => [...prev, { id: colId, desc: false }])
            }
          }
          dragColumnRef.current = null
          dragSourceRef.current = null
          didDragRef.current = true
        }}
      >
        {sorting.length === 0 ? (
          <span className="k2-sort-zone-hint">Drag a column header here to set sort order</span>
        ) : (
          sorting.map((s, idx) => (
            <div
              key={s.id}
              className={`k2-sort-chip ${sortChipDragOver === s.id ? 'k2-sort-chip-drag-over' : ''}`}
              draggable
              onDragStart={(e) => {
                e.stopPropagation()
                dragColumnRef.current = s.id
                dragSourceRef.current = 'chip'
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => {
                if (dragSourceRef.current === 'chip') {
                  e.preventDefault()
                  e.stopPropagation()
                  setSortChipDragOver(s.id)
                }
              }}
              onDragLeave={() => {
                if (sortChipDragOver === s.id) setSortChipDragOver(null)
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setSortZoneActive(false)
                setSortChipDragOver(null)
                const from = dragColumnRef.current
                if (from && from !== s.id && dragSourceRef.current === 'chip') {
                  setSorting(prev => {
                    const next = [...prev]
                    const fromIdx = next.findIndex(x => x.id === from)
                    const toIdx = next.findIndex(x => x.id === s.id)
                    const [item] = next.splice(fromIdx, 1)
                    next.splice(toIdx, 0, item)
                    return next
                  })
                }
                dragColumnRef.current = null
                dragSourceRef.current = null
              }}
              onDragEnd={() => {
                setSortChipDragOver(null)
                dragSourceRef.current = null
              }}
            >
              <span className="k2-sort-chip-index">{idx + 1}</span>
              <span className="k2-sort-chip-label">{COLUMN_LABELS[s.id] ?? s.id}</span>
              <button
                className="k2-sort-chip-dir"
                onClick={() => setSorting(prev => prev.map(x => x.id === s.id ? { ...x, desc: !x.desc } : x))}
              >
                {s.desc ? '▼' : '▲'}
              </button>
              <button
                className="k2-sort-chip-remove"
                onClick={() => setSorting(prev => prev.filter(x => x.id !== s.id))}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* Table */}
      <div className="k2-grid-content">
        <table className="k2-table">
          {/* Header row */}
          <thead>
            <tr className="k2-header-row">
              {table.getHeaderGroups()[0].headers.map((header) => (
                <th
                  key={header.id}
                  className={`k2-header-cell${dragOverId === header.column.id ? ' k2-drag-over' : ''}`}
                  style={{ width: header.getSize() }}
                  draggable={header.column.id !== 'actions'}
                  onDragStart={(e) => {
                    dragColumnRef.current = header.column.id
                    dragSourceRef.current = 'header'
                    didDragRef.current = false
                    e.dataTransfer.effectAllowed = 'move'
                    // Make the drag ghost semi-transparent
                    const el = e.currentTarget
                    el.style.opacity = '0.5'
                    setTimeout(() => { el.style.opacity = '' }, 0)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    if (dragColumnRef.current && dragColumnRef.current !== header.column.id && header.column.id !== 'actions') {
                      didDragRef.current = true
                      setDragOverId(header.column.id)
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverId === header.column.id) setDragOverId(null)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOverId(null)
                    const from = dragColumnRef.current
                    const to = header.column.id
                    if (from && from !== to && to !== 'actions') {
                      setColumnOrder(prev => {
                        const next = [...prev]
                        const fromIdx = next.indexOf(from)
                        const toIdx = next.indexOf(to)
                        next.splice(fromIdx, 1)
                        next.splice(toIdx, 0, from)
                        return next
                      })
                    }
                    dragColumnRef.current = null
                  }}
                  onDragEnd={() => {
                    setDragOverId(null)
                    dragColumnRef.current = null
                  }}
                >
                  <div
                    className={`k2-header-content ${header.column.getCanSort() ? 'k2-sortable' : ''}`}
                    onClick={() => {
                      // Don't sort if we just finished a drag
                      if (didDragRef.current) { didDragRef.current = false; return }
                      if (!header.column.getCanSort()) return
                      const current = header.column.getIsSorted()
                      if (!current) {
                        setSorting(prev => [...prev, { id: header.column.id, desc: false }])
                      } else if (current === 'asc') {
                        setSorting(prev => prev.map(s => s.id === header.column.id ? { ...s, desc: true } : s))
                      } else {
                        setSorting(prev => prev.filter(s => s.id !== header.column.id))
                      }
                    }}
                  >
                    <span className="k2-header-text">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </span>
                    {header.column.getIsSorted() && (
                      <span className="k2-sort-badge">
                        <span className="k2-sort-arrow">
                          {header.column.getIsSorted() === 'asc' ? '▲' : '▼'}
                        </span>
                        {sorting.length > 1 && (
                          <span className="k2-sort-index">{header.column.getSortIndex() + 1}</span>
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
            <tr className="k2-filter-header-row">
              {table.getHeaderGroups()[0].headers.map((header) => (
                <th key={`filter-${header.id}`} className="k2-filter-header-cell">
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
              <tr key={row.id} className={`k2-row ${i % 2 === 1 ? 'k2-alt' : ''} ${row.getIsSelected() ? 'k2-selected' : ''}`}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="k2-cell" style={{ width: cell.column.getSize() }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pager */}
      <div className="k2-pager">
        <div className="k2-pager-nav">
          <button
            className="k2-pager-btn"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            ⟨⟨
          </button>
          <button
            className="k2-pager-btn"
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
                className={`k2-pager-num ${page === pageIndex ? 'k2-active' : ''}`}
                onClick={() => table.setPageIndex(page)}
              >
                {page + 1}
              </button>
            )
          })}
          <button
            className="k2-pager-btn"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            ⟩
          </button>
          <button
            className="k2-pager-btn"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            ⟩⟩
          </button>
        </div>
        <div className="k2-pager-info">
          <span>{rangeStart} - {rangeEnd} of {totalFiltered} items</span>
          <select
            className="k2-pager-size"
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
