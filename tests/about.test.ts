// Tests of the About page (section 7.6 of the spec). They look at the built
// page: the one in dist/, with the content of the repo, and the one of a copy
// of the site with some content files changed.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, test } from "node:test";
import { build } from "./support/copy.ts";
import { element, elements, hrefsOf, textOf } from "./support/html.ts";
import { PAGES } from "./support/phrases.ts";
import {
  AGEING,
  CLINICAL_CLAIM,
  PLACEHOLDER,
  forbiddenWordsIn,
  numbersBesidesPercentages,
  patientsNotSimulated,
  sentencesOf,
} from "./support/rules.ts";

const root = new URL("..", import.meta.url).pathname;

// The file of the About page of each language in a build.
const ABOUT = { en: "about.html", pt: "pt-br/sobre.html" };

// The <main> of the About page with the content of the repo, as `npm test`
// has just built it.
async function examplePage(language: keyof typeof ABOUT): Promise<string> {
  return element(await readFile(`${root}dist/${ABOUT[language]}`, "utf8"), "main");
}

// What opens the page, before its sections: the bio and the avatar.
function openingOf(page: string): string {
  return page.split(/<section\b/)[0] ?? "";
}

// The parts of the page, in the order they appear: the bio, which has no
// title, and then the title of each section.
function partsOf(page: string) {
  return {
    title: textOf(element(page, "h1")),
    bio: elements(openingOf(page), "p").map(textOf),
    sections: elements(page, "section").map((section) => textOf(element(section, "h2"))),
  };
}

// Section 7.6 of the spec: the bio, the experience, the education and the
// contact, in this order. The bio is one paragraph.
test("About shows, in both languages, the bio, the experience, the education and the contact, in this order", async () => {
  const inEnglish = partsOf(await examplePage("en"));
  assert.equal(inEnglish.title, "About");
  assert.equal(inEnglish.bio.length, 1);
  assert.deepEqual(inEnglish.sections, ["Experience", "Education", "Contact"]);

  const inPortuguese = partsOf(await examplePage("pt"));
  assert.equal(inPortuguese.title, "Sobre");
  assert.equal(inPortuguese.bio.length, 1);
  assert.deepEqual(inPortuguese.sections, ["Experiência", "Formação", "Contato"]);
});

// The bio of the page of a language.
async function bioOf(language: keyof typeof ABOUT): Promise<string> {
  return partsOf(await examplePage(language)).bio.join(" ");
}

// Section 7.6 of the spec: a paragraph of three or four sentences, in the
// first person. The wording is the owner's: the test reads only its shape.
test("the bio is written, in both languages: three or four sentences, in the first person", async () => {
  const firstPerson = {
    en: /\b(I|I'm|my|me)\b/,
    pt: /(^|\s)(eu|sou|meu|minha|me|trabalho|construo|estudo|escrevo)\b/i,
  };
  for (const language of ["en", "pt"] as const) {
    const bio = await bioOf(language);
    assert.doesNotMatch(bio, PLACEHOLDER, language);
    const sentences = sentencesOf(bio);
    assert.ok(
      sentences.length === 3 || sentences.length === 4,
      `${language}: the bio has ${sentences.length} sentences`,
    );
    assert.match(bio, firstPerson[language], language);
  }
});

// Section 11 of the spec: nothing that ages, the patients of the research
// always "simulated", no claim that the system diagnoses or treats, and no
// name that stays out of the site.
test("the bio follows the content rules: no number, nothing that ages, no forbidden mention", async () => {
  for (const language of ["en", "pt"] as const) {
    const bio = await bioOf(language);
    assert.doesNotMatch(bio, /\d/, language);
    assert.doesNotMatch(bio, AGEING, language);
    assert.doesNotMatch(bio, CLINICAL_CLAIM, language);
    assert.deepEqual(patientsNotSimulated(bio), [], language);
    assert.deepEqual(forbiddenWordsIn(bio), [], language);
  }
});

// The avatar: what the <img> of the bio says in the HTML.
function avatarOf(page: string) {
  const [image = ""] = openingOf(page).match(/<img\b[^>]*>/) ?? [];
  const attribute = (name: string) => image.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
  return {
    alt: attribute("alt"),
    width: attribute("width"),
    height: attribute("height"),
    src: attribute("src") ?? "",
  };
}

// Section 7.6 of the spec: the bio sits next to the pixel art avatar. The
// avatar is the file src/assets/avatar.png, of 288 by 288 pixels, served by
// the site itself.
test("the bio has the avatar next to it, with alternative text, width and height, served from a file of the repo", async () => {
  const alts = {
    en: "Pixel art avatar of Shaihan Buenos",
    pt: "Avatar de Shaihan Buenos em pixel art",
  };
  const file = await readFile(`${root}src/assets/avatar.png`);
  for (const language of ["en", "pt"] as const) {
    const { src, ...avatar } = avatarOf(await examplePage(language));
    assert.deepEqual(avatar, { alt: alts[language], width: "288", height: "288" }, language);
    assert.match(src, /^\/(?!\/)/, language);
    assert.deepEqual(await readFile(`${root}dist${src}`), file, language);
  }
});

// A period, as a visitor reads it, and the months it marks.
function periodOf(caption: string) {
  return {
    period: textOf(caption),
    months: [...caption.matchAll(/<time datetime="([^"]*)"/g)].map(([, month]) => month),
  };
}

// The timeline of the experience: the companies, in the order they appear,
// each with its name, its whole period and its roles. A role shows the
// title, with the `lang` it is marked with, the period, the line of context
// and the achievements.
function timelineOf(page: string) {
  return elements(element(page, "section", "experience"), "article").map((company) => {
    const [header = "", ...roles] = company.split(/(?=<h4\b)/);
    return {
      name: textOf(element(header, "h3")),
      ...periodOf(element(header, "p")),
      roles: roles.map((role) => {
        const title = element(role, "h4");
        const [period = "", context = ""] = elements(role, "p");
        return {
          title: textOf(title),
          lang: title.match(/^<h4\b[^>]*\blang="([^"]*)"/)?.[1] ?? null,
          ...periodOf(period),
          context: textOf(context),
          achievements: elements(element(role, "ul"), "li").map(textOf),
        };
      }),
    };
  });
}

// Section 7.6 of the spec: a timeline by company, from the most recent to
// the oldest. The company shows the name and the whole period; each role
// shows the title, in English in both languages, and its period. The
// companies, the titles and the months are the ones the spec gives.
const TIMELINE = {
  en: [
    {
      name: "ADP Labs",
      period: "Dec 2022 – Present",
      months: ["2022-12"],
      roles: [
        {
          title: "Software Engineer II",
          lang: null,
          period: "Dec 2022 – Present",
          months: ["2022-12"],
        },
      ],
    },
    {
      name: "Dell Technologies",
      period: "Sep 2020 – Dec 2022",
      months: ["2020-09", "2022-12"],
      roles: [
        {
          title: "Software Engineer I",
          lang: null,
          period: "Jul 2021 – Dec 2022",
          months: ["2021-07", "2022-12"],
        },
        {
          title: "Software Engineer Intern",
          lang: null,
          period: "Sep 2020 – Jul 2021",
          months: ["2020-09", "2021-07"],
        },
      ],
    },
  ],
  pt: [
    {
      name: "ADP Labs",
      period: "dez. de 2022 – hoje",
      months: ["2022-12"],
      roles: [
        {
          title: "Software Engineer II",
          lang: "en",
          period: "dez. de 2022 – hoje",
          months: ["2022-12"],
        },
      ],
    },
    {
      name: "Dell Technologies",
      period: "set. de 2020 – dez. de 2022",
      months: ["2020-09", "2022-12"],
      roles: [
        {
          title: "Software Engineer I",
          lang: "en",
          period: "jul. de 2021 – dez. de 2022",
          months: ["2021-07", "2022-12"],
        },
        {
          title: "Software Engineer Intern",
          lang: "en",
          period: "set. de 2020 – jul. de 2021",
          months: ["2020-09", "2021-07"],
        },
      ],
    },
  ],
};

for (const language of ["en", "pt"] as const) {
  test(`the experience (${language}) is a timeline by company, each role with its title in English and its period`, async () => {
    const timeline = timelineOf(await examplePage(language)).map((company) => ({
      ...company,
      roles: company.roles.map(({ title, lang, period, months }) => ({
        title,
        lang,
        period,
        months,
      })),
    }));
    assert.deepEqual(timeline, TIMELINE[language]);
  });
}

// The roles of the page of a language, from the most recent to the oldest.
async function rolesOf(language: keyof typeof ABOUT) {
  return timelineOf(await examplePage(language)).flatMap(({ roles }) => roles);
}

// Section 12 of the spec: nine achievements, each of 120 to 220 characters.
// The internship has a single one. The wording is the owner's: the test
// reads only the shape of each role.
test("each role has one line of context and its achievements, of 120 to 220 characters, in both languages", async () => {
  for (const language of ["en", "pt"] as const) {
    const roles = await rolesOf(language);
    assert.deepEqual(
      roles.map(({ achievements }) => achievements.length),
      [4, 4, 1],
      language,
    );
    for (const { title, context, achievements } of roles) {
      assert.ok(context.length > 0, `${language}: ${title} has no line of context`);
      assert.doesNotMatch(context, PLACEHOLDER, `${language}: ${title}`);
      for (const achievement of achievements) {
        assert.doesNotMatch(achievement, PLACEHOLDER, `${language}: ${title}`);
        assert.ok(
          achievement.length >= 120 && achievement.length <= 220,
          `${language}: ${title} has an achievement of ${achievement.length} characters: ${achievement}`,
        );
      }
    }
  }
});

// Section 11 of the spec: the experience tells what Shaihan did as an
// engineer. A number is only a percentage of quality or of improvement,
// nothing ages, and no name that stays out of the site is there. The agent
// credit belongs to the projects: the experience says nothing about agents.
test("the experience follows the content rules: no number besides percentages, nothing that ages, no forbidden mention", async () => {
  for (const language of ["en", "pt"] as const) {
    for (const { title, context, achievements } of await rolesOf(language)) {
      const text = [context, ...achievements].join(" ");
      assert.deepEqual(numbersBesidesPercentages(text), [], `${language}: ${title}`);
      assert.doesNotMatch(text, AGEING, `${language}: ${title}`);
      assert.doesNotMatch(text, /\bagents?\b|\bagentes?\b/i, `${language}: ${title}`);
      assert.deepEqual(forbiddenWordsIn(text), [], `${language}: ${title}`);
    }
  }
});

// Section 7.6 of the spec gives the line of the education.
test("the education is one line", async () => {
  const lines = {
    en: "Bachelor's degree in Information Systems, UNISINOS, completed in 2025",
    pt: "Bacharelado em Sistemas de Informação, UNISINOS, concluído em 2025",
  };
  for (const language of ["en", "pt"] as const) {
    const education = element(await examplePage(language), "section", "education");
    assert.deepEqual(elements(education, "p").map(textOf), [lines[language]], language);
  }
});

// The contact channels, from section 7.6 of the spec, with the addresses of
// section 13.
const CHANNELS = [
  { text: "LinkedIn", href: "https://www.linkedin.com/in/shaihanbuenos/" },
  { text: "GitHub", href: "https://github.com/ShaihanBuenos" },
  { text: "hi@shaihanbuenos.dev", href: "mailto:hi@shaihanbuenos.dev" },
];

test("the contact shows LinkedIn, GitHub and the e-mail of the site, and no other link leaves the site", async () => {
  for (const language of ["en", "pt"] as const) {
    const page = await examplePage(language);
    const contact = element(page, "section", "contact");
    assert.deepEqual(
      elements(contact, "a").map((link) => ({ text: textOf(link), href: hrefsOf(link).join(" ") })),
      CHANNELS,
      language,
    );
    assert.deepEqual(
      hrefsOf(page).filter((href) => !href.startsWith("/")),
      CHANNELS.map(({ href }) => href),
      language,
    );
  }
});

// Section 7.6 of the spec: no logo, no table of skills, no résumé in PDF, no
// phone and no personal e-mail. The avatar is the only image of the page.
test("About has no logo, no table, no phone, no personal e-mail and no link to a PDF", async () => {
  for (const language of ["en", "pt"] as const) {
    const page = await examplePage(language);
    assert.equal(page.match(/<(img|svg|picture|object)\b/g)?.length, 1, language);
    assert.doesNotMatch(element(page, "section", "experience"), /<(img|svg|picture|object)\b/);
    assert.doesNotMatch(page, /<table\b|skills/i, language);
    assert.doesNotMatch(page, /pdf/i, language);
    assert.doesNotMatch(page, /tel:|\+?\d[\d\s().-]{7,}\d/, language);
    assert.deepEqual(
      [...new Set(page.match(/[\w.+-]+@[\w.-]+/g))],
      ["hi@shaihanbuenos.dev"],
      language,
    );
  }
});

// A role file: the title, the months and the achievements are given by each
// test, and the line of context is made from the title.
function roleFile(company: string, title: string, months: string, achievements: string[]): string {
  return [
    `company: ${company}`,
    `title: ${title}`,
    months,
    `context:\n  en: Context of ${title}.\n  pt-br: Contexto de ${title}.`,
    "achievements:",
    ...achievements.map((name) => `  - en: ${name}.\n    pt-br: ${name} em português.`),
    "",
  ].join("\n");
}

describe("the experience comes from the content", { concurrency: true }, () => {
  // A copy of the site with test phrases in English, the current role with
  // every field changed, the two previous roles deleted and two more roles,
  // both ended, at another company. The names of the files are not in the
  // order of the months.
  const changed = build({
    remove: ["roles/dell-software-engineer-i.yaml", "roles/dell-software-engineer-intern.yaml"],
    write: {
      "pages/en.yaml": PAGES,
      "roles/adp-labs-software-engineer-ii.yaml": roleFile(
        "Newest Test Company",
        "Staff Test Engineer",
        "start: 2025-05",
        ["Third written first", "First written second", "Second written third"],
      ),
      "roles/a-earlier-role.yaml": roleFile(
        "Older Test Company",
        "Test Engineer I",
        "start: 2021-08\nend: 2023-02",
        ["Earlier achievement"],
      ),
      "roles/z-later-role.yaml": roleFile(
        "Older Test Company",
        "Test Engineer II",
        "start: 2023-02\nend: 2025-04",
        ["Later achievement"],
      ),
    },
  });

  async function changedPage(language: keyof typeof ABOUT): Promise<string> {
    return element(await (await changed).read(ABOUT[language]), "main");
  }

  test("changing the fields of a role file changes its role on the page", async () => {
    const [company] = timelineOf(await changedPage("pt"));
    assert.deepEqual(company, {
      name: "Newest Test Company",
      period: "mai. de 2025 – hoje",
      months: ["2025-05"],
      roles: [
        {
          title: "Staff Test Engineer",
          lang: "en",
          period: "mai. de 2025 – hoje",
          months: ["2025-05"],
          context: "Contexto de Staff Test Engineer.",
          achievements: [
            "Third written first em português.",
            "First written second em português.",
            "Second written third em português.",
          ],
        },
      ],
    });
  });

  // Section 7.6 of the spec: from the most recent company to the oldest. The
  // company shows its whole period: from the start of its oldest role to the
  // end of its newest one.
  test("two roles at the same company sit under one name, from the most recent to the oldest, with the whole period of the company", async () => {
    const timeline = timelineOf(await changedPage("pt"));
    assert.deepEqual(
      timeline.map(({ name }) => name),
      ["Newest Test Company", "Older Test Company"],
    );
    const older = timeline.at(1);
    assert.deepEqual(
      { period: older?.period, months: older?.months },
      { period: "ago. de 2021 – abr. de 2025", months: ["2021-08", "2025-04"] },
    );
    assert.deepEqual(
      older?.roles.map(({ title, period, months }) => ({ title, period, months })),
      [
        {
          title: "Test Engineer II",
          period: "fev. de 2023 – abr. de 2025",
          months: ["2023-02", "2025-04"],
        },
        {
          title: "Test Engineer I",
          period: "ago. de 2021 – fev. de 2023",
          months: ["2021-08", "2023-02"],
        },
      ],
    );
  });

  test("the months are written in the language of the page", async () => {
    const periods = (await changedPage("en")).match(/<time\b[^>]*>[^<]*<\/time>/g)?.map(textOf);
    assert.deepEqual(periods, [
      "May 2025",
      "May 2025",
      "Aug 2021",
      "Apr 2025",
      "Feb 2023",
      "Apr 2025",
      "Aug 2021",
      "Feb 2023",
    ]);
  });

  test("deleting a role file takes its role away", async () => {
    for (const language of ["en", "pt"] as const) {
      const page = await changedPage(language);
      assert.deepEqual(
        timelineOf(page).flatMap(({ roles }) => roles.map(({ title }) => title)),
        ["Staff Test Engineer", "Test Engineer II", "Test Engineer I"],
        language,
      );
      assert.doesNotMatch(page, /Dell Technologies|Software Engineer/, language);
    }
  });

  test("the bio, the titles of the sections, “Present”, the education and the alternative text of the avatar come from the phrases file", async () => {
    const page = await changedPage("en");
    assert.deepEqual(partsOf(page), {
      title: "About",
      bio: ["Test bio."],
      sections: ["Test experience caption", "Test education link", "Test contact"],
    });
    assert.equal(avatarOf(page).alt, "Test avatar");
    assert.deepEqual(
      timelineOf(page)
        .at(0)
        ?.roles.map(({ period }) => period),
      ["May 2025 – test present"],
    );
    assert.equal(timelineOf(page).at(0)?.period, "May 2025 – test present");
    assert.deepEqual(elements(element(page, "section", "education"), "p").map(textOf), [
      "Test education.",
    ]);
  });
});
