// The content collections (section 6 of the spec): where the files of each
// one live and which fields they have. The fields are in src/lib/schemas.ts.
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import {
  pagesSchema,
  projectSchema,
  projectStorySchema,
  researchItemSchema,
  roleSchema,
  studyListSchema,
  studySchema,
  textSchema,
  textVersionSchema,
} from "./lib/schemas.ts";

// The id of a short item is the name of its file, without the extension.
function filesOf(folder: string) {
  return glob({ base: `./src/content/${folder}`, pattern: "*.yaml" });
}

// A text or a project is a folder: one file with what holds for both
// languages, and one file per language. The id of the shared file is the
// name of the folder, and the id of each language file is
// "<folder>/<language>".
function sharedFilesOf(folder: string, fileName: string) {
  return glob({
    base: `./src/content/${folder}`,
    pattern: `*/${fileName}`,
    generateId: ({ entry }) => entry.slice(0, entry.lastIndexOf("/")),
  });
}

function languageFilesOf(folder: string) {
  return glob({
    base: `./src/content/${folder}`,
    pattern: "*/{en,pt-br}.md",
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  });
}

export const collections = {
  pages: defineCollection({ loader: filesOf("pages"), schema: pagesSchema }),
  texts: defineCollection({ loader: sharedFilesOf("texts", "text.yaml"), schema: textSchema }),
  textVersions: defineCollection({ loader: languageFilesOf("texts"), schema: textVersionSchema }),
  projects: defineCollection({
    loader: sharedFilesOf("projects", "project.yaml"),
    schema: projectSchema,
  }),
  projectStories: defineCollection({
    loader: languageFilesOf("projects"),
    schema: projectStorySchema,
  }),
  studies: defineCollection({ loader: filesOf("studies"), schema: studySchema }),
  lists: defineCollection({
    loader: glob({ base: "./src/content/lists", pattern: "studies.yaml" }),
    schema: studyListSchema,
  }),
  roles: defineCollection({ loader: filesOf("roles"), schema: roleSchema }),
  research: defineCollection({ loader: filesOf("research"), schema: researchItemSchema }),
};
