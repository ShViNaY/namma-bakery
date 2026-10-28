"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Loader2,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  ExternalLink,
  MessageSquare,
  Cake,
  ArrowLeft,
  XCircle,
} from "lucide-react";
import type { CustomCakeTrackingItem, CustomCakeStatus } from "@/lib/custom-cake/types";
import {
  verifyCustomCakeTrackingAction,
  getCustomCakeDashboardAction,
  logoutCustomCakeTrackingAction,
} from "@/lib/custom-cake/tracking-actions";
import { formatIstDate, formatIstTime } from "@/lib/utils/date";

interface CustomCakeTrackingDashboardProps {
  initialAuthenticated?: boolean;
  initialEnquiries?: CustomCakeTrackingItem[];
  initialVerifiedPhone?: string;
}

export function CustomCakeTrackingDashboard({
  initialAuthenticated = false,
  initialEnquiries = [],
  initialVerifiedPhone,
}: CustomCakeTrackingDashboardProps) {
  // Authentication & session state
  const [isAuthenticated, setIsAuthenticated] = React.useState(initialAuthenticated);
  const [enquiries, setEnquiries] = React.useState<CustomCakeTrackingItem[]>(initialEnquiries);
  const [verifiedPhone, setVerifiedPhone] = React.useState<string | undefined>(initialVerifiedPhone);

  // Form input state
  const [enquiryNumber, setEnquiryNumber] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Expanded cards state
  const [expandedCards, setExpandedCards] = React.useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Toggle card expansion
  const toggleCard = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (id: string, text: string) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Submit verification form
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEnquiry = enquiryNumber.trim().toUpperCase();
    const cleanPhone = phone.trim();

    if (!cleanEnquiry || !cleanPhone) {
      setErrorMessage("Please enter both your custom cake enquiry number and phone number.");
      return;
    }

    if (!cleanEnquiry.startsWith("CC")) {
      setErrorMessage("Enquiry numbers start with CC (e.g. CC1022). Standard bakery orders start with NB.");
      return;
    }

    setIsVerifying(true);

    try {
      const result = await verifyCustomCakeTrackingAction({
        enquiryNumber: cleanEnquiry,
        phone: cleanPhone,
      });

      if (!result.success || !result.enquiries) {
        setErrorMessage(
          result.error ||
            "Those details don't match a custom cake enquiry. Please check your enquiry number and phone number."
        );
        setIsVerifying(false);
        return;
      }

      setIsAuthenticated(true);
      setEnquiries(result.enquiries);
      setVerifiedPhone(result.verifiedPhone);
      setErrorMessage(null);

      // Auto-expand first card
      if (result.enquiries.length > 0) {
        setExpandedCards({ [result.enquiries[0].id]: true });
      }
    } catch (err) {
      console.error("[CustomCakeTrackingDashboard] Verification failed:", err);
      setErrorMessage("A network error occurred while verifying your enquiry. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Refresh dashboard status
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const result = await getCustomCakeDashboardAction();
      if (result.authenticated && result.enquiries) {
        setEnquiries(result.enquiries);
        if (result.verifiedPhone) setVerifiedPhone(result.verifiedPhone);
      } else {
        // Session expired
        setIsAuthenticated(false);
        setEnquiries([]);
        setErrorMessage("Your tracking session has expired. Please verify your enquiry number and phone again.");
      }
    } catch (err) {
      console.error("[CustomCakeTrackingDashboard] Refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Log out / clear session
  const handleLogout = async () => {
    try {
      await logoutCustomCakeTrackingAction();
    } catch (err) {
      console.error("[CustomCakeTrackingDashboard] Logout error:", err);
    }
    setIsAuthenticated(false);
    setEnquiries([]);
    setVerifiedPhone(undefined);
    setEnquiryNumber("");
    setPhone("");
    setErrorMessage(null);
  };

  // Status mapping
  const getStatusBadge = (status: CustomCakeStatus) => {
    switch (status) {
      case "SUBMITTED":
        return {
          label: "Enquiry Received",
          detail: "Pending Baker Review",
          style: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
        };
      case "UNDER_REVIEW":
        return {
          label: "In Review",
          detail: "Baker Inspecting Schedule",
          style: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-300",
        };
      case "NEEDS_CLARIFICATION":
        return {
          label: "Clarification Needed",
          detail: "Baker Sent A Note",
          style: "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-300",
        };
      case "QUOTED":
        return {
          label: "Quote Prepared",
          detail: "Ready for Your Approval",
          style: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
        };
      case "CUSTOMER_ACCEPTED":
        return {
          label: "Confirmed",
          detail: "Scheduled for Baking",
          style: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
        };
      case "DECLINED":
      case "CUSTOMER_DECLINED":
      case "WITHDRAWN":
      case "EXPIRED":
        return {
          label: "Request Closed / Declined",
          detail: "Not In Progress",
          style: "bg-destructive/15 text-destructive border-destructive/30",
        };
    }
  };

  // Timeline step calculation
  const getTimelineStep = (status: CustomCakeStatus): number => {
    switch (status) {
      case "SUBMITTED":
        return 1;
      case "UNDER_REVIEW":
      case "NEEDS_CLARIFICATION":
        return 2;
      case "QUOTED":
        return 3;
      case "CUSTOMER_ACCEPTED":
        return 4;
      default:
        return 0; // Closed / Declined
    }
  };

  const isDeclinedOrClosed = (status: CustomCakeStatus): boolean => {
    return ["DECLINED", "CUSTOMER_DECLINED", "WITHDRAWN", "EXPIRED"].includes(status);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Navigation Breadcrumb */}
      <nav aria-label="Breadcrumb" className={!isAuthenticated ? "max-w-xl mx-auto" : ""}>
        <Link
          href="/custom-cake"
          className="inline-flex min-touch-target items-center gap-1.5 text-xs text-muted-foreground hover:text-caramel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Custom Cakes</span>
        </Link>
      </nav>

      {/* Header */}
      <div className={`space-y-1.5 ${!isAuthenticated ? "max-w-xl mx-auto" : ""}`}>
        <span className="font-kannada text-xs font-semibold text-caramel block">
          ನಿಮ್ಮ ಕಸ್ಟಮ್ ಕೇಕ್ ವಿಚಾರಣೆಗಳ ಸ್ಥಿತಿ ತಿಳಿಯಿರಿ
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Track My Custom Cakes
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
          View the real-time status, baker notes, and confirmed specifications for your celebration cake enquiries in one place.
        </p>
      </div>

      {/* ERROR ALERT */}
      {errorMessage && (
        <div
          role="alert"
          className={`flex items-start gap-2.5 rounded-sm border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive dark:bg-destructive/20 ${
            !isAuthenticated ? "max-w-xl mx-auto" : ""
          }`}
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* 1. NOT AUTHENTICATED: VERIFICATION FORM */}
      {!isAuthenticated && (
        <div className="rounded-sm border border-border bg-card p-6 sm:p-8 space-y-6 shadow-xs max-w-xl mx-auto">
          <div className="space-y-1.5 text-center">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground">
              Verify Your Custom Cake Enquiry
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              To protect your privacy, enter any one of your custom cake enquiry reference numbers and your mobile phone number.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="trackEnquiryNumber"
                className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5"
              >
                Enquiry Number
              </label>
              <input
                id="trackEnquiryNumber"
                name="enquiryNumber"
                type="text"
                required
                autoCapitalize="characters"
                placeholder="e.g. CC1022"
                value={enquiryNumber}
                onChange={(e) => {
                  setEnquiryNumber(e.target.value.toUpperCase());
                  if (errorMessage) setErrorMessage(null);
                }}
                className="w-full min-h-[48px] rounded-sm border border-border bg-background px-3.5 font-mono text-sm text-foreground uppercase placeholder:normal-case placeholder:font-sans placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel hover:border-caramel/50 transition-colors"
              />
              <span className="text-[11px] text-muted-foreground mt-1 block">
                Found in your confirmation page or enquiry notes (e.g. CC1022).
              </span>
            </div>

            <div>
              <label
                htmlFor="trackPhone"
                className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5"
              >
                Customer Phone Number
              </label>
              <div className="relative flex items-center">
                <span
                  className="absolute left-3.5 text-xs font-semibold text-muted-foreground select-none"
                  aria-hidden="true"
                >
                  +91
                </span>
                <input
                  id="trackPhone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  required
                  placeholder="98450 12345"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full min-h-[48px] rounded-sm border border-border bg-background pl-12 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel hover:border-caramel/50 transition-colors"
                />
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">
                The 10-digit mobile number used when submitting your cake enquiry.
              </span>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-caramel text-sm font-semibold text-white shadow-xs transition-colors hover:bg-caramel/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Enquiry Details...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>View My Enquiries</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-border/60 text-center">
            <p className="text-xs text-muted-foreground">
              Looking for a standard bakery order?{" "}
              <Link
                href="/orders"
                className="font-medium text-caramel hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel"
              >
                Track Bakery Order (NBxxxx)
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* 2. AUTHENTICATED: DASHBOARD VIEW */}
      {isAuthenticated && (
        <div className="space-y-6">
          {/* Top Session Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-sm border border-border bg-card p-4 sm:p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-bold text-foreground">
                  Your Custom Cake Enquiries
                </h2>
                <span className="inline-flex items-center rounded-full bg-caramel/15 px-2.5 py-0.5 text-xs font-semibold text-caramel">
                  {enquiries.length} {enquiries.length === 1 ? "Enquiry" : "Enquiries"}
                </span>
              </div>
              {verifiedPhone && (
                <p className="text-xs text-muted-foreground">
                  Verified for phone: <strong className="font-mono text-foreground">{verifiedPhone}</strong>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="min-touch-target inline-flex items-center justify-center gap-1.5 rounded-sm border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                title="Refresh latest status from kitchen"
              >
                <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="min-touch-target inline-flex items-center justify-center gap-1.5 rounded-sm border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                title="Switch phone number"
              >
                <LogOut className="size-3.5" />
                <span>Track Different Phone</span>
              </button>
            </div>
          </div>

          {/* Empty State */}
          {enquiries.length === 0 && (
            <div className="rounded-sm border border-border bg-card p-12 text-center space-y-4">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Cake className="size-6" />
              </div>
              <h3 className="font-heading text-base font-bold text-foreground">
                No Enquiries Found
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No custom cake enquiries were found matching this phone number.
              </p>
              <Link
                href="/custom-cake"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-sm bg-caramel px-5 text-xs font-semibold text-white hover:bg-caramel/90"
              >
                <Sparkles className="size-4" />
                <span>Submit a Custom Cake Enquiry</span>
              </Link>
            </div>
          )}

          {/* Enquiries List */}
          <div className="space-y-5">
            {enquiries.map((enquiry) => {
              const badge = getStatusBadge(enquiry.status);
              const currentStep = getTimelineStep(enquiry.status);
              const isDeclined = isDeclinedOrClosed(enquiry.status);
              const isExpanded = Boolean(expandedCards[enquiry.id]);

              return (
                <div
                  key={enquiry.id}
                  className="rounded-sm border border-border bg-card overflow-hidden shadow-xs transition-shadow hover:shadow-sm"
                >
                  {/* Card Main Bar */}
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Top Row: Ref number, Badge, and Quick Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-base font-bold text-foreground">
                          {enquiry.request_number}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopy(enquiry.id, enquiry.request_number)}
                          className="min-touch-target inline-flex items-center justify-center rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                          title="Copy enquiry number"
                          aria-label={`Copy enquiry number ${enquiry.request_number}`}
                        >
                          {copiedId === enquiry.id ? (
                            <Check className="size-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </button>

                        <span className="text-xs text-muted-foreground">
                          · {enquiry.cake_type || "Celebration Cake"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wider border ${badge.style}`}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          <span>{badge.label}</span>
                        </span>
                      </div>
                    </div>

                    {/* Timeline Progression */}
                    {!isDeclined ? (
                      <div className="pt-2">
                        <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                          {/* Step 1: Received */}
                          <div className="space-y-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                currentStep >= 1 ? "bg-caramel" : "bg-muted"
                              }`}
                            />
                            <span
                              className={`block font-medium ${
                                currentStep >= 1 ? "text-foreground font-semibold" : "text-muted-foreground"
                              }`}
                            >
                              1. Received
                            </span>
                          </div>

                          {/* Step 2: Reviewing */}
                          <div className="space-y-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                currentStep >= 2 ? "bg-caramel" : "bg-muted"
                              }`}
                            />
                            <span
                              className={`block font-medium ${
                                currentStep >= 2 ? "text-foreground font-semibold" : "text-muted-foreground"
                              }`}
                            >
                              2. Reviewing
                            </span>
                          </div>

                          {/* Step 3: Quoted */}
                          <div className="space-y-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                currentStep >= 3 ? "bg-caramel" : "bg-muted"
                              }`}
                            />
                            <span
                              className={`block font-medium ${
                                currentStep >= 3 ? "text-foreground font-semibold" : "text-muted-foreground"
                              }`}
                            >
                              3. Price Quote
                            </span>
                          </div>

                          {/* Step 4: Confirmed */}
                          <div className="space-y-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                currentStep >= 4 ? "bg-emerald-600" : "bg-muted"
                              }`}
                            />
                            <span
                              className={`block font-medium ${
                                currentStep >= 4 ? "text-emerald-700 font-semibold dark:text-emerald-400" : "text-muted-foreground"
                              }`}
                            >
                              4. Confirmed
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-sm border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                        <XCircle className="size-4 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold block">Enquiry Closed / Declined</strong>
                          <p className="text-[11px] mt-0.5 text-muted-foreground">
                            {enquiry.decline_reason || "This custom cake enquiry has been closed by bakery staff."}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Key Attributes Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                      <div className="space-y-0.5 rounded-sm border border-border bg-background p-2.5">
                        <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
                          Flavour &amp; Diet
                        </span>
                        <p className="font-semibold text-foreground truncate">{enquiry.flavour}</p>
                        <span className="text-[11px] text-muted-foreground">
                          {enquiry.egg_type === "EGGLESS" ? "Eggless / Pure Veg" : "Regular"}
                        </span>
                      </div>

                      <div className="space-y-0.5 rounded-sm border border-border bg-background p-2.5">
                        <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
                          Weight &amp; Shape
                        </span>
                        <p className="font-semibold text-foreground">
                          {enquiry.weight_grams >= 1000
                            ? `${enquiry.weight_grams / 1000} kg`
                            : `${enquiry.weight_grams}g`}
                        </p>
                        <span className="text-[11px] text-muted-foreground">
                          {enquiry.shape || "Round"}
                        </span>
                      </div>

                      <div className="space-y-0.5 rounded-sm border border-border bg-background p-2.5">
                        <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
                          Requested Pickup
                        </span>
                        <p className="font-semibold text-foreground truncate">
                          {formatIstDate(enquiry.preferred_pickup_at)}
                        </p>
                        <span className="text-[11px] text-muted-foreground">
                          Around {formatIstTime(enquiry.preferred_pickup_at)}
                        </span>
                      </div>

                      <div className="space-y-0.5 rounded-sm border border-border bg-background p-2.5">
                        <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
                          Submitted On
                        </span>
                        <p className="font-semibold text-foreground truncate">
                          {formatIstDate(enquiry.created_at)}
                        </p>
                        <span className="text-[11px] text-muted-foreground">
                          {formatIstTime(enquiry.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/60">
                      <button
                        type="button"
                        onClick={() => toggleCard(enquiry.id)}
                        className="min-touch-target inline-flex items-center gap-1.5 text-xs font-semibold text-caramel hover:text-caramel/80 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel"
                      >
                        {isExpanded ? (
                          <>
                            <span>Hide Details &amp; Notes</span>
                            <ChevronUp className="size-3.5" />
                          </>
                        ) : (
                          <>
                            <span>View Full Details &amp; Notes</span>
                            <ChevronDown className="size-3.5" />
                          </>
                        )}
                      </button>

                      <Link
                        href={`/custom-cake/confirmation/${enquiry.public_token}`}
                        className="min-touch-target inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-caramel"
                      >
                        <span>Full Confirmation Page</span>
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Expandable Details Section */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/20 p-5 sm:p-6 space-y-4 text-xs">
                      {/* Cake Inscription Message */}
                      {enquiry.message_on_cake && (
                        <div className="rounded-sm border border-amber-300 bg-amber-50/80 p-3 space-y-1 dark:bg-amber-950/40 dark:border-amber-800">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
                            <Sparkles className="size-3" />
                            <span>Cake Inscription</span>
                          </span>
                          <p className="font-serif italic text-sm text-amber-950 dark:text-amber-200">
                            &ldquo;{enquiry.message_on_cake}&rdquo;
                          </p>
                        </div>
                      )}

                      {/* Design & Theme Instructions */}
                      {enquiry.description && (
                        <div className="space-y-1 rounded-sm border border-border bg-background p-3.5">
                          <span className="text-muted-foreground font-semibold block text-[11px] uppercase tracking-wider">
                            Design &amp; Theme Instructions
                          </span>
                          <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                            {enquiry.description}
                          </p>
                        </div>
                      )}

                      {/* Reference Image Preview */}
                      {enquiry.reference_image_url && (
                        <div className="space-y-2">
                          <span className="text-muted-foreground font-semibold block text-[11px] uppercase tracking-wider">
                            Submitted Reference Photo
                          </span>
                          <div className="relative size-36 sm:size-44 overflow-hidden rounded-sm border border-border bg-card">
                            <Image
                              src={enquiry.reference_image_url}
                              alt="Custom cake reference design"
                              fill
                              sizes="176px"
                              className="object-cover"
                            />
                          </div>
                        </div>
                      )}

                      {/* Quote & Pricing info if available */}
                      {enquiry.quote && (
                        <div className="rounded-sm border border-emerald-300 bg-emerald-50/80 p-3.5 space-y-1.5 dark:bg-emerald-950/40 dark:border-emerald-800">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                            Bakery Agreed Price &amp; Quote
                          </span>
                          <p className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                            ₹{(enquiry.quote.price_paise / 100).toLocaleString("en-IN")}
                          </p>
                          {enquiry.quote.bakery_note && (
                            <p className="text-xs text-emerald-950 dark:text-emerald-100">
                              Note: {enquiry.quote.bakery_note}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Messages / Communication History */}
                      {enquiry.messages && enquiry.messages.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-muted-foreground font-semibold block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                            <MessageSquare className="size-3.5 text-caramel" />
                            <span>Messages &amp; Notes from Bakery Staff</span>
                          </span>
                          <div className="space-y-2">
                            {enquiry.messages.map((msg, idx) => (
                              <div
                                key={idx}
                                className={`rounded-sm p-3 space-y-1 ${
                                  msg.sender === "STAFF"
                                    ? "bg-caramel/10 border border-caramel/25 text-foreground"
                                    : "bg-background border border-border text-foreground"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                                  <span className="font-semibold uppercase tracking-wider">
                                    {msg.sender === "STAFF" ? "Bakery Chef / Operations" : "You (Customer)"}
                                  </span>
                                  <span>{formatIstDate(msg.created_at)}</span>
                                </div>
                                <p className="text-xs leading-relaxed">{msg.body}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 border-t border-border">
            <Link
              href="/custom-cake"
              className="w-full sm:w-auto min-h-[48px] h-12 px-6 rounded-sm bg-caramel text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-caramel/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel shadow-xs"
            >
              <Sparkles className="size-4" />
              <span>Submit Another Custom Cake Enquiry</span>
            </Link>

            <Link
              href="/menu"
              className="w-full sm:w-auto min-h-[48px] h-12 px-6 rounded-sm border border-border bg-card text-foreground text-xs font-semibold flex items-center justify-center gap-2 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
            >
              <Cake className="size-4" />
              <span>Browse Regular Menu</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
