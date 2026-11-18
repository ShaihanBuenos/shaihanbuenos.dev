---
whatItIs: "A product I am building, not launched yet: a PWA for daily records, designed to work offline."
description: "The story of Betô, a product that is not launched yet: writes that never repeat, passwordless login of its own and the method of writing code with AI agents, measured."
---

## Engineering decisions

### A record that arrives twice is stored once

**The problem.** An app that works offline resends whatever it is not sure has arrived. The same record can reach the server twice, even at the same instant.

**The choice.** Each record carries an identifier generated on the device, and the database has a unique key made of the author and that identifier. The write is an `INSERT … ON CONFLICT DO NOTHING RETURNING`, followed by a `SELECT` when the record was already there. A test sends two batches at the same time and checks that a single record was stored.

**What was ruled out.** Doing it all in one statement, with a CTE: under concurrency, it can come back empty.

![[Example] A diagram goes here: the same record reaches the server twice and is stored once.](./image-to-come.svg "[Example] Diagram to come: two sends of the same record, one write.")

### Nothing is deleted: undoing writes a void

**The problem.** Undoing a record is one more operation that can be done offline and resent. It has to travel the same path as the records.

**The choice.** The server never deletes a record. Undoing writes a void, and the send queue gained a void operation. The batch answers with a status for each item.

**What was ruled out.** Removing the row with a `DELETE`.

### Passwordless login of its own, in place of an authentication service

**The problem.** The app needs login without a password, and the first decision was to use a managed authentication service.

**The choice.** Its own login with a Google account, through OIDC with PKCE, and a session kept on the server, in Postgres, on the same origin as the app, with CSRF protection. No JWT reaches the browser. The login is tested end to end against a stand-in for Google, written for the tests. Login by a link sent by e-mail is planned, not built yet.

**What was ruled out.** Amazon Cognito, chosen in an earlier decision. The new decision supersedes the old one and records why.

### The build stops what breaks the architecture

**The problem.** Agents write the code. A boundary between modules that exists only in a document ends up crossed without anyone seeing it.

**The choice.** The boundaries are checked by the build, on both sides: on the backend, with Spring Modulith; on the frontend, with an ESLint rule that has tests of its own. The OpenAPI contract only accepts additive changes, and a check stops the contract and the code from drifting apart.

**What was ruled out.** Leaving the boundaries to the documentation and to review.

## How it was built

The code was written by AI agents, with Claude Code, under the specification and the review I defined.

The method has four rules. The specification comes first. The tests are derived from the specification. Whoever verifies is not whoever implemented. And each change goes through two independent AI reviewers that never see each other's findings.

The backend is Java with Spring Boot and PostgreSQL; the frontend, React with TypeScript. The backend tests run against a real Postgres, with Testcontainers, and faults injected on purpose show that they catch regressions.

I measured the method. The first measurement showed that, out of 19 PRs, 7 were process work and only 3 shipped product. A comparison between two ways of reviewing found two defects the old flow had let through. After that, I started removing two tools from the process. The bad result stays here too: by my own measure, the lines of process per line of code did not fall, 1.81 against 1.20.

Today Betô runs only on my own machine: the login, one sign-up and the first kind of record, with undo. The offline queue and the installation as a PWA are planned.
