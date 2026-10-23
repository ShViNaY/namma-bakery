import * as React from "react";
import { User } from "lucide-react";
import type { CustomerDetailsFormInput } from "@/lib/checkout/validation";

interface CustomerDetailsFormProps {
  values: CustomerDetailsFormInput;
  onChange: (field: keyof CustomerDetailsFormInput, value: string) => void;
  errors: Partial<Record<keyof CustomerDetailsFormInput, string>>;
}

export function CustomerDetailsForm({
  values,
  onChange,
  errors,
}: CustomerDetailsFormProps) {
  const notesLength = values.customerNotes.length;

  return (
    <div className="rounded-sm border border-border bg-card p-5 sm:p-6 space-y-5">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <User className="h-5 w-5 text-caramel" aria-hidden="true" />
        <h3 className="font-heading text-lg font-semibold text-foreground">
          Customer Information
        </h3>
      </div>

      <div className="space-y-4">
        {/* Customer Name */}
        <div>
          <label
            htmlFor="customerName"
            className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
          >
            Full Name <span className="text-destructive" aria-hidden="true">*</span>
          </label>
          <input
            id="customerName"
            name="customerName"
            type="text"
            required
            autoComplete="name"
            placeholder="e.g. Priya Sharma"
            value={values.customerName}
            onChange={(e) => onChange("customerName", e.target.value)}
            aria-invalid={Boolean(errors.customerName)}
            aria-describedby={errors.customerName ? "customerName-error" : undefined}
            className={`w-full min-h-[48px] rounded-sm border bg-background px-3.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel ${
              errors.customerName
                ? "border-destructive focus-visible:ring-destructive"
                : "border-border hover:border-caramel/50"
            }`}
          />
          {errors.customerName && (
            <p
              id="customerName-error"
              role="alert"
              className="mt-1 text-xs text-destructive font-medium"
            >
              {errors.customerName}
            </p>
          )}
        </div>

        {/* Customer Phone */}
        <div>
          <label
            htmlFor="customerPhone"
            className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
          >
            Mobile Phone Number <span className="text-destructive" aria-hidden="true">*</span>
          </label>
          <div className="relative flex items-center">
            <span
              className="absolute left-3.5 text-xs font-semibold text-muted-foreground select-none"
              aria-hidden="true"
            >
              +91
            </span>
            <input
              id="customerPhone"
              name="customerPhone"
              type="tel"
              required
              autoComplete="tel"
              inputMode="numeric"
              placeholder="98450 12345"
              value={values.customerPhone}
              onChange={(e) => onChange("customerPhone", e.target.value)}
              aria-invalid={Boolean(errors.customerPhone)}
              aria-describedby={
                errors.customerPhone ? "customerPhone-error" : "customerPhone-hint"
              }
              className={`w-full min-h-[48px] rounded-sm border bg-background pl-12 pr-3.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel ${
                errors.customerPhone
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-border hover:border-caramel/50"
              }`}
            />
          </div>
          {errors.customerPhone ? (
            <p
              id="customerPhone-error"
              role="alert"
              className="mt-1 text-xs text-destructive font-medium"
            >
              {errors.customerPhone}
            </p>
          ) : (
            <p
              id="customerPhone-hint"
              className="mt-1 text-[11px] text-muted-foreground"
            >
              We use this to verify and coordinate your bakery pickup in RR Nagar.
            </p>
          )}
        </div>

        {/* Customer Email (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="customerEmail"
              className="block text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Email Address
            </label>
            <span className="text-[11px] text-muted-foreground">Optional</span>
          </div>
          <input
            id="customerEmail"
            name="customerEmail"
            type="email"
            autoComplete="email"
            placeholder="priya@example.com"
            value={values.customerEmail}
            onChange={(e) => onChange("customerEmail", e.target.value)}
            aria-invalid={Boolean(errors.customerEmail)}
            aria-describedby={
              errors.customerEmail ? "customerEmail-error" : "customerEmail-hint"
            }
            className={`w-full min-h-[48px] rounded-sm border bg-background px-3.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel ${
              errors.customerEmail
                ? "border-destructive focus-visible:ring-destructive"
                : "border-border hover:border-caramel/50"
            }`}
          />
          {errors.customerEmail ? (
            <p
              id="customerEmail-error"
              role="alert"
              className="mt-1 text-xs text-destructive font-medium"
            >
              {errors.customerEmail}
            </p>
          ) : (
            <p
              id="customerEmail-hint"
              className="mt-1 text-[11px] text-muted-foreground"
            >
              Optional: receive order confirmation and digital pickup receipt.
            </p>
          )}
        </div>

        {/* Customer Notes / Special Instructions */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="customerNotes"
              className="block text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Special Instructions or Cake Message
            </label>
            <span
              className={`text-[11px] ${
                notesLength > 450
                  ? "text-amber-700 dark:text-amber-400 font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {notesLength}/500
            </span>
          </div>
          <textarea
            id="customerNotes"
            name="customerNotes"
            rows={3}
            maxLength={500}
            placeholder="e.g. Write 'Happy 5th Birthday Ananya!' on the cake, or leave any pickup instructions."
            value={values.customerNotes}
            onChange={(e) => onChange("customerNotes", e.target.value)}
            aria-invalid={Boolean(errors.customerNotes)}
            aria-describedby={
              errors.customerNotes ? "customerNotes-error" : "customerNotes-hint"
            }
            className={`w-full rounded-sm border bg-background p-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel ${
              errors.customerNotes
                ? "border-destructive focus-visible:ring-destructive"
                : "border-border hover:border-caramel/50"
            }`}
          />
          {errors.customerNotes ? (
            <p
              id="customerNotes-error"
              role="alert"
              className="mt-1 text-xs text-destructive font-medium"
            >
              {errors.customerNotes}
            </p>
          ) : (
            <p
              id="customerNotes-hint"
              className="mt-1 text-[11px] text-muted-foreground"
            >
              Let our bakers know any message for the cake or custom requests.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
