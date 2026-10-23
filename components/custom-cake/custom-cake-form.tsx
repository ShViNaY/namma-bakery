"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Calendar,
  Clock,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  User,
  Mail,
  Info,
  Check,
} from "lucide-react";
import { submitCustomCakeRequestAction } from "@/lib/custom-cake/actions";
import { getIstDateString } from "@/lib/utils/date";

const CAKE_OCCASIONS = [
  "Birthday Celebration",
  "Wedding & Engagement",
  "Anniversary",
  "Cartoon & Character Theme",
  "Baby Shower / Naming",
  "Corporate Event",
  "Festive Celebration",
  "Other Occasion",
];

const FLAVOUR_OPTIONS = [
  "Dutch Chocolate Truffle",
  "Butterscotch Crunch",
  "Fresh Fruit / Mango",
  "Classic Black Forest",
  "Pineapple Cream",
  "Red Velvet Cream Cheese",
  "Rasmalai Fusion",
  "Rich Blueberry",
  "Custom / To Discuss",
];

const WEIGHT_PRESETS = [
  { label: "1/2 kg (500g)", grams: 500, servings: "3–4 servings" },
  { label: "1 kg (1,000g)", grams: 1000, servings: "6–8 servings" },
  { label: "1.5 kg (1,500g)", grams: 1500, servings: "10–12 servings" },
  { label: "2 kg (2,000g)", grams: 2000, servings: "15–18 servings" },
  { label: "3 kg (3,000g)", grams: 3000, servings: "25–30 servings" },
  { label: "5 kg (5,000g)", grams: 5000, servings: "40+ servings" },
];

const SHAPE_OPTIONS = [
  "Round",
  "Square",
  "Heart",
  "Multi-Tiered (2+ Tiers)",
  "Custom Sculpted",
];

const PICKUP_WINDOWS = [
  "10:00 AM – 12:00 PM",
  "12:00 PM – 2:00 PM",
  "2:00 PM – 4:00 PM",
  "4:00 PM – 6:00 PM",
  "6:00 PM – 8:00 PM",
  "8:00 PM – 9:30 PM",
];

export function CustomCakeForm() {
  const router = useRouter();

  // Tomorrow in IST as minimum pickup date
  const tomorrowIst = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return getIstDateString(d);
  }, []);

  // Form states
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [customerEmail, setCustomerEmail] = React.useState("");

  const [cakeType, setCakeType] = React.useState(CAKE_OCCASIONS[0]);
  const [customOccasion, setCustomOccasion] = React.useState("");

  const [flavour, setFlavour] = React.useState(FLAVOUR_OPTIONS[0]);
  const [customFlavour, setCustomFlavour] = React.useState("");

  const [eggType, setEggType] = React.useState<"EGGLESS" | "REGULAR">("EGGLESS");
  const [weightGrams, setWeightGrams] = React.useState<number>(1000);
  const [isCustomWeight, setIsCustomWeight] = React.useState(false);
  const [customWeightInput, setCustomWeightInput] = React.useState("");

  const [shape, setShape] = React.useState(SHAPE_OPTIONS[0]);
  const [preferredPickupDate, setPreferredPickupDate] = React.useState(tomorrowIst);
  const [preferredPickupTime, setPreferredPickupTime] = React.useState(PICKUP_WINDOWS[2]);

  const [description, setDescription] = React.useState("");
  const [messageOnCake, setMessageOnCake] = React.useState("");
  const [additionalNotes, setAdditionalNotes] = React.useState("");

  // File upload state
  const [referenceFile, setReferenceFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Reference photo must be under 5MB in size.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMessage("Only PNG, JPEG, and WebP image formats are accepted.");
      return;
    }

    setErrorMessage(null);
    setReferenceFile(file);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveFile = () => {
    setReferenceFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic client checks
    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMessage("Please enter your name (at least 2 characters).");
      return;
    }

    const cleanPhone = customerPhone.replace(/[\s\-]/g, "");
    if (!/^(\+91|91|0)?[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage("Please describe your design or theme idea (at least 10 characters).");
      return;
    }

    const finalWeight = isCustomWeight
      ? Number(customWeightInput)
      : weightGrams;

    if (!finalWeight || finalWeight < 250 || finalWeight > 20000) {
      setErrorMessage("Cake weight must be between 250g and 20,000g (20 kg).");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("customerName", customerName.trim());
      formData.set("customerPhone", cleanPhone);
      if (customerEmail.trim()) formData.set("customerEmail", customerEmail.trim());

      const finalOccasion =
        cakeType === "Other Occasion" && customOccasion.trim()
          ? customOccasion.trim()
          : cakeType;
      formData.set("cakeType", finalOccasion);

      const finalFlavour =
        flavour === "Custom / To Discuss" && customFlavour.trim()
          ? customFlavour.trim()
          : flavour;
      formData.set("flavour", finalFlavour);

      formData.set("eggType", eggType);
      formData.set("weightGrams", String(finalWeight));
      formData.set("shape", shape);
      formData.set("preferredPickupDate", preferredPickupDate);
      formData.set("preferredPickupTime", preferredPickupTime);
      formData.set("description", description.trim());
      if (messageOnCake.trim()) formData.set("messageOnCake", messageOnCake.trim());
      if (additionalNotes.trim()) formData.set("additionalNotes", additionalNotes.trim());

      if (referenceFile) {
        formData.set("referenceImage", referenceFile);
      }

      const res = await submitCustomCakeRequestAction(formData);

      if (!res.success || !res.token) {
        setErrorMessage(res.error || "Failed to submit custom cake enquiry. Please check details.");
        setIsSubmitting(false);
        return;
      }

      // Redirect to confirmation page
      router.push(`/custom-cake/confirmation/${res.token}`);
    } catch (err) {
      console.error("[CustomCakeForm] Submission failed:", err);
      setErrorMessage("An unexpected network error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* Important Business Rule Notice */}
      <div
        role="note"
        className="rounded-sm border border-amber-300 bg-amber-50/80 p-4 sm:p-5 text-amber-950 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200 space-y-2"
      >
        <div className="flex items-start gap-3">
          <Info className="size-5 text-amber-800 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-heading text-sm sm:text-base font-bold">
              How Custom Cake Enquiries Work
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed">
              Custom cakes require confirmation from our head baker before your order is finalized. Submitting this form creates a preliminary design enquiry. Our team will review your specifications, verify kitchen availability, and contact you directly via phone to finalize the order.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-sm border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive dark:bg-destructive/20"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span className="leading-tight">{errorMessage}</span>
        </div>
      )}

      {/* SECTION 1: Cake Occasion, Flavour & Specifications */}
      <div className="rounded-sm border border-border bg-card p-5 sm:p-7 space-y-6">
        <div className="border-b border-border pb-3">
          <h2 className="font-heading text-lg font-bold text-foreground">
            1. Cake Specifications
          </h2>
          <p className="text-xs text-muted-foreground">
            Select the occasion, flavour, and serving size you need.
          </p>
        </div>

        {/* Occasion / Cake Type */}
        <fieldset className="space-y-2 border-0 p-0 m-0">
          <legend className="block text-xs font-semibold uppercase tracking-wider text-foreground">
            Occasion / Event <span className="text-destructive">*</span>
          </legend>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Select occasion">
            {CAKE_OCCASIONS.map((occ) => {
              const isSelected = cakeType === occ;
              return (
                <button
                  key={occ}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setCakeType(occ)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-sm text-xs font-medium inline-flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-caramel text-white shadow-xs"
                      : "border border-border bg-background text-foreground hover:border-caramel/50"
                  }`}
                >
                  {occ}
                </button>
              );
            })}
          </div>
          {cakeType === "Other Occasion" && (
            <input
              type="text"
              placeholder="Specify the occasion (e.g. Graduation, Housewarming)..."
              value={customOccasion}
              onChange={(e) => setCustomOccasion(e.target.value)}
              className="w-full mt-2 min-h-[48px] rounded-sm border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
            />
          )}
        </fieldset>

        {/* Flavour Choice */}
        <fieldset className="space-y-2 border-0 p-0 m-0">
          <legend className="block text-xs font-semibold uppercase tracking-wider text-foreground">
            Flavour Preference <span className="text-destructive">*</span>
          </legend>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Select flavour">
            {FLAVOUR_OPTIONS.map((flav) => {
              const isSelected = flavour === flav;
              return (
                <button
                  key={flav}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setFlavour(flav)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-sm text-xs font-medium inline-flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-caramel text-white shadow-xs"
                      : "border border-border bg-background text-foreground hover:border-caramel/50"
                  }`}
                >
                  {flav}
                </button>
              );
            })}
          </div>
          {flavour === "Custom / To Discuss" && (
            <input
              type="text"
              placeholder="Describe your desired flavour or special mix..."
              value={customFlavour}
              onChange={(e) => setCustomFlavour(e.target.value)}
              className="w-full mt-2 min-h-[48px] rounded-sm border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
            />
          )}
        </fieldset>

        {/* Egg Preference & Shape */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          {/* Egg Type */}
          <fieldset className="space-y-2 border-0 p-0 m-0">
            <legend className="block text-xs font-semibold uppercase tracking-wider text-foreground">
              Egg Preference <span className="text-destructive">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Select egg preference">
              <button
                type="button"
                role="radio"
                aria-checked={eggType === "EGGLESS"}
                onClick={() => setEggType("EGGLESS")}
                className={`min-h-[48px] p-3 rounded-sm border text-left flex items-center justify-between transition-colors ${
                  eggType === "EGGLESS"
                    ? "border-emerald-600 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300"
                    : "border-border bg-background text-foreground hover:border-caramel/40"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-xs">
                    <span className="size-2 rounded-full bg-emerald-600" />
                    <span>Eggless (Pure Veg)</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    100% vegetarian sponge
                  </span>
                </div>
                {eggType === "EGGLESS" && <Check className="size-4 text-emerald-700" />}
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={eggType === "REGULAR"}
                onClick={() => setEggType("REGULAR")}
                className={`min-h-[48px] p-3 rounded-sm border text-left flex items-center justify-between transition-colors ${
                  eggType === "REGULAR"
                    ? "border-amber-600 bg-amber-500/10 text-amber-900 dark:text-amber-300"
                    : "border-border bg-background text-foreground hover:border-caramel/40"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-xs">
                    <span className="size-2 rounded-full bg-amber-600" />
                    <span>Regular</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    Traditional egg sponge
                  </span>
                </div>
                {eggType === "REGULAR" && <Check className="size-4 text-amber-700" />}
              </button>
            </div>
          </fieldset>

          {/* Cake Shape */}
          <fieldset className="space-y-2 border-0 p-0 m-0">
            <legend className="block text-xs font-semibold uppercase tracking-wider text-foreground">
              Cake Shape / Structure
            </legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="group" aria-label="Select cake shape">
              {SHAPE_OPTIONS.map((sh) => {
                const isSelected = shape === sh;
                return (
                  <button
                    key={sh}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setShape(sh)}
                    className={`min-h-[44px] px-2.5 py-2 rounded-sm text-xs font-medium flex items-center justify-center text-center transition-colors truncate ${
                      isSelected
                        ? "bg-caramel text-white shadow-xs"
                        : "border border-border bg-background text-foreground hover:border-caramel/50"
                    }`}
                  >
                    {sh}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* Serving Size & Weight */}
        <fieldset className="space-y-2 pt-2 border-0 p-0 m-0">
          <legend className="block text-xs font-semibold uppercase tracking-wider text-foreground">
            Approximate Weight / Serving Size <span className="text-destructive">*</span>
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2" role="group" aria-label="Select approximate weight">
            {WEIGHT_PRESETS.map((p) => {
              const isSelected = !isCustomWeight && weightGrams === p.grams;
              return (
                <button
                  key={p.grams}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setIsCustomWeight(false);
                    setWeightGrams(p.grams);
                  }}
                  className={`min-h-[50px] p-2.5 rounded-sm border text-left flex flex-col justify-center transition-colors ${
                    isSelected
                      ? "border-caramel bg-caramel/10"
                      : "border-border bg-background hover:border-caramel/50"
                  }`}
                >
                  <span className="font-semibold text-xs text-foreground block">
                    {p.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    {p.servings}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsCustomWeight(!isCustomWeight)}
              className="text-xs font-semibold text-caramel hover:underline"
            >
              {isCustomWeight ? "← Choose preset weight" : "Need a different weight (e.g. 4 kg or 10 kg)?"}
            </button>
            {isCustomWeight && (
              <div className="mt-2 flex items-center gap-2 max-w-xs">
                <input
                  type="number"
                  min="250"
                  max="20000"
                  step="250"
                  placeholder="e.g. 4000"
                  value={customWeightInput}
                  onChange={(e) => setCustomWeightInput(e.target.value)}
                  className="w-full min-h-[42px] rounded-sm border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                />
                <span className="text-xs font-semibold text-muted-foreground">grams</span>
              </div>
            )}
          </div>
        </fieldset>
      </div>

      {/* SECTION 2: Design Details, Message & Reference Image */}
      <div className="rounded-sm border border-border bg-card p-5 sm:p-7 space-y-6">
        <div className="border-b border-border pb-3">
          <h2 className="font-heading text-lg font-bold text-foreground">
            2. Design, Inscription & Reference Photo
          </h2>
          <p className="text-xs text-muted-foreground">
            Provide details on the theme, colours, and optional reference images.
          </p>
        </div>

        {/* Design Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="description"
              className="block text-xs font-semibold uppercase tracking-wider text-foreground"
            >
              Design / Theme Description <span className="text-destructive">*</span>
            </label>
            <span className="text-[11px] text-muted-foreground font-mono">
              {description.length} / 1500
            </span>
          </div>
          <textarea
            id="description"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your cake idea in detail: theme characters, colour tones (e.g. pastel lavender & gold), frosting style, floral decorations, or specific tier layouts..."
            className="w-full rounded-sm border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
          />
        </div>

        {/* Message on Cake */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="messageOnCake"
              className="block text-xs font-semibold uppercase tracking-wider text-foreground"
            >
              Message / Name Inscription (Optional)
            </label>
            <span className="text-[11px] text-muted-foreground font-mono">
              {messageOnCake.length} / 60
            </span>
          </div>
          <div className="relative">
            <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-caramel/70" />
            <input
              id="messageOnCake"
              type="text"
              maxLength={60}
              value={messageOnCake}
              onChange={(e) => setMessageOnCake(e.target.value)}
              placeholder="e.g. Happy 5th Birthday Dhruv! or Cheers to 25 Years"
              className="w-full min-h-[44px] rounded-sm border border-border bg-background pl-10 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
            />
          </div>
        </div>

        {/* Reference Image Upload */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground">
            Reference Image / Sketch (Optional)
          </label>

          {previewUrl ? (
            <div className="relative inline-block rounded-sm border border-border bg-background p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Cake reference preview"
                className="size-36 object-cover rounded-xs border border-border"
              />
              <button
                type="button"
                onClick={handleRemoveFile}
                className="absolute -top-2 -right-2 size-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-xs hover:bg-destructive/90"
                title="Remove photo"
              >
                <X className="size-3.5" />
              </button>
              <p className="text-[10px] text-muted-foreground mt-1 max-w-[140px] truncate">
                {referenceFile?.name}
              </p>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-sm border-2 border-dashed border-border p-6 text-center hover:border-caramel/60 hover:bg-surface transition-colors"
            >
              <UploadCloud className="size-8 text-caramel/70 mx-auto mb-2" />
              <p className="text-xs font-semibold text-foreground">
                Click to upload a reference photo or sketch
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                PNG, JPEG, or WebP up to 5MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: Pickup Schedule & Customer Contact */}
      <div className="rounded-sm border border-border bg-card p-5 sm:p-7 space-y-6">
        <div className="border-b border-border pb-3">
          <h2 className="font-heading text-lg font-bold text-foreground">
            3. Schedule & Contact Details
          </h2>
          <p className="text-xs text-muted-foreground">
            When would you like to collect your cake at our RR Nagar bakery counter?
          </p>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label
              htmlFor="preferredPickupDate"
              className="block text-xs font-semibold uppercase tracking-wider text-foreground"
            >
              Preferred Pickup Date <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-caramel" />
              <input
                id="preferredPickupDate"
                type="date"
                required
                min={tomorrowIst}
                value={preferredPickupDate}
                onChange={(e) => setPreferredPickupDate(e.target.value)}
                className="w-full min-h-[48px] rounded-sm border border-border bg-background pl-10 pr-3.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Custom celebration cakes typically require 24–48 hours advance notice.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="preferredPickupTime"
              className="block text-xs font-semibold uppercase tracking-wider text-foreground"
            >
              Preferred Pickup Window <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-caramel" />
              <select
                id="preferredPickupTime"
                required
                value={preferredPickupTime}
                onChange={(e) => setPreferredPickupTime(e.target.value)}
                className="w-full min-h-[48px] rounded-sm border border-border bg-background pl-10 pr-3.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
              >
                {PICKUP_WINDOWS.map((win) => (
                  <option key={win} value={win}>
                    {win}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Bakery counter pickup at BEML Layout, RR Nagar.
            </p>
          </div>
        </div>

        {/* Customer Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          <div className="space-y-1.5">
            <label
              htmlFor="customerName"
              className="block text-xs font-semibold uppercase tracking-wider text-foreground"
            >
              Your Full Name <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                id="customerName"
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full min-h-[48px] rounded-sm border border-border bg-background pl-10 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="customerPhone"
              className="block text-xs font-semibold uppercase tracking-wider text-foreground"
            >
              Mobile Phone Number <span className="text-destructive">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-semibold text-muted-foreground select-none">
                +91
              </span>
              <input
                id="customerPhone"
                type="tel"
                required
                inputMode="numeric"
                placeholder="98450 12345"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full min-h-[48px] rounded-sm border border-border bg-background pl-12 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Our head baker will call this number to confirm the order.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="customerEmail"
            className="block text-xs font-semibold uppercase tracking-wider text-foreground"
          >
            Email Address (Optional)
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              id="customerEmail"
              type="email"
              placeholder="e.g. ramesh@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full min-h-[48px] rounded-sm border border-border bg-background pl-10 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
            />
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-1.5 pt-2">
          <label
            htmlFor="additionalNotes"
            className="block text-xs font-semibold uppercase tracking-wider text-foreground"
          >
            Special Dietary Requirements or Dietary Notes (Optional)
          </label>
          <input
            id="additionalNotes"
            type="text"
            maxLength={1000}
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="e.g. Nut allergy, less sugar, gluten-sensitive note, candle requirements..."
            className="w-full min-h-[48px] rounded-sm border border-border bg-background px-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-12 w-full sm:w-auto sm:min-w-[280px] items-center justify-center gap-2 rounded-sm bg-caramel text-sm font-semibold text-white shadow-none transition-colors hover:bg-caramel/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground mx-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Submitting Your Request...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4" />
              <span>Submit Custom Cake Enquiry</span>
            </>
          )}
        </button>
        <p className="text-center text-xs text-muted-foreground mt-2">
          No advance payment required today. You pay upon collection at the bakery.
        </p>
      </div>
    </form>
  );
}
