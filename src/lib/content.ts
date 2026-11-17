// The content of the site, read from the files in src/content and already
// checked. Pages read the content through here, not straight from the
// collections: this is where the versions of each language are joined, the
// links are checked, the lists are ordered and the drafts leave the build.
import { type CollectionEntry, getCollection } from "astro:content";
import { type Language, LANGUAGES } from "./languages.ts";
import type { Phrases } from "./schemas.ts";

// One version of a text: the original or the translation.
export type TextVersion = CollectionEntry<"textVersions">["data"] & {
  // The file of the version, for the page to show the body with `render()`.
  file: CollectionEntry<"textVersions">;
};

export type Text = CollectionEntry<"texts">["data"] & {
  id: string;
  // The version in each language. The one in the original language always exists.
  versions: Partial<Record<Language, TextVersion>>;
};

// The version of a text that a page in this language shows: the one in the
// page's language when it exists, and the original when it does not.
export function versionIn(
  text: Text,
  language: Language,
): { version: TextVersion; language: Language } {
  for (const candidate of [language, text.originalLanguage]) {
    const version = text.versions[candidate];
    if (version) return { version, language: candidate };
  }
  throw new Error(`texts/${text.id}: the version in the original language is missing`);
}

// The project story in one language.
export type ProjectStory = CollectionEntry<"projectStories">["data"] & {
  // The file of the story, for the page to show the body with `render()`.
  file: CollectionEntry<"projectStories">;
};

export type Project = CollectionEntry<"projects">["data"] & {
  id: string;
  // The project mark: the SVG source, to go straight into the page.
  mark: string;
  // The project story in each language.
  stories: Record<Language, ProjectStory>;
};

// `links.texts` holds the texts that came from the study and the ones the
// study's file links, from the most recent to the oldest.
export type Study = CollectionEntry<"studies">["data"] & { id: string };
export type Role = CollectionEntry<"roles">["data"] & { id: string };
export type ResearchItem = CollectionEntry<"research">["data"] & { id: string };

export interface Content {
  // The phrases of the fixed pages, in each language.
  pages: Record<Language, Phrases>;
  // The texts, from the most recent to the oldest. Drafts are only included
  // in the dev server.
  texts: Text[];
  // The projects, in the order of the `order` field.
  projects: Project[];
  // The studies, from the most recent start to the oldest.
  studies: Study[];
  studyList: CollectionEntry<"lists">["data"];
  // The roles, from the most recent start to the oldest.
  roles: Role[];
  // The research items, in the order of the `order` field.
  research: ResearchItem[];
}

// The project marks: the SVG source of each file, by path.
const MARKS = new Map(
  Object.entries(
    import.meta.glob<string>("../content/projects/*/mark.svg", {
      query: "?raw",
      import: "default",
      eager: true,
    }),
  ),
);

function withId<T>({ id, data }: { id: string; data: T }): T & { id: string } {
  return { ...data, id };
}

function byId<T extends { id: string }>(files: T[]): Map<string, T> {
  return new Map(files.map((file) => [file.id, file]));
}

// The folders that have a language file (<folder>/<language>.md) and lack the
// file with what holds for both languages.
function foldersWithoutSharedFile(languageFiles: Map<string, unknown>, ids: string[]): string[] {
  const folders = new Set([...languageFiles.keys()].map((id) => id.slice(0, id.lastIndexOf("/"))));
  for (const id of ids) folders.delete(id);
  return [...folders];
}

async function load(): Promise<Content> {
  // Each error names the file and the problem. The build stops with all of
  // them together.
  const errors: string[] = [];

  const pages = byId(await getCollection("pages"));
  for (const language of LANGUAGES) {
    if (!pages.has(language)) {
      errors.push(`pages/${language}.yaml: the fixed pages are missing in this language`);
    }
  }

  const textVersions = byId(await getCollection("textVersions"));
  const texts = (await getCollection("texts")).map(({ id, data }): Text => {
    const versions: Text["versions"] = {};
    for (const language of LANGUAGES) {
      const file = textVersions.get(`${id}/${language}`);
      if (!file) continue;
      versions[language] = { ...file.data, file };

      const isTranslation = language !== data.originalLanguage;
      if (isTranslation && file.data.translatedWithAI === undefined) {
        errors.push(
          `texts/${id}/${language}.md: translatedWithAI is missing, and every translation has it`,
        );
      }
      if (!isTranslation && file.data.translatedWithAI !== undefined) {
        errors.push(`texts/${id}/${language}.md: translatedWithAI only applies to a translation`);
      }
    }
    if (!versions[data.originalLanguage]) {
      errors.push(
        `texts/${id}: ${data.originalLanguage}.md, the version in the original language, is missing`,
      );
    }
    return { ...data, id, versions };
  });
  const textIds = texts.map(({ id }) => id);

  for (const folder of foldersWithoutSharedFile(textVersions, textIds)) {
    errors.push(`texts/${folder}: text.yaml is missing`);
  }

  for (const language of LANGUAGES) {
    const owners = new Map<string, string>();
    for (const { id, versions } of texts) {
      const slug = versions[language]?.slug;
      if (slug === undefined) continue;
      const owner = owners.get(slug);
      if (owner !== undefined) {
        errors.push(
          `texts/${id}/${language}.md: the slug "${slug}" already belongs to texts/${owner}`,
        );
      }
      owners.set(slug, id);
    }
  }

  const projectStories = byId(await getCollection("projectStories"));
  const projects: Project[] = [];
  const projectIds: string[] = [];
  for (const { id, data } of await getCollection("projects")) {
    projectIds.push(id);
    const mark = MARKS.get(`../content/projects/${id}/mark.svg`);
    if (mark === undefined) {
      errors.push(`projects/${id}: mark.svg, the project mark, is missing`);
    }
    const stories: Partial<Project["stories"]> = {};
    for (const language of LANGUAGES) {
      const file = projectStories.get(`${id}/${language}`);
      if (file) stories[language] = { ...file.data, file };
      else errors.push(`projects/${id}: the project is missing in a language, no ${language}.md`);
    }
    if (mark !== undefined && stories.en && stories["pt-br"]) {
      projects.push({ ...data, id, mark, stories: { en: stories.en, "pt-br": stories["pt-br"] } });
    }
  }

  for (const folder of foldersWithoutSharedFile(projectStories, projectIds)) {
    errors.push(`projects/${folder}: project.yaml is missing`);
  }

  const studies = (await getCollection("studies")).map(withId);
  const research = (await getCollection("research")).map(withId);
  const studyList = (await getCollection("lists")).at(0)?.data;
  if (!studyList) errors.push("lists/studies.yaml: the file is missing");

  // The links: each one points to a file that has to exist.
  const studyIds = new Set(studies.map(({ id }) => id));
  const researchIds = new Set(research.map(({ id }) => id));
  for (const { id, study } of texts) {
    if (study !== undefined && !studyIds.has(study)) {
      errors.push(`texts/${id}/text.yaml: the study "${study}" does not exist`);
    }
  }
  for (const { id, links } of studies) {
    const file = `studies/${id}.yaml`;
    for (const text of links.texts) {
      if (!textIds.includes(text)) errors.push(`${file}: the text "${text}" does not exist`);
    }
    if (links.project !== undefined && !projectIds.includes(links.project)) {
      errors.push(`${file}: the project "${links.project}" does not exist`);
    }
    for (const item of links.research) {
      if (!researchIds.has(item)) {
        errors.push(`${file}: the research item "${item}" does not exist`);
      }
    }
  }

  if (errors.length > 0 || !studyList) {
    throw new Error(`The content has errors:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }

  // A draft is shown only in the dev server, and the links that point to it
  // go away with it.
  const publishedTexts = texts
    .filter(({ draft }) => !draft || import.meta.env.SHOW_DRAFTS)
    .sort((a, b) => b.publishedOn.getTime() - a.publishedOn.getTime());

  return {
    pages: Object.fromEntries(
      LANGUAGES.map((language) => [language, pages.get(language)?.data]),
    ) as Content["pages"],
    texts: publishedTexts,
    projects: projects.sort((a, b) => a.order - b.order),
    studies: studies
      .map((study) => ({
        ...study,
        links: {
          ...study.links,
          texts: publishedTexts
            .filter((text) => text.study === study.id || study.links.texts.includes(text.id))
            .map(({ id }) => id),
        },
      }))
      .sort((a, b) => b.start.localeCompare(a.start)),
    studyList,
    roles: (await getCollection("roles"))
      .map(withId)
      .sort((a, b) => b.start.localeCompare(a.start)),
    research: research.sort((a, b) => a.order - b.order),
  };
}

let loaded: Promise<Content> | undefined;

// During a build, the content is read and checked only once. In the dev
// server, it is read on every request, to show the file that was just saved.
export function content(): Promise<Content> {
  if (import.meta.env.DEV) return load();
  return (loaded ??= load());
}

export async function phrasesOf(language: Language): Promise<Phrases> {
  return (await content()).pages[language];
}
