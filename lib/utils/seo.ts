/**
 * Utility helpers for SEO, base URL resolution, and structured data.
 */

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://nammabakery.com";
}

/**
 * Standard Bakery schema.org JSON-LD matching real project details.
 */
export function getBakeryJsonLd() {
  const siteUrl = getBaseUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: "Namma Bakery",
    alternateName: "ನಮ್ಮ ಬೇಕರಿ",
    url: siteUrl,
    description:
      "Handcrafted cakes, fresh savoury bakes, and everyday neighbourhood favourites in Rajarajeshwari Nagar, Bengaluru.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "BEML Layout 3rd Stage",
      addressLocality: "Rajarajeshwari Nagar",
      addressRegion: "Karnataka",
      postalCode: "560098",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      addressCountry: "IN",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "10:00",
        closes: "21:30",
      },
    ],
    hasMenu: `${siteUrl}/menu`,
    servesCuisine: ["Bakery", "Desserts", "Snacks"],
    paymentAccepted: "Cash, Credit Card, Debit Card, UPI",
    currenciesAccepted: "INR",
    priceRange: "₹₹",
  };
}
