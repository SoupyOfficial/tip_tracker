'use client';

import { useRouter } from 'next/navigation';
import { TipsList } from '@/components/tips/TipsList';
import { useTips } from '@/hooks/useTips';

export default function TipsPage() {
  const router = useRouter();
  const { tips, loading, error, loadTips } = useTips();

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-8">
        <h1 className="mb-6 text-2xl font-bold">All Tips</h1>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Tips</h1>
        <button
          type="button"
          onClick={() => router.push('/add')}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
        >
          Add Tip
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={loadTips}
            className="mt-3 text-sm font-medium text-red-700 underline hover:text-red-800"
          >
            Try again
          </button>
        </div>
      ) : tips.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-500">No tips recorded yet.</p>
          <button
            type="button"
            onClick={() => router.push('/add')}
            className="mt-3 text-sm font-medium text-blue-600 underline hover:text-blue-700"
          >
            Add your first tip
          </button>
        </div>
      ) : (
        <TipsList />
      )}
    </div>
  );
}
