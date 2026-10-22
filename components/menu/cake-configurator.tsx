"use client";

import { useMemo, useState } from "react";
import type { CakeFinish, EggType, PriceTierRule } from "@/lib/menu/types";
import { formatPaise } from "@/lib/utils/money";
import {
  formatCakeFinish,
  formatEggType,
  formatWeightGrams,
} from "@/lib/menu/utils";

interface CakeConfiguratorProps {
  rules: PriceTierRule[];
  startingPricePaise?: number | null;
}

export function CakeConfigurator({
  rules,
  startingPricePaise,
}: CakeConfiguratorProps) {
  const activeRules = useMemo(
    () => rules.filter((r) => r.is_active && r.price_paise > 0),
    [rules]
  );

  // Available distinct options present in the active database rules
  const availableWeights = useMemo(() => {
    const weights = Array.from(new Set(activeRules.map((r) => r.weight_grams)));
    return weights.sort((a, b) => a - b);
  }, [activeRules]);

  const availableEggTypes = useMemo(() => {
    const types = Array.from(new Set(activeRules.map((r) => r.egg_type)));
    // Order EGGLESS first (bakery priority)
    return types.sort((a, b) => (a === "EGGLESS" ? -1 : b === "EGGLESS" ? 1 : 0));
  }, [activeRules]);

  const availableFinishes = useMemo(() => {
    const finishes = Array.from(new Set(activeRules.map((r) => r.finish)));
    const order: CakeFinish[] = [
      "STANDARD",
      "RICE_PAPER",
      "SHAPE_CAKE",
      "GUM_PASTE",
    ];
    return finishes.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }, [activeRules]);

  // Initial state derived from the lowest starting price rule
  const initialRule = useMemo(() => {
    if (activeRules.length === 0) return null;
    return [...activeRules].sort((a, b) => a.price_paise - b.price_paise)[0];
  }, [activeRules]);

  const [selectedWeight, setSelectedWeight] = useState<number>(
    initialRule?.weight_grams ?? availableWeights[0] ?? 500
  );
  const [selectedEggType, setSelectedEggType] = useState<EggType>(
    initialRule?.egg_type ?? availableEggTypes[0] ?? "EGGLESS"
  );
  const [selectedFinish, setSelectedFinish] = useState<CakeFinish>(
    initialRule?.finish ?? availableFinishes[0] ?? "STANDARD"
  );

  // Find exact matching rule
  const currentRule = useMemo(() => {
    return activeRules.find(
      (r) =>
        r.weight_grams === selectedWeight &&
        r.egg_type === selectedEggType &&
        r.finish === selectedFinish
    );
  }, [activeRules, selectedWeight, selectedEggType, selectedFinish]);

  // Check valid option combinations based solely on database rules
  const isWeightValid = (weight: number) => {
    return activeRules.some((r) => r.weight_grams === weight);
  };

  const isEggTypeValidForWeight = (egg: EggType, weight: number) => {
    return activeRules.some(
      (r) => r.weight_grams === weight && r.egg_type === egg
    );
  };

  const isFinishValidForSelection = (
    finish: CakeFinish,
    weight: number,
    egg: EggType
  ) => {
    return activeRules.some(
      (r) =>
        r.weight_grams === weight && r.egg_type === egg && r.finish === finish
    );
  };

  const handleWeightChange = (newWeight: number) => {
    setSelectedWeight(newWeight);

    // If current egg & finish combination exists for the new weight, keep it
    if (
      activeRules.some(
        (r) =>
          r.weight_grams === newWeight &&
          r.egg_type === selectedEggType &&
          r.finish === selectedFinish
      )
    ) {
      return;
    }

    // Otherwise find the best matching rule for this weight
    const matchingRule =
      activeRules.find(
        (r) => r.weight_grams === newWeight && r.egg_type === selectedEggType
      ) ?? activeRules.find((r) => r.weight_grams === newWeight);

    if (matchingRule) {
      setSelectedEggType(matchingRule.egg_type);
      setSelectedFinish(matchingRule.finish);
    }
  };

  const handleEggTypeChange = (newEgg: EggType) => {
    setSelectedEggType(newEgg);

    if (
      activeRules.some(
        (r) =>
          r.weight_grams === selectedWeight &&
          r.egg_type === newEgg &&
          r.finish === selectedFinish
      )
    ) {
      return;
    }

    const matchingRule = activeRules.find(
      (r) => r.weight_grams === selectedWeight && r.egg_type === newEgg
    );
    if (matchingRule) {
      setSelectedFinish(matchingRule.finish);
    }
  };

  if (activeRules.length === 0) {
    return (
      <div className="rounded-sm border border-border bg-card p-4">
        <span className="text-sm font-medium text-foreground">
          {startingPricePaise
            ? `From ${formatPaise(startingPricePaise)}`
            : "Price available in store"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 rounded-sm border border-border bg-card p-5 sm:p-6">
      {/* Live Price Header */}
      <div className="border-b border-border pb-4">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Customized Cake Price
        </span>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {currentRule ? formatPaise(currentRule.price_paise) : "Unavailable"}
          </span>
          {startingPricePaise &&
            currentRule &&
            currentRule.price_paise > startingPricePaise && (
              <span className="text-xs text-muted-foreground">
                (Starting from {formatPaise(startingPricePaise)})
              </span>
            )}
        </div>

        {currentRule && (
          <p className="mt-1 text-xs text-caramel font-medium">
            {formatWeightGrams(selectedWeight)} • {formatEggType(selectedEggType)} •{" "}
            {formatCakeFinish(selectedFinish)}
          </p>
        )}
      </div>

      {/* 1. Cake Weight Selector */}
      {availableWeights.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-foreground uppercase tracking-wider">
            1. Select Size / Weight
          </label>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {availableWeights.map((weight) => {
              const isSelected = selectedWeight === weight;
              const isAvailable = isWeightValid(weight);

              return (
                <button
                  key={weight}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => handleWeightChange(weight)}
                  className={`flex h-12 min-w-24 items-center justify-center rounded-sm px-4 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel ${
                    isSelected
                      ? "border-2 border-caramel bg-caramel/10 text-caramel font-semibold"
                      : isAvailable
                      ? "border border-border bg-card text-foreground hover:bg-secondary"
                      : "border border-border/40 bg-muted/30 text-muted-foreground/40 line-through cursor-not-allowed"
                  }`}
                >
                  {formatWeightGrams(weight)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Egg Preference Selector */}
      {availableEggTypes.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-foreground uppercase tracking-wider">
            2. Egg Preference
          </label>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {availableEggTypes.map((egg) => {
              const isSelected = selectedEggType === egg;
              const isAvailable = isEggTypeValidForWeight(egg, selectedWeight);

              return (
                <button
                  key={egg}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => handleEggTypeChange(egg)}
                  className={`flex h-12 min-w-28 items-center justify-center gap-1.5 rounded-sm px-4 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel ${
                    isSelected
                      ? "border-2 border-caramel bg-caramel/10 text-caramel font-semibold"
                      : isAvailable
                      ? "border border-border bg-card text-foreground hover:bg-secondary"
                      : "border border-border/40 bg-muted/30 text-muted-foreground/40 line-through cursor-not-allowed"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      egg === "EGGLESS" ? "bg-emerald-600" : "bg-amber-800"
                    }`}
                  />
                  <span>{formatEggType(egg)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Frosting & Finish Style */}
      {availableFinishes.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-foreground uppercase tracking-wider">
            3. Finish / Presentation
          </label>
          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {availableFinishes.map((finish) => {
              const isSelected = selectedFinish === finish;
              const isAvailable = isFinishValidForSelection(
                finish,
                selectedWeight,
                selectedEggType
              );

              return (
                <button
                  key={finish}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => setSelectedFinish(finish)}
                  className={`flex h-12 items-center justify-between rounded-sm px-4 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel ${
                    isSelected
                      ? "border-2 border-caramel bg-caramel/10 text-caramel font-semibold"
                      : isAvailable
                      ? "border border-border bg-card text-foreground hover:bg-secondary"
                      : "border border-border/40 bg-muted/30 text-muted-foreground/40 line-through cursor-not-allowed"
                  }`}
                >
                  <span>{formatCakeFinish(finish)}</span>
                  {!isAvailable && (
                    <span className="text-[10px] text-muted-foreground/60 no-underline shrink-0">
                      N/A in size
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pricing Rule Note if owner provided note */}
      {currentRule?.note && (
        <div className="rounded-sm border border-border/60 bg-secondary/30 p-3 text-[11px] text-muted-foreground">
          {currentRule.note}
        </div>
      )}
    </div>
  );
}
