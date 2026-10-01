import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/admin",
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: "/admin",
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: "/admin",
      },
      {
        userAgent: "Claude-SearchBot",
        allow: "/",
        disallow: "/admin",
      },
      {
        userAgent: "Claude-User",
        allow: "/",
        disallow: "/admin",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
