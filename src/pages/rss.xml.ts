import type { APIRoute } from "astro";
import { emptyFeed } from "../lib/feed.ts";

export const GET: APIRoute = (context) => emptyFeed("en", context);
