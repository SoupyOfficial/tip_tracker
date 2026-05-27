'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import type { AnalyticsSummary, TourType } from '@/lib/types';

const DAY_COLORS: Record<string, string> = {
  Sun: '#3b82f6',
  Mon: '#10b981',
  Tue: '#f59e0b',
  Wed: '#8b5cf6',
  Thu: '#ef4444',
  Fri: '#06b6d4',
  Sat: '#ec4899',
};

const TOUR_TYPE_COLORS: Record<TourType, string> = {
  VIP: '#8b5cf6',
  Standard: '#3b82f6',
  Corporate: '#10b981',
  Mixed: '#f59e0b',
};

const PAYMENT_COLORS: Record<string, string> = {
  Cash: '#10b981',
  'Credit Card': '#3b82f6',
  Venmo: '#8b5cf6',
  Zelle: '#06b6d4',
  PayPal: '#f59e0b',
};

interface InsightsPanelProps {
  analytics: AnalyticsSummary;
}

export function InsightsPanel({ analytics }: InsightsPanelProps) {
  const {
    paymentBreakdown,
    tourTypeBreakdown,
    monthlyTrends,
    dayOfWeekBreakdown,
  } = analytics;

  const hasData = analytics.totalTours > 0;

  if (!hasData) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          Analytics & Insights
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No data yet. Add your first tip to see analytics.
        </p>
      </div>
    );
  }

  const paymentData = Object.entries(paymentBreakdown)
    .filter(([, data]) => data.count > 0)
    .map(([method, data]) => ({
      name: method,
      value: data.total,
      count: data.count,
    }));

  const tourTypeData = Object.entries(tourTypeBreakdown)
    .filter(([, data]) => data.count > 0)
    .map(([type, data]) => ({
      name: type,
      total: data.total,
      count: data.count,
      average: data.average,
    }));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Analytics & Insights
      </h2>

      {/* Tips by Day of Week */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          Tips by Day of Week
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dayOfWeekBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#6b7280" />
            <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" tickFormatter={(v: number) => `$${v}`} />
            <Tooltip
              formatter={(value: unknown) => [`$${Number(value).toFixed(2)}`, 'Total']}
              contentStyle={{
                backgroundColor: 'rgb(31 41 55)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {dayOfWeekBreakdown.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={DAY_COLORS[entry.day] || '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Payment Breakdown */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          Payment Breakdown
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={paymentData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
            >
              {paymentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[entry.name] || '#6b7280'} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: unknown) => [`$${Number(value).toFixed(2)}`, 'Total']}
              contentStyle={{
                backgroundColor: 'rgb(31 41 55)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 flex flex-wrap gap-2 sm:gap-3">
          {paymentData.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: PAYMENT_COLORS[item.name] }}
              />
              {item.name} ({item.count})
            </div>
          ))}
        </div>
      </div>

      {/* Tour Type Breakdown */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          Tour Type Breakdown
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={tourTypeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
            <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" tickFormatter={(v: number) => `$${v}`} />
            <Tooltip
              formatter={(value: unknown) => [`$${Number(value).toFixed(2)}`, 'Total']}
              contentStyle={{
                backgroundColor: 'rgb(31 41 55)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {tourTypeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={TOUR_TYPE_COLORS[entry.name as TourType] || '#6b7280'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Trends */}
      {monthlyTrends.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Monthly Trends
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" tickFormatter={(v: number) => `$${v}`} />
              <Tooltip
                formatter={(value: unknown) => [`$${Number(value).toFixed(2)}`, 'Total']}
                contentStyle={{
                  backgroundColor: 'rgb(31 41 55)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}
