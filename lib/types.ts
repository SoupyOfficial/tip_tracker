export type TourType = string;
export type Rating = 1 | 2 | 3 | 4 | 5;
export type Currency = "USD";
export type PaymentMethod = "Cash" | "Credit Card" | "Venmo" | "Zelle" | "PayPal";
export type Location = string;
export type TourPrivacy = "private" | "non-private";

export interface TipEntry {
  id: string;
  date: string;
  amount: number;
  tourType: TourType;
  guestCount: number;
  rating: Rating;
  notes?: string;
  currency: Currency;
  paymentMethod: PaymentMethod;
  location: Location;
  isPrivate: TourPrivacy;
  createdAt: string;
  updatedAt: string;
}

export interface TipFilters {
  search?: string;
  tourType?: TourType;
  paymentMethod?: PaymentMethod;
  rating?: Rating;
  dateRange?: { start: string; end: string };
  sortBy?: 'date' | 'amount' | 'tourType' | 'rating';
  sortOrder?: 'asc' | 'desc';
  isPrivate?: TourPrivacy;
}

export interface AnalyticsSummary {
  totalTips: number;
  averagePerTour: number;
  totalTours: number;
  paymentBreakdown: Record<PaymentMethod, { count: number; total: number }>;
  tourTypeBreakdown: Record<TourType, { count: number; total: number; average: number }>;
  averageRating: number;
  bestDay: { date: string; amount: number } | null;
  monthlyTrends: Array<{ month: string; total: number; count: number; average: number }>;
  perTourAverages: Record<TourType, { averageTip: number; count: number; averageGuests: number }>;
  dayOfWeekBreakdown: Array<{ day: string; total: number; count: number; average: number }>;
  privacyBreakdown: Record<TourPrivacy, { count: number; total: number; average: number }>;
}
