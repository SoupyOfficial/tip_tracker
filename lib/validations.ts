import { z } from "zod";

const paymentMethods = ["Cash", "Credit Card", "Venmo", "Zelle", "PayPal"] as const;
export const TipEntryFormSchema = z.object({
  date: z.string({
    error: (issue) =>
      issue.input === undefined ? "Date is required" : "Invalid date",
  }),

  amount: z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? "Tip amount is required"
          : "Tip amount must be a number",
    })
    .min(0.01, { error: "Tip amount must be at least $0.01" }),

  tourType: z.string({
    error: "Tour type is required",
  }).min(1, { error: "Tour type is required" }),

  guestCount: z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? "Guest count is required"
          : "Guest count must be a number",
    })
    .int({ error: "Guest count must be a whole number" })
    .min(1, { error: "Must have at least 1 guest" })
    .max(100, { error: "Guest count cannot exceed 100" }),

  rating: z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? "Rating is required"
          : "Rating must be a number",
    })
    .int({ error: "Rating must be a whole number" })
    .min(1, { error: "Rating must be between 1 and 5" })
    .max(5, { error: "Rating must be between 1 and 5" }),

  notes: z
    .string()
    .max(500, { error: "Notes cannot exceed 500 characters" })
    .optional(),

  currency: z.literal("USD").default("USD"),

  paymentMethod: z.enum(paymentMethods, {
    error: "Please select a valid payment method",
  }),

  location: z.string({
    error: "Location is required",
  }).min(1, { error: "Location is required" }).default("Universal Studios Florida & Islands of Adventure"),

});

export type TipEntryFormValues = z.infer<typeof TipEntryFormSchema>;
