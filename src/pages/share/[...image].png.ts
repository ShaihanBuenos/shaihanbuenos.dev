import type { APIRoute, GetStaticPaths } from "astro";
import { content } from "../../lib/content.ts";
import { type ShareImage, shareImagesOf } from "../../lib/share-image.ts";
import { shareImagePng } from "../../lib/share-image-drawing.ts";

// One file per share image, at the path the pages point to.
export const getStaticPaths = (async () =>
  shareImagesOf(await content()).map((image) => ({
    params: { image: image.path.replace(/^\/share\//, "").replace(/\.png$/, "") },
    props: { image },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ image: ShareImage }> = async ({ props }) =>
  new Response(new Uint8Array(await shareImagePng(props.image)), {
    headers: { "Content-Type": "image/png" },
  });
