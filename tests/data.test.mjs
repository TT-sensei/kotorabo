import test from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS, DIAGNOSTIC_IDS, VOCABULARY_DATA } from "../js/data/questions.js";
import { SYSTEMATIC_VOCABULARY } from "../js/data/question-sets/systematic-language.js";
import { COMPOUND_STRUCTURE_DATA } from "../js/data/question-sets/compound-structure.js";
import { VOCABULARY_EXPANSION_DATA } from "../js/data/question-sets/vocabulary-expansion.js";
import { LANGUAGE_USE_DATA } from "../js/data/question-sets/language-use.js";
import { MUNICIPAL_VOCABULARY_DATA } from "../js/data/question-sets/municipal-vocabulary.js";
import { LABS, SKILL_MAP } from "../js/data/skill-map.js";
import { buildDiagnosticSession, buildFocusSession, buildSession, orderQuestionOptions } from "../js/core/engine.js";
import { BADGES, evaluateBadgeIds } from "../js/data/badges.js";

test("学習ジャンルは語彙に特化した6ジャンル", () => {
  assert.deepEqual(Object.keys(LABS), ["meaning", "precise", "feelings", "sensory", "learning", "structure"]);
  assert.equal(SKILL_MAP.length, 6);
  assert.ok(SKILL_MAP.every((skill) => skill.id.startsWith("vocab.")));
});

test("有効な問題バンクは語彙問題だけで構成される", () => {
  assert.equal(QUESTIONS.length, 198);
  assert.equal(VOCABULARY_EXPANSION_DATA.length, 60);
  assert.equal(MUNICIPAL_VOCABULARY_DATA.length, 36);
  assert.equal(new Set(QUESTIONS.map((question) => question.id)).size, QUESTIONS.length);
  const skillIds = new Set(SKILL_MAP.map((skill) => skill.id));
  QUESTIONS.forEach((question) => {
    assert.ok(LABS[question.lab], `${question.id}: lab`);
    assert.ok(skillIds.has(question.skill), `${question.id}: skill`);
    assert.equal(question.lab, question.skill.replace("vocab.", ""), `${question.id}: category match`);
    assert.equal(question.options.length, 4, `${question.id}: four choices`);
    assert.equal(question.options.filter((option) => option.quality === "best").length, 1, `${question.id}: one best`);
    assert.ok(question.options.every((option) => ["best", "acceptable", "incorrect"].includes(option.quality)));
    assert.ok(question.hint && question.explanation, `${question.id}: learning support`);
    assert.ok(question.contentLevel >= 1 && question.contentLevel <= 6, `${question.id}: level`);
    assert.ok(question.depth >= 1 && question.depth <= 6, `${question.id}: depth`);
  });
  assert.ok(QUESTIONS.every((question) => !question.skill.startsWith("sentence.") && !question.skill.startsWith("connection.") && !question.skill.startsWith("passage.")));
  assert.ok(QUESTIONS.every((question) => question.lab !== "expressions"));
});

test("診断は学年に応じて利用できる語彙ジャンルから出題する", () => {
  const gradeSix = buildDiagnosticSession(QUESTIONS, DIAGNOSTIC_IDS, { grade:6, challengeLevel:6 });
  assert.equal(gradeSix.length, 6);
  assert.deepEqual(new Set(gradeSix.map((item) => QUESTIONS.find((question) => question.id === item.questionId).lab)).size, 6);
  const gradeOne = buildDiagnosticSession(QUESTIONS, DIAGNOSTIC_IDS, { grade:1, challengeLevel:1 });
  assert.ok(gradeOne.length >= 3);
  assert.ok(gradeOne.every((item) => QUESTIONS.find((question) => question.id === item.questionId).contentLevel <= 1));
});

test("今日のチャレンジは全学年で3・5・10問を重複なく編成できる", () => {
  for (let grade = 1; grade <= 6; grade += 1) {
    for (const size of [3, 5, 10]) {
      const session = buildSession(QUESTIONS, { grade, challengeLevel:grade }, [], size);
      assert.equal(session.length, size, `grade ${grade} / ${size}`);
      assert.equal(new Set(session.map((item) => item.questionId)).size, size, `grade ${grade} / ${size} unique`);
      assert.ok(session.every((item) => QUESTIONS.some((question) => question.id === item.questionId)));
    }
  }
});

test("6ジャンルすべてで5問の特訓を編成できる", () => {
  for (const skill of SKILL_MAP) {
    const session = buildFocusSession(QUESTIONS, { grade:3, challengeLevel:3 }, [], skill.id, 5);
    const questions = session.map((item) => QUESTIONS.find((question) => question.id === item.questionId));
    assert.equal(session.length, 5, skill.id);
    assert.equal(new Set(session.map((item) => item.questionId)).size, 5, `${skill.id}: unique`);
    assert.ok(questions.every((question) => question.lab === skill.lab), `${skill.id}: same domain`);
    assert.ok(questions.some((question) => question.skill === skill.id), `${skill.id}: selected skill`);
  }
});

test("学年とチャレンジレベルは分けて扱える", () => {
  const session = buildSession(QUESTIONS, { grade:6, challengeLevel:1 }, [], 10);
  const questions = session.map((item) => QUESTIONS.find((question) => question.id === item.questionId));
  assert.ok(questions.every((question) => question.gradeMin <= 1));
  assert.ok(questions.every((question) => question.contentLevel <= 2));
});

test("ことばファイルは問題で出会う語句だけを集め、問題IDと結び付く", () => {
  assert.ok(VOCABULARY_DATA.length >= 170);
  assert.equal(new Set(VOCABULARY_DATA.map((word) => word.id)).size, VOCABULARY_DATA.length);
  const ids = new Set(QUESTIONS.map((question) => question.id));
  VOCABULARY_DATA.forEach((word) => {
    assert.ok(word.term && word.category && word.meaning && word.example, word.id);
    assert.ok(word.questionIds.length > 0, word.id);
    word.questionIds.forEach((id) => assert.ok(ids.has(id), `${word.id}: ${id}`));
  });
  assert.deepEqual(new Set(VOCABULARY_DATA.map((word) => word.category)), new Set(Object.values(LABS).map((lab) => lab.short)));
  assert.ok(VOCABULARY_DATA.every((word) => word.category !== "昔からの表現"));
});

test("学年段階の語彙セットにはことわざ・慣用句・敬語などを含めない", () => {
  assert.equal(SYSTEMATIC_VOCABULARY.length, 48);
  assert.ok(SYSTEMATIC_VOCABULARY.every((word) => word.category !== "相手に合わせる言葉" && word.category !== "ことわざ・慣用句・故事成語"));
  assert.ok(QUESTIONS.every((question) => !question.subskill.includes("敬語") && !question.subskill.includes("接続詞")));
});

test("熟語の構成は6種類の関係を含み、語句ファイルに登録される", () => {
  assert.equal(COMPOUND_STRUCTURE_DATA.length, 12);
  const compounds = QUESTIONS.filter((question) => question.id.startsWith("kb2-cs-"));
  assert.equal(compounds.length, 12);
  const types = new Set(compounds.map((question) => question.subskill));
  assert.equal(types.size, 6);
  compounds.forEach((question) => {
    assert.ok(question.vocabularyTerm);
    assert.ok(VOCABULARY_DATA.some((word) => word.term === question.vocabularyTerm && word.questionIds.includes(question.id)));
  });
});

test("新しい語彙60問は6ジャンルに均等に追加される", () => {
  const counts = Object.fromEntries(Object.keys(LABS).map((lab) => [lab, 0]));
  VOCABULARY_EXPANSION_DATA.forEach(([, question]) => { counts[question.lab] += 1; });
  assert.deepEqual(counts, { meaning:10, precise:10, feelings:10, sensory:10, learning:10, structure:10 });
  VOCABULARY_EXPANSION_DATA.forEach(([id, question]) => {
    assert.ok(question.vocabularyTerm, id);
    assert.ok(question.vocabularyMeaning, id);
    assert.ok(question.vocabularyExample, id);
  });
});

test("文脈で使う語彙問題は独自作成され、学びの観点が付いている", () => {
  assert.equal(LANGUAGE_USE_DATA.length, 12);
  const lenses = new Set(LANGUAGE_USE_DATA.map(([, question]) => question.learningLens));
  assert.deepEqual(lenses, new Set(["treasure", "dialogue", "academic", "structure"]));
  LANGUAGE_USE_DATA.forEach(([id, question]) => {
    assert.equal(question.purpose, "transfer", id);
    assert.ok(question.context && question.vocabularyTerm && question.vocabularyMeaning && question.vocabularyExample, id);
  });
});

test("新しい教科横断語彙36問は6ジャンルに均等に追加される", () => {
  const counts = Object.fromEntries(Object.keys(LABS).map((lab) => [lab, 0]));
  MUNICIPAL_VOCABULARY_DATA.forEach(([, question]) => { counts[question.lab] += 1; });
  assert.deepEqual(counts, { meaning:6, precise:6, feelings:6, sensory:6, learning:6, structure:6 });
  MUNICIPAL_VOCABULARY_DATA.forEach(([id, question]) => {
    assert.ok(question.vocabularyTerm, id);
    assert.ok(question.vocabularyMeaning, id);
    assert.ok(question.vocabularyExample, id);
    assert.ok(question.context && question.hint && question.explanation, id);
  });
});

test("選択肢の並び替えは再現可能", () => {
  const sample = QUESTIONS[0];
  assert.deepEqual(orderQuestionOptions(sample), orderQuestionOptions(sample));
});

test("達成バッジは6ジャンルに対応し、学習過程も評価する", () => {
  assert.equal(new Set(BADGES.map((badge) => badge.id)).size, BADGES.length);
  assert.equal(BADGES.filter((badge) => badge.id.startsWith("skill-")).length, 6);
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
