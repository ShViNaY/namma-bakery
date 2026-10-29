"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Cake,
  Sparkles,
  Clock,
  MapPin,
  ShoppingBag,
  Search,
  ChevronRight,
} from "lucide-react";
import { HeaderCartButton } from "./header-cart-button";
import { useCart } from "@/lib/cart/context";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  {
    href: "/menu",
    label: "Bakery Menu",
    labelKn: "ಮೆನು",
    description: "Handcrafted celebration cakes & fresh bakes",
    icon: Cake,
  },
  {
    href: "/custom-cake",
    label: "Custom Cakes",
    labelKn: "ಕಸ್ಟಮ್ ಕೇಕ್",
    description: "Design your personalized celebration cake",
    icon: Sparkles,
  },
  {
    href: "/orders",
    label: "Track Order",
    labelKn: "ಆರ್ಡರ್ ಟ್ರ್ಯಾಕ್",
    description: "Check status of your bakery pickup",
    icon: Search,
  },
];

const CATEGORY_SHORTCUTS = [
  { href: "/menu/cakes", label: "Cakes" },
  { href: "/menu/sandwiches", label: "Sandwiches" },
  { href: "/menu/mini-pizzas", label: "Mini Pizzas" },
  { href: "/menu/soups", label: "Soups" },
];

const MOBILE_PRIMARY_ACTIONS = [
  { href: "/menu", label: "Menu" },
  { href: "/custom-cake", label: "Custom Cakes" },
  { href: "/orders", label: "Track Order" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { itemCount, isHydrated } = useCart();
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const handleBrandClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setIsOpen(false);
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Close menu on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  // Handle scroll styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Lock body scroll and manage keyboard accessibility when mobile drawer is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the first navigation link
    const timer = setTimeout(() => {
      firstLinkRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen]);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  const displayCount = isHydrated ? itemCount : 0;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        isScrolled
          ? "border-b border-border bg-background/95 backdrop-blur-md shadow-2xs"
          : "border-b border-border/40 bg-background/80 backdrop-blur-xs"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-3 sm:px-6">
        {/* Brand identity */}
        <Link
          href="/"
          onClick={handleBrandClick}
          className="group flex flex-col justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
        >
          <span className="font-kannada text-[11px] sm:text-xs font-medium tracking-wide text-caramel leading-none mb-0.5">
            ನಮ್ಮ ಬೇಕರಿ
          </span>
          <span className="font-heading text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-caramel sm:text-xl">
            Namma Bakery
          </span>
        </Link>

        {/* Desktop Navigation (>= md screens) */}
        <nav
          className="hidden md:flex items-center gap-1 lg:gap-1.5"
          aria-label="Main Navigation"
        >
          <Link
            href="/menu"
            className={cn(
              "flex min-h-[48px] items-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-secondary hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel",
              pathname.startsWith("/menu")
                ? "text-caramel font-semibold"
                : "text-foreground"
            )}
          >
            Menu
          </Link>
          <Link
            href="/custom-cake"
            className={cn(
              "flex min-h-[48px] items-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-secondary hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel",
              pathname.startsWith("/custom-cake")
                ? "text-caramel font-semibold"
                : "text-foreground"
            )}
          >
            Custom Cakes
          </Link>
          <Link
            href="/orders"
            aria-label="Track your order"
            className={cn(
              "flex min-h-[48px] items-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-secondary hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel",
              pathname.startsWith("/orders")
                ? "text-caramel font-semibold"
                : "text-foreground"
            )}
          >
            Track Order
          </Link>
          <HeaderCartButton />
          <div className="hidden lg:flex items-center gap-2 border-l border-border pl-3">
            <span className="text-xs font-medium text-muted-foreground">
              RR Nagar, Bengaluru
            </span>
          </div>
        </nav>

        {/* Mobile Header Right Controls (< md screens) */}
        <div className="flex md:hidden items-center gap-1">
          <HeaderCartButton />

          <button
            ref={menuButtonRef}
            type="button"
            onClick={toggleMenu}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation-drawer"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-md text-foreground transition-colors hover:bg-secondary hover:text-caramel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
          >
            {isOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Primary Actions Row (< md screens) */}
      <nav
        aria-label="Mobile quick navigation"
        className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xs px-2.5 py-2 sm:px-4"
      >
        <div className="mx-auto grid grid-cols-3 gap-2 max-w-md">
          {MOBILE_PRIMARY_ACTIONS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-[48px] items-center justify-center rounded-sm border px-1.5 py-1 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel",
                  isActive
                    ? "border-caramel/60 bg-secondary/80 text-caramel font-semibold shadow-2xs"
                    : "border-border/80 bg-background/80 text-foreground font-medium hover:border-caramel/40 hover:bg-secondary/40 hover:text-caramel active:bg-secondary/60"
                )}
              >
                <span className="text-xs sm:text-sm leading-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Navigation Drawer / Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-16 z-40 bg-foreground/30 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
            onClick={closeMenu}
            aria-hidden="true"
          />

          {/* Drawer Menu */}
          <div
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
            className="fixed inset-x-0 top-16 z-50 md:hidden max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-border bg-card shadow-lg animate-in slide-in-from-top-3 duration-200"
          >
            <div className="mx-auto max-w-md px-4 py-5 space-y-6">
              {/* Primary Navigation Links */}
              <nav className="space-y-1.5" aria-label="Mobile primary navigation">
                {NAV_LINKS.map((link, idx) => {
                  const Icon = link.icon;
                  const isActive = pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      ref={idx === 0 ? firstLinkRef : undefined}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex min-h-[52px] items-center justify-between rounded-sm border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel",
                        isActive
                          ? "border-caramel/50 bg-secondary/80 text-caramel font-semibold"
                          : "border-border bg-background text-foreground hover:border-caramel/40 hover:bg-secondary/40"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-sm",
                            isActive
                              ? "bg-caramel text-white"
                              : "bg-secondary text-caramel"
                          )}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-semibold">
                              {link.label}
                            </span>
                            <span className="font-kannada text-[11px] text-muted-foreground">
                              {link.labelKn}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {link.description}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        className="h-4 w-4 text-muted-foreground shrink-0"
                        aria-hidden="true"
                      />
                    </Link>
                  );
                })}

                {/* Mobile Cart Link */}
                <Link
                  href="/cart"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex min-h-[52px] items-center justify-between rounded-sm border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel",
                    pathname === "/cart"
                      ? "border-caramel/50 bg-secondary/80 text-caramel font-semibold"
                      : "border-border bg-background text-foreground hover:border-caramel/40 hover:bg-secondary/40"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-sm",
                        pathname === "/cart"
                          ? "bg-caramel text-white"
                          : "bg-secondary text-caramel"
                      )}
                    >
                      <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold">Shopping Cart</span>
                        <span className="font-kannada text-[11px] text-muted-foreground">
                          ಕಾರ್ಟ್
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {displayCount > 0
                          ? `${displayCount} ${displayCount === 1 ? "item" : "items"} ready for pickup`
                          : "No items yet"}
                      </span>
                    </div>
                  </div>
                  {displayCount > 0 && (
                    <span className="rounded-full bg-caramel px-2 py-0.5 text-xs font-semibold text-white">
                      {displayCount}
                    </span>
                  )}
                </Link>
              </nav>

              {/* Menu Categories Shortcuts */}
              <div className="pt-2 border-t border-border">
                <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Browse by Category
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORY_SHORTCUTS.map((cat) => (
                    <Link
                      key={cat.href}
                      href={cat.href}
                      onClick={() => setIsOpen(false)}
                      className="flex min-h-[48px] items-center justify-between rounded-sm border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-caramel/50 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                    >
                      <span>{cat.label}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Store Pickup Notice */}
              <div className="rounded-sm border border-border/80 bg-secondary/30 p-3.5 text-xs text-muted-foreground space-y-2">
                <div className="flex items-start gap-2 text-foreground font-medium">
                  <MapPin className="h-4 w-4 text-caramel shrink-0 mt-0.5" />
                  <span>BEML Layout 3rd Stage, RR Nagar</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Clock className="h-3.5 w-3.5 text-caramel shrink-0" />
                  <span>Counter Pickup: 10:00 AM – 9:30 PM (Daily)</span>
                </div>
              </div>

              {/* Close Action */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={closeMenu}
                  className="flex min-h-[48px] w-full items-center justify-center rounded-sm border border-border bg-background py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel"
                >
                  Close Menu
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
