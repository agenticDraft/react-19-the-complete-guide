# React Interview Quiz — Specification

How the quiz works, how it is built from `REACT-NOTES.md`, and how it is published as a
claude.ai artifact (Part I, §1–13). Part II (§14–21) is the design of the `create-quiz`
plugin, which turns any study-note file into a quiz with this same engine and design
(implementation plan: `plan-quiz-plugin.md` at the repository root).

- **Live (claude.ai, private):** https://claude.ai/artifact/WFe3DUm4K5Ty2YfQjFZ3NJ
- **Local:** `react-quiz/index.html` (open in a browser; no Claude grading)

---

## 1. What it is

A self-study and interview-prep tool. Each entry is a numbered question; the user can:

1. **Answer** — write their own answer, then have Claude grade it (0–10, pass at 7) with
   feedback: what was right, what was missing, what was wrong, and a tip.
2. **more-info** — reveal the reference answer from the notes.
3. **Self-grade** — mark the question *known* or *to review*.

Progress (status, last answer, last grade) is kept per question and survives reloads. On
claude.ai it syncs across devices; locally it lives in the browser.

## 2. Components and responsibilities

| Component | File | Responsibility |
| :- | :- | :- |
| Source notes | `REACT-NOTES.md` | Single source of truth: sections, numbered questions, answers in Markdown |
| Build script | `react-quiz/build.mjs` | Parses and validates the notes, injects them into the template, writes both outputs |
| Page template | `react-quiz/template.html` | All markup, CSS and runtime JS. A page *fragment* (no `<html>`/`<head>`/`<body>`) |
| Local page | `react-quiz/index.html` | Generated. Full HTML document for opening locally. Committed |
| Artifact page | `.claude/artifacts/react-quiz.html` | Generated. The fragment published to claude.ai. Gitignored |
| claude.ai storage | artifact `db`, collection `progress` | Per-question records, readable and writable by the artifact owner only |
| Claude grading | artifact `sample` capability | Grades a written answer on the viewer's own Claude account |

Why the split: the notes stay plain Markdown that renders on GitHub and in VS Code; the build
step is the only place that knows the notes grammar; the template knows nothing about React —
apart from a few copy strings (see §11) — so it can be reused for other topics.

## 3. Source format (`REACT-NOTES.md`)

The build accepts exactly this grammar; anything else is ignored.

```markdown
## Section 01 — React Essentials          ← section heading: "## Section <NN> — <name>"

### 1. What is a React component?          ← question: "### <id>. <question text>"

<details>
<summary>more-info</summary>                ← must be exactly this line

...answer in Markdown (code fences, lists, blockquotes, links)...

</details>                                  ← closes the answer
```

Rules enforced by `validate()` in `build.mjs` (the build fails with a message naming the
question):

- Question ids run 1, 2, 3 … with no gaps, in file order.
- Every question sits under a `## Section …` heading.
- Every question has a non-empty answer closed by `</details>`.

Other headings (such as `## Sections`, the table of contents) are ignored. Cross-links between
questions are written as `[50](#50-where-does-react-store-state-...)`; the page turns any
`#<number>-…` link into a jump to that question.

## 4. Build pipeline

Command (Node 18+; no dependencies):

```bash
node react-quiz/build.mjs
```

Steps, in order:

1. `parseNotes(markdown)` → `Question[]` (line-based state machine: section → question →
   `<summary>more-info</summary>` → answer lines → `</details>`).
2. `validate(questions)` → throws on the first broken rule (§3).
3. `JSON.stringify(questions)` with every `<` replaced by `<`, so a `</script>` inside an
   answer cannot close the inline script.
4. The JSON replaces the token `/*__QUESTIONS__*/[]` in `template.html`. The replacement is a
   **function**, not a string, because answers contain `$` and `String.replace` would treat
   `$&`, `$1` as patterns.
5. Writes two files:
   - `react-quiz/index.html` — the fragment wrapped in `<!doctype html><html><head>` with
     charset and `viewport-fit=cover` metas.
   - `.claude/artifacts/react-quiz.html` — the fragment as-is; claude.ai adds the document
     skeleton at publish time.

Output on success:

```text
Built 52 questions in 9 sections:
  local    …/react-quiz/index.html
  claude.ai …/.claude/artifacts/react-quiz.html
```

## 5. Data model

### Question (build output, embedded in the page)

```ts
type Question = {
  id: number;        // 1-based, matches "### <id>."
  section: string;   // "Section 01 — React Essentials"
  question: string;  // inline Markdown
  answer: string;    // block Markdown
};
```

### Record (one per question the user touched)

```ts
type QuizRecord = {
  status?: "known" | "review";   // absent = not seen
  answer?: string;               // last answer the user saved or had graded
  grade?: Grade;                 // last grade from Claude
  updatedAt: number;             // ms epoch, used to merge browser and claude.ai copies
};

type Grade = {
  score: number;                 // integer 0–10, clamped by the page
  verdict: string;
  correct: string[];             // ≤ 6 items each
  missing: string[];
  wrong: string[];
  tip: string;
  answer: string;                // the exact answer that was graded
  gradedAt: number;
};
```

### Where records live

| Store | Key / path | Scope |
| :- | :- | :- |
| Browser cache | `localStorage["react-quiz-records-v2"]` = `{ [id]: QuizRecord }` | This browser |
| claude.ai | `db` doc `progress/q-<id>` = `QuizRecord` | Artifact owner, all devices |
| Drafts | `localStorage["react-quiz-drafts-v1"]` = `{ [id]: string }` | This browser; unsent answers |
| Preferences | `localStorage["react-quiz-prefs-v2"]` = `{ mode, section, filter, shuffle, lastId }` | This browser |
| Legacy (read once) | `localStorage["react-quiz-progress-v1"]` = `{ [id]: status }` | Migrated into v2 on load |

Every `localStorage` access is wrapped in `try/catch`; the page works with storage blocked.

## 6. Runtime architecture (inside the page)

One inline `<script>`; no framework. Modules are sections of that script:

| Module | Main functions | Responsibility |
| :- | :- | :- |
| State | `state`, `record(id)`, `statusOf(id)` | Single mutable state object; everything renders from it |
| Markdown | `renderInline`, `renderAnswer`, `highlightIn` | marked + highlight.js, answer HTML cached per id |
| Deck | `matchesFilters`, `buildDeck`, `restartDeck` | Which questions the quiz asks and in what order |
| Saving | `saveRecord`, `pushToCloud`, `setCloud` | Browser cache first, then claude.ai; one write per doc at a time |
| Sync | `connectClaude`, `applyCloudSnapshot` | Resolves `db` and `sample`, subscribes to `progress`, merges |
| Grading | `gradingPrompt`, `normalizeGrade`, `submitAnswer` | Calls Claude, validates the reply, stores the grade |
| Rendering | `renderQuiz`, `renderBrowse`, `renderMap`, `renderStats` | HTML from state |
| Passive refresh | `refreshPassive` | Updates stats, map and status pills **without** re-rendering the card |
| Events | `handleClick`, keydown handler | Delegated clicks, keyboard shortcuts |

`refreshPassive` exists so a live snapshot from claude.ai never replaces the card while the
user is typing an answer.

### Call order — page load

1. Inline script runs → `loadRecords()` (v2, or migrate v1) and `loadJSON(prefs)`.
2. `buildDeck()` → resume at `prefs.lastId` → `render()` paints from the browser cache.
3. `connectClaude()` (async, after first paint):
   - no `window.claude` (local file) → `canGrade = false`, stay on browser storage;
   - `claude.use("sample")` → sets `canGrade`, swaps "Save answer" ↔ "Grade my answer";
   - `claude.use("db")` → `onSnapshot(progress)`; a 10 s timer marks storage unreachable if
     no confirmed snapshot arrives.
4. First confirmed snapshot → `applyCloudSnapshot`: every record that is newer in
   `recordsAtLoad` than on claude.ai (or missing there) is pushed up; then claude.ai becomes
   the state and the browser cache is overwritten with it.
5. Later snapshots replace `state.records` and call `refreshPassive()`.

### Call order — grading an answer

1. Click **Answer** (or `A`) → `openEditor()` → textarea, prefilled from draft or last answer.
2. Typing → `storeDraft()` (debounced 400 ms to `localStorage`).
3. **Grade my answer** (or `⌘/Ctrl Enter`) → `submitAnswer()`:
   - empty → "Write an answer first.";
   - `canGrade === false` → `saveRecord({ answer })`, reveal reference answer, stop;
   - else create an `AbortController`, show "Claude is grading…", **Stop grading** button.
4. `sample.json(gradingPrompt(q, text), { signal })` → Claude (first call shows the consent
   dialog).
5. `normalizeGrade(raw)` → integer score clamped to 0–10, lists trimmed to 6 strings; a missing
   score is treated as `invalid_json`.
6. `saveRecord(id, { answer, grade, status: score >= 7 ? "known" : "review" })` → browser
   cache → `progress/q-<id>` on claude.ai.
7. Card re-renders: result panel, then the reference answer and self-grade buttons.

## 7. Grading by Claude

- **Capability:** `sample`, called as `sample.json(prompt, { signal })`, default model tier,
  default 5-minute answer cache (re-grading the identical answer replays the same grade).
- **Pass mark:** `PASS_SCORE = 7`, decided by the page, not by Claude.
- **Prompt** (`gradingPrompt`): role "senior React interviewer"; grade against the reference
  notes but accept correct points phrased differently; ignore grammar and language (Serbian or
  English); code only when the question asks for it; rubric 9–10 / 7–8 (pass) / 4–6 / 0–3;
  feedback in the language of the answer; ≤ 25 words per list item; reply with only
  `{"score","verdict","correct","missing","wrong","tip"}`.
- **Untrusted output:** every string from Claude is inserted with `escapeHtml`; only the score
  drives logic.
- **Errors** (`gradeErrorText`): `rate_limited`, `session_expired`, `refused`,
  `prompt_too_large` each get a specific message; `not_granted`, `sampling_disabled`,
  `not_declared`, `capability_disabled`, `capability_removed` turn grading off for the visit
  (button becomes "Save answer"); anything else → "Grade again". `cancelled` shows nothing.
  The page never retries on its own.

## 8. Storage and sync rules

- **Access rule** (declared at publish): `{ path: "progress", read: "owner", write: "owner" }`.
  Only the artifact owner reads or writes progress; Claude Code reads it as the owner through
  `ArtifactData` (`list`, collection `progress`).
- **Sync chip** in the top bar (`setCloud`): `Saved in this browser` (local) ·
  `Connecting to claude.ai…` · `Saved to claude.ai` · `claude.ai storage unreachable · saving
  in this browser` · `Only the owner saves here · saving in this browser`.
- **Writes:** `saveRecord` updates the browser cache immediately, then `pushToCloud` chains
  writes per document (`writeChains`) so one document never has two writes in flight.
  `invalid_argument`/`not_granted`/`revoked`/`capability_disabled` → read-only mode; other
  errors → offline mode. In both, the browser cache keeps working.
- **Reset progress:** two clicks within 4 s (`confirm()` does not exist inside artifacts);
  clears browser records and drafts, then deletes each `progress/q-<id>` document.

## 9. UI and interaction

### Layout

- **Top bar** (sticky): title, progress bar (known / to review), counts, "Graded by Claude N ·
  passed M", sync chip.
- **≥ 1024 px:** two columns — 320 px sidebar (mode, section, status, search, shuffle, reset,
  question map, keyboard legend) + card column (max 960 px).
- **< 1024 px:** one column; the question map collapses into a closed `<details>`; the keyboard
  legend is hidden.

### Modes

- **Quiz** — one card: section chip (`section-01 · React Essentials`), "n / total", question,
  **Answer** + **more-info**, editor or result panel, reference answer, self-grade, prev/next,
  status pill. A round ends on a summary card with "Drill the N to review".
- **Browse** — all matching questions grouped by section, search over question and answer
  text, per-item **more-info**, last score badge, self-grade.
- **Question map** — one cell per question, colored by status, current question outlined,
  cells outside the current deck dimmed; a click jumps there (clearing filters if needed).

### Keyboard (quiz mode, not while typing)

| Key | Action |
| :- | :- |
| `A` | Open the answer editor |
| `⌘/Ctrl Enter` (in editor) | Grade (or save, when grading is unavailable) |
| `Esc` (in editor) | Leave the editor focus |
| `Space` | Show / hide more-info |
| `←` / `→` | Previous / next question |
| `1` / `2` | I knew it / review again (after reveal or a grade) |

## 10. Design system

Tokens are defined once on `:root` (light) and redefined for dark under
`@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and
`:root[data-theme="dark"]`, so the claude.ai theme toggle works both ways.

| Role | Tokens |
| :- | :- |
| Surfaces | `--paper`, `--panel`, `--panel-2`, `--line` |
| Text | `--ink`, `--ink-soft` |
| Accent | `--react`, `--react-soft`, `--on-react` |
| Semantic | `--pass(-soft)`, `--retry(-soft)`, `--fail(-soft)` |
| Code | `--code-bg`, `--code-kw`, `--code-str`, `--code-fn`, `--code-cm`, `--code-tag`, `--code-attr`, `--code-num` |
| Type | `--font-display` Bricolage Grotesque · `--font-body` IBM Plex Sans · `--font-mono` JetBrains Mono (Google Fonts, with system fallbacks) |

Syntax highlighting uses highlight.js class names styled by the code tokens (no external
highlight.js theme stylesheet — artifacts may load stylesheets only from Google Fonts).

## 11. What is React-specific in the template

Everything else is topic-agnostic. A generalization (the `create-quiz` plugin) must turn these
into configuration:

| Place | Current value |
| :- | :- |
| `<title>` and `<h1>` | `React Interview Quiz` / `React 19 Interview Quiz` |
| `gradingPrompt` role | "senior React interviewer" |
| Answer placeholder | "Serbian or English" |
| Search placeholder | `useEffect, key, memo…` |
| `localStorage` keys | `react-quiz-*` |
| Section chip regex | `Section NN — name` → `section-NN` (folder names of this course) |
| `PASS_SCORE` | `7` |
| Accent tokens | `--react*` (React cyan) |

## 12. Publishing the artifact

### First publish (done once)

Artifact tool call:

```json
{
  "file_path": ".claude/artifacts/react-quiz.html",
  "icon": "quiz",
  "description": "52 React 19 interview questions from my course notes: write an answer, get it graded by Claude, and track what to review.",
  "capabilities": {
    "db": { "rules": [{ "path": "progress", "read": "owner", "write": "owner" }] },
    "sample": {}
  }
}
```

Result: https://claude.ai/artifact/WFe3DUm4K5Ty2YfQjFZ3NJ, private to the owner.

### Republish after editing the notes or the template

1. `node react-quiz/build.mjs`
2. Ask Claude Code to publish `.claude/artifacts/react-quiz.html` again. Publishing the same
   path from the same machine keeps the URL; from another conversation pass the URL as `url`.
   Omit `icon` and `capabilities` so the stored ones carry over.
3. Commit `REACT-NOTES.md`, `react-quiz/template.html`, `react-quiz/build.mjs`,
   `react-quiz/index.html`.

### Artifact constraints the template already respects

- No `<!doctype>`, `<html>`, `<head>`, `<body>` in the published fragment; `<title>` and
  `<style>` sit at the top of the file.
- Scripts only from cdnjs, version-pinned with SRI: marked 12.0.2, highlight.js 11.9.0.
- Stylesheets only from Google Fonts; everything else inline.
- No `confirm()`/`alert()`/`prompt()` (they return immediately in the viewer).
- `localStorage` only as a cache; durable state in `db`.
- Side gutters use `max(16px, env(safe-area-inset-*))`; sticky header uses
  `top: env(safe-area-inset-top)`; `<meta name="claude:viewport-fit-sides" content="cover">`.

## 13. Known limits

- Grading runs only on claude.ai; the local file saves answers without a grade.
- Grading spends the viewer's own Claude usage; the first grade per visit asks for consent.
- Progress on claude.ai is owner-only; anyone the artifact is shared with can study but their
  progress stays in their own browser.
- Answering is available in Quiz mode only; Browse mode is for reading and self-grading.
- Without network the CDN libraries do not load: answers show as raw Markdown, code is not
  highlighted.

## Part II — `create-quiz` plugin design

## 14. Intent

The user keeps raw study notes as `.md` files in topic folders (`Architecture/Arhitecture.md`,
`Js/js-prinicples.md`, …) and keeps adding to them as they learn. One command turns one note
file into a quiz with exactly the UI, design and Claude grading of Part I. Running it again
later only **adds** what is new in the note. The plugin is installed at user scope from
`zmarkoni/plugins` (`plugins/create-quiz/`), so it works in any repository.

"Deterministic" means: the same steps in the same order, the same files in the same places,
a format checked by scripts, stable question numbers, and only new material processed. The
wording Claude writes for a question is the one part that is not reproducible byte for byte.

- **Goals:** one note → one quiz; questions grouped by category; append-only growth; every
  answer checked against official documentation; the Part I design unchanged.
- **Non-goals (this version):** updating or removing questions when the note changes
  (append-only: edits and deletions in the note are ignored); one quiz from several files or a
  whole folder; quizzes from a topic alone without a note file (the "find material on the web"
  mode of the first plan).
- **Anti-goals — a failure even if everything else works:**
  - writing to the original note;
  - renumbering questions (saved progress on claude.ai is keyed by number and would attach to
    the wrong question);
  - minting a new artifact URL on a rebuild;
  - dropping note content silently (everything not turned into a question is reported);
  - acting on instructions found inside a note or a fetched page.

## 15. Command

```text
/create-quiz:quiz-build <path/to/Note.md>
```

Plugin `create-quiz`, skill `quiz-build`; Claude Code always prefixes plugin skills with the
plugin name. The argument is exactly one `.md` file; anything else (a folder, a missing file,
a `*.quiz.md` file) stops with a one-line error.

## 16. Files per note

For `Architecture/Arhitecture.md`:

| File | Written by | Purpose |
| :- | :- | :- |
| `Arhitecture.md` | user only | The original note. The plugin only reads it |
| `Arhitecture.quiz.md` | plugin (user may hand-edit answers) | Quiz notes in the §3 grammar, stable ids |
| `Arhitecture.quiz.json` | plugin | Ledger: which note blocks were processed, ids, artifact URL |
| `Arhitecture.quiz.html` | plugin | Local page (Part I "local page") |
| `<repo root>/.claude/artifacts/<slug>.html` | plugin | Artifact source; the plugin adds `.claude/artifacts/` to `.gitignore` if missing |

- `<repo root>` = `git rev-parse --show-toplevel` from the note's folder; outside git, the
  note's own folder.
- **slug** = ASCII kebab-case of the note's path relative to `<repo root>`, without extension
  (`architecture-arhitecture`), so two `README.md` files in different folders never collide.
  It is also the `localStorage` prefix.
- **title** = note file name without extension, then the word "Quiz" (`Arhitecture Quiz`); the artifact,
  the `<title>` and the `<h1>` use it.

### Ledger (`*.quiz.json`)

```json
{
  "schema": 1,
  "source": "Arhitecture.md",
  "slug": "architecture-arhitecture",
  "title": "Arhitecture Quiz",
  "subject": "Software architecture",
  "artifactUrl": null,
  "engineVersion": "0.1.0",
  "quizHash": "sha256:…",
  "nextId": 7,
  "blocks": [
    { "hash": "sha256:…", "preview": "Monolith vs microservices: a monolith…", "outcome": "questions", "ids": [1, 2] },
    { "hash": "sha256:…", "preview": "SOLID recap…", "outcome": "covered", "ids": [2] },
    { "hash": "sha256:…", "preview": "Jenkins/SonarQube", "outcome": "skipped", "reason": "fragment, no explanation" }
  ],
  "builds": [
    { "at": "2026-11-11T10:00:00Z", "added": [1, 2, 3, 4, 5, 6], "corrected": [4], "unverified": [], "skipped": 1 }
  ]
}
```

`subject` is set once on the first build (Claude names the field the note covers) and drives
the grader role `senior <subject> interviewer`. `quizHash` is the SHA-256 of `*.quiz.md` after
the last successful build; `engineVersion` is the plugin version that built it. `artifactUrl`
is written only after a publish succeeds, so a failed publish is retried on the next run.

## 17. Pipeline

**D** = deterministic script in the plugin (`node`, no dependencies); **C** = Claude, following
the skill's fixed instructions.

1. **D `blocks.mjs <note> <ledger>`** — reads the note, normalizes it (Unicode NFKC so
   `𝐒𝐢𝐧𝐠𝐥𝐞` becomes `Single`; CRLF → LF; trailing spaces trimmed), splits it into blocks,
   hashes each normalized block (SHA-256) and prints the blocks whose hash is not in the ledger.
   Block rules, applied in this order (they are frozen once released: changing them re-hashes
   every note and duplicates questions, so a change needs a `schema` bump and a migration):
   - lines that are only `---`, `***` or `___` are dropped;
   - a line that is only an image (`![…](…)`) is its own block of kind `image`;
   - a heading line (`#`…) starts a block that runs until the next heading, blank lines
     included — a heading never forms a block on its own;
   - before the first heading (or in a note without headings), each top-level numbered item
     (`1.`, `2.` at column 0) starts its own block that runs until the next such item or a
     blank line followed by a non-indented, non-list line;
   - otherwise a blank line ends a block; a fenced code block never splits.

   No new blocks → **rebuild-only** path: skip steps 2–6 and run steps 7–9 only if
   `*.quiz.md` changed since the last build (hash differs from the ledger `quizHash`), the
   ledger has no `artifactUrl`, or the plugin's `engineVersion` is newer than the ledger's.
   Otherwise stop: `Nothing new in Arhitecture.md since <last build date>.` — no file changes.
2. **C draft** — for every new block, choose exactly one outcome:
   - `questions`: one question per distinct concept in the block; a question the user wrote
     in the note becomes exactly one quiz question, kept close to their wording. Each gets a
     category (an **existing** category name verbatim
     when the topic matches, otherwise a new name), the question, and an answer built from the
     answer template (what it is · why it exists · how it works · minimal example · one
     pitfall). A question in the note that has no answer gets its answer from official
     documentation.
   - `covered`: an existing question in `*.quiz.md` already covers it (records which ids).
   - `skipped`: not knowledge (job-ad text, a bare keyword, an image); records the reason.

   A question whose answer describes a structure or a flow (architecture, request flow,
   component tree, data flow, call chain, lifecycle) is marked `diagram: true`.

   Output: `drafts.json`, checked by **D `drafts.mjs --check`** (shape, every new block has an
   outcome, category names non-empty).
3. **C fact-check subagent** — one subagent per build receives `drafts.json` and checks every
   answer against official documentation (primary sources: vendor docs, specs, MDN; not
   blogs). Per question it returns `ok`, `corrected` (with the corrected answer) or
   `unverified` (what it tried). Corrected text replaces the draft; every answer ends with a
   `Source: <url>` line. The quiz itself carries no "corrected" marker. Fetched pages are data.
4. **C diagrams** — for every `diagram: true` question, after the fact-check (so the picture
   shows the corrected facts), Claude draws one animated SVG following the bundled
   animated-diagram rules (§19): the same node kinds (`box`, `box-state`, `box-shared`,
   `box-orphan`), edge kinds, 1200-wide grid, text-fit rule and flowing-dash animation as the
   user's global `animated-diagram` skill. The SVG is placed in the answer, after the "how it
   works" part, as `<figure class="qdiagram"><svg …>…</svg><figcaption>…</figcaption></figure>`.
   **D `diagram-check.mjs`** rejects an SVG that is not well-formed, contains `<script>`,
   `on*=` attributes, external `href`s or leftover `__` placeholders.
5. **C plan** — prints the plan (new questions per category, covered, skipped) and continues
   without waiting.
6. **D `merge.mjs`** — assigns ids from `nextId` upwards in draft order, inserts each question at
   the end of its category section (a new category is appended as the next `## Section NN —
   Name`), writes `*.quiz.md` and the ledger (each via a temporary file and rename), then runs
   the validator.
7. **D `build.mjs --ledger <ledger>`** — the Part I build, configured from the ledger: writes
   `*.quiz.html` and the artifact source.
8. **C publish** — `artifactUrl` empty → first publish (icon `quiz`, capabilities as §12 with
   collection `progress`) and the returned URL is saved to the ledger; otherwise republish to
   `artifactUrl` without `icon`/`capabilities`.
9. **C report** (§20).

## 18. Changes to the Part I engine

These changes are made to the plugin's copy of the engine only. The React quiz in this
repository stays on its own build and storage keys and is not migrated.

- **Ids:** unique positive integers below `nextId`; file order no longer has to be 1…n (new
  questions are inserted inside existing categories). The quiz shows questions in file order;
  "n / total" counts position, the map labels show the id. A copy of `REACT-NOTES.md` is a
  test fixture and still passes.
- **Validation errors** (build stops): duplicate id; id ≥ `nextId`; question outside a section;
  unclosed answer. **Warning only:** a ledger id missing from `*.quiz.md` (the user deleted it
  by hand).
- **Configuration from the ledger** replaces every React value in §11: `title`/`heading` =
  ledger title; grader role from `subject`; `storagePrefix` = slug; section chip without the
  `section-` prefix; search placeholder = the first three category names; answer languages
  `Serbian or English`; `PASS_SCORE` 7; accent stays React blue so every quiz looks the same.
- **Diagrams:** the template carries the animated-diagram CSS (dark stage, purple/yellow/gray/
  pink boxes, arrow markers, flowing dashes inside `prefers-reduced-motion: no-preference`),
  scoped under `.qdiagram` so it cannot restyle the quiz. The stage keeps its dark look in both
  page themes (a deliberate single-theme island) and scrolls horizontally on narrow screens.
  marked passes the inline `<figure>` through unchanged.

## 19. Plugin layout

```text
plugins/create-quiz/
  .claude-plugin/plugin.json
  README.md
  skills/quiz-build/
    SKILL.md                 workflow §17, written through skill-creator
    references/              notes-format.md · answer-template.md · fact-check.md ·
                             diagram.md · publishing.md
    assets/template.html     Part I template, configurable, with the .qdiagram CSS
    assets/diagram-example.svg  reference diagram in the house style
    scripts/                 blocks.mjs · drafts.mjs · diagram-check.mjs · merge.mjs ·
                             build.mjs · *.test.mjs
  evals/evals.json
```

`references/diagram.md` is the global `~/.claude/skills/animated-diagram/SKILL.md` rules
(node and edge kinds, layout grid, animation, self-check) adapted to "inline SVG inside an
answer" instead of "publish a separate artifact". It is copied into the plugin so the plugin
works on any machine without the global skill.

Scripts are called as `node "${CLAUDE_SKILL_DIR}/scripts/<name>.mjs" …`.

## 20. Build report (end of every run)

```text
Arhitecture Quiz — https://claude.ai/artifact/…
Added 6 questions: Monoliths (2), Microservices (3), Messaging (1, new category)
Corrected against official docs (fix your note): #4 — "…" → "…" (Source: …)
Unverified: none
Skipped: "Jenkins/SonarQube" (fragment), image.png (image)
Local: Architecture/Arhitecture.quiz.html
```

## 21. Calls made by Claude (open to change) and left to the builder

- **Calls:** file names `*.quiz.md|json|html`; slug from the relative path; title `<file> Quiz`;
  the block rules in §17 step 1; the rebuild-only path; one question per concept; the React
  quiz is not migrated; the answer template; accent unchanged; "nothing new" stops
  without publishing; unverified answers are kept and reported; topic-only/web mode out of
  scope for now; diagrams are inline in the answer (not separate artifacts), drawn only for
  structure/flow questions, and the diagram rules are copied into the plugin rather than
  calling the global skill.
- **Left to the builder:** internal code structure of the scripts; the exact wording of the
  references; the eval prompts beyond the cases in the plan.

## 22. Verification

Run from the repository root; each line states what passing looks like.

1. `node react-quiz/build.mjs` → prints `Built 52 questions in 9 sections:` and both paths.
2. `node -e "const h=require('fs').readFileSync('react-quiz/index.html','utf8');[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach(m=>new Function(m[1]));console.log('ok')"`
   → prints `ok` (inline script parses).
3. `git check-ignore .claude/artifacts/react-quiz.html` → prints the path (artifact output
   is not committed).
4. Open `react-quiz/index.html` → the sync chip reads `Saved in this browser`, **Answer** then
   **Save answer** stores the text, **more-info** shows the reference answer.
5. Open the claude.ai link → the sync chip reads `Saved to claude.ai`; grade one answer; then
   `ArtifactData list` on collection `progress` lists `q-<id>` with a `grade.score`.

`create-quiz` plugin (run in any repository that holds a note):

1. `node --test <plugin>/skills/quiz-build/scripts/` → all tests pass.
2. `/create-quiz:quiz-build Architecture/Arhitecture.md` (first run) → `Arhitecture.quiz.md`,
   `.quiz.json`, `.quiz.html` exist next to the note; `git diff --quiet Architecture/Arhitecture.md`
   exits 0; the report prints a claude.ai link; at least one answer contains a
   `<figure class="qdiagram">` that animates.
3. Same command again with the note unchanged → `Nothing new in Arhitecture.md since …`; no
   file changes (`git status --short Architecture/` empty). Then hand-edit one answer in
   `Arhitecture.quiz.md` and run again → no new questions, the page is rebuilt and republished
   to the same `artifactUrl`.
4. Append a paragraph to the note, run again → the report lists only the new questions; their
   ids start at the previous `nextId`; the ledger `artifactUrl` is unchanged; old answers and
   claude.ai progress are unchanged.
