"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

export const RECOMMENDATION_STORAGE_KEY = "namma_bakery_recommendation_prompt_v1";

// In-memory state for synchronous same-tab reactivity
let isMemoryDismissed: boolean | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Safe guard against listener errors
    }
  });
}

/**
 * Dismisses the recommendation widget prompt.
 * Persists to localStorage and notifies all subscribers synchronously.
 */
export function dismissRecommendation(): void {
  isMemoryDismissed = true;
  try {
    localStorage.setItem(RECOMMENDATION_STORAGE_KEY, "true");
  } catch {
    // localStorage may be disabled in private/restricted browsing mode
  }
  notify();
}

/**
 * Resets the dismissed state (useful for testing or re-enabling prompt).
 */
export function resetRecommendationDismissed(): void {
  isMemoryDismissed = false;
  try {
    localStorage.removeItem(RECOMMENDATION_STORAGE_KEY);
  } catch {
    // localStorage may be disabled
  }
  notify();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", callback);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", callback);
    }
  };
}

function getDismissedSnapshot(): boolean {
  if (isMemoryDismissed !== null) return isMemoryDismissed;
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(RECOMMENDATION_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Pages where the recommendation widget should not appear.
 */
export function isRecommendationWidgetEligible(pathname: string): boolean {
  return !(
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/checkout") ||
    pathname === "/cart"
  );
}

/**
 * Hook to check if the recommendation prompt has been dismissed.
 */
export function useRecommendationDismissed(): boolean {
  return useSyncExternalStore(subscribe, getDismissedSnapshot, getServerSnapshot);
}

/**
 * Hook returning whether the recommendation widget is currently visible on the page.
 */
export function useRecommendationWidgetVisible(): boolean {
  const pathname = usePathname();
  const isDismissed = useRecommendationDismissed();

  if (!isRecommendationWidgetEligible(pathname)) {
    return false;
  }
  return !isDismissed;
}
