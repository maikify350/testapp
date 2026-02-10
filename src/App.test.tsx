import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

// Mock Supabase client — table-aware
vi.mock('./lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'clients') {
        return {
          select: () => ({
            order: () =>
              Promise.resolve({
                data: [{ id: 1, name: 'Acme Corp', email: 'info@acme.com', phone: '555-0100', company: 'Acme', created_at: '2025-01-01' }],
                error: null,
              }),
          }),
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
          delete: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }
      }
      // opportunities
      return {
        select: () => ({
          order: () =>
            Promise.resolve({
              data: [{ id: 1, client_id: 1, title: 'Big Deal', value: 50000, stage: 'lead', created_at: '2025-01-01', clients: { name: 'Acme Corp' } }],
              error: null,
            }),
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
        delete: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      }
    },
  },
}))

describe('CRM App', () => {
  it('renders the CRM heading', () => {
    render(<App />)
    expect(screen.getByText('CRM')).toBeInTheDocument()
  })

  it('renders both tabs', () => {
    render(<App />)
    expect(screen.getByText('Clients')).toBeInTheDocument()
    expect(screen.getByText('Opportunities')).toBeInTheDocument()
  })

  it('shows client form elements by default', async () => {
    render(<App />)
    expect(await screen.findByPlaceholderText('Name *')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add client/i })).toBeInTheDocument()
  })

  it('switches to opportunities tab', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByText('Opportunities'))
    expect(screen.getByPlaceholderText('Title *')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add opportunity/i })).toBeInTheDocument()
  })
})
