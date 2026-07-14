import React, { useState, useEffect } from 'react';
import { ShieldAlert, Server, Copy, Check, CloudLightning, Code, RefreshCw, Layers } from 'lucide-react';
import { ApiKey, RequestLog, GatewayStats } from './types';
import StatsGrid from './components/StatsGrid';
import KeysTable from './components/KeysTable';
import Playground from './components/Playground';
import IntegrationGuide from './components/IntegrationGuide';
import LogsList from './components/LogsList';

export default function App() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [stats, setStats] = useState<GatewayStats>({
    totalRequests: 0,
    activeKeys: 0,
    totalKeys: 0,
    successRate: 100,
    avgLatency: 0,
    modelDistribution: {},
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic base URL computation
  const gatewayBaseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api` : '';

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(gatewayBaseUrl);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [keysRes, logsRes, statsRes] = await Promise.all([
        fetch('/api/keys'),
        fetch('/api/logs'),
        fetch('/api/stats'),
      ]);

      if (!keysRes.ok || !logsRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch dashboard statistics and keys.');
      }

      const keysData = await keysRes.json();
      const logsData = await logsRes.json();
      const statsData = await statsRes.json();

      setKeys(keysData);
      setLogs(logsData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message || 'Connecting to proxy gateway failed. Is server starting up?');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-poll logs and stats every 6 seconds to keep it dynamic
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const handleCreateKey = async (name: string, description: string, allowedModels: string[]) => {
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, allowedModels }),
      });
      if (!res.ok) throw new Error('Failed to create key');
      fetchDashboardData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to create access key.');
    }
  };

  const handleToggleKey = async (id: string) => {
    try {
      const res = await fetch(`/api/keys/${id}/toggle`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to toggle key status');
      fetchDashboardData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status.');
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      const res = await fetch(`/api/keys/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete key');
      fetchDashboardData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to delete key.');
    }
  };

  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/logs', {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to clear logs');
      fetchDashboardData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to clear log history.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans selection:bg-indigo-50 selection:text-indigo-900 pb-12">
      {/* Top Brand Banner */}
      <header className="bg-slate-900 border-b border-slate-800 text-white py-5 px-6 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <CloudLightning className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                Gemini API Gateway
                <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  v1.0 Beta
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Developer proxy cluster for secure, custom token authorization with Gemini 3.5 Flash
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Manual Reload"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Reload
            </button>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Gateway Cluster Active
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
        
        {/* Error Alert Panel */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-800 animate-pulse">
            <ShieldAlert className="w-5 h-5 mt-0.5 text-rose-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Cluster Synchronization Failed</h4>
              <p className="text-xs text-rose-700 mt-1 leading-relaxed">{error}</p>
              <button
                onClick={() => fetchDashboardData()}
                className="mt-2 text-xs font-bold text-rose-800 underline hover:text-rose-950 focus:outline-none"
              >
                Retry handshake connection
              </button>
            </div>
          </div>
        )}

        {/* Custom Proxy Endpoint Callout Banner */}
        <div className="p-6 bg-indigo-900 border border-indigo-950 text-white rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          {/* Accent decoration */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-800/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2 text-indigo-300">
              <Server className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Active Proxy Endpoint URL</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Forward SDK and raw REST traffic through this site's deployment
            </h2>
            <p className="text-xs text-indigo-200">
              Use your created gateway tokens with the Google Gen AI SDK or direct REST cURL requests.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-indigo-950 p-2.5 rounded-xl border border-indigo-800/60 max-w-full sm:max-w-md w-full">
            <span className="font-mono text-xs text-indigo-200 select-all truncate px-1.5 flex-1">
              {gatewayBaseUrl || 'https://initializing-domain/api'}
            </span>
            <button
              id="btn-copy-endpoint"
              onClick={handleCopyEndpoint}
              className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-all shadow-xs cursor-pointer"
            >
              {copiedEndpoint ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedEndpoint ? 'Copied' : 'Copy URL'}
            </button>
          </div>
        </div>

        {/* Stats Grid Dashboard Bento */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="p-6 bg-white border border-slate-100 rounded-xl shadow-xs animate-pulse space-y-3">
                <div className="w-1/3 h-3.5 bg-slate-100 rounded-md" />
                <div className="w-2/3 h-7 bg-slate-100 rounded-md" />
                <div className="w-1/2 h-2 bg-slate-100 rounded-md" />
              </div>
            ))}
          </div>
        ) : (
          <StatsGrid stats={stats} />
        )}

        {/* Dynamic Multi-Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Keys management & Documentation (8/12 grid span) */}
          <div className="lg:col-span-7 space-y-6">
            <KeysTable
              keys={keys}
              onCreateKey={handleCreateKey}
              onToggleKey={handleToggleKey}
              onDeleteKey={handleDeleteKey}
            />

            <IntegrationGuide keys={keys} />
          </div>

          {/* Right Panel: Interactive Playground & Traffic Monitor (5/12 grid span) */}
          <div className="lg:col-span-5 space-y-6 h-full flex flex-col">
            <div className="flex-1">
              <Playground keys={keys} onTriggerRefresh={() => fetchDashboardData(true)} />
            </div>
          </div>
        </div>

        {/* Traffic logs feed table */}
        <LogsList
          logs={logs}
          onClearLogs={handleClearLogs}
          onRefresh={() => fetchDashboardData(true)}
          refreshing={refreshing}
        />
      </main>
    </div>
  );
}
