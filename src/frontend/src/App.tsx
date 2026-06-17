import React, { useState, useEffect } from 'react';
import { useTokenStore } from './stores/tokenStore';
import Verification from './tabs/Verification';
import LiveLinks from './tabs/LiveLinks';
import EmbedTools from './tabs/EmbedTools';
import Transactions from './tabs/Transactions';
import Share from './tabs/Share';
import Insights from './tabs/Insights';
import UpdateMetadata from './tabs/UpdateMetadata';

type Tab = 'verification' | 'links' | 'embed' | 'transactions' | 'share' | 'insights' | 'update';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('verification');
  const [loading, setLoading] = useState(true);
  const { tokenMint, setVerification, setTransactions, setInsights, setTrustScore, updateLastUpdated } = useTokenStore();

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/token/verify/${tokenMint}`);
        const data = await response.json();
        
        if (data.success) {
          setVerification(data.data);
          setTrustScore(data.data.trustScore);
        }

        const txResponse = await fetch(`/api/token/transactions/${tokenMint}?limit=10`);
        const txData = await txResponse.json();
        if (txData.success) {
          setTransactions(txData.data);
        }

        const insightResponse = await fetch(`/api/token/insights/${tokenMint}`);
        const insightData = await insightResponse.json();
        if (insightData.success) {
          setInsights(insightData.data);
        }

        updateLastUpdated();
      } catch (error) {
        console.error('Error fetching token data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenData();
    const interval = setInterval(fetchTokenData, 15000);
    return () => clearInterval(interval);
  }, [tokenMint, setVerification, setTransactions, setInsights, setTrustScore, updateLastUpdated]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
                Token Transparency Hub
              </h1>
              <p className="text-gray-400 mt-1">Onchain Verification for {tokenMint.slice(0, 8)}...{tokenMint.slice(-4)}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Live on Mainnet</div>
              <div className="text-xs text-green-400 mt-1">● Connected</div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b border-gray-800 bg-gray-900/30 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8 min-w-max md:min-w-0">
            {[
              { id: 'verification', label: '✓ Verification' },
              { id: 'insights', label: '💡 Insights' },
              { id: 'update', label: '✏️ Update' },
              { id: 'links', label: '🔗 Live Links' },
              { id: 'embed', label: '</> Embed' },
              { id: 'transactions', label: '📊 Transactions' },
              { id: 'share', label: '📢 Share' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`px-4 py-4 text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-green-400 border-b-2 border-green-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-green-400"></div>
            <p className="mt-4 text-gray-400">Fetching onchain data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'verification' && <Verification />}
            {activeTab === 'insights' && <Insights />}
            {activeTab === 'update' && <UpdateMetadata />}
            {activeTab === 'links' && <LiveLinks />}
            {activeTab === 'embed' && <EmbedTools />}
            {activeTab === 'transactions' && <Transactions />}
            {activeTab === 'share' && <Share />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
