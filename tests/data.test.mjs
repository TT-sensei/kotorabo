import test from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS, VOCABULARY_DATA } from "../js/data/questions.js";
import { SYSTEMATIC_VOCABULARY } from "../js/data/question-sets/systematic-language.js";
import { COMPOUND_STRUCTURE_DATA } from "../js/data/question-sets/compound-structure.js";
import { VOCABULARY_EXPANSION_DATA } from "../js/data/question-sets/vocabulary-expansion.js";
import { LANGUAGE_USE_DATA } from "../js/data/question-sets/language-use.js";
import { MUNICIPAL_VOCABULARY_DATA } from "../js/data/question-sets/municipal-vocabulary.js";
import { LABS, SKILL_MAP } from "../js/data/skill-map.js";
import { adaptiveLevelForSkill, buildFocusSession, buildSession, orderQuestionOptions } from "../js/core/engine.js";
import { BADGES, evaluateBadgeIds } from "../js/data/badges.js";

test("学習ジャンルは語彙に特化した6ジャンル", () => {
  assert.deepEqual(Object.keys(LABS), ["meaning", "precise", "feelings", "sensory", "learning", "structure"]);
  assert.equal(SKILL_MAP.length, 6);
  assert.ok(SKILL_MAP.every((skill) => skill.id.startsWith("vocab.")));
});

test("有効な問題バンクは語彙問題だけで構成される", () => {
  assert.equal(QUESTIONS.length, 288);
  assert.equal(VOCABULARY_EXPANSION_DATA.length, 60);
  assert.equal(MUNICIPAL_VOCABULARY_DATA.length, 126);
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

test("自動難易度は各ジャンルの最もやさしい問題から始まる", () => {
  for (const skill of SKILL_MAP) {
    const levels = QUESTIONS.filter((question) => question.skill === skill.id).map((question) => question.contentLevel);
    assert.equal(adaptiveLevelForSkill(skill.id, QUESTIONS, []), Math.min(...levels), skill.id);
  }
});

test("自動難易度は正答が続くと上がり、つまずきが続くと安定段階へ戻る", () => {
  const sample = QUESTIONS.find((question) => question.skill === SKILL_MAP[0].id);
  const bank = [1, 2, 3].map((contentLevel) => ({
    ...sample, id:`adaptive-${contentLevel}`, contentLevel,
  }));
  const skill = sample.skill;
  assert.equal(adaptiveLevelForSkill(skill, bank, []), 1);
  const twoSuccesses = [1, 2].map(() => ({
    skill, questionId:"adaptive-1", quality:"best", usedHint:false,
  }));
  assert.equal(adaptiveLevelForSkill(skill, bank, twoSuccesses), 2);
  const recentMisses = [
    ...twoSuccesses,
    { skill, questionId:"adaptive-2", quality:"incorrect", usedHint:false },
    { skill, questionId:"adaptive-2", quality:"incorrect", usedHint:false },
  ];
  assert.equal(adaptiveLevelForSkill(skill, bank, recentMisses), 1);
  const topLevelSuccesses = [1, 2].map(() => ({
    skill, questionId:"adaptive-3", quality:"best", usedHint:false,
  }));
  assert.equal(adaptiveLevelForSkill(skill, bank, topLevelSuccesses), 3);
});

test("今日のチャレンジは学年選択なしで5問を重複なく編成できる", () => {
  const session = buildSession(QUESTIONS, {}, [], 5);
  assert.equal(session.length, 5);
  assert.equal(new Set(session.map((item) => item.questionId)).size, 5);
  assert.ok(session.every((item) => QUESTIONS.some((question) => question.id === item.questionId)));
});

test("チャレンジのstretchは可能な場合に適応レベルより一段上を出す", () => {
  const session = buildSession(QUESTIONS, {}, [], 5);
  const stretch = session.find((item) => item.role === "stretch");
  assert.ok(stretch, "stretch role exists");
  const question = QUESTIONS.find((item) => item.id === stretch.questionId);
  const target = adaptiveLevelForSkill(question.skill, QUESTIONS, []);
  assert.ok(question.contentLevel > target, `${question.id}: stretch should exceed ${target}`);
});

test("6ジャンルすべてで3問・5問の特訓を必ず編成できる", () => {
  for (const skill of SKILL_MAP) {
    for (const size of [3, 5]) {
      const session = buildFocusSession(QUESTIONS, { grade:3, challengeLevel:3 }, [], skill.id, size);
      const questions = session.map((item) => QUESTIONS.find((question) => question.id === item.questionId));
      assert.equal(session.length, size, `${skill.id}: ${size}問`);
      assert.equal(new Set(session.map((item) => item.questionId)).size, size, `${skill.id}: unique`);
      assert.ok(questions.every((question) => question.lab === skill.lab && question.skill === skill.id), `${skill.id}: same skill`);
    }
  }
});

test("直近の問題が多くても特訓の問題数を確保する", () => {
  for (const skill of SKILL_MAP) {
    const recent = QUESTIONS.filter((question) => question.skill === skill.id).slice(0, 5).map((question) => ({
      skill:skill.id, questionId:question.id, quality:"best", usedHint:false,
    }));
    const session = buildFocusSession(QUESTIONS, {}, recent, skill.id, 5);
    assert.equal(session.length, 5, skill.id);
    assert.equal(new Set(session.map((item) => item.questionId)).size, 5, skill.id);
  }
});

test("初回のチャレンジは各ジャンルの入門段階から出題する", () => {
  const session = buildSession(QUESTIONS, {}, [], 5);
  const selected = session.map((item) => QUESTIONS.find((question) => question.id === item.questionId));
  selected.forEach((question) => {
    const available = QUESTIONS.filter((item) => item.skill === question.skill).map((item) => item.contentLevel);
    assert.equal(question.contentLevel, Math.min(...available), question.id);
  });
});

test("ことばファイルは問題で出会う語句だけを集め、問題IDと結び付く", () => {
  assert.ok(VOCABULARY_DATA.length >= 170);
  assert.ok(VOCABULARY_DATA.every((word) => word.contentLevel >= 1 && word.contentLevel <= 6));
  assert.ok(VOCABULARY_DATA.every((word) => word.levelLabel === `内容L${word.contentLevel}`));
  assert.ok(VOCABULARY_DATA.every((word) => !Object.hasOwn(word, "gradeBand") && !Object.hasOwn(word, "gradeMin")));
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

test("新しい教科横断語彙126問は6ジャンルに均等に追加される", () => {
  const counts = Object.fromEntries(Object.keys(LABS).map((lab) => [lab, 0]));
  MUNICIPAL_VOCABULARY_DATA.forEach(([, question]) => { counts[question.lab] += 1; });
  assert.deepEqual(counts, { meaning:21, precise:21, feelings:21, sensory:21, learning:21, structure:21 });
  MUNICIPAL_VOCABULARY_DATA.forEach(([id, question]) => {
    assert.ok(question.vocabularyTerm, id);
    assert.ok(question.vocabularyMeaning, id);
    assert.ok(question.vocabularyExample, id);
    assert.ok(question.context && question.hint && question.explanation, id);
  });
});

test("「適切」と意味が重なる「適当」を誤答選択肢にしない", () => {
  const question = QUESTIONS.find((item) => item.id === "kb2-mv-precise-05");
  assert.ok(question);
  assert.ok(question.options.some((option) => option.text === "不明確"));
  assert.ok(question.options.every((option) => option.text !== "適当"));
});

test("選択肢の並び替えは再現可能", () => {
  const sample = QUESTIONS[0];
  assert.deepEqual(orderQuestionOptions(sample), orderQuestionOptions(sample));
});

test("正解の表示位置は4か所に偏りなく分散する", () => {
  const positions = [0, 0, 0, 0];
  QUESTIONS.forEach((question) => {
    const ordered = orderQuestionOptions(question);
    positions[ordered.findIndex((option) => option.quality === "best")] += 1;
  });
  positions.forEach((count, index) => {
    assert.ok(count >= 40 && count <= 100, `position ${index + 1}: ${count}`);
  });
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
