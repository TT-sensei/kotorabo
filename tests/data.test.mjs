import test from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS, DIAGNOSTIC_IDS } from "../js/data/questions.js";
import { LABS, SKILL_MAP } from "../js/data/skill-map.js";
import { buildDiagnosticSession, buildFocusSession, buildSession, orderQuestionOptions } from "../js/core/engine.js";
import { SYSTEMATIC_VOCABULARY } from "../js/data/question-sets/systematic-language.js";
import { BADGES, evaluateBadgeIds } from "../js/data/badges.js";

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

test("初回診断は全レベルで4LABから1問ずつ出す", () => {
  for (let level = 1; level <= 6; level += 1) {
    const session = buildDiagnosticSession(QUESTIONS, DIAGNOSTIC_IDS, { grade:level, challengeLevel:level });
    const questions = session.map((item) => QUESTIONS.find((question) => question.id === item.questionId));
    assert.equal(session.length, 4, `level ${level}`);
    assert.deepEqual([...new Set(questions.map((question) => question.lab))].sort(), Object.keys(LABS).sort());
    assert.ok(questions.every((question) => question.gradeMin <= level));
  }
});

test("画面上のbest位置が問題IDによる安定順でA〜Dに分散する", () => {
  const counts = [0, 0, 0, 0];
  QUESTIONS.forEach((question) => {
    const first = orderQuestionOptions(question).map((option) => option.id);
    const second = orderQuestionOptions(question).map((option) => option.id);
    assert.deepEqual(first, second, `${question.id}: stable`);
    const bestIndex = orderQuestionOptions(question).findIndex((option) => option.quality === "best");
    counts[bestIndex] += 1;
  });
  counts.forEach((count, index) => assert.ok(count >= 25, `choice ${index}: ${count}`));
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

test("接続詞を独立したスキルとしてLevel 1〜6を十分に特訓できる", () => {
  const questions = QUESTIONS.filter((question) => question.skill === "connection.connectives");
  assert.equal(questions.length, 73);
  assert.deepEqual([...new Set(questions.map((question) => question.contentLevel))].sort(), [1, 2, 3, 4, 5, 6]);
  for (let level = 1; level <= 6; level += 1) {
    assert.ok(questions.filter((question) => question.contentLevel === level).length >= 10, `level ${level}`);
  }
  const tags = new Set(questions.flatMap((question) => question.thinkingTags));
  ["因果", "逆接", "対比", "具体例"].forEach((tag) => assert.ok(tags.has(tag), tag));
});

test("追加した接続詞60問は全選択肢に個別フィードバックがある", () => {
  const extra = QUESTIONS.filter((question) => question.id.startsWith("cx-"));
  assert.equal(extra.length, 60);
  extra.forEach((question) => {
    assert.equal(question.options.length, 4, question.id);
    question.options.forEach((option) => assert.ok(option.feedback, `${question.id} / ${option.id}`));
  });
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

test("学年系統の独自問題を6SKILL・各12問収録している", () => {
  const systematic = QUESTIONS.filter((question) => question.id.startsWith("sys-"));
  assert.equal(systematic.length, 72);
  const skills = [
    "words.semantic_groups", "words.feeling_character", "words.traditional_expressions",
    "words.word_formation", "words.learning_terms", "sentence.register_keigo",
  ];
  skills.forEach((skill) => assert.equal(systematic.filter((question) => question.skill === skill).length, 12, skill));
  systematic.forEach((question) => {
    assert.equal(question.options.length, 4, question.id);
    assert.equal(question.options.filter((option) => option.quality === "best").length, 1, question.id);
    assert.ok(question.curriculumTags?.length >= 2, `${question.id}: curriculumTags`);
    assert.ok(question.vocabularyIds?.length, `${question.id}: vocabularyIds`);
  });
});

test("ことばファイルは独自問題と1対1で参照できる", () => {
  assert.equal(SYSTEMATIC_VOCABULARY.length, 72);
  const ids = new Set(SYSTEMATIC_VOCABULARY.map((word) => word.id));
  assert.equal(ids.size, 72);
  SYSTEMATIC_VOCABULARY.forEach((word) => {
    assert.ok(word.term && word.category && word.meaning && word.example, word.id);
    word.questionIds.forEach((id) => assert.ok(QUESTIONS.some((question) => question.id === id), `${word.id}: ${id}`));
  });
});

test("達成バッジは42個で、正解以外の学習行動も評価する", () => {
  assert.equal(BADGES.length, 42);
  assert.equal(new Set(BADGES.map((badge) => badge.id)).size, 42);
  const sampleQuestion = QUESTIONS.find((question) => question.purpose === "transfer");
  const attempts = [{
    questionId:sampleQuestion.id, lab:sampleQuestion.lab, skill:sampleQuestion.skill,
    depth:sampleQuestion.depth, quality:"best", tryNumber:2, usedHint:true,
    mode:"focus", answeredAt:"2026-08-25T10:00:00.000Z",
  }];
  const ids = evaluateBadgeIds({ attempts, questions:QUESTIONS, researchLevel:2 });
  ["process-first-step", "process-comeback", "process-hint", "process-review", "process-transfer", "rank-2"]
    .forEach((id) => assert.ok(ids.includes(id), id));
});
