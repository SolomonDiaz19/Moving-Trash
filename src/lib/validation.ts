import { z } from "zod";

export const bookingRequestSchema = z.object({
  // ✅ matches what your ContactForm sends
  dumpsterSize: z.enum(["20 Yard", "30 Yard", "40 Yard"]),

  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be YYYY-MM-DD"),

  // you allow 7–14 (since your UI can do 7 default + extended 8–14)
  durationDays: z.coerce.number().int().min(7).max(14),

  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().toLowerCase().email().max(254),

  address: z.string().trim().min(2).max(200),

  notes: z.string().trim().max(800).optional().or(z.literal("")),

  // ✅ honeypot
  companyWebsite: z.string().optional().or(z.literal("")),
});

export type BookingRequest = z.infer<typeof bookingRequestSchema>;
