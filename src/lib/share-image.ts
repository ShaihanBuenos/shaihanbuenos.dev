// The share images (section 9 of the spec): which ones exist, where each one
// lives and what each one says. A text has one per language it has a version
// in, a project has one per language, and the fixed pages share a default one
// per language. Who draws them is src/lib/share-image-drawing.ts.
import type { Content, Project, Text } from "./content.ts";
import { type Language, LANGUAGES, homeOf } from "./languages.ts";
import { projectPathOf, textPathOf } from "./pages.ts";
import type { Phrases, TEXT_TYPES } from "./schemas.ts";
import { DOMAIN, NAME } from "./site.ts";

// The size every share image has, the one the sites that show it expect.
export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 } as const;

interface Shared {
  // The path of the image file on the site.
  path: string;
  // The alternative text: what is written on the image.
  alt: string;
}

export type ShareImage = Shared &
  (
    | { kind: "default"; name: string; label: string }
    | { kind: "text"; title: string; type: (typeof TEXT_TYPES)[number]; typeName: string }
    | { kind: "project"; name: string; mark: string }
  );

// The image of a page lives at the path of the page, under /share.
function pathOfImageAt(pagePath: string): string {
  return `/share${pagePath}.png`;
}

function altOf(...written: string[]): string {
  return [...written, DOMAIN].join(" · ");
}

// The image of the fixed pages of a language: the name and the label.
export function defaultShareImage(language: Language, phrases: Phrases): ShareImage {
  const home = homeOf(language);
  return {
    kind: "default",
    path: pathOfImageAt(`${home === "/" ? "" : home}/default`),
    alt: altOf(NAME, phrases.home.label),
    name: NAME,
    label: phrases.home.label,
  };
}

// The image of one version of a text: the title and the text type.
export function textShareImage(
  text: Text,
  language: Language,
  phrases: Phrases,
): ShareImage | undefined {
  const version = text.versions[language];
  if (!version) return undefined;
  const typeName = phrases.writing.types[text.type];
  return {
    kind: "text",
    path: pathOfImageAt(textPathOf(version.slug, language)),
    alt: altOf(version.title, typeName),
    title: version.title,
    type: text.type,
    typeName,
  };
}

// The image of a project story: the project mark and the name.
export function projectShareImage(project: Project, language: Language): ShareImage {
  return {
    kind: "project",
    path: pathOfImageAt(projectPathOf(project.id, language)),
    alt: altOf(project.name),
    name: project.name,
    mark: project.mark,
  };
}

// Every share image of the site: the build writes one file for each.
export function shareImagesOf({ pages, texts, projects }: Content): ShareImage[] {
  return LANGUAGES.flatMap((language) => [
    defaultShareImage(language, pages[language]),
    ...projects.map((project) => projectShareImage(project, language)),
    ...texts.flatMap((text) => textShareImage(text, language, pages[language]) ?? []),
  ]);
}
