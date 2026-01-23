'use client';

import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UsageStats } from '@/app/lib/admin-stats';
import { Calendar, TrendingUp } from 'lucide-react';

interface UsageChartsProps {
  stats: UsageStats[];
  loading?: boolean;
}

export default function UsageCharts({ stats, loading }: UsageChartsProps) {
  const [period, setPeriod] = useState<'day' | 'hour' | 'month'>('day');

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="text-center py-8">
          <div className="text-sm font-black text-slate-400">טוען נתונים...</div>
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <div className="text-sm font-black text-slate-400">אין נתונים להצגה</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#4D96FF]" />
          <h3 className="text-lg font-black text-slate-900">נתוני שימוש</h3>
        </div>
        <div className="flex gap-2">
          {(['day', 'hour', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl font-black text-sm transition-colors ${
                period === p
                  ? 'bg-[#4D96FF] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {p === 'day' ? 'יומי' : p === 'hour' ? 'שעתי' : 'חודשי'}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h4 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest">
            משתמשים חדשים
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={12}
                tick={{ fill: '#64748b' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tick={{ fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#4D96FF"
                strokeWidth={2}
                dot={{ fill: '#4D96FF', r: 4 }}
                name="משתמשים"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Events Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h4 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest">
            אירועים
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={12}
                tick={{ fill: '#64748b' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tick={{ fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="events" fill="#8B5CF6" name="אירועים" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Combined Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h4 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest">
          סקירה כללית
        </h4>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={stats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={12}
              tick={{ fill: '#64748b' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tick={{ fill: '#64748b' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#4D96FF"
              strokeWidth={2}
              dot={{ fill: '#4D96FF', r: 4 }}
              name="משתמשים"
            />
            <Line
              type="monotone"
              dataKey="events"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={{ fill: '#8B5CF6', r: 4 }}
              name="אירועים"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
