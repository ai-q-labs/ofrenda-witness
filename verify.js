// Deterministic check on every ghost reply. A small model that invents a clue breaks a mystery,
// so a reply is only shown if every name, time, and clue object in it is backed by the memories given.

const WORD_TIMES = /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(?:o'clock|thirty|fifteen|forty(?:-\w+)?|fifty(?:-\w+)?|twenty(?:-\w+)?)\b/gi;
const DIGIT_TIMES = /\b\d{1,2}[:.]\d{2}\b|\b\d{1,2}\s*(?:am|pm|a\.m\.|p\.m\.)/gi;
const ACCUSE = /\b(push(?:ed)?|kill(?:ed)?|murder(?:ed)?|shove[d]?|attack(?:ed)?|did it|guilty|innocent|responsible)\b/i;
const MAX_SENTENCES = 3;

// Questions about who did it never reach the model: a yes or a no would both be a false clue.
export function isCulpritQuestion(q) {
  return /\b(who|whom|which one)\b[^?]*\b(push|pushed|kill|killed|did it|behind you|was it)\b/i.test(q)
    || /\b(was it|did)\s+\p{Lu}\p{L}+[^?]*\b(push|kill|do it|did it)\b/iu.test(q)
    || /\bis\s+\p{Lu}\p{L}+[^?]*\b(guilty|innocent|the killer|responsible)\b/iu.test(q);
}

function normalizeTime(t) {
  const m = t.match(/(\d{1,2})[:.](\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : t.toLowerCase();
}

export function verifyReply(reply, { memories, allowedNames, allowedTimes, suspects, clueObjects }) {
  const problems = [];
  const memoryText = memories.join(" ").toLowerCase();

  // Times: only times that appear in the memories given.
  const given = new Set(allowedTimes.filter((t) => memoryText.includes(t)));
  for (const t of reply.match(DIGIT_TIMES) || []) {
    if (!given.has(normalizeTime(t))) problems.push(`time not in memory: ${t}`);
  }
  for (const t of reply.match(WORD_TIMES) || []) problems.push(`time in words: ${t}`);

  // Names: capitalised words that are not sentence starts must be known names.
  const allowed = new Set(allowedNames.map((n) => n.toLowerCase()));
  const sentences = reply.split(/(?<=[.!?…])\s+/);
  for (const s of sentences) {
    const words = s.match(/[\p{L}'’]+/gu) || [];
    words.slice(1).forEach((w) => {
      const bare = w.replace(/['’]s$/, "");
      if (/^\p{Lu}/u.test(bare) && bare !== "I" && !allowed.has(bare.toLowerCase())) problems.push(`unknown name: ${bare}`);
    });
  }

  // Clue objects: only objects that appear in the memories given.
  const lower = reply.toLowerCase();
  for (const o of clueObjects) {
    if (new RegExp(`\\b${o}\\b`).test(lower) && !new RegExp(`\\b${o}\\b`).test(memoryText)) problems.push(`object not in memory: ${o}`);
  }

  // Short answers leave less room for invented detail.
  if (sentences.filter((s) => s.trim()).length > MAX_SENTENCES) problems.push(`more than ${MAX_SENTENCES} sentences`);

  // The ghost never saw who pushed him, so it may not say anyone did it, or that anyone did not.
  for (const s of sentences) {
    if (!ACCUSE.test(s)) continue;
    for (const full of suspects) {
      const [first, last] = full.toLowerCase().split(" ");
      const sl = s.toLowerCase();
      if (sl.includes(first) || sl.includes(last)) problems.push(`names a suspect as the killer: ${full}`);
    }
  }

  return { ok: problems.length === 0, problems };
}
