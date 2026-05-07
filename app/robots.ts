import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://helpforge.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        // Crawl the marketing surface; keep authenticated and API paths out.
        allow: ["/", "/login", "/signup", "/pricing"],
        disallow: ["/dashboard", "/dashboard/*", "/api", "/api/*", "/auth/*"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
