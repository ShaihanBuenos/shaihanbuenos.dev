// The e-mail of the contact: where a page sends who wants to ask for something.
export const EMAIL = { name: "hi@shaihanbuenos.dev", href: "mailto:hi@shaihanbuenos.dev" } as const;

// The contact channels (section 7.6 of the spec), the same in both languages.
export const CONTACT = [
  { name: "LinkedIn", href: "https://www.linkedin.com/in/shaihanbuenos/" },
  { name: "GitHub", href: "https://github.com/ShaihanBuenos" },
  EMAIL,
] as const;
