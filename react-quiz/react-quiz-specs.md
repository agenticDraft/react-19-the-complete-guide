# React Interview Quiz — Specification

How the quiz works, how it is built from `REACT-NOTES.md`, and how it is published as a
claude.ai artifact. This document is also the reference spec for the `create-quiz` plugin
(see `plan-quiz-plugin.md` at the repository root), which generalizes this quiz to any topic.

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

## 14. Verification

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
