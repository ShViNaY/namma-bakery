import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/utils/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/menu", "/menu/*", "/custom-cake"],
        disallow: [
          "/admin",
          "/admin/*",
          "/staff",
          "/staff/*",
          "/cart",
          "/checkout",
          "/orders",
          "/orders/*",
          "/track",
          "/custom-cake/confirmation",
          "/custom-cake/confirmation/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
