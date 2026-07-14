import React from 'react';
import { Key, Activity, Clock, CheckCircle } from 'lucide-react';
import { GatewayStats } from '../types';

interface StatsGridProps {
  stats: GatewayStats;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const items = [
    {
      id: 'total-keys',
      name: 'Total Gateway Keys',
      value: `${stats.activeKeys} / ${stats.totalKeys} Active`,
      sub: 'Custom created keys',
      icon: Key,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400',
    },
    {
      id: 'total-requests',
      name: 'Total API Traffic',
      value: stats.totalRequests.toLocaleString(),
      sub: 'All proxied requests',
      icon: Activity,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400',
    },
    {
      id: 'avg-latency',
      name: 'Avg Response Latency',
      value: `${stats.avgLatency} ms`,
      sub: 'Under-the-hood latency',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400',
    },
    {
      id: 'success-rate',
      name: 'Success Rate',
      value: `${stats.successRate}%`,
      sub: 'Successful status codes',
      icon: CheckCircle,
      color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/30 dark:text-sky-400',
    },
  ];

  return (
    <div id="stats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            id={`stat-card-${item.id}`}
            key={item.id}
            className="p-5 bg-white border border-slate-100 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.name}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{item.value}</h3>
              <p className="text-xs text-slate-400 mt-1">{item.sub}</p>
            </div>
            <div className={`p-3 rounded-xl ${item.color}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
