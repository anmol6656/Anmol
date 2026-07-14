import React, { useState } from 'react';
import { Terminal, Send, Cpu, Zap, Eye, AlertCircle, Copy, Check } from 'lucide-react';
import { ApiKey } from '../types';

interface PlaygroundProps {
  keys: ApiKey[];
  onTriggerRefresh: () => void;
}

const SAMPLE_PROMPTS = [
  { label: 'Server Haiku', prompt: 'Write a haiku about a high-throughput API gateway server.' },
  { label: 'JSON List', prompt: 'Give me a JSON array containing top 3 programming languages of 2026, with name and popularity percentage. Return ONLY raw JSON.' },
  { label: 'Tech Explainer', prompt: 'Explain quantum computing to an 8-year-old in exactly three short sentences.' },
];

export default function Playground({ keys, onTriggerRefresh }: PlaygroundProps) {
  const [selectedKeyId, setSelectedKeyId] = useState<string>('keyless');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');
  const [method, setMethod] = useState<'generateContent' | 'streamGenerateContent'>('streamGenerateContent');
  const [prompt, setPrompt] = useState('Write a quick greeting message to developers using this gateway!');
  
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [rawResponse, setRawResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [performance, setPerformance] = useState<{ latency: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const activeKeys = keys.filter((k) => k.status === 'active');

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunTest = async () => {
    setLoading(true);
    setOutput('');
    setRawResponse('');
    setError(null);
    setPerformance(null);

    const startTime = Date.now();
    const queryKeyParam = selectedKeyId !== 'keyless' ? `?key=${selectedKeyId}` : '';
    const endpoint = `/api/v1beta/models/${selectedModel}:${method}${queryKeyParam}`;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // If client key is selected, we can also pass it in headers to demonstrate that method!
      if (selectedKeyId !== 'keyless') {
        headers['x-goog-api-key'] = selectedKeyId;
      }

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `HTTP error! status: ${response.status}`);
      }

      if (method === 'streamGenerateContent') {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedText = '';
        let fullRawJson = '';

        if (!reader) {
          throw new Error('Readable stream not supported on this response.');
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullRawJson += chunk;
          setRawResponse(fullRawJson);

          // Attempt to extract text from chunk
          // In standard SSE, the stream contains data blocks or concatenated JSON
          try {
            // Check if chunk is concatenated JSON objects
            const cleaned = chunk.trim();
            // Match "text": "..." within the string using regex as a reliable fallback for streaming chunks
            const textMatches = [...cleaned.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g)];
            if (textMatches.length > 0) {
              for (const m of textMatches) {
                // Unescape backslashes, quotes and newlines
                const cleanText = m[1]
                  .replace(/\\n/g, '\n')
                  .replace(/\\"/g, '"')
                  .replace(/\\\\/g, '\\');
                accumulatedText += cleanText;
              }
              setOutput(accumulatedText);
            } else {
              // Try parsing as standard JSON chunk
              const parsed = JSON.parse(cleaned);
              const candidates = Array.isArray(parsed) ? parsed[0]?.candidates : parsed?.candidates;
              const textVal = candidates?.[0]?.content?.parts?.[0]?.text;
              if (textVal) {
                accumulatedText += textVal;
                setOutput(accumulatedText);
              }
            }
          } catch (e) {
            // Regex fallback for non-conforming or partial JSON chunks
            const match = chunk.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
            if (match) {
              const cleanText = match[1]
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
              accumulatedText += cleanText;
              setOutput(accumulatedText);
            }
          }
        }
      } else {
        // Standard Non-Streaming
        const resJson = await response.json();
        setRawResponse(JSON.stringify(resJson, null, 2));
        const generatedText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (generatedText) {
          setOutput(generatedText);
        } else {
          setOutput(JSON.stringify(resJson, null, 2));
        }
      }

      setPerformance({
        latency: Date.now() - startTime,
      });
      onTriggerRefresh(); // refresh dashboard logs and stats
    } catch (err: any) {
      setError(err.message || 'An error occurred during execution.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="playground-container" className="bg-white border border-slate-100 rounded-xl shadow-xs p-5 flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-600" />
            Interactive Playground
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Test the live proxy endpoints using your generated API keys.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-500">Gateway Status: Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label htmlFor="playground-key-select" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            API Token
          </label>
          <select
            id="playground-key-select"
            value={selectedKeyId}
            onChange={(e) => setSelectedKeyId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs focus:outline-none transition-colors font-medium text-slate-800 shadow-xs"
          >
            <option value="keyless">🗝️ Keyless Public Access (gemini-3.5-flash)</option>
            {activeKeys.map((k) => (
              <option key={k.id} value={k.id}>
                🔑 {k.name} ({k.id.substring(0, 12)}...)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="playground-model-select" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Target Model
          </label>
          <select
            id="playground-model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs focus:outline-none transition-colors font-medium text-slate-800 shadow-xs"
          >
            <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Execution Method
          </label>
          <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1 gap-1">
            <button
              type="button"
              onClick={() => setMethod('streamGenerateContent')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                method === 'streamGenerateContent'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Streaming
            </button>
            <button
              type="button"
              onClick={() => setMethod('generateContent')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                method === 'generateContent'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Standard
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="playground-prompt-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Instruction / Prompt
          </label>
          <div className="flex gap-2">
            {SAMPLE_PROMPTS.map((item) => (
              <button
                type="button"
                key={item.label}
                onClick={() => setPrompt(item.prompt)}
                className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium px-2 py-1 rounded-md transition-all cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="relative">
          <textarea
            id="playground-prompt-input"
            rows={3}
            placeholder="Write your prompt here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-3 text-sm focus:outline-none transition-colors shadow-xs"
          />
          <button
            type="button"
            disabled={loading}
            onClick={handleRunTest}
            className="absolute right-3 bottom-4 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold text-xs px-3.5 py-1.5 rounded-md shadow-xs transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? 'Running...' : 'Execute'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-[220px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Response Terminal</span>
          <div className="flex items-center gap-2">
            {performance && (
              <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100 font-semibold">
                Latency: {performance.latency} ms
              </span>
            )}
            {output && (
              <button
                type="button"
                onClick={handleCopyOutput}
                className="flex items-center gap-1 text-[10px] hover:text-indigo-600 text-slate-500 transition-all font-semibold cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Response'}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-[200px]">
          {/* Main Visual Output */}
          <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs overflow-y-auto max-h-[240px] border border-slate-800 flex flex-col justify-between">
            {loading && !output && (
              <div className="text-slate-400 animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                Awaiting first stream chunk from API Gateway...
              </div>
            )}
            {error && (
              <div className="text-rose-400 flex gap-2 items-start bg-rose-950/20 p-3 rounded-lg border border-rose-900/30">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-rose-300">API Execution Error</div>
                  <div className="mt-0.5 text-[11px] leading-relaxed text-rose-400">{error}</div>
                </div>
              </div>
            )}
            {!loading && !output && !error && (
              <div className="text-slate-500 italic text-center my-auto">
                Execute a test query above to see live-streamed responses from the Gemini proxy gateway.
              </div>
            )}
            {output && (
              <div className="whitespace-pre-wrap leading-relaxed select-text text-slate-200">
                {output}
              </div>
            )}
          </div>

          {/* Raw JSON Response Payload */}
          <div className="bg-slate-950 text-emerald-400 rounded-lg p-4 font-mono text-[10px] overflow-y-auto max-h-[240px] border border-slate-800">
            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block border-b border-slate-800 pb-1.5 mb-2">
              Raw HTTP Chunk/JSON Stream Inspector
            </span>
            {rawResponse ? (
              <pre className="whitespace-pre-wrap select-text">{rawResponse}</pre>
            ) : (
              <div className="text-slate-600 italic text-center pt-8">
                Raw wire protocol payload will stream here...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
