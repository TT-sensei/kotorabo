import test from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS, DIAGNOSTIC_IDS } from "../js/data/questions.js";
import { LABS, SKILL_MAP } from "../js/data/skill-map.js";
import { buildFocusSession, buildSession } from "../js/core/engine.js";

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

test("学校の学年とは別のチャレンジレベルで出題できる", () => {
  const session = buildSession(QUESTIONS, { grade: 6, challengeLevel: 1 }, [], 10);
  const questions = session.map((item) => QUESTIONS.find((question) => question.id === item.questionId));
  assert.ok(questions.every((question) => question.gradeMin <= 1));
  assert.ok(questions.every((question) => question.contentLevel <= 2));
});

test("特訓モードは各SKILLを中心に同じLABから5問作れる", () => {
  for (const skill of SKILL_MAP) {
    const session = buildFocusSession(QUESTIONS, { grade: 3, challengeLevel: 3 }, [], skill.id, 5);
    const questions = session.map((item) => QUESTIONS.find((question) => question.id === item.questionId));
    assert.equal(session.length, 5, skill.id);
    assert.equal(new Set(session.map((item) => item.questionId)).size, 5, `${skill.id}: unique`);
    assert.ok(questions.every((question) => question.lab === skill.lab), `${skill.id}: same LAB`);
    assert.ok(questions.some((question) => question.skill === skill.id), `${skill.id}: selected skill`);
  }
});

test("特訓モードは選んだSKILLなら学年より上の問題も使える", () => {
  const session = buildFocusSession(QUESTIONS, { grade: 1, challengeLevel: 1 }, [], "words.abstract_objective", 3);
  const questions = session.map((item) => QUESTIONS.find((question) => question.id === item.questionId));
  assert.ok(questions.some((question) => question.skill === "words.abstract_objective" && question.contentLevel > 1));
});

test("追加問題は4LAB・6レベルに各5問ずつある", () => {
  const added = QUESTIONS.filter((question) => question.id.startsWith("kb2-"));
  assert.equal(added.length, 120);
  for (const lab of Object.keys(LABS)) {
    for (let level = 1; level <= 6; level += 1) {
      assert.equal(
        added.filter((question) => question.lab === lab && question.contentLevel === level).length,
        5,
        `${lab} / level ${level}`,
      );
    }
  }
});

test("追加問題の全選択肢に個別フィードバックがある", () => {
  const added = QUESTIONS.filter((question) => question.id.startsWith("kb2-"));
  added.forEach((question) => {
    question.options.forEach((option) => {
      assert.ok(option.feedback, `${question.id} / ${option.id}`);
      assert.ok(["best", "acceptable", "incorrect"].includes(option.quality), `${question.id} / ${option.id} quality`);
    });
  });
});

test("追加問題のbest位置がA〜Dに分散している", () => {
  const counts = [0, 0, 0, 0];
  QUESTIONS.filter((question) => question.id.startsWith("kb2-")).forEach((question) => {
    question.options.forEach((option, index) => {
      if (option.quality === "best") counts[index] += 1;
    });
  });
  counts.forEach((count, index) => assert.ok(count >= 20, `choice ${index}: ${count}`));
});
