'use client';

import { useEffect, useState } from 'react';
import { getAnalytics } from '@/lib/db';
import type { AnalyticsSummary, TourType, TourPrivacy } from '@/lib/types';
import { InsightsPanel } from '@/components/analytics/InsightsPanel';

const TOUR_TYPE_ORDER: TourType[] = ['VIP', 'Standard', 'Corporate', 'Mixed'];
const TOUR_TYPE_EMOJIS: Record<TourType, string> = {
  VIP: '👑',
  Standard: '🎯',
  Corporate: '🏢',
  Mixed: '🔀',
};

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics().then((data) => {
      setAnalytics(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!analytics || analytics.totalTours === 0) {
    return (
      <div className="mx-auto max-w-4xl p-4">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Tip Tracker Dashboard
        </h1>
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            No tips recorded yet. Add your first tip to get started!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        Tip Tracker Dashboard
      </h1>

      {/* Summary Stat Cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Tips</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${analytics.totalTips.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg per Tour</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${analytics.averagePerTour.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Tours</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.totalTours}
          </p>
        </div>
      </div>

      {/* Privacy Summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Private Tours</p>
              <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                ${analytics.privacyBreakdown.private.average.toFixed(2)} avg
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Non-Private Tours</p>
              <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                ${analytics.privacyBreakdown["non-private"].average.toFixed(2)} avg
              </p>
            </div>
          </div>
          {(() => {
            const diff = analytics.privacyBreakdown.private.average - analytics.privacyBreakdown["non-private"].average;
            if (diff === 0) return null;
            return (
              <p className={`text-sm font-medium ${diff > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                Private tours earn ${Math.abs(diff).toFixed(2)} {diff > 0 ? "more" : "less"} on avg
              </p>
            );
          })()}
        </div>
      </div>

      {/* Per Tour Type Summary Cards */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Per Tour Type
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {TOUR_TYPE_ORDER.map((type) => {
            const data = analytics.perTourAverages[type];
            const hasData = data.count > 0;
            return (
              <div
                key={type}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-lg">{TOUR_TYPE_EMOJIS[type]}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {type}
                  </span>
                </div>
                {hasData ? (
                  <>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      ${data.averageTip.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      avg · {data.count} tour{data.count !== 1 ? 's' : ''}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500">No data yet</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights Panel with Charts */}
      <InsightsPanel analytics={analytics} />
    </div>
  );
}
