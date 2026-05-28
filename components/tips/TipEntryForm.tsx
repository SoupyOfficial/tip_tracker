"use client";

import { useState, useEffect, useCallback } from "react";
import { TipEntryFormSchema } from "@/lib/validations";
import type { TipEntryFormValues } from "@/lib/validations";
import type { TipEntry, TourType, PaymentMethod, Location } from "@/lib/types";
import { getCustomLocations, getCustomTourTypes, addCustomLocation, addCustomTourType } from "@/lib/settings";

const paymentMethods: PaymentMethod[] = ["Cash", "Credit Card", "Venmo", "Zelle", "PayPal"];

const STORAGE_KEY_LAST_TOUR = "tip_tracker_last_tour";
const STORAGE_KEY_LAST_LOCATION = "tip_tracker_last_location";

function getStoredDefault<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

interface TipEntryFormProps {
  initialData?: TipEntry | null;
  onSubmit: (values: TipEntryFormValues) => Promise<void>;
  onCancel?: () => void;
  defaultQuickAdd?: boolean;
}

export default function TipEntryForm({
  initialData,
  onSubmit,
  onCancel,
  defaultQuickAdd = true,
}: TipEntryFormProps) {
  const isEdit = !!initialData;

  const [quickAdd, setQuickAdd] = useState(!isEdit && defaultQuickAdd);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [date, setDate] = useState(initialData?.date ?? getTodayString());
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? "");
  const [tourType, setTourType] = useState<TourType>(
    initialData?.tourType ?? getStoredDefault<TourType>(STORAGE_KEY_LAST_TOUR, "Private")
  );
  const [guestCount, setGuestCount] = useState(initialData?.guestCount?.toString() ?? "1");
  const [rating, setRating] = useState(initialData?.rating?.toString() ?? "4");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    initialData?.paymentMethod ?? "Cash"
  );
  const [location, setLocation] = useState<Location>(
    initialData?.location ?? getStoredDefault<Location>(STORAGE_KEY_LAST_LOCATION, "Universal")
  );
  const [tourTypes, setTourTypes] = useState<string[]>(getCustomTourTypes);
  const [locations, setLocations] = useState<string[]>(getCustomLocations);

  useEffect(() => {
    setQuickAdd(!isEdit && defaultQuickAdd)
  }, [defaultQuickAdd, isEdit])

  useEffect(() => {
    setTourTypes(getCustomTourTypes());
    setLocations(getCustomLocations());
  }, []);

  useEffect(() => {
    if (!isEdit && typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_LAST_TOUR, JSON.stringify(tourType));
        localStorage.setItem(STORAGE_KEY_LAST_LOCATION, JSON.stringify(location));
      } catch {
        // localStorage unavailable
      }
    }
  }, [tourType, location, isEdit]);

  const clearErrors = useCallback(() => {
    setGeneralError(null);
    setFieldErrors({});
  }, []);

  const handleAddCustomTourType = () => {
    const name = prompt("Enter new tour type:");
    if (!name) return;
    addCustomTourType(name);
    const updated = getCustomTourTypes();
    setTourTypes(updated);
    setTourType(name.trim());
  };

  const handleAddCustomLocation = () => {
    const name = prompt("Enter new location:");
    if (!name) return;
    addCustomLocation(name);
    const updated = getCustomLocations();
    setLocations(updated);
    setLocation(name.trim());
  };

  const buildFormData = useCallback((): Record<string, unknown> => {
    const data: Record<string, unknown> = {
      date,
      amount: parseFloat(amount),
      tourType,
      guestCount: parseInt(guestCount, 10),
      rating: parseInt(rating, 10),
      paymentMethod,
      location,
    };
    if (notes.trim()) {
      data.notes = notes.trim();
    }
    return data;
  }, [date, amount, tourType, guestCount, rating, paymentMethod, location, notes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setSubmitting(true);

    const formData = buildFormData();
    const result = TipEntryFormSchema.safeParse(formData);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0]?.toString();
        if (path) {
          errors[path] = issue.message;
        }
      }
      setFieldErrors(errors);
      setGeneralError("Please fix the errors below and try again.");
      setSubmitting(false);
      return;
    }

    try {
      await onSubmit(result.data);
    } catch {
      setGeneralError("Failed to save tip. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setSubmitting(true);

    const formData = {
      date,
      amount: parseFloat(amount),
      tourType,
      location,
      guestCount: 1,
      rating: null,
      paymentMethod: null,
      notes: null,
    };
    const result = TipEntryFormSchema.safeParse(formData);

    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? "Invalid form data";
      setGeneralError(firstError);
      setSubmitting(false);
      return;
    }

    try {
      await onSubmit(result.data);
    } catch {
      setGeneralError("Failed to save tip. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={quickAdd ? handleQuickAdd : handleSubmit} className="space-y-4">
      {/* General error banner */}
      {generalError && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {generalError}
        </div>
      )}

      {quickAdd ? (
        /* Quick Add Mode */
        <div className="space-y-4">
          {/* Amount - large input */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tip Amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-gray-300 bg-white py-4 pl-8 pr-4 text-3xl font-semibold text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            {fieldErrors.amount && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.amount}</p>
            )}
          </div>

          {/* Tour Type - pill buttons */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tour Type
            </label>
            <div className="flex flex-wrap gap-2">
              {tourTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTourType(type)}
                  className={`min-h-11 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    tourType === type
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type}
                </button>
              ))}
              <button
                type="button"
                onClick={handleAddCustomTourType}
                className="min-h-11 rounded-full px-3 py-2 text-sm font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                title="Add custom tour type"
              >
                +
              </button>
            </div>
            {fieldErrors.tourType && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.tourType}</p>
            )}
          </div>

          {/* Location - pill buttons */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Location
            </label>
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocation(loc)}
                  className={`min-h-11 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    location === loc
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {loc}
                </button>
              ))}
              <button
                type="button"
                onClick={handleAddCustomLocation}
                className="min-h-11 rounded-full px-3 py-2 text-sm font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                title="Add custom location"
              >
                +
              </button>
            </div>
            {fieldErrors.location && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.location}</p>
            )}
          </div>

          {/* Save button */}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              "Saving..."
            ) : (
              <>
                <span>$</span>
                <span>Save Tip</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Full Form Mode */
        <div className="space-y-4">
          {/* Date */}
          <div>
            <label htmlFor="date" className="mb-1 block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            {fieldErrors.date && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.date}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="mb-1 block text-sm font-medium text-gray-700">
              Tip Amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                $
              </span>
              <input
                id="amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-8 pr-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            {fieldErrors.amount && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.amount}</p>
            )}
          </div>

          {/* Tour Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tour Type
            </label>
            <div className="flex flex-wrap gap-2">
              {tourTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTourType(type)}
                  className={`min-h-11 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    tourType === type
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type}
                </button>
              ))}
              <button
                type="button"
                onClick={handleAddCustomTourType}
                className="min-h-11 rounded-full px-3 py-2 text-sm font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                title="Add custom tour type"
              >
                +
              </button>
            </div>
            {fieldErrors.tourType && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.tourType}</p>
            )}
          </div>

          {/* Guest Count */}
          <div>
            <label htmlFor="guestCount" className="mb-1 block text-sm font-medium text-gray-700">
              Guest Count
            </label>
            <input
              id="guestCount"
              type="text"
              inputMode="numeric"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            {fieldErrors.guestCount && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.guestCount}</p>
            )}
          </div>

          {/* Rating */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star.toString())}
                  className={`h-11 w-11 rounded-lg text-lg font-semibold transition-colors ${
                    parseInt(rating, 10) >= star
                      ? "bg-yellow-400 text-yellow-900"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  {star}
                </button>
              ))}
            </div>
            {fieldErrors.rating && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.rating}</p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label htmlFor="paymentMethod" className="mb-1 block text-sm font-medium text-gray-700">
              Payment Method
            </label>
            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            {fieldErrors.paymentMethod && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.paymentMethod}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="mb-1 block text-sm font-medium text-gray-700">
              Location
            </label>
            <div className="flex gap-2">
              <select
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value as Location)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddCustomLocation}
                className="min-h-11 min-w-11 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-200 transition-colors"
                title="Add custom location"
              >
                +
              </button>
            </div>
            {fieldErrors.location && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.location}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              maxLength={500}
            />
            {fieldErrors.notes && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.notes}</p>
            )}
          </div>

          {/* Submit / Cancel */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                "Saving..."
              ) : (
                <>
                  <span>$</span>
                  <span>{isEdit ? "Update Tip" : "Save Tip"}</span>
                </>
              )}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
