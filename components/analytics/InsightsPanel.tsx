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
import type { AnalyticsSummary, TourPrivacy, TourType } from '@/lib/types';

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
    privacyBreakdown,
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
              innerRadius={50}
              outerRadius={80}
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
        <div className="mt-2 flex flex-wrap gap-3">
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

      {/* Private vs Non-Private */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          Private vs Non-Private
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {(["private", "non-private"] as TourPrivacy[]).map((privacy) => {
            const data = privacyBreakdown[privacy];
            const hasData = data.count > 0;
            const isPrivate = privacy === "private";
            return (
              <div
                key={privacy}
                className={`rounded-lg border p-4 ${
                  isPrivate
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
                    : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
                }`}
              >
                <p className={`text-sm font-medium ${
                  isPrivate
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-amber-700 dark:text-amber-400"
                }`}>
                  {isPrivate ? "Private Tours" : "Non-Private Tours"}
                </p>
                {hasData ? (
                  <div className="mt-2 space-y-1">
                    <p className={`text-2xl font-bold ${
                      isPrivate
                        ? "text-emerald-900 dark:text-emerald-100"
                        : "text-amber-900 dark:text-amber-100"
                    }`}>
                      ${data.average.toFixed(2)}
                    </p>
                    <p className={`text-xs ${
                      isPrivate
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}>
                      {data.count} tour{data.count !== 1 ? 's' : ''} · ${data.total.toFixed(2)} total
                    </p>
                  </div>
                ) : (
                  <p className={`mt-2 text-sm ${
                    isPrivate
                      ? "text-emerald-500 dark:text-emerald-400"
                      : "text-amber-500 dark:text-amber-400"
                  }`}>
                    No {isPrivate ? 'private' : 'non-private'} tours yet
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
