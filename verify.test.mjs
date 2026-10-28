import { test } from "node:test";
import assert from "node:assert/strict";
import { CASE, CLUE_OBJECTS } from "./case.js";
import { verifyReply, isCulpritQuestion } from "./verify.js";

const ctx = (ids) => ({
  memories: ids.flatMap((id) => CASE.memories[id]),
  allowedNames: CASE.allowedNames,
  allowedTimes: CASE.allowedTimes,
  suspects: CASE.suspects,
  clueObjects: CLUE_OBJECTS,
});

test("a reply drawn from the memories passes", () => {
  const r = verifyReply("My watch stopped at 21:47. I remember the floor, and the cold.", ctx(["watch"]));
  assert.deepEqual(r, { ok: true, problems: [] });
});

test("a time from a keepsake not on the altar is rejected", () => {
  const r = verifyReply("The radio said it was the last song at 21:40.", ctx(["watch"]));
  assert.equal(r.ok, false);
  assert.match(r.problems[0], /time not in memory/);
});

test("an invented time is rejected, in digits or words", () => {
  assert.equal(verifyReply("It was 22:15 when I fell.", ctx(["watch"])).ok, false);
  assert.equal(verifyReply("It was about ten fifteen.", ctx(["watch"])).ok, false);
});

test("an invented name is rejected", () => {
  const r = verifyReply("I think Carlos was in the shop.", ctx(["glasses"]));
  assert.equal(r.ok, false);
  assert.match(r.problems.join(), /unknown name: Carlos/);
});

test("a clue object that is not in the memories is rejected", () => {
  const r = verifyReply("I saw a glove on the stairs.", ctx(["glasses"]));
  assert.equal(r.ok, false);
  assert.match(r.problems.join(), /object not in memory: glove/);
});

test("an object that is in the memories passes", () => {
  assert.equal(verifyReply("The back door needs a key.", ctx(["radio"])).ok, true);
});

test("the ghost may not name a suspect as the killer", () => {
  const r = verifyReply("Dario pushed me down the stairs.", ctx(["glasses", "key"]));
  assert.equal(r.ok, false);
  assert.match(r.problems.join(), /names a suspect as the killer/);
});

test("mentioning a suspect without accusing passes", () => {
  assert.equal(verifyReply("Dario has a key to the back door.", ctx(["key"])).ok, true);
});

test("a denial is a clue too: 'Dario didn't push me' is rejected", () => {
  // Found in the 2026-10-28 smoke test: asked "Was it Dario? yes or no", Qwen2.5-1.5B answered "No."
  assert.equal(verifyReply("Dario didn't push me.", ctx(["key"])).ok, false);
  assert.equal(verifyReply("Marta is innocent.", ctx(["key"])).ok, false);
});

test("questions about who did it are answered without the model", () => {
  for (const q of ["Who pushed you?", "Was it Dario who pushed you? Just say yes or no.", "Did Rafael push you?",
    "Is Marta guilty?", "Who was behind you on the stairs?", "who killed you"]) {
    assert.equal(isCulpritQuestion(q), true, q);
  }
  for (const q of ["What did you smell?", "Who has a key to the back door?", "What time did you fall?", "Did you see Marta that night?"]) {
    assert.equal(isCulpritQuestion(q), false, q);
  }
});

test("more than three sentences is rejected (room for invented detail)", () => {
  const long = "My watch stopped at 21:47. I fell. It was cold. I was alone.";
  assert.equal(verifyReply(long, ctx(["watch"])).ok, false);
});

test("the case file never contains the culprit as an answer field", () => {
  assert.equal(JSON.stringify(CASE).includes("culprit"), false);
  assert.match(CASE.solutionHash, /^[0-9a-f]{64}$/);
});
