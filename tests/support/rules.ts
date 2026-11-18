// The content rules of section 11 of the spec that a machine can check in
// what a visitor reads on a built page.
import { createHash } from "node:crypto";

// The mark of the example content: a phrase that is still to be written.
export const PLACEHOLDER = /\[(Example|Exemplo)\]/;

// What ages on its own: years of experience and "full stack".
export const AGEING = /full[\s-]?stack|years of experience|anos de experiência/i;

// What no text about the research says: that the system diagnoses or treats.
export const CLINICAL_CLAIM = /\bdiagnos|\btreat(s|ed|ing|ment)?\b|\btrata(r|m|mento)?\b/i;

// The words that may not appear. The repo is public, and the list itself
// would say them, so each word is kept as the start of its SHA-256, in
// lowercase and without accents. The list in plain text lives outside git,
// with the local notes of the owner. To add a word:
//   node -e 'console.log(require("crypto").createHash("sha256").update(process.argv[1]).digest("hex").slice(0,16))' word
const FORBIDDEN = {
  // On every page: names from the jobs and from the education that stay out.
  everywhere: [
    "8cfac65dd49a3192",
    "6efd03c45b422b10",
    "6e00cd562cc2d88e",
    "8080fee1a894f940",
    "c605f2b4daa48df1",
    "c4bc9f13fc13297c",
    "2dc010636b9dce91",
    "3c274c1dd454eea1",
    "b11f203e8e6ce90d",
    "4737a15e2c762fa0",
    "ee139bd0fd941847",
    "e0ed2678d4a00b83",
  ],
  // On the story of Betô: the words of the product, which is not described.
  beto: [
    "bbba57318f719113",
    "3be1d422a46085e1",
    "5f9276129b845b99",
    "781a214bbdbeff92",
    "506f84b59e800386",
    "95e833ef891c0276",
    "fae5479753d378a7",
    "52a469e4d8e95cc9",
    "f709c3c476ec3e68",
    "cd6357efdd966de8",
    "23bcd2d83d4c0f27",
    "77af778b51abd4a3",
    "d936608baaacc6b7",
    "14d002066c4c378e",
    "e8ecc2be07024e43",
    "d4e8973e04e657a4",
    "7051fd3b01733aed",
    "ab91a82d14cfc612",
    "2d0cd22c1a2ec2ad",
    "ee9c1331c074457b",
    "038740ef981ab56f",
    "55867341416422aa",
    "dde6e8974b46a1ed",
    "124f08e2ce881b97",
    "3fbf0de21a976c03",
    "1304a72b829ecaaa",
    "7a6c4fac6c5cd720",
    "5f1da0912e175651",
    "0f4168490e38b844",
    "b4eeaba064fa12cf",
    "aec6c3d03f013562",
    "4f682b71153ffa91",
    "b04cb09fabfe6b51",
    "a9c5e061b86713d9",
    "ec8202b6f9fb16f9",
    "f44e64e75f3948e9",
  ],
  // On the story of Out of the Rabbit Hole: what the story leaves out.
  "rabbit-hole": [
    "d543d4d01e3cb2b0",
    "f1cb9ac330164b33",
    "652d75f9bafb25e5",
    "dc79aa1e1052f781",
    "7dc1f976675a8015",
    "b66533e3e0c928d0",
    "c58094d7d232d7d3",
    "577aeee7d0d03b5a",
    "e65bb10d3e58b38a",
    "1c6c95d531d28b1f",
    "472bbf14923e2e7c",
    "be9aa7494d82bfe5",
  ],
  // On the story of Ensaio: what the story leaves out.
  ensaio: [
    "2b78da3dc866654e",
    "24e6654bfd1ab85b",
    "5d5fc02f21b428d6",
    "a6c70cf4d6fbc067",
    "f7a5936c485e5b92",
    "1ee11af4ed5d63ca",
    "fce466b97aea7edc",
    "77909277a1ffc4b0",
    "e03d2c41ef2fff7e",
    "17c1532ca6cff8f6",
    "1057a9604e04b274",
    "a4a670183ad8c997",
    "a908043ed469f361",
    "ec5d7aacefdc9cf1",
    "0b595c8494cdf15a",
    "683b531f41ec88a2",
    "fe81f9390ffe3dc8",
  ],
};

// The words of a text, in lowercase and without accents.
function wordsOf(text: string): string[] {
  return (
    text
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .match(/[a-z0-9]+/g) ?? []
  );
}

// The forbidden words a text has: the ones of every page and the ones of the
// given list.
export function forbiddenWordsIn(
  text: string,
  list?: Exclude<keyof typeof FORBIDDEN, "everywhere">,
) {
  const forbidden = new Set([...FORBIDDEN.everywhere, ...(list ? FORBIDDEN[list] : [])]);
  const found = wordsOf(text).filter((word) =>
    forbidden.has(createHash("sha256").update(word).digest("hex").slice(0, 16)),
  );
  return [...new Set(found)];
}

// The sentences of a text. A period inside a number or a name (82.5, .NET)
// does not close a sentence.
export function sentencesOf(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence !== "");
}

// The numbers of a text that are not a percentage: "90%" is left out, and
// "12" or "4.37 million" is not.
export function numbersBesidesPercentages(text: string): string[] {
  return (text.match(/\S*\d\S*/g) ?? []).filter(
    (word) => !/^\(?\d+([.,]\d+)?%[.,;:)]*$/.test(word),
  );
}

// Section 11 of the spec: the patients are always "simulated". The sentences
// that name a patient or a persona without saying so.
export function patientsNotSimulated(text: string): string[] {
  return sentencesOf(text).filter(
    (sentence) => /patient|pacient|persona/i.test(sentence) && !/simulated|simulad/i.test(sentence),
  );
}

// Section 11 of the spec: a result number only shows next to the caveat. The
// sentences with a number that do not say the patients are simulated.
export function numbersWithoutTheCaveat(text: string): string[] {
  return sentencesOf(text).filter(
    (sentence) => /\d/.test(sentence) && !/simulated|simulad/i.test(sentence),
  );
}
