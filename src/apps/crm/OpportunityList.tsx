import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { OpportunityWithClient } from './types'

const STAGES = ['lead', 'qualified', 'proposal', 'won', 'lost'] as const

const currencyFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function OpportunityList() {
  const [opportunities, setOpportunities] = useState<OpportunityWithClient[]>([])
  const [clients, setClients] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [stage, setStage] = useState<(typeof STAGES)[number]>('lead')
  const [clientId, setClientId] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [oppResult, clientResult] = await Promise.all([
      supabase
        .from('opportunities')
        .select('*, clients(name)')
        .order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name').order('name'),
    ])

    if (oppResult.error) {
      setError(oppResult.error.message)
    } else {
      setOpportunities(oppResult.data ?? [])
    }

    if (clientResult.error) {
      setError(clientResult.error.message)
    } else {
      setClients(clientResult.data ?? [])
    }

    setLoading(false)
  }

  function resetForm() {
    setTitle('')
    setValue('')
    setStage('lead')
    setClientId('')
    setEditingId(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    const record = {
      title: title.trim(),
      value: value ? parseFloat(value) : null,
      stage,
      client_id: clientId ? parseInt(clientId) : null,
    }

    if (editingId) {
      const { error } = await supabase
        .from('opportunities')
        .update(record)
        .eq('id', editingId)
      if (error) {
        setError(error.message)
      } else {
        const clientName = clients.find(c => c.id === record.client_id)?.name ?? null
        setOpportunities(
          opportunities.map(o =>
            o.id === editingId
              ? { ...o, ...record, clients: clientName ? { name: clientName } : null }
              : o
          )
        )
        resetForm()
      }
    } else {
      const { data, error } = await supabase
        .from('opportunities')
        .insert(record)
        .select('*, clients(name)')
        .single()
      if (error) {
        setError(error.message)
      } else {
        setOpportunities([data, ...opportunities])
        resetForm()
      }
    }
  }

  function startEdit(opp: OpportunityWithClient) {
    setEditingId(opp.id)
    setTitle(opp.title)
    setValue(opp.value?.toString() ?? '')
    setStage(opp.stage)
    setClientId(opp.client_id?.toString() ?? '')
  }

  async function deleteOpportunity(id: number) {
    const { error } = await supabase.from('opportunities').delete().eq('id', id)
    if (error) {
      setError(error.message)
    } else {
      setOpportunities(opportunities.filter(o => o.id !== id))
    }
  }

  if (loading) return <p>Loading opportunities...</p>

  return (
    <div className="crm-section">
      {error && <p className="crm-error">{error}</p>}

      <form className="crm-form" onSubmit={handleSubmit}>
        <input
          placeholder="Title *"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Value"
          value={value}
          onChange={e => setValue(e.target.value)}
          step="0.01"
        />
        <select value={stage} onChange={e => setStage(e.target.value as (typeof STAGES)[number])}>
          {STAGES.map(s => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <select value={clientId} onChange={e => setClientId(e.target.value)}>
          <option value="">No client</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="crm-form-actions">
          <button type="submit">{editingId ? 'Update' : 'Add Opportunity'}</button>
          {editingId && (
            <button type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {opportunities.length === 0 ? (
        <p>No opportunities yet. Add one above!</p>
      ) : (
        <table className="crm-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Value</th>
              <th>Stage</th>
              <th>Client</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map(opp => (
              <tr key={opp.id}>
                <td>{opp.title}</td>
                <td>{opp.value != null ? currencyFormat.format(opp.value) : '—'}</td>
                <td>
                  <span className={`crm-stage crm-stage-${opp.stage}`}>{opp.stage}</span>
                </td>
                <td>{opp.clients?.name ?? '—'}</td>
                <td className="crm-actions">
                  <button onClick={() => startEdit(opp)}>Edit</button>
                  <button onClick={() => deleteOpportunity(opp.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default OpportunityList
