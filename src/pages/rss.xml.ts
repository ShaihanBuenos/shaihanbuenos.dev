import type { APIRoute } from "astro";
import { feed } from "../lib/feed.ts";

export const GET: APIRoute = (context) => feed("en", context);
