import type { APIRoute } from "astro";
import { feedVazio } from "../../lib/feed.ts";

export const GET: APIRoute = (contexto) => feedVazio("pt-br", contexto);
