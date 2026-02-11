import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
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
import { FontSelector, FONT_OPTIONS } from './FontSelector'
import { DatePicker } from './DatePicker'
import './TanStackClientGridV2.css'

const columnHelper = createColumnHelper<Client>()

// --- Theme definitions ---
const THEMES = [
  { id: 'mocha', label: 'Mocha', color: '#A47148', className: 'k2-theme-mocha' },
  { id: 'mocha-dark', label: 'Mocha Dark', color: '#C4956A', className: 'k2-theme-mocha-dark' },
  { id: 'teal-light', label: 'Teal Light', color: '#0F766E', className: 'k2-theme-teal-light' },
  { id: 'dark-teal', label: 'Dark Teal', color: '#14B8A6', className: 'k2-theme-dark-teal' },
  { id: 'default', label: 'Default Dark', color: '#646cff', className: '' },
  { id: 'ocean', label: 'Ocean Blue', color: '#0ea5e9', className: 'k2-theme-ocean' },
  { id: 'nordic', label: 'Nordic', color: '#5eead4', className: 'k2-theme-nordic' },
  { id: 'emerald', label: 'Emerald', color: '#10b981', className: 'k2-theme-emerald' },
  { id: 'ruby', label: 'Ruby', color: '#f43f5e', className: 'k2-theme-ruby' },
  { id: 'amber', label: 'Amber', color: '#f59e0b', className: 'k2-theme-amber' },
  { id: 'light', label: 'Light', color: '#4f46e5', className: 'k2-theme-light' },
]

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

// --- Editable cell component using uncontrolled input ---
const EditableInput = React.memo(({
  defaultValue,
  onValueChange,
  fieldKey
}: {
  defaultValue: string;
  onValueChange: (field: string, val: string) => void;
  fieldKey: string;
}) => {
  const [localValue, setLocalValue] = useState(defaultValue)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    onValueChange(fieldKey, newValue)
  }, [fieldKey, onValueChange])

  return (
    <input
      className="k2-inline-input"
      value={localValue}
      onChange={handleChange}
      autoFocus={fieldKey === 'name'}
    />
  )
})

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

export default function TanStackClientGridV2({ clients, onEdit, onSave, onDelete }: ClientGridProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [editingRowId, setEditingRowId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const editValuesRef = useRef<Record<string, string>>({})
  const [nestedView, setNestedView] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([
    'select', 'name', 'email', 'phone', 'company', 'created_at', 'actions',
  ])
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [sortZoneActive, setSortZoneActive] = useState(false)
  const [sortChipDragOver, setSortChipDragOver] = useState<string | null>(null)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('k2-grid-theme')
    return THEMES.find(t => t.id === saved) ?? THEMES[0]
  })
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const themeRef = useRef<HTMLDivElement>(null)
  const [fontFamily, setFontFamily] = useState(() => {
    const saved = localStorage.getItem('k2-grid-font')
    return saved || FONT_OPTIONS[0].family
  })
  const dragColumnRef = useRef<string | null>(null)
  const dragSourceRef = useRef<'header' | 'chip' | null>(null)
  const didDragRef = useRef(false)

  // Close theme dropdown on outside click
  useEffect(() => {
    if (!showThemeMenu) return
    const handler = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showThemeMenu])

  const COLUMN_LABELS: Record<string, string> = {
    name: 'Name', email: 'Email', phone: 'Phone',
    company: 'Company', created_at: 'Created',
  }

  const selectedCount = Object.keys(rowSelection).length

  // Sync ref with state
  useEffect(() => {
    editValuesRef.current = editValues
  }, [editValues])

  // Memoize edit handlers to prevent recreation
  const handleFieldChange = useCallback((field: string, value: string) => {
    const newValues = { ...editValuesRef.current, [field]: value }
    editValuesRef.current = newValues
    setEditValues(newValues)
  }, [])

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
      cell: (info) => {
        if (info.row.original.id === editingRowId) {
          return <EditableInput defaultValue={editValues.name ?? ''} onValueChange={handleFieldChange} fieldKey="name" />
        }
        return info.getValue()
      },
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      filterFn: operatorFilterFn,
      size: 220,
      cell: (info) => {
        if (info.row.original.id === editingRowId) {
          return <EditableInput defaultValue={editValues.email ?? ''} onValueChange={handleFieldChange} fieldKey="email" />
        }
        return info.getValue()
      },
    }),
    columnHelper.accessor('phone', {
      header: 'Phone',
      filterFn: operatorFilterFn,
      size: 150,
      cell: (info) => {
        if (info.row.original.id === editingRowId) {
          return <EditableInput defaultValue={editValues.phone ?? ''} onValueChange={handleFieldChange} fieldKey="phone" />
        }
        return info.getValue()
      },
    }),
    columnHelper.accessor('company', {
      header: 'Company',
      filterFn: operatorFilterFn,
      size: 200,
      cell: (info) => {
        if (info.row.original.id === editingRowId) {
          return <EditableInput defaultValue={editValues.company ?? ''} onValueChange={handleFieldChange} fieldKey="company" />
        }
        return info.getValue()
      },
    }),
    columnHelper.accessor('created_at', {
      header: 'Created',
      filterFn: operatorFilterFn,
      size: 150,
      cell: (info) => {
        if (info.row.original.id === editingRowId) {
          return <DatePicker defaultValue={editValues.created_at ?? info.getValue()} onValueChange={handleFieldChange} fieldKey="created_at" />
        }
        const date = new Date(info.getValue())
        const day = String(date.getUTCDate()).padStart(2, '0')
        const month = String(date.getUTCMonth() + 1).padStart(2, '0')
        const year = date.getUTCFullYear()
        return `${month}/${day}/${year}`
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      size: 140,
      enableResizing: false,
      cell: ({ row }) => {
        if (row.original.id === editingRowId) {
          return (
            <div className="k2-actions">
              <button className="k2-action-btn k2-save" onClick={async () => {
                if (onSave) {
                  await onSave({ ...row.original, ...editValuesRef.current })
                }
                setEditingRowId(null)
                setEditValues({})
                editValuesRef.current = {}
              }}>Save</button>
              <button className="k2-action-btn k2-cancel" onClick={() => {
                setEditingRowId(null)
                setEditValues({})
                editValuesRef.current = {}
              }}>Cancel</button>
            </div>
          )
        }
        return (
          <div className="k2-actions">
            <button className="k2-action-btn k2-edit" onClick={() => {
              setEditingRowId(row.original.id)
              const initialValues = {
                name: row.original.name ?? '',
                email: row.original.email ?? '',
                phone: row.original.phone ?? '',
                company: row.original.company ?? '',
                created_at: row.original.created_at ?? '',
              }
              setEditValues(initialValues)
              editValuesRef.current = initialValues
            }}>Edit</button>
            <button className="k2-action-btn k2-delete" onClick={() => onDelete(row.original.id)}>Delete</button>
          </div>
        )
      },
    }),
  ], [onEdit, onSave, onDelete, editingRowId, handleFieldChange])

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

  // --- Grouping logic for nested view ---
  type GroupNode = {
    type: 'group'
    columnId: string
    label: string
    value: string
    depth: number
    key: string
    count: number
    children: (GroupNode | { type: 'row'; row: typeof table extends { getRowModel: () => { rows: (infer R)[] } } ? R : never })[]
  }

  function buildGroupTree(
    rows: ReturnType<typeof table.getRowModel>['rows'],
    sortCols: SortingState,
    depth: number,
    parentKey: string,
  ): GroupNode['children'] {
    if (depth >= sortCols.length) {
      return rows.map(r => ({ type: 'row' as const, row: r }))
    }
    const colId = sortCols[depth].id
    const colLabel = COLUMN_LABELS[colId] ?? colId
    const groups = new Map<string, typeof rows>()
    for (const row of rows) {
      let val = String(row.getValue(colId) ?? '')
      if (colId === 'created_at') {
        const date = new Date(val)
        const day = String(date.getUTCDate()).padStart(2, '0')
        const month = String(date.getUTCMonth() + 1).padStart(2, '0')
        const year = date.getUTCFullYear()
        val = `${month}/${day}/${year}`
      }
      if (!groups.has(val)) groups.set(val, [])
      groups.get(val)!.push(row)
    }
    return Array.from(groups.entries()).map(([val, groupRows]) => {
      const key = parentKey ? `${parentKey}|${colId}=${val}` : `${colId}=${val}`
      return {
        type: 'group' as const,
        columnId: colId,
        label: colLabel,
        value: val,
        depth,
        key,
        count: groupRows.length,
        children: buildGroupTree(groupRows, sortCols, depth + 1, key),
      }
    })
  }

  function toggleGroup(key: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const colCount = table.getVisibleLeafColumns().length

  function renderGroupedBody(nodes: GroupNode['children'], rowIndex: { value: number }): React.ReactNode[] {
    const result: React.ReactNode[] = []
    for (const node of nodes) {
      if (node.type === 'group') {
        const isCollapsed = collapsedGroups.has(node.key)
        result.push(
          <tr key={`group-${node.key}`} className="k2-group-row" onClick={() => toggleGroup(node.key)}>
            <td colSpan={colCount} className="k2-group-cell" style={{ paddingLeft: `${node.depth * 24 + 12}px` }}>
              <span className="k2-group-toggle">{isCollapsed ? '▶' : '▼'}</span>
              <span className="k2-group-label">{node.label}: </span>
              <span className="k2-group-value">{node.value}</span>
              <span className="k2-group-count">({node.count})</span>
            </td>
          </tr>
        )
        if (!isCollapsed) {
          result.push(...renderGroupedBody(node.children, rowIndex))
        }
      } else {
        const i = rowIndex.value++
        const row = node.row
        result.push(
          <tr key={row.id} className={`k2-row ${i % 2 === 1 ? 'k2-alt' : ''} ${row.getIsSelected() ? 'k2-selected' : ''} ${row.original.id === editingRowId ? 'k2-editing' : ''} k2-nested-data-row`}
            style={{ ['--nest-depth' as string]: sorting.length }}
          >
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="k2-cell" style={{ width: cell.column.getSize() }}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        )
      }
    }
    return result
  }

  return (
    <div
      className={`k2-grid ${theme.className}`}
      style={{ '--k2-font-family': fontFamily } as React.CSSProperties}
    >
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
          <label className="k2-nested-toggle">
            <input
              type="checkbox"
              className="k2-checkbox"
              checked={nestedView}
              onChange={(e) => { setNestedView(e.target.checked); setCollapsedGroups(new Set()) }}
            />
            <span>Nested View</span>
          </label>
          <input
            className="k2-global-search"
            placeholder="Search all columns..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
          <FontSelector
            currentFont={fontFamily}
            onFontChange={(font) => {
              setFontFamily(font)
              localStorage.setItem('k2-grid-font', font)
            }}
          />
          <div className="k2-theme-wrapper" ref={themeRef}>
            <button
              className="k2-theme-btn"
              title="Change theme"
              onClick={() => setShowThemeMenu(!showThemeMenu)}
            >
              <span className="k2-theme-btn-dot" style={{ background: theme.color }} />
            </button>
            {showThemeMenu && (
              <div className="k2-theme-dropdown">
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    className={`k2-theme-option ${t.id === theme.id ? 'k2-theme-active' : ''}`}
                    onClick={() => { setTheme(t); localStorage.setItem('k2-grid-theme', t.id); setShowThemeMenu(false) }}
                  >
                    <span className="k2-theme-dot" style={{ background: t.color }} />
                    {t.label}
                    {t.id === theme.id && <span className="k2-theme-check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
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
                  draggable={header.column.id !== 'actions' && header.column.id !== 'select'}
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
                    if (!dragColumnRef.current || header.column.id === 'actions' || header.column.id === 'select') return
                    e.preventDefault()
                    e.stopPropagation()
                    e.dataTransfer.dropEffect = 'move'
                    if (dragColumnRef.current !== header.column.id) {
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
                    if (from && from !== to && to !== 'actions' && to !== 'select') {
                      setColumnOrder(prev => {
                        const next = [...prev]
                        const fromIdx = next.indexOf(from)
                        const toIdx = next.indexOf(to)
                        // Remove from old position
                        next.splice(fromIdx, 1)
                        // Insert at new position
                        const newToIdx = next.indexOf(to)
                        next.splice(newToIdx, 0, from)
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
            {nestedView && sorting.length > 0 ? (
              renderGroupedBody(
                buildGroupTree(table.getSortedRowModel().rows, sorting, 0, ''),
                { value: 0 },
              )
            ) : (
              table.getRowModel().rows.map((row, i) => (
                <tr key={row.id} className={`k2-row ${i % 2 === 1 ? 'k2-alt' : ''} ${row.getIsSelected() ? 'k2-selected' : ''} ${row.original.id === editingRowId ? 'k2-editing' : ''}`}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="k2-cell" style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pager (hidden in nested view) */}
      <div className="k2-pager" style={nestedView && sorting.length > 0 ? { display: 'none' } : undefined}>
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
