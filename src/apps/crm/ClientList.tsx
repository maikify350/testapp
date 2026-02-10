import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Client } from './types'

function ClientList() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      setError(error.message)
    } else {
      setClients(data ?? [])
    }
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

      {clients.length === 0 ? (
        <p>No clients yet. Add one above!</p>
      ) : (
        <table className="crm-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Company</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.id}>
                <td>{client.name}</td>
                <td>{client.email}</td>
                <td>{client.phone}</td>
                <td>{client.company}</td>
                <td className="crm-actions">
                  <button onClick={() => startEdit(client)}>Edit</button>
                  <button onClick={() => deleteClient(client.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default ClientList
