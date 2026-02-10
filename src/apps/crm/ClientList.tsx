import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import { GRID_OPTIONS } from './grids'
import type { GridLibrary } from './grids'
import type { Client } from './types'

const AgGridClientGrid = lazy(() => import('./grids/AgGridClientGrid'))
const TanStackClientGrid = lazy(() => import('./grids/TanStackClientGrid'))
const MuiDataGridClientGrid = lazy(() => import('./grids/MuiDataGridClientGrid'))

function ClientList() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [gridLibrary, setGridLibrary] = useState<GridLibrary>('ag-grid')
  const [loadInfo, setLoadInfo] = useState<{ label: string; records: number; secs: number } | null>(null)
  const loadStart = useRef<number>(0)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    loadStart.current = performance.now()
    // Supabase PostgREST caps at 1000 rows per request, so paginate
    let allData: Client[] = []
    let from = 0
    const pageSize = 1000
    while (true) {
      const { data, error: err } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1)
      if (err) {
        setError(err.message)
        break
      }
      allData = allData.concat(data ?? [])
      if (!data || data.length < pageSize) break
      from += pageSize
    }
    const elapsed = (performance.now() - loadStart.current) / 1000
    setLoadInfo({ label: 'Fetch', records: allData.length, secs: elapsed })
    setClients(allData)
    setLoading(false)
  }

  function resetForm() {
    setName('')
    setEmail('')
    setPhone('')
    setCompany('')
    setEditingId(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const record = {
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      company: company.trim() || null,
    }

    if (editingId) {
      const { error } = await supabase
        .from('clients')
        .update(record)
        .eq('id', editingId)
      if (error) {
        setError(error.message)
      } else {
        setClients(clients.map(c => (c.id === editingId ? { ...c, ...record } : c)))
        resetForm()
      }
    } else {
      const { data, error } = await supabase
        .from('clients')
        .insert(record)
        .select()
        .single()
      if (error) {
        setError(error.message)
      } else {
        setClients([data, ...clients])
        resetForm()
      }
    }
  }

  function startEdit(client: Client) {
    setEditingId(client.id)
    setName(client.name)
    setEmail(client.email ?? '')
    setPhone(client.phone ?? '')
    setCompany(client.company ?? '')
  }

  async function deleteClient(id: number) {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) {
      setError(error.message)
    } else {
      setClients(clients.filter(c => c.id !== id))
    }
  }

  function renderGrid() {
    const gridProps = { clients, onEdit: startEdit, onDelete: deleteClient }
    switch (gridLibrary) {
      case 'ag-grid':
        return <AgGridClientGrid {...gridProps} />
      case 'tanstack':
        return <TanStackClientGrid {...gridProps} />
      case 'mui-datagrid':
        return <MuiDataGridClientGrid {...gridProps} />
    }
  }

  if (loading) return <p>Loading clients...</p>

  return (
    <div className="crm-section">
      {error && <p className="crm-error">{error}</p>}

      <form className="crm-form" onSubmit={handleSubmit}>
        <input
          placeholder="Name *"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          placeholder="Phone"
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />
        <input
          placeholder="Company"
          value={company}
          onChange={e => setCompany(e.target.value)}
        />
        <div className="crm-form-actions">
          <button type="submit">{editingId ? 'Update' : 'Add Client'}</button>
          {editingId && (
            <button type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="crm-grid-selector">
        <label htmlFor="grid-select">Grid Library:</label>
        <select
          id="grid-select"
          value={gridLibrary}
          onChange={e => {
            const lib = e.target.value as GridLibrary
            const start = performance.now()
            setGridLibrary(lib)
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                const elapsed = (performance.now() - start) / 1000
                const label = GRID_OPTIONS.find(o => o.value === lib)?.label ?? lib
                setLoadInfo({ label: `Render ${label}`, records: clients.length, secs: elapsed })
              })
            })
          }}
        >
          {GRID_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {loadInfo && (
          <span className="crm-load-time">
            {loadInfo.label}: ({loadInfo.records} records) {loadInfo.secs.toFixed(2)} secs
          </span>
        )}
      </div>

      {clients.length === 0 ? (
        <p>No clients yet. Add one above!</p>
      ) : (
        <Suspense fallback={<p>Loading grid...</p>}>
          {renderGrid()}
        </Suspense>
      )}
    </div>
  )
}

export default ClientList
