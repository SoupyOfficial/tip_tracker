import { parse, isValid } from 'date-fns';
import { addTip } from './db';
import type { TipEntry, TourType, PaymentMethod, Location, Rating } from './types';

const VALID_TOUR_TYPES: TourType[] = ['Private', 'Non-Private'];
const VALID_PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Credit Card', 'Venmo', 'Zelle', 'PayPal'];
const VALID_LOCATIONS: Location[] = [
  'Universal Studios Florida & Islands of Adventure',
  'Epic Universe',
  'All Parks',
];
const VALID_RATINGS: Rating[] = [1, 2, 3, 4, 5];

function parseDate(value: unknown): { date: string | null; error: string | null } {
  if (typeof value !== 'string') return { date: null, error: `Invalid date: ${String(value)}` };

  const trimmed = value.trim();
  if (!trimmed) return { date: null, error: 'Date is empty' };

  // Try ISO format first
  const isoDate = new Date(trimmed);
  if (isValid(isoDate)) {
    return { date: isoDate.toISOString().split('T')[0], error: null };
  }

  // Try MM/DD/YYYY
  const slashDate = parse(trimmed, 'MM/dd/yyyy', new Date());
  if (isValid(slashDate)) {
    return { date: slashDate.toISOString().split('T')[0], error: null };
  }

  // Try YYYY-MM-DD
  const dashDate = parse(trimmed, 'yyyy-MM-dd', new Date());
  if (isValid(dashDate)) {
    return { date: dashDate.toISOString().split('T')[0], error: null };
  }

  return { date: null, error: `Unrecognized date format: ${trimmed}` };
}

function parseTourType(value: unknown): { tourType: TourType | null; error: string | null } {
  if (typeof value !== 'string') return { tourType: null, error: `Invalid tourType: ${String(value)}` };
  const normalized = value.trim() as TourType;
  if (!VALID_TOUR_TYPES.includes(normalized)) {
    return { tourType: null, error: `Invalid tourType: ${value}. Must be one of: ${VALID_TOUR_TYPES.join(', ')}` };
  }
  return { tourType: normalized, error: null };
}

function parsePaymentMethod(value: unknown): { paymentMethod: PaymentMethod | null; error: string | null } {
  if (typeof value !== 'string') return { paymentMethod: null, error: `Invalid paymentMethod: ${String(value)}` };
  const normalized = value.trim() as PaymentMethod;
  if (!VALID_PAYMENT_METHODS.includes(normalized)) {
    return { paymentMethod: null, error: `Invalid paymentMethod: ${value}. Must be one of: ${VALID_PAYMENT_METHODS.join(', ')}` };
  }
  return { paymentMethod: normalized, error: null };
}

function parseLocation(value: unknown): { location: Location | null; error: string | null } {
  if (typeof value !== 'string') return { location: null, error: `Invalid location: ${String(value)}` };
  const normalized = value.trim() as Location;
  if (!VALID_LOCATIONS.includes(normalized)) {
    return { location: null, error: `Invalid location: ${value}. Must be one of: ${VALID_LOCATIONS.join(', ')}` };
  }
  return { location: normalized, error: null };
}

function parseRating(value: unknown): { rating: Rating | null; error: string | null } {
  const num = typeof value === 'string' ? parseInt(value.trim(), 10) : typeof value === 'number' ? Math.round(value) : null;
  if (num === null || isNaN(num)) return { rating: null, error: `Invalid rating: ${String(value)}` };
  if (!VALID_RATINGS.includes(num as Rating)) {
    return { rating: null, error: `Invalid rating: ${value}. Must be 1-5` };
  }
  return { rating: num as Rating, error: null };
}

function parsePositiveInt(value: unknown, fieldName: string): { num: number | null; error: string | null } {
  const num = typeof value === 'string' ? parseInt(value.trim(), 10) : typeof value === 'number' ? Math.round(value) : null;
  if (num === null || isNaN(num)) return { num: null, error: `Invalid ${fieldName}: ${String(value)}` };
  if (num < 0) return { num: null, error: `${fieldName} must be non-negative: ${value}` };
  return { num, error: null };
}

function parseAmount(value: unknown): { amount: number | null; error: string | null } {
  const num = typeof value === 'string' ? parseFloat(value.trim()) : typeof value === 'number' ? value : null;
  if (num === null || isNaN(num)) return { amount: null, error: `Invalid amount: ${String(value)}` };
  if (num < 0) return { amount: null, error: `Amount must be non-negative: ${value}` };
  return { amount: Math.round(num * 100) / 100, error: null };
}

function normalizeTipObject(obj: Record<string, unknown>, index: number): { tip: TipEntry | null; error: string | null } {
  const errors: string[] = [];

  const dateResult = parseDate(obj.date);
  if (dateResult.error) errors.push(dateResult.error);

  const amountResult = parseAmount(obj.amount);
  if (amountResult.error) errors.push(amountResult.error);

  const tourTypeResult = parseTourType(obj.tourType);
  if (tourTypeResult.error) errors.push(tourTypeResult.error);

  const guestResult = parsePositiveInt(obj.guestCount, 'guestCount');
  if (guestResult.error) errors.push(guestResult.error);

  const ratingResult = parseRating(obj.rating);
  if (ratingResult.error) errors.push(ratingResult.error);

  const paymentResult = parsePaymentMethod(obj.paymentMethod);
  if (paymentResult.error) errors.push(paymentResult.error);

  const locationResult = parseLocation(obj.location);
  if (locationResult.error) errors.push(locationResult.error);

  if (errors.length > 0) {
    return { tip: null, error: `Row ${index + 1}: ${errors.join('; ')}` };
  }

  return {
    tip: {
      id: crypto.randomUUID(),
      date: dateResult.date!,
      amount: amountResult.amount!,
      tourType: tourTypeResult.tourType!,
      guestCount: guestResult.num!,
      rating: ratingResult.rating!,
      notes: typeof obj.notes === 'string' ? obj.notes : undefined,
      currency: 'USD',
      paymentMethod: paymentResult.paymentMethod!,
      location: locationResult.location!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    error: null,
  };
}

export function parseTipJSON(jsonString: string): TipEntry[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON: unable to parse input string');
  }

  const items: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
  const result = validateTipImport(items);
  if (result.errors.length > 0) {
    throw new Error(`Validation errors: ${result.errors.join('; ')}`);
  }
  return result.valid;
}

export function parseTipCSV(csvString: string): TipEntry[] {
  const lines = csvString.trim().split(/\r?\n/);
  if (lines.length === 0) {
    throw new Error('CSV is empty');
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());

  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const row: Record<string, unknown> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = j < values.length ? values[j] : '';
    }
    rows.push(row);
  }

  const result = validateTipImport(rows);
  if (result.errors.length > 0) {
    throw new Error(`CSV validation errors: ${result.errors.join('; ')}`);
  }
  return result.valid;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  fields.push(current);
  return fields;
}

export function validateTipImport(tips: unknown[]): { valid: TipEntry[]; errors: string[] } {
  const valid: TipEntry[] = [];
  const errors: string[] = [];

  for (let i = 0; i < tips.length; i++) {
    const item = tips[i];
    if (item === null || item === undefined || typeof item !== 'object') {
      errors.push(`Row ${i + 1}: Entry must be an object`);
      continue;
    }

    const result = normalizeTipObject(item as Record<string, unknown>, i);
    if (result.error) {
      errors.push(result.error);
    } else if (result.tip) {
      valid.push(result.tip);
    }
  }

  return { valid, errors };
}

export async function importTips(tips: TipEntry[]): Promise<{ imported: number; skipped: number; errors: string[] }> {
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const tip of tips) {
    const key = `${tip.date}|${tip.amount}|${tip.tourType}`;
    if (seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);

    try {
      await addTip({
        date: tip.date,
        amount: tip.amount,
        tourType: tip.tourType,
        guestCount: tip.guestCount,
        rating: tip.rating,
        notes: tip.notes,
        currency: tip.currency,
        paymentMethod: tip.paymentMethod,
        location: tip.location,
      });
      imported++;
    } catch (err) {
      errors.push(`Failed to import tip on ${tip.date}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { imported, skipped, errors };
}
