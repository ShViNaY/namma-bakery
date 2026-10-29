import type { Metadata } from "next";
import { DM_Sans, Fraunces, Noto_Sans_Kannada, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const notoSansKannada = Noto_Sans_Kannada({
  variable: "--font-kannada",
  subsets: ["kannada"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

import { DemoBanner } from "@/components/layout/demo-banner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { RecommendationWidget } from "@/components/layout/recommendation-widget";
import { CartProvider } from "@/lib/cart/context";
import { getBaseUrl } from "@/lib/utils/seo";

const siteUrl = getBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Namma Bakery — Fresh Cakes & Bakes | RR Nagar, Bengaluru",
    template: "%s | Namma Bakery",
  },
  description:
    "Fresh handcrafted cakes, savoury snacks, and everyday baked treats in BEML Layout, Rajarajeshwari Nagar, Bengaluru. Order fresh cakes and bakes online for bakery counter pickup.",
  keywords: [
    "Namma Bakery",
    "Bakery RR Nagar",
    "Bengaluru Bakery",
    "Cakes in Rajarajeshwari Nagar",
    "BEML Layout Bakery",
    "Birthday Cakes Bengaluru",
    "Custom Celebration Cakes",
    "Eggless Cakes RR Nagar",
    "Fresh Bakes Bangalore",
  ],
  authors: [{ name: "Namma Bakery" }],
  creator: "Namma Bakery",
  publisher: "Namma Bakery",
  formatDetection: {
    email: false,
    address: true,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Namma Bakery",
    title: "Namma Bakery — Fresh Cakes & Bakes | RR Nagar, Bengaluru",
    description:
      "Fresh handcrafted cakes, savoury snacks, and baked treats in BEML Layout, Rajarajeshwari Nagar, Bengaluru.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Namma Bakery — Fresh Cakes & Bakes | RR Nagar, Bengaluru",
    description:
      "Fresh handcrafted cakes, savoury snacks, and baked treats in BEML Layout, Rajarajeshwari Nagar, Bengaluru.",
  },
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${fraunces.variable} ${notoSansKannada.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body id="top" className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-sm focus:bg-caramel focus:px-4 focus:py-2.5 focus:text-xs focus:font-semibold focus:text-white focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        <CartProvider>
          <DemoBanner />
          <Header />
          <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <Footer />
          <RecommendationWidget />
        </CartProvider>
      </body>
    </html>
  );
}

