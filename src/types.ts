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

export interface GatewayStats {
  totalRequests: number;
  activeKeys: number;
  totalKeys: number;
  successRate: number;
  avgLatency: number;
  modelDistribution: Record<string, number>;
}
