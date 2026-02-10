import { useState } from 'react'
import ClientList from './ClientList'
import OpportunityList from './OpportunityList'
import './CrmApp.css'

type Tab = 'clients' | 'opportunities'

function CrmApp() {
  const [activeTab, setActiveTab] = useState<Tab>('clients')

  return (
    <div className="crm-app">
      <h1>CRM</h1>
      <div className="crm-tabs">
        <button
          className={`crm-tab ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          Clients
        </button>
        <button
          className={`crm-tab ${activeTab === 'opportunities' ? 'active' : ''}`}
          onClick={() => setActiveTab('opportunities')}
        >
          Opportunities
        </button>
      </div>
      {activeTab === 'clients' ? <ClientList /> : <OpportunityList />}
    </div>
  )
}

export default CrmApp
