export interface Client {
  id: number
  name: string
  email: string | null
  phone: string | null
  company: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  website: string | null
  created_at: string
}

export interface Opportunity {
  id: number
  client_id: number | null
  title: string
  value: number | null
  stage: 'lead' | 'qualified' | 'proposal' | 'won' | 'lost'
  created_at: string
}

export interface OpportunityWithClient extends Opportunity {
  clients: { name: string } | null
}
