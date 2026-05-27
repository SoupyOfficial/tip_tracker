'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTips, useTipMutations } from '@/hooks/useTips';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import type { TipEntry } from '@/lib/types';

function TipItem({
  tip,
  onDelete,
}: {
  tip: TipEntry;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();

  return (
    <div className="group relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              ${tip.amount.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500">{tip.tourType}</span>
          </div>
          <p className="text-sm text-gray-600">
            {new Date(tip.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </p>
          {tip.guestCount > 0 && (
            <p className="text-xs text-gray-500">{tip.guestCount} guests</p>
          )}
          {tip.notes && (
            <p className="mt-1 text-xs text-gray-400 line-clamp-2">
              {tip.notes}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => router.push(`/tips/edit?id=${tip.id}`)}
            className="rounded-lg p-2.5 text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-600 active:bg-amber-100 min-h-[44px] min-w-[44px]"
            aria-label="Edit tip"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => onDelete(tip.id)}
            className="rounded-lg p-2.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 active:bg-red-100 min-h-[44px] min-w-[44px]"
            aria-label="Delete tip"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center flex-wrap gap-1.5">
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {tip.paymentMethod}
        </span>
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {tip.location}
        </span>
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
          {'★'.repeat(tip.rating)}{'☆'.repeat(5 - tip.rating)}
        </span>
      </div>
    </div>
  );
}

export function TipsList() {
  const { tips, loading, error, loadTips } = useTips();
  const { deleteTip } = useTipMutations();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDeleteRequest = (id: string) => {
    setDeleteId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteTip(deleteId);
      toast.success('Tip deleted');
      loadTips();
    } catch {
      toast.error('Failed to delete tip');
    }
    setDeleteId(null);
  };

  const handleDeleteCancel = () => {
    setDeleteId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  if (tips.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-500">No tips recorded yet.</p>
        <p className="mt-1 text-xs text-gray-400">
          Add your first tip to get started!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {tips.map((tip) => (
          <TipItem key={tip.id} tip={tip} onDelete={handleDeleteRequest} />
        ))}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Tip?"
        message="This will permanently delete this tip entry. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}
