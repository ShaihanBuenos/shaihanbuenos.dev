import type { APIRoute } from "astro";
import { addressOf } from "../lib/pages.ts";

// Every robot is allowed, AI ones included (section 9 of the spec). Until
// launch, what keeps the site out of search engines is the mark not to index
// (src/lib/config.ts), which a robot only sees if it may read the pages.
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${addressOf("/sitemap.xml", site)}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
