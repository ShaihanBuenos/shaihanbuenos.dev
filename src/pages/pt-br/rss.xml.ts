import type { APIRoute } from "astro";
import { feed } from "../../lib/feed.ts";

export const GET: APIRoute = (context) => feed("pt-br", context);
