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

export function buildSession(bank, profile, attempts, size) {
  const progress = buildProgress(attempts);
  const recentIds = new Set(attempts.slice(-5).map((item) => item.questionId));
  const seed = `${new Date().toISOString().slice(0, 10)}:${attempts.length}:${size}`;
  const targetLevel = profile.challengeLevel ?? profile.grade;
  // diagnosticは「初回にも使う」という主用途。診断後の定着確認にも再利用できます。
  const available = bank.filter((q) => q.gradeMin <= targetLevel && q.contentLevel <= Math.min(6, targetLevel + 1));
  const used = new Set();
  const result = [];
  const weak = new Set(progress.filter((p) => p.needsReview).map((p) => p.skill));
  const known = new Set(progress.filter((p) => p.attempts > 0).map((p) => p.skill));
  const strong = new Set(progress.filter((p) => p.stableDepth >= 3).map((p) => p.skill));

  function take(role, test) {
    let pool = stableSort(available.filter((q) => !used.has(q.id) && !recentIds.has(q.id) && test(q)), `${seed}:${role}`);
    if (!pool.length) pool = stableSort(available.filter((q) => !used.has(q.id) && test(q)), `${seed}:${role}:fallback`);
    if (!pool.length) return false;
    const recentThemes = new Set(result.slice(-2).map((item) => bank.find((q) => q.id === item.questionId)?.theme).filter(Boolean));
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
    if (role === "retry") take(role, (q) => weak.has(q.skill)) || take(role, (q) => known.has(q.skill));
    else if (role === "recall") take(role, (q) => known.has(q.skill));
    else if (role === "transfer") take(role, (q) => q.purpose === "transfer" && (!strong.size || strong.has(q.skill))) || take(role, (q) => q.purpose === "transfer");
    else if (role === "stretch") take(role, (q) => q.contentLevel === Math.min(6, targetLevel + 1)) || take(role, (q) => q.depth >= 4);
    else take(role, (q) => !known.has(q.skill)) || take(role, () => true);
  });
  while (result.length < size && take("current", () => true)) { /* 候補がある限り追加 */ }
  return result.slice(0, size);
}

export function buildFocusSession(bank, profile, attempts, skillId, size = 5) {
  const skill = SKILL_MAP.find((item) => item.id === skillId);
  if (!skill) return [];

  const targetLevel = profile.challengeLevel ?? profile.grade;
  const progress = new Map(buildProgress(attempts).map((item) => [item.skill, item]));
  const recentIds = new Set(attempts.slice(-5).map((item) => item.questionId));
  const seed = `focus:${skillId}:${targetLevel}:${attempts.length}:${size}`;
  const candidates = bank.filter((question) => question.lab === skill.lab);

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

  const exact = ranked.filter((question) => question.skill === skillId);
  const related = ranked.filter((question) => question.skill !== skillId);
  const chosen = [];
  let exactIndex = 0;
  while (chosen.length < size && exactIndex < exact.length) {
    chosen.push(exact[exactIndex]);
    exactIndex += 1;
  }
  for (const question of related) {
    if (chosen.length >= size) break;
    chosen.push(question);
  }

  return chosen.slice(0, size).map((question) => ({ questionId: question.id, role: "focus" }));
}

export function findDelayedRetry(bank, current, usedIds, level) {
  const currentTags = new Set([...(current.thinkingTags || []), ...(current.crossTags || [])]);
  const candidates = bank.filter((q) => q.id !== current.id && !usedIds.has(q.id) && q.skill === current.skill && q.gradeMin <= level && (q.similarGroup !== current.similarGroup || q.transferGroup === current.transferGroup));
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
