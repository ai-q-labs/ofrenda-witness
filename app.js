import * as webllm from "https://esm.run/@mlc-ai/web-llm@0.2.86";
import { CASE, CLUE_OBJECTS } from "./case.js";
import { verifyReply, isCulpritQuestion } from "./verify.js";

const MODELS = {
  "Qwen2.5-1.5B-Instruct-q4f16_1-MLC": "Qwen2.5 1.5B (Apache-2.0, ~1 GB)",
  "Llama-3.2-1B-Instruct-q4f16_1-MLC": "Llama 3.2 1B (~0.9 GB)",
  "Qwen2.5-0.5B-Instruct-q4f16_1-MLC": "Qwen2.5 0.5B (Apache-2.0, ~0.4 GB, low-end devices)",
};
const SEED = 1102;          // fixed, so every player meets the same ghost
const MAX_RETELLS = 2;

const $ = (s) => document.querySelector(s);
const placed = new Set();
let engine = null;

function memoriesOnAltar() {
  return [...placed].flatMap((id) => CASE.memories[id]);
}

function systemPrompt(memories) {
  return [
    `You are the ghost of ${CASE.ghost}, a retired clockmaker, speaking at your own ofrenda on the Night of the Dead.`,
    "Speak in the first person, gently, in one to three short sentences.",
    "You may only use these memories:",
    ...memories.map((m) => `- ${m}`),
    "If the memories do not answer the question, say that you do not remember.",
    "Never invent names, times, or objects. You never saw who pushed you, so never say who did it.",
  ].join("\n");
}

function say(who, text, note) {
  const p = document.createElement("div");
  p.className = `line ${who}`;
  p.textContent = text;
  if (note) {
    const n = document.createElement("span");
    n.className = "note";
    n.textContent = note;
    p.append(n);
  }
  $("#log").append(p);
  p.scrollIntoView({ block: "end" });
}

function closestMemory(question, memories) {
  const q = new Set(question.toLowerCase().match(/\p{L}+/gu) || []);
  let best = memories[0], score = -1;
  for (const m of memories) {
    const s = (m.toLowerCase().match(/\p{L}+/gu) || []).filter((w) => w.length > 3 && q.has(w)).length;
    if (s > score) { best = m; score = s; }
  }
  return best;
}

async function ask(question) {
  const memories = memoriesOnAltar();
  if (!memories.length) { say("ghost", "The candle flickers. Place one of my things on the altar, and I will remember."); return; }
  if (isCulpritQuestion(question)) {
    say("ghost", "I never saw who stood behind me. I can only tell you what my things remember. The rest is yours to find.", "fixed answer: the model is not asked who did it");
    return;
  }
  const ctx = { memories, allowedNames: CASE.allowedNames, allowedTimes: CASE.allowedTimes, suspects: CASE.suspects, clueObjects: CLUE_OBJECTS };
  const messages = [{ role: "system", content: systemPrompt(memories) }, { role: "user", content: question }];
  for (let attempt = 0; attempt <= MAX_RETELLS; attempt++) {
    const out = await engine.chat.completions.create({ messages, temperature: 0.2, max_tokens: 120, seed: SEED + attempt });
    const reply = out.choices[0].message.content.trim();
    const check = verifyReply(reply, ctx);
    if (check.ok) {
      say("ghost", reply, attempt ? `checked against his memories · retold ${attempt}×` : "checked against his memories");
      return;
    }
    console.info("[ofrenda] rejected:", reply, check.problems);
    messages.push({ role: "assistant", content: reply },
      { role: "user", content: `That is not in your memories (${check.problems.join("; ")}). Answer again using only the memories.` });
  }
  say("ghost", `The memory slips like smoke. All I hold is this: ${closestMemory(question, memories)}`, "quoted from his memories");
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function render() {
  $("#title").textContent = CASE.title;
  $("#intro").replaceChildren(...CASE.intro.map((t) => Object.assign(document.createElement("p"), { textContent: t })));
  $("#people").replaceChildren(...CASE.people.map((p) => {
    const li = document.createElement("li");
    li.innerHTML = `<b></b> <i></i><br><span></span>`;
    li.querySelector("b").textContent = p.name;
    li.querySelector("i").textContent = `(${p.role})`;
    li.querySelector("span").textContent = p.note;
    return li;
  }));
  $("#altar").replaceChildren(...CASE.keepsakes.map((k) => {
    const b = document.createElement("button");
    b.className = "keepsake";
    b.textContent = `${k.glyph} ${k.label}`;
    b.onclick = () => {
      placed.has(k.id) ? placed.delete(k.id) : placed.add(k.id);
      b.classList.toggle("on", placed.has(k.id));
      if (placed.has(k.id)) say("system", `You place the ${k.label.toLowerCase()} on the ofrenda.`);
      $("#shelf").replaceChildren(...CASE.keepsakes.filter((x) => placed.has(x.id))
        .map((x) => Object.assign(document.createElement("span"), { textContent: `${x.glyph} ${x.label}` })));
    };
    return b;
  }));
  $("#suspect").replaceChildren(...CASE.suspects.map((s) => Object.assign(document.createElement("option"), { value: s, textContent: s })));
  $("#model").replaceChildren(...Object.entries(MODELS).map(([id, label]) => Object.assign(document.createElement("option"), { value: id, textContent: label })));
}

async function load() {
  $("#load").disabled = true;
  if (!navigator.gpu) { $("#status").textContent = "This browser has no WebGPU. Try a recent Chrome or Edge."; return; }
  engine = await webllm.CreateMLCEngine($("#model").value, {
    initProgressCallback: (p) => { $("#status").textContent = p.text; },
  });
  $("#status").textContent = "The candle is lit. Everything now runs on this device; you can go offline.";
  $("#ask").disabled = false;
  $("#accuse").disabled = false;
}

render();
$("#load").onclick = load;
$("#ask-form").onsubmit = async (e) => {
  e.preventDefault();
  const q = $("#question").value.trim();
  if (!q || !engine) return;
  $("#question").value = "";
  say("you", q);
  $("#ask").disabled = true;
  try { await ask(q); } finally { $("#ask").disabled = false; }
};
$("#accuse").onclick = async () => {
  const ok = (await sha256(`ofrenda:${$("#suspect").value}`)) === CASE.solutionHash;
  say("system", ok ? CASE.epilogue.right : CASE.epilogue.wrong);
};

window.__ofrenda = { ask: (q) => ask(q), place: (id) => placed.add(id), get engine() { return engine; } };
