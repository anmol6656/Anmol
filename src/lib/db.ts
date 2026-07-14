import fs from 'fs';
import path from 'path';

export interface ApiKey {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  status: 'active' | 'inactive';
  allowedModels: string[];
  requestCount: number;
  lastUsedAt: string | null;
}

export interface RequestLog {
  id: string;
  keyId: string;
  keyName: string;
  timestamp: string;
  model: string;
  method: string;
  status: number;
  latency: number;
  error: string | null;
}

const DB_DIR = path.join(process.cwd(), 'data');
const KEYS_FILE = path.join(DB_DIR, 'keys.json');
const LOGS_FILE = path.join(DB_DIR, 'logs.json');

function ensureDbExists() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(KEYS_FILE)) {
    fs.writeFileSync(KEYS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!fs.existsSync(LOGS_FILE)) {
    fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function getKeys(): ApiKey[] {
  try {
    ensureDbExists();
    const data = fs.readFileSync(KEYS_FILE, 'utf-8');
    return JSON.parse(data) as ApiKey[];
  } catch (error) {
    console.error('Failed to read keys database:', error);
    return [];
  }
}

export function saveKeys(keys: ApiKey[]) {
  try {
    ensureDbExists();
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write keys database:', error);
  }
}

export function getLogs(): RequestLog[] {
  try {
    ensureDbExists();
    const data = fs.readFileSync(LOGS_FILE, 'utf-8');
    return JSON.parse(data) as RequestLog[];
  } catch (error) {
    console.error('Failed to read logs database:', error);
    return [];
  }
}

export function saveLogs(logs: RequestLog[]) {
  try {
    ensureDbExists();
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write logs database:', error);
  }
}

export function createKey(name: string, description: string, allowedModels: string[]): ApiKey {
  const keys = getKeys();
  // Generate a key in the format: gpk_xxxxxxxxxxxxxxxxxxxxxxxx
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < 32; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const newKey: ApiKey = {
    id: `gpk_${randomStr}`,
    name: name || 'Unnamed Key',
    description: description || '',
    createdAt: new Date().toISOString(),
    status: 'active',
    allowedModels: allowedModels.length > 0 ? allowedModels : ['gemini-3.5-flash'],
    requestCount: 0,
    lastUsedAt: null,
  };
  keys.push(newKey);
  saveKeys(keys);
  return newKey;
}

export function toggleKeyStatus(id: string): ApiKey | null {
  const keys = getKeys();
  const keyIndex = keys.findIndex((k) => k.id === id);
  if (keyIndex === -1) return null;

  keys[keyIndex].status = keys[keyIndex].status === 'active' ? 'inactive' : 'active';
  saveKeys(keys);
  return keys[keyIndex];
}

export function deleteKey(id: string): boolean {
  const keys = getKeys();
  const filtered = keys.filter((k) => k.id !== id);
  if (filtered.length === keys.length) return false;
  saveKeys(filtered);
  return true;
}

export function updateKeyUsage(id: string): ApiKey | null {
  const keys = getKeys();
  const keyIndex = keys.findIndex((k) => k.id === id);
  if (keyIndex === -1) return null;

  keys[keyIndex].requestCount += 1;
  keys[keyIndex].lastUsedAt = new Date().toISOString();
  saveKeys(keys);
  return keys[keyIndex];
}

export function addLog(logData: Omit<RequestLog, 'id' | 'timestamp'>): RequestLog {
  const logs = getLogs();
  const newLog: RequestLog = {
    ...logData,
    id: `log_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
  // Limit to last 500 logs for performance
  logs.unshift(newLog);
  if (logs.length > 500) {
    logs.pop();
  }
  saveLogs(logs);
  return newLog;
}

export function clearLogs() {
  saveLogs([]);
}
