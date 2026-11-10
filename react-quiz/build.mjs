// Builds react-quiz/index.html from REACT-NOTES.md.
// REACT-NOTES.md stays the single source of truth; re-run after editing it:
//   node react-quiz/build.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const notesPath = join(here, "..", "REACT-NOTES.md");
const templatePath = join(here, "template.html");
const outPath = join(here, "index.html");
const DATA_TOKEN = "/*__QUESTIONS__*/[]";

// Expected shape of every entry in REACT-NOTES.md:
//   ## Section 01 — React Essentials
//   ### 1. Question text?
//   <details>
//   <summary>more-info</summary>
//   ...answer markdown...
//   </details>
function parseNotes(markdown) {
  const questions = [];
  let section = null;
  let current = null;
  let inAnswer = false;

  for (const line of markdown.split("\n")) {
    const sectionMatch = line.match(/^## (Section \d+.*)$/);
    const questionMatch = line.match(/^### (\d+)\. (.+)$/);

    if (inAnswer) {
      if (line.trim() === "</details>") {
        current.answer = current.answer.join("\n").trim();
        inAnswer = false;
      } else {
        current.answer.push(line);
      }
    } else if (sectionMatch) {
      section = sectionMatch[1].trim();
    } else if (questionMatch) {
      current = {
        id: Number(questionMatch[1]),
        section,
        question: questionMatch[2].trim(),
        answer: [],
      };
      questions.push(current);
    } else if (current && line.trim() === "<summary>more-info</summary>") {
      inAnswer = true;
    }
  }

  return questions;
}

function validate(questions) {
  if (questions.length === 0) {
    throw new Error("No questions found in REACT-NOTES.md");
  }
  questions.forEach((q, index) => {
    if (q.id !== index + 1) {
      throw new Error(`Question numbering breaks at #${q.id} (expected #${index + 1})`);
    }
    if (!q.section) {
      throw new Error(`Question #${q.id} is not under a "## Section ..." heading`);
    }
    if (typeof q.answer !== "string" || q.answer.length === 0) {
      throw new Error(`Question #${q.id} has no closed <details> answer`);
    }
  });
}

const questions = parseNotes(readFileSync(notesPath, "utf8"));
validate(questions);

// "<" is escaped so a "</script>" inside an answer cannot end the inline script early.
const json = JSON.stringify(questions).replace(/</g, "\\u003c");
const template = readFileSync(templatePath, "utf8");

if (!template.includes(DATA_TOKEN)) {
  throw new Error(`template.html is missing the ${DATA_TOKEN} placeholder`);
}

// A replacer function, not a string: answers contain "$" (template literals,
// prices), which String.replace would otherwise treat as $1/$& patterns.
writeFileSync(outPath, template.replace(DATA_TOKEN, () => json));

const sections = new Set(questions.map((q) => q.section)).size;
console.log(`Built ${outPath} — ${questions.length} questions in ${sections} sections.`);
