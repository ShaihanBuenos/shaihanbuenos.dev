// The fields of each content collection (section 6 of the spec). The build
// stops when a file does not follow the schema of its collection.
import { z } from "astro/zod";
import { LANGUAGES } from "./languages.ts";

const phrase = z.string().trim().min(1);

export const TEXT_TYPES = ["article", "study-note"] as const;

export const PROJECT_STATES = ["works-locally", "in-development", "in-planning"] as const;

// What every fixed page has: its name on the menu and the page description.
const page = z.strictObject({ name: phrase, description: phrase });

// The topics of a text. The list is fixed and can grow: a new topic goes
// here, with its name in both phrases files.
export const TOPICS = ["backend", "frontend", "architecture", "ai", "career", "academic"] as const;

// The phrases of the fixed pages in one language. Each language has one file
// in this shape, so a page missing from one of them stops the build.
export const pagesSchema = z.strictObject({
  // Phrases of the layout shared by every page.
  common: z.strictObject({ menu: phrase, language: phrase, skip: phrase, feed: phrase }),
  home: page.extend({
    label: phrase,
    intro: phrase,
    // The blocks of the floor plan: the title of each one and, where the
    // caption is not a piece of content, the caption.
    blocks: z.strictObject({
      research: phrase,
      methodCaption: phrase,
      method: phrase,
      experienceCaption: phrase,
      experience: phrase,
    }),
    // The end of the experience while the current role has none: "today".
    today: phrase,
    // The paper callout: one plain sentence, without numbers.
    paper: phrase,
    // Comes before the start month of a study in progress: "since".
    since: phrase,
    // The link that closes each section.
    more: z.strictObject({
      research: phrase,
      projects: phrase,
      writing: phrase,
      studies: phrase,
      about: phrase,
    }),
  }),
  projects: page.extend({
    // The name of each project state.
    states: z.record(z.enum(PROJECT_STATES), phrase),
    // Comes before the "updated on" date of a project story.
    updatedOn: phrase,
    // The title of the section of a project story that leads to the others.
    others: phrase,
  }),
  writing: page.extend({
    // The name of each text type.
    types: z.record(z.enum(TEXT_TYPES), phrase),
    // The name of each topic.
    topics: z.record(z.enum(TOPICS), phrase),
    // The link that closes the page of a text and leads back to the list.
    all: phrase,
    // Comes before the date of the content revision of a text.
    updatedOn: phrase,
    // Comes before the study a text came from.
    study: phrase,
    // The translation note. A translation shown in this language was always
    // written in the other one, so `from` names the other language.
    translationNote: z.strictObject({
      from: phrase,
      // The link to the original.
      original: phrase,
      // The notice of a translation made with AI.
      withAI: phrase,
    }),
  }),
  studies: page,
  research: page,
  about: page.extend({ bio: phrase, education: phrase }),
  // "Not found" only has a name: it is not on the menu nor in search engines.
  notFound: z.strictObject({ name: phrase }),
});

export type Phrases = z.infer<typeof pagesSchema>;

const language = z.enum(LANGUAGES);

// A day, such as 2026-01-15, written without quotes.
const day = z.date({ error: "use a day, such as 2026-01-15" });

// A month, such as 2026-02.
const month = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, { error: "use year and month, such as 2026-02" });

// The last part of a page's address, in words of the page's language.
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
  error: "use only lowercase letters without accents, numbers and hyphens",
});

// A phrase written in both languages, in a single file.
const inBothLanguages = z.strictObject({ en: phrase, "pt-br": phrase });

// What holds for every version of a text: texts/<text>/text.yaml.
export const textSchema = z.strictObject({
  publishedOn: day,
  // Only after a content revision.
  updatedOn: day.optional(),
  type: z.enum(TEXT_TYPES),
  topics: z.array(z.enum(TOPICS)).min(1).max(3),
  originalLanguage: language,
  // The study the text came from: the name of its file in studies/, without
  // the extension.
  study: z.string().optional(),
  draft: z.boolean().default(false),
});

// One version of a text, the original or the translation:
// texts/<text>/<language>.md.
export const textVersionSchema = z.strictObject({
  title: phrase,
  // The one-line summary.
  summary: phrase,
  slug,
  // Only on a translation: whether it was made with AI.
  translatedWithAI: z.boolean().optional(),
});

// What holds for both languages of a project: projects/<project>/project.yaml.
// The project mark is the file mark.svg in the same folder.
export const projectSchema = z.strictObject({
  name: phrase,
  // The position on the list of projects: the lowest number comes first.
  order: z.number(),
  state: z.enum(PROJECT_STATES),
  updatedOn: day,
});

// The project story in one language: projects/<project>/<language>.md. The
// body holds the engineering decisions and "How it was built".
export const projectStorySchema = z.strictObject({
  whatItIs: phrase,
  // The page description.
  description: phrase,
});

export const STUDY_STATUSES = ["in-progress", "completed"] as const;

// A study: studies/<study>.yaml, with both languages inside.
export const studySchema = z
  .strictObject({
    name: inBothLanguages,
    goal: inBothLanguages,
    status: z.enum(STUDY_STATUSES),
    start: month,
    end: month.optional(),
    links: z
      .strictObject({
        // Names of folders in texts/. A text that names this study as the
        // study it came from is already linked, and is not repeated here.
        texts: z.array(z.string()).default([]),
        // Name of a folder in projects/.
        project: z.string().optional(),
        // The address of the certificate.
        certificate: z.url().optional(),
        // Whether the study was part of the education.
        education: z.boolean().default(false),
        // The paper and the thesis: names of files in research/, without the
        // extension.
        research: z.array(z.string()).default([]),
      })
      .prefault({}),
  })
  .refine(({ status, end }) => (status === "completed") === (end !== undefined), {
    path: ["end"],
    error: "a completed study has an end month, and one in progress has none",
  });

// The study list: lists/studies.yaml.
export const studyListSchema = z.strictObject({
  // The month of the last check of the list.
  checkedOn: month,
});

// A role: roles/<role>.yaml. Roles with the same company stay together on
// the timeline.
export const roleSchema = z.strictObject({
  company: phrase,
  // In English in both languages.
  title: phrase,
  start: month,
  // Without an end, the role is the current one.
  end: month.optional(),
  context: inBothLanguages,
  // In the order they appear on the page.
  achievements: z.array(inBothLanguages).min(1),
});

// What the paper and the thesis have in common (section 7.5 of the spec).
const researchItem = z.strictObject({
  // The position on the Research page: the lowest number comes first.
  order: z.number(),
  summary: inBothLanguages,
  // What Shaihan built.
  built: inBothLanguages,
  // The result, with the caveat right next to the number.
  result: inBothLanguages,
});

// A research item: research/<item>.yaml.
export const researchItemSchema = z.discriminatedUnion("type", [
  researchItem.extend({
    type: z.literal("paper"),
    // In the original English.
    title: phrase,
    // Where it came out, such as "HAXD 2026, IEEE".
    venue: phrase,
    // As they appear in the publication. `highlight` marks Shaihan's name.
    authors: z
      .array(z.strictObject({ name: phrase, highlight: z.boolean().default(false) }))
      .min(1),
    doi: z.string().regex(/^10\.\d{4,}\/\S+$/, { error: "use only the DOI, such as 10.1109/..." }),
  }),
  researchItem.extend({
    type: z.literal("thesis"),
    // In Portuguese, and the translation shown in parentheses in English.
    title: phrase,
    translatedTitle: phrase,
    // What it is, with the advisor named.
    whatItIs: inBothLanguages,
  }),
]);
