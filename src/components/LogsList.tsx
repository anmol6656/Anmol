import React, { useState } from 'react';
import { ListFilter, Eye, RefreshCw, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { RequestLog } from '../types';

interface LogsListProps {
  logs: RequestLog[];
  onClearLogs: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export default function LogsList({ logs, onClearLogs, onRefresh, refreshing }: LogsListProps) {
  const [filterModel, setFilterModel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredLogs = logs.filter((log) => {
    const modelMatch = filterModel === 'all' || log.model.toLowerCase().includes(filterModel.toLowerCase());
    let statusMatch = true;
    if (filterStatus === 'success') {
      statusMatch = log.status >= 200 && log.status < 300;
    } else if (filterStatus === 'error') {
      statusMatch = log.status >= 400;
    }
    return modelMatch && statusMatch;
  });

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
          <CheckCircle2 className="w-3 h-3" />
          {status} OK
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-100">
        <AlertCircle className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const getLatencyBadge = (latency: number) => {
    if (latency < 400) {
      return <span className="font-mono font-semibold text-emerald-600">{latency}ms</span>;
    } else if (latency < 1200) {
      return <span className="font-mono font-semibold text-amber-600">{latency}ms</span>;
    }
    return <span className="font-mono font-semibold text-orange-600">{latency}ms</span>;
  };

  return (
    <div id="logs-manager" className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-indigo-600" />
            Gateway Traffic Logs
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time traffic audit logs for keys and model executions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filters */}
          <select
            id="log-model-filter"
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none text-slate-600"
          >
            <option value="all">All Models</option>
            <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
          </select>

          <select
            id="log-status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none text-slate-600"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success (2xx)</option>
            <option value="error">Errors (4xx+)</option>
          </select>

          <button
            id="btn-refresh-logs"
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {logs.length > 0 && (
            <button
              id="btn-clear-logs"
              onClick={() => {
                if (confirm('Are you sure you want to clear all traffic logs? This action is irreversible.')) {
                  onClearLogs();
                }
              }}
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Clear Logs"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-600">No logs found matching filters</p>
            <p className="text-xs text-slate-400 mt-1">
              {logs.length === 0 
                ? 'Traffic logs are empty. Run a test from the playground!'
                : 'Try adjusting your filter parameters above.'}
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase text-[10px] tracking-wider font-semibold sticky top-0 bg-white z-10">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Access Key Used</th>
                <th className="p-4">Target Model & Method</th>
                <th className="p-4">Status</th>
                <th className="p-4">Latency</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-slate-500 font-mono whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-900">{log.keyName}</span>
                    <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{log.keyId}</span>
                  </td>
                  <td className="p-4 font-mono">
                    <span className="text-slate-800 font-semibold">{log.model}</span>
                    <span className="text-slate-400 text-[10px] block mt-0.5">:{log.method}</span>
                  </td>
                  <td className="p-4">{getStatusBadge(log.status)}</td>
                  <td className="p-4">{getLatencyBadge(log.latency)}</td>
                  <td className="p-4 max-w-[200px]">
                    {log.error ? (
                      <span className="text-rose-500 font-semibold truncate block" title={log.error}>
                        {log.error}
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        Success
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
