---
whatItIs: "A personal finance app that runs only on my own machine: it reads card statements, bank statements and payslips with AI and shows where the money goes."
description: "The story of Out of the Rabbit Hole: a personal finance app that reads documents with AI, and the engineering decisions behind it."
---

## Engineering decisions

### The database is the source of truth, even when edited from outside

**The problem.** The data can change outside the app: a fix made by hand in the database, for example. If the app trusts the copy it holds in memory, its next write runs over that change.

**The choice.** Postgres is the source of truth. A trigger bumps a revision number on every write, wherever it comes from. Each change the app makes runs in a single transaction: it locks the revision, reloads the data if its copy is stale, writes only the rows that changed and retries on a deadlock. The tests cover edits made outside the app.

**What was ruled out.** The first design planned for MongoDB, and this one replaced it. With Postgres, the revision, the transactions and the constraints live in the database itself, not in the app's code.

### The database constraints come from the types in the code

**The problem.** The values a field accepts are written in two places: the TypeScript types and the database constraints. When a new value lands in only one of them, the error shows up late, as a rejected write.

**The choice.** The `CHECK` constraints of the database are generated from the TypeScript union types. A helper, checked at compile time, makes the build fail if any member of a union is missing.

**What was ruled out.** Writing the constraints by hand in SQL and counting on review to keep the two lists the same.

### The AI proposes, and I accept

**The problem.** A model that reads a statement can get a value wrong, and an error written straight to the database changes every number that depends on it.

**The choice.** The reading leaves the model as structured output, in a fixed schema, and no change the AI proposes is applied until I accept it. Once I do, the app shows which numbers moved. Every number is recomputed from the documents and a ledger of corrections, in time order. The model sits behind an interface, and the tests use a simulated model and an in-memory Postgres. That simulated model is what the AI reading was verified with: reading a real document, with an API key, has not been tested yet.

**What was ruled out.** Letting the model write what it read straight to the database.

![[Example] A capture of the demo goes here, with made-up data: a change proposed by the AI, waiting to be accepted.](./image-to-come.svg "[Example] Capture to come: a change proposed by the AI, waiting to be accepted. Made-up data.")

## How it was built

The code was written by AI agents, under the specification and the review I defined.

My part was to decide what to build, approve the design document, define how each part would be verified and decide the architecture. The agents chose the defaults I left open and logged each decision.

The app is written in TypeScript, with React, Express and Postgres, and uses the Anthropic SDK to talk to the model. The tests cover the API routes, the database constraints, the edits made outside the app and every screen, on desktop and on phone. A demo runs with made-up data and without an API key.

![[Example] A capture of the demo goes here, with made-up data: the screen that shows where the money goes.](./image-to-come.svg "[Example] Capture to come: the spending screen of the demo. Made-up data.")
