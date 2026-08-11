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
  // diagnosticは「初回にも使う」という主用途。診断後の定着確認にも再利用できます。
  const available = bank.filter((q) => q.gradeMin <= profile.grade && q.contentLevel <= Math.min(6, profile.grade + 1));
  const used = new Set();
  const result = [];
  const weak = new Set(progress.filter((p) => p.needsReview).map((p) => p.skill));
  const known = new Set(progress.filter((p) => p.attempts > 0).map((p) => p.skill));
  const strong = new Set(progress.filter((p) => p.stableDepth >= 3).map((p) => p.skill));

  function take(role, test) {
    let pool = stableSort(available.filter((q) => !used.has(q.id) && !recentIds.has(q.id) && test(q)), `${seed}:${role}`);
    if (!pool.length) pool = stableSort(available.filter((q) => !used.has(q.id) && test(q)), `${seed}:${role}:fallback`);
    if (!pool.length) return false;
    used.add(pool[0].id);
    result.push({ questionId: pool[0].id, role });
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
    else if (role === "stretch") take(role, (q) => q.contentLevel === Math.min(6, profile.grade + 1)) || take(role, (q) => q.depth >= 4);
    else take(role, (q) => !known.has(q.skill)) || take(role, () => true);
  });
  while (result.length < size && take("current", () => true)) { /* 候補がある限り追加 */ }
  return result.slice(0, size);
}

export function findDelayedRetry(bank, current, usedIds, grade) {
  return bank.find((q) => q.id !== current.id && !usedIds.has(q.id) && q.skill === current.skill && q.gradeMin <= grade && (q.similarGroup !== current.similarGroup || q.transferGroup === current.transferGroup));
}
