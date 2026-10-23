"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Lock, Mail, AlertCircle, ChefHat } from "lucide-react";
import { staffLoginAction, type ActionState } from "@/lib/staff/actions";

const initialState: ActionState = {
  error: null,
};

export function StaffLoginForm() {
  const [state, formAction, isPending] = useActionState(
    staffLoginAction,
    initialState
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-sm border border-border bg-card p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-12 rounded-full bg-caramel/10 text-caramel mx-auto mb-1">
            <ChefHat className="size-6" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Staff Portal
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Sign in with your staff account to manage orders and kitchen operations.
          </p>
        </div>

        {state?.error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-sm border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive dark:bg-destructive/20"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{state.error}</span>
          </div>
        )}

        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-foreground"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="staff@nammabakery.com"
                className="w-full min-h-[46px] rounded-sm border border-border bg-background pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel hover:border-caramel/50 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-foreground"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full min-h-[46px] rounded-sm border border-border bg-background pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel hover:border-caramel/50 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-caramel text-sm font-semibold text-white shadow-none transition-colors hover:bg-caramel/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground mt-2"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <span>Sign In to Dashboard</span>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-border/60 text-center">
          <p className="text-xs text-muted-foreground">
            Internal bakery system. Unauthorized access attempts are logged.
          </p>
        </div>
      </div>
    </div>
  );
}
