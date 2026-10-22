"use client";

import { useState } from "react";
import Image from "next/image";
import { Cake, Soup, UtensilsCrossed } from "lucide-react";
import type { ProductImage, ProductKind } from "@/lib/menu/types";

interface ProductGalleryProps {
  images?: ProductImage[];
  productName: string;
  kind: ProductKind;
  categorySlug?: string;
}

function renderPlaceholderIcon(kind: ProductKind, categorySlug?: string) {
  if (kind === "TIERED_CAKE" || categorySlug === "cakes") {
    return <Cake className="h-20 w-20 stroke-[1.25]" />;
  }
  if (categorySlug === "soups") {
    return <Soup className="h-20 w-20 stroke-[1.25]" />;
  }
  return <UtensilsCrossed className="h-20 w-20 stroke-[1.25]" />;
}

export function ProductGallery({
  images = [],
  productName,
  kind,
  categorySlug,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // If no uploaded photos in database/storage, display bakery Crust placeholder
  if (images.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="relative flex aspect-4/3 w-full flex-col items-center justify-center rounded-sm border border-border bg-secondary/50 p-8 text-caramel/70">
          {renderPlaceholderIcon(kind, categorySlug)}
          <span className="mt-4 font-heading text-xs tracking-wider text-muted-foreground uppercase">
            Namma Bakery • RR Nagar
          </span>
        </div>
      </div>
    );
  }

  const currentImage = images[selectedIndex] ?? images[0];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const imageUrl = currentImage.storage_path.startsWith("http")
    ? currentImage.storage_path
    : `${supabaseUrl}/storage/v1/object/public/product-images/${currentImage.storage_path}`;

  return (
    <div className="flex flex-col gap-3">
      {/* Primary Display */}
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-sm border border-border bg-secondary/30">
        <Image
          src={imageUrl}
          alt={currentImage.alt_text || productName}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {/* Thumbnails if multiple images exist */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            const thumbUrl = img.storage_path.startsWith("http")
              ? img.storage_path
              : `${supabaseUrl}/storage/v1/object/public/product-images/${img.storage_path}`;

            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-sm border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel ${
                  isSelected
                    ? "border-caramel ring-1 ring-caramel"
                    : "border-border opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={thumbUrl}
                  alt={img.alt_text || `${productName} thumbnail ${idx + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
