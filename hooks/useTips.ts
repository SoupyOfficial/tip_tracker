import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
  addTip as dbAddTip,
  updateTip as dbUpdateTip,
  deleteTip as dbDeleteTip,
  getAllTips,
  getAnalytics,
} from '@/lib/db';
import { TipEntryFormSchema } from '@/lib/validations';
import type { TipEntry, TipFilters, AnalyticsSummary, Rating } from '@/lib/types';
import type { TipEntryFormValues } from '@/lib/validations';

export function useTips(filters?: TipFilters) {
  const [tips, setTips] = useState<TipEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllTips(filters);
      setTips(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tips';
      setError(message);
      toast.error('Failed to load tips', { description: message });
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    loadTips();
  }, [loadTips]);

  return { tips, loading, error, loadTips };
}

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(message);
      toast.error('Failed to load analytics', { description: message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return { analytics, loading, error, loadAnalytics };
}

export function useTipMutations() {
  const [loading, setLoading] = useState(false);

  const addTip = async (values: unknown) => {
    setLoading(true);
    try {
      const parsed = TipEntryFormSchema.parse(values);
      const id = await dbAddTip({ ...parsed, rating: parsed.rating as Rating });
      toast.success('Tip added', { description: `$${parsed.amount.toFixed(2)} saved successfully` });
      return id;
    } catch (err) {
      if (err instanceof Error && 'issues' in err) {
        const firstError = (err as { issues: Array<{ message: string }> }).issues[0]?.message;
        toast.error('Validation failed', { description: firstError || 'Invalid form data' });
      } else {
        const message = err instanceof Error ? err.message : 'Failed to add tip';
        toast.error('Failed to add tip', { description: message });
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTip = async (id: string, values: Partial<TipEntryFormValues>) => {
    setLoading(true);
    try {
      await dbUpdateTip(id, { ...values, rating: values.rating as Rating | undefined });
      toast.success('Tip updated', { description: 'Changes saved successfully' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update tip';
      toast.error('Failed to update tip', { description: message });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTip = async (id: string) => {
    setLoading(true);
    try {
      await dbDeleteTip(id);
      toast.success('Tip deleted', { description: 'Entry removed successfully' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete tip';
      toast.error('Failed to delete tip', { description: message });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { addTip, updateTip, deleteTip, loading };
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function tipsToCSV(tips: TipEntry[]): string {
  const headers = ['id', 'date', 'amount', 'tourType', 'guestCount', 'rating', 'notes', 'currency', 'paymentMethod', 'location', 'createdAt', 'updatedAt'];
  const escapeCSV = (val: string | number | undefined) => {
    if (val === undefined || val === null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const rows = tips.map((t) =>
    headers
      .map((h) => escapeCSV(t[h as keyof TipEntry]))
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export function useExport() {
  const exportCSV = async () => {
    try {
      const tips = await getAllTips();
      if (tips.length === 0) {
        toast.info('No data to export', { description: 'Add some tips first' });
        return;
      }
      const csv = tipsToCSV(tips);
      downloadFile(csv, `tip-tracker-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
      toast.success('Export complete', { description: `${tips.length} tips exported as CSV` });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export CSV';
      toast.error('Export failed', { description: message });
    }
  };

  const exportJSON = async () => {
    try {
      const tips = await getAllTips();
      if (tips.length === 0) {
        toast.info('No data to export', { description: 'Add some tips first' });
        return;
      }
      const json = JSON.stringify(tips, null, 2);
      downloadFile(json, `tip-tracker-export-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
      toast.success('Export complete', { description: `${tips.length} tips exported as JSON` });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export JSON';
      toast.error('Export failed', { description: message });
    }
  };

  return { exportCSV, exportJSON };
}
