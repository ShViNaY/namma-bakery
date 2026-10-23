import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/utils/seo";
import { getMenuCategories, getMenuProducts } from "@/lib/menu/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const currentDate = new Date();

  // Core static public routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/menu`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/custom-cake`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  try {
    const [categoriesResult, productsResult] = await Promise.all([
      getMenuCategories(),
      getMenuProducts(),
    ]);

    const categoryEntries: MetadataRoute.Sitemap = (
      categoriesResult.data || []
    ).map((cat) => ({
      url: `${baseUrl}/menu/${cat.slug}`,
      lastModified: currentDate,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    const productEntries: MetadataRoute.Sitemap = [];
    for (const prod of productsResult.data || []) {
      if (prod.category?.slug && prod.slug) {
        productEntries.push({
          url: `${baseUrl}/menu/${prod.category.slug}/${prod.slug}`,
          lastModified: currentDate,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }

    return [...staticRoutes, ...categoryEntries, ...productEntries];
  } catch (err) {
    console.error("[sitemap] Failed to fetch dynamic menu entries:", err);
    return staticRoutes;
  }
}
