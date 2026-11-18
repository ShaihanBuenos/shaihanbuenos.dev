---
whatItIs: "A local app for my own guitar practice: a tab player that changes the amp tone for each section of a song, with a tone advisor built with an LLM. It is in planning, with no app code yet."
description: "The story of Ensaio, an app in planning for my own guitar practice: the research in primary sources, the hardware test plan and the design of the AI part."
---

## Engineering decisions

### The tone advisor only proposes what the device has

**The problem.** An LLM that suggests a tone can make up an effect block the device does not have, or a value out of range.

**The choice.** By the specification, the model's proposal is a JSON in which every block name has to come from the device's catalog. The number ranges will be checked in code, and the model tries again when a value falls out of range. The AI will only write proposals, never the final version. None of this is built yet.

**What was ruled out.** LangChain and a vector database. By the design, the reference data fits in the prompt, with caching, and the practice log will be searched through tool calls.

### Measuring with the device before choosing the stack

**The problem.** The app depends on changing the tone on the device, over USB, in the middle of a song. Before choosing the stack, I need to know how long that change takes and whether it cuts the sound.

**The choice.** A throwaway test prototype: a step-by-step protocol to run with the real device, a logger that notices when the USB is plugged and unplugged, and scripts that measure the latency and the gap of silence when the tone changes. A simulated device makes it possible to work without the hardware, and the analysis code was checked against synthetic signals. The test with the real device has not been run yet.

**What was ruled out.** Choosing the stack before measuring. The decision between Electron, Tauri and a local web app is still open.

### Design errors caught in the browser's source code

**The problem.** The design counted on an audio buffer smaller than 128 samples, and one screen showed a latency bar for the app's audio "engine".

**The choice.** Reading the source code of Chromium. It showed that Chrome on the Mac does not use a buffer smaller than 128 samples, and that the "engine" bar was, in fact, Chrome's own buffer. Both fixes went into the specification. The research tags each fact as documented, user report or still to be tested.

**What was ruled out.** Trusting the numbers in the design without going to the source.

## How it was built

There is no app code yet: the specification, the research and the test prototype were written by AI agents, with Claude Code, under my direction and my review.

My part is to decide what to build, approve the specification and define what each test has to prove. The planning starts with research in primary sources, and what the research finds goes back into the specification before any code.

The first stage has no AI: the tone advisor arrives in the second. The stack hypothesis uses alphaTab to play the tabs, Web MIDI to talk to the device and SQLite for the practice log.
