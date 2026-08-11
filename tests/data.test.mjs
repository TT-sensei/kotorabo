import test from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS, DIAGNOSTIC_IDS } from "../js/data/questions.js";
import { LABS, SKILL_MAP } from "../js/data/skill-map.js";
import { buildSession } from "../js/core/engine.js";

test("問題IDが重複せず、必要なメタデータがそろっている", () => {
  assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, QUESTIONS.length);
  const skillIds = new Set(SKILL_MAP.map((skill) => skill.id));
  QUESTIONS.forEach((q) => {
    assert.ok(LABS[q.lab], `${q.id}: lab`);
    assert.ok(skillIds.has(q.skill), `${q.id}: skill`);
    assert.ok(q.options.some((option) => option.quality === "best"), `${q.id}: best`);
    assert.ok(q.options.length >= 3, `${q.id}: choices`);
    assert.ok(q.hint && q.explanation, `${q.id}: support`);
    assert.ok(q.contentLevel >= 1 && q.contentLevel <= 6, `${q.id}: level`);
    assert.ok(q.depth >= 1 && q.depth <= 6, `${q.id}: depth`);
  });
});

test("初回診断が4LABをすべて含む", () => {
  const labs = new Set(DIAGNOSTIC_IDS.map((id) => QUESTIONS.find((q) => q.id === id)?.lab));
  assert.deepEqual([...labs].sort(), Object.keys(LABS).sort());
});

test("各学年で今日の研究3問・5問・10問を重複なく生成できる", () => {
  for (let grade = 1; grade <= 6; grade += 1) {
    for (const size of [3, 5, 10]) {
      const session = buildSession(QUESTIONS, { grade }, [], size);
      assert.equal(session.length, size, `grade ${grade} / ${size}`);
      assert.equal(new Set(session.map((item) => item.questionId)).size, size, `grade ${grade} / ${size} unique`);
    }
  }
});
