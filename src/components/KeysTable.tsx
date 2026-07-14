import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check, Trash2, Shield, Plus, ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { ApiKey } from '../types';

interface KeysTableProps {
  keys: ApiKey[];
  onCreateKey: (name: string, description: string, allowedModels: string[]) => void;
  onToggleKey: (id: string) => void;
  onDeleteKey: (id: string) => void;
}

export default function KeysTable({ keys, onCreateKey, onToggleKey, onDeleteKey }: KeysTableProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>(['gemini-3.5-flash']);
  
  const [revealKeyId, setRevealKeyId] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const availableModels = [
    { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash (Recommended)' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: '*', label: 'All Models (Wildcard *)' },
  ];

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateKey(name, description, selectedModels);
    setName('');
    setDescription('');
    setSelectedModels(['gemini-3.5-flash']);
    setShowForm(false);
  };

  const toggleModelSelection = (model: string) => {
    if (model === '*') {
      setSelectedModels(['*']);
    } else {
      let updated = selectedModels.filter((m) => m !== '*');
      if (updated.includes(model)) {
        updated = updated.filter((m) => m !== model);
      } else {
        updated.push(model);
      }
      if (updated.length === 0) {
        updated = ['gemini-3.5-flash'];
      }
      setSelectedModels(updated);
    }
  };

  return (
    <div id="keys-manager" className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Gateway Access Keys
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Create custom access tokens to proxy Gemini models securely.
          </p>
        </div>
        <button
          id="btn-create-key-toggle"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Close Drawer' : 'Generate New Key'}
        </button>
      </div>

      {showForm && (
        <form id="form-create-key" onSubmit={handleSubmit} className="p-6 bg-slate-50/50 border-b border-slate-100 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="key-name-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Key Label / Name
              </label>
              <input
                id="key-name-input"
                type="text"
                required
                placeholder="e.g. Production Web App"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-lg p-3 text-sm focus:outline-none transition-colors shadow-xs"
              />
            </div>

            <div>
              <label htmlFor="key-desc-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Purpose / Description
              </label>
              <input
                id="key-desc-input"
                type="text"
                placeholder="e.g. Chat bot integration key"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-lg p-3 text-sm focus:outline-none transition-colors shadow-xs"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Allowed Gemini Models
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableModels.map((model) => {
                const isSelected = selectedModels.includes(model.value);
                return (
                  <button
                    type="button"
                    key={model.value}
                    onClick={() => toggleModelSelection(model.value)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-medium shadow-xs'
                        : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    {model.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Only selected models can be queried with this API key.
            </p>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Generate Gateway Token
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        {keys.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-700">No Custom API Keys Created Yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Click the "Generate New Key" button to secure your proxy gateway.
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <th className="p-4">Key Details</th>
                <th className="p-4">Secure Token ID</th>
                <th className="p-4">Allowed Models</th>
                <th className="p-4">Requests</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {keys.map((key) => {
                const isRevealed = revealKeyId === key.id;
                const isCopied = copiedKeyId === key.id;
                return (
                  <tr key={key.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-slate-900 text-sm">{key.name}</div>
                      {key.description && <div className="text-xs text-slate-400 mt-0.5">{key.description}</div>}
                      <div className="text-[10px] text-slate-400 mt-1">
                        Created {new Date(key.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs">
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100 max-w-[280px]">
                        <span className="truncate flex-1 select-all">
                          {isRevealed ? key.id : `${key.id.substring(0, 8)}••••••••••••••••••••`}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setRevealKeyId(isRevealed ? null : key.id)}
                            className="p-1 hover:text-indigo-600 text-slate-400 transition-colors"
                            title={isRevealed ? 'Hide API Key' : 'Reveal API Key'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(key.id)}
                            className="p-1 hover:text-indigo-600 text-slate-400 transition-colors"
                            title="Copy to Clipboard"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {key.allowedModels.map((model) => (
                          <span
                            key={model}
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200"
                          >
                            {model}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-semibold text-slate-700">
                      <div>{key.requestCount}</div>
                      {key.lastUsedAt && (
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          Used {new Date(key.lastUsedAt).toLocaleTimeString()}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => onToggleKey(key.id)}
                        className="flex items-center gap-1.5 focus:outline-none cursor-pointer"
                        title={key.status === 'active' ? 'Suspend Token' : 'Activate Token'}
                      >
                        {key.status === 'active' ? (
                          <>
                            <ToggleRight className="w-8 h-8 text-emerald-500" />
                            <span className="text-xs font-semibold text-emerald-600">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-8 h-8 text-slate-300" />
                            <span className="text-xs font-semibold text-slate-400">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${key.name}"? This action cannot be undone.`)) {
                            onDeleteKey(key.id);
                          }
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="Delete Token"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
