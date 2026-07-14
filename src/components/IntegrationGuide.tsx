import React, { useState } from 'react';
import { Code, Copy, Check, Terminal, FileCode2 } from 'lucide-react';
import { ApiKey } from '../types';

interface IntegrationGuideProps {
  keys: ApiKey[];
}

export default function IntegrationGuide({ keys }: IntegrationGuideProps) {
  const [selectedKeyId, setSelectedKeyId] = useState<string>('gpk_YOUR_CREATED_TOKEN');
  const [activeTab, setActiveTab] = useState<'js' | 'python' | 'curl'>('js');
  const [copied, setCopied] = useState(false);

  // Fallback if they haven't created any keys yet
  const activeKeys = keys.filter((k) => k.status === 'active');
  const displayKey = activeKeys.length > 0 ? activeKeys[0].id : selectedKeyId;

  const gatewayUrl = typeof window !== 'undefined' ? `${window.location.origin}/api` : 'https://YOUR_DOMAIN/api';

  const snippets = {
    js: `// Install Google Gen AI SDK: npm install @google/genai
import { GoogleGenAI } from '@google/genai';

// Initialize with your custom Gateway Access Token and custom Base URL
const ai = new GoogleGenAI({
  apiKey: '${displayKey}',
  baseUrl: '${gatewayUrl}' 
});

// Run generation using Gemini 3.5 Flash
async function run() {
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: 'Explain standard API Gateways in one short sentence.'
  });
  
  console.log(response.text);
}

run();`,
    python: `# Install python SDK: pip install google-genai
from google import genai
from google.genai import types

# Initialize client pointing to your custom API Gateway
client = genai.Client(
    api_key="${displayKey}",
    http_options={
        "baseUrl": "${gatewayUrl}"
    }
)

# Call Gemini 3.5 Flash model
response = client.models.generate_content(
    model="gemini-3.5-flash",
    contents="Explain standard API Gateways in one short sentence."
)

print(response.text)`,
    curl: `curl -X POST "${gatewayUrl}/v1beta/models/gemini-3.5-flash:generateContent?key=${displayKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain standard API Gateways in one short sentence."
          }
        ]
      }
    ]
  }'`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="integration-guide" className="bg-white border border-slate-100 rounded-xl shadow-xs p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-600" />
            Developer Integration Guide
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Integrate your custom keys with the official Google Gen AI SDK seamlessly.
          </p>
        </div>

        {activeKeys.length > 1 && (
          <div className="flex items-center gap-2">
            <label htmlFor="guide-token-select" className="text-xs font-semibold text-slate-500">Inject Token:</label>
            <select
              id="guide-token-select"
              value={displayKey}
              onChange={(e) => setSelectedKeyId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none transition-colors font-mono font-medium text-slate-800"
            >
              {activeKeys.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} ({k.id.substring(0, 10)}...)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1 gap-1 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('js')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'js'
              ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100/50'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5" />
          JavaScript / TypeScript SDK
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('python')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'python'
              ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100/50'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          Python Gen AI SDK
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('curl')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'curl'
              ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100/50'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Raw REST curl
        </button>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-3 top-3 flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-2.5 py-1.5 rounded-md border border-slate-700 transition-all cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
        <pre className="bg-slate-950 text-slate-200 p-4 rounded-lg font-mono text-xs overflow-x-auto border border-slate-900 leading-relaxed max-h-[280px]">
          <code>{snippets[activeTab]}</code>
        </pre>
      </div>
    </div>
  );
}
