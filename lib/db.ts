import Dexie, { type EntityTable } from 'dexie';
import { getDay } from 'date-fns';
import type { TipEntry, TipFilters, AnalyticsSummary, PaymentMethod, TourType, Rating } from './types';

const db = new Dexie('TipTrackerDB') as Dexie & {
  tips: EntityTable<TipEntry, 'id'>;
};

db.version(1).stores({
  tips: '++id, date, tourType, paymentMethod, rating, location',
});

db.version(2).stores({
  tips: '++id, date, tourType, paymentMethod, rating, location',
}).upgrade((tx) => {
  return tx.table('tips').toCollection().modify((tip: Record<string, unknown>) => {
    delete tip.isPrivate;
  });
});

db.version(3).stores({
  tips: '++id, date, tourType, paymentMethod, rating, location',
});

export { db };

export async function addTip(entry: Omit<TipEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await db.tips.add({
    ...entry,
    id,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function updateTip(
  id: string,
  updates: Partial<Omit<TipEntry, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  await db.tips.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteTip(id: string): Promise<void> {
  await db.tips.delete(id);
}

export async function getTipById(id: string): Promise<TipEntry | undefined> {
  return db.tips.get(id);
}

export async function getAllTips(filters?: TipFilters): Promise<TipEntry[]> {
  let tips = await db.tips.toArray();

  if (!filters) return tips;

  const { search, tourType, paymentMethod, rating, dateRange, sortBy, sortOrder } = filters;

  if (search) {
    const lowerSearch = search.toLowerCase();
    tips = tips.filter(
      (t) =>
        (t.notes?.toLowerCase().includes(lowerSearch) ?? false) ||
        t.amount.toString().includes(lowerSearch)
    );
  }

  if (tourType) {
    tips = tips.filter((t) => t.tourType === tourType);
  }

  if (paymentMethod) {
    tips = tips.filter((t) => t.paymentMethod === paymentMethod);
  }

  if (rating) {
    tips = tips.filter((t) => t.rating === rating);
  }

  if (dateRange) {
    tips = tips.filter((t) => t.date >= dateRange.start && t.date <= dateRange.end);
  }

  if (sortBy) {
    tips.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return tips;
}

export async function getAnalytics(): Promise<AnalyticsSummary> {
  const tips = await db.tips.toArray();

  const totalTips = tips.reduce((sum, t) => sum + t.amount, 0);
  const totalTours = tips.length;
  const averagePerTour = totalTours > 0 ? totalTips / totalTours : 0;

  const paymentMethods: PaymentMethod[] = ['Cash', 'Credit Card', 'Venmo', 'Zelle', 'PayPal'];
  const paymentBreakdown = {} as Record<PaymentMethod, { count: number; total: number }>;
  for (const method of paymentMethods) {
    const filtered = tips.filter((t) => t.paymentMethod === method);
    paymentBreakdown[method] = {
      count: filtered.length,
      total: filtered.reduce((sum, t) => sum + t.amount, 0),
    };
  }

  const tourTypes: TourType[] = ['Private', 'Non-Private'];
  const tourTypeBreakdown = {} as Record<TourType, { count: number; total: number; average: number }>;
  for (const type of tourTypes) {
    const filtered = tips.filter((t) => t.tourType === type);
    const total = filtered.reduce((sum, t) => sum + t.amount, 0);
    tourTypeBreakdown[type] = {
      count: filtered.length,
      total,
      average: filtered.length > 0 ? total / filtered.length : 0,
    };
  }

  const validRatings = tips.filter(t => t.rating != null);
  const averageRating = validRatings.length > 0
    ? validRatings.reduce((sum, t) => sum + (t.rating as number), 0) / validRatings.length
    : 0;

  const dailyTotals = tips.reduce<Record<string, number>>((acc, t) => {
    acc[t.date] = (acc[t.date] || 0) + t.amount;
    return acc;
  }, {});

  let bestDay: { date: string; amount: number } | null = null;
  for (const [date, amount] of Object.entries(dailyTotals)) {
    if (!bestDay || amount > bestDay.amount) {
      bestDay = { date, amount };
    }
  }

  const monthlyMap = tips.reduce<Record<string, { total: number; count: number }>>((acc, t) => {
    const month = t.date.substring(0, 7);
    if (!acc[month]) acc[month] = { total: 0, count: 0 };
    acc[month].total += t.amount;
    acc[month].count += 1;
    return acc;
  }, {});

  const monthlyTrends = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      total: data.total,
      count: data.count,
      average: data.count > 0 ? data.total / data.count : 0,
    }));

  const perTourAverages = {} as Record<TourType, { averageTip: number; count: number; averageGuests: number }>;
  for (const type of tourTypes) {
    const filtered = tips.filter((t) => t.tourType === type);
    const totalTip = filtered.reduce((sum, t) => sum + t.amount, 0);
    const totalGuests = filtered.reduce((sum, t) => sum + (t.guestCount ?? 0), 0);
    perTourAverages[type] = {
      averageTip: filtered.length > 0 ? totalTip / filtered.length : 0,
      count: filtered.length,
      averageGuests: filtered.length > 0 ? totalGuests / filtered.length : 0,
    };
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayTotals = Array.from({ length: 7 }, () => ({ total: 0, count: 0 }));
  for (const t of tips) {
    const dayIndex = getDay(new Date(t.date + 'T00:00:00'));
    dayTotals[dayIndex].total += t.amount;
    dayTotals[dayIndex].count += 1;
  }
  const dayOfWeekBreakdown = dayTotals.map((data, index) => ({
    day: dayNames[index],
    total: data.total,
    count: data.count,
    average: data.count > 0 ? data.total / data.count : 0,
  }));

  return {
    totalTips,
    averagePerTour,
    totalTours,
    paymentBreakdown,
    tourTypeBreakdown,
    averageRating,
    bestDay,
    monthlyTrends,
    perTourAverages,
    dayOfWeekBreakdown,
  };
}
