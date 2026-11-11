import { SKILL_MAP } from "../data/skill-map.js";

function hash(input) {
  let value = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    value ^= input.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return Math.abs(value);
}

const stableSort = (items, seed) => [...items].sort((a, b) => hash(`${seed}:${a.id}`) - hash(`${seed}:${b.id}`));

export const orderQuestionOptions = (question) => stableSort(question.options, `${question.id}:option`);

export function buildDiagnosticSession(bank, diagnosticIds, profile) {
  const targetLevel = profile.challengeLevel ?? profile.grade;
  const diagnosticSet = new Set(diagnosticIds);
  const available = bank.filter((question) => diagnosticSet.has(question.id) && question.gradeMin <= targetLevel);

  return [...new Set(SKILL_MAP.map((skill) => skill.lab))].map((lab) => {
    const candidates = stableSort(
      available.filter((question) => question.lab === lab),
      `diagnostic:${targetLevel}:${lab}`,
    ).sort((a, b) => b.contentLevel - a.contentLevel);
    return candidates[0] ? { questionId: candidates[0].id, role: "diagnostic" } : null;
  }).filter(Boolean);
}

export function buildProgress(attempts) {
  return SKILL_MAP.map((definition) => {
    const records = attempts.filter((item) => item.skill === definition.id);
    const successful = records.filter((item) => item.quality === "best" && !item.usedHint).map((item) => item.depth);
    const partial = records.filter((item) => item.quality !== "incorrect").map((item) => Math.max(1, item.depth - 1));
    const stableDepth = successful.length ? Math.max(...successful) : partial.length ? Math.max(...partial) : 0;
    const recent = records.slice(-4);
    const unsteady = recent.filter((item) => item.quality !== "best" || item.usedHint || item.tryNumber > 1).length;
    return {
      skill: definition.id,
      lab: definition.lab,
      attempts: records.length,
      best: records.filter((item) => item.quality === "best").length,
      incorrect: records.filter((item) => item.quality === "incorrect").length,
      stableDepth,
      needsReview: records.length > 0 && unsteady >= Math.ceil(recent.length / 2),
    };
  });
}

export function labReadiness(progress, lab) {
  const items = progress.filter((item) => item.lab === lab && item.attempts > 0);
  if (!items.length) return { label: "ここからスタート！", value: 0 };
  const value = Math.round(items.reduce((sum, item) => sum + Math.min(6, item.stableDepth), 0) / (items.length * 6) * 100);
  return { label: value >= 70 ? "ちがうお話へ！" : value >= 40 ? "いい感じ！" : "少しずついこう", value };
}

function adaptiveLevelForSkill(skillId, bank, attempts) {
  const questionById = new Map(bank.map((question) => [question.id, question]));
  const records = attempts.filter((attempt) => attempt.skill === skillId).slice(-4);
  if (!records.length) return 1;
  const successfulLevels = records
    .filter((attempt) => attempt.quality === "best" && !attempt.usedHint)
    .map((attempt) => questionById.get(attempt.questionId)?.contentLevel || 1);
  const recent = records.slice(-3);
  const recentSuccesses = recent.filter((attempt) => attempt.quality === "best" && !attempt.usedHint).length;
  const recentMisses = recent.filter((attempt) => attempt.quality === "incorrect").length;
  const highestStable = successfulLevels.length ? Math.max(...successfulLevels) : 1;
  if (recent.length >= 2 && recentMisses >= 2) return Math.max(1, highestStable - 1);
  if (recent.length >= 2 && recentSuccesses >= 2) return Math.min(6, highestStable + 1);
  return Math.max(1, Math.min(6, highestStable));
}

export function buildSession(bank, profile, attempts, size) {
  const progress = buildProgress(attempts);
  const recentIds = new Set(attempts.slice(-5).map((item) => item.questionId));
  const seed = `${new Date().toISOString().slice(0, 10)}:${attempts.length}:${size}`;
  const skillLevels = new Map(SKILL_MAP.map((skill) => [skill.id, adaptiveLevelForSkill(skill.id, bank, attempts)]));
  const used = new Set();
  const result = [];
  const weak = new Set(progress.filter((item) => item.needsReview).map((item) => item.skill));
  const known = new Set(progress.filter((item) => item.attempts > 0).map((item) => item.skill));
  const strong = new Set(progress.filter((item) => item.stableDepth >= 3).map((item) => item.skill));

  function take(role, test) {
    let pool = stableSort(bank.filter((question) => {
      const level = skillLevels.get(question.skill) || 1;
      return !used.has(question.id) && !recentIds.has(question.id) && question.contentLevel <= level + 1 && test(question);
    }), `${seed}:${role}`);
    if (!pool.length) pool = stableSort(bank.filter((question) => {
      const level = skillLevels.get(question.skill) || 1;
      return !used.has(question.id) && question.contentLevel <= level + 1 && test(question);
    }), `${seed}:${role}:fallback`);
    if (!pool.length) return false;
    const recentThemes = new Set(result.slice(-2).map((item) => bank.find((question) => question.id === item.questionId)?.theme).filter(Boolean));
    const chosen = pool.find((question) => !question.theme || !recentThemes.has(question.theme)) || pool[0];
    used.add(chosen.id);
    result.push({ questionId: chosen.id, role });
    return true;
  }

  const pattern = size === 3
    ? ["retry", "current", "transfer"]
    : size === 5
      ? ["recall", "retry", "current", "stretch", "transfer"]
      : ["recall", "retry", "current", "transfer", "stretch", "retry", "current", "recall", "transfer", "stretch"];

  pattern.forEach((role) => {
    if (role === "retry") take(role, (question) => weak.has(question.skill)) || take(role, (question) => known.has(question.skill));
    else if (role === "recall") take(role, (question) => known.has(question.skill));
    else if (role === "transfer") take(role, (question) => question.purpose === "transfer" && (!strong.size || strong.has(question.skill))) || take(role, (question) => question.purpose === "transfer");
    else if (role === "stretch") take(role, (question) => question.contentLevel >= (skillLevels.get(question.skill) || 1));
    else take(role, (question) => !known.has(question.skill)) || take(role, () => true);
  });
  while (result.length < size && take("current", () => true)) { /* 問題がある限り出題 */ }
  return result.slice(0, size);
}

export function buildFocusSession(bank, profile, attempts, skillId, size = 5) {
  const skill = SKILL_MAP.find((item) => item.id === skillId);
  if (!skill) return [];
  const targetLevel = adaptiveLevelForSkill(skillId, bank, attempts);
  const progress = new Map(buildProgress(attempts).map((item) => [item.skill, item]));
  const recentIds = new Set(attempts.slice(-5).map((item) => item.questionId));
  const seed = `focus:${skillId}:${attempts.length}:${size}`;
  const candidates = bank.filter((question) => question.lab === skill.lab && question.contentLevel <= targetLevel + 1);
  const ranked = stableSort(candidates, seed).sort((a, b) => {
    const score = (question) => {
      const exact = question.skill === skillId ? 1000 : 0;
      const learning = progress.get(question.skill);
      const review = learning?.needsReview ? 120 : 0;
      const unseen = learning?.attempts ? 0 : 35;
      const nearby = 120 - Math.abs(question.contentLevel - targetLevel) * 24;
      const fresh = recentIds.has(question.id) ? -80 : 0;
      return exact + review + unseen + nearby + fresh;
    };
    return score(b) - score(a);
  });
  const chosen = ranked.filter((question) => question.skill === skillId).slice(0, size);
  for (const question of ranked) {
    if (chosen.length >= size) break;
    if (!chosen.some((item) => item.id === question.id)) chosen.push(question);
  }
  return chosen.slice(0, size).map((question) => ({ questionId: question.id, role: "focus" }));
}
export function findDelayedRetry(bank, current, usedIds, level) {
  const currentTags = new Set([...(current.thinkingTags || []), ...(current.crossTags || [])]);
  const candidates = bank.filter((q) => q.id !== current.id && !usedIds.has(q.id) && q.skill === current.skill && q.contentLevel <= level && (q.similarGroup !== current.similarGroup || q.transferGroup === current.transferGroup));
  return candidates.sort((a, b) => {
    const score = (question) => {
      const tags = [...(question.thinkingTags || []), ...(question.crossTags || [])];
      const tagOverlap = tags.filter((tag) => currentTags.has(tag)).length;
      const differentTheme = question.theme && question.theme !== current.theme ? 3 : 0;
      const sameTransfer = question.transferGroup && question.transferGroup === current.transferGroup ? 2 : 0;
      return tagOverlap + differentTheme + sameTransfer;
    };
    return score(b) - score(a);
  })[0];
}
