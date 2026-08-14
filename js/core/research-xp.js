const RANKS = [
  { level: 1, title: "ことば見習い", xp: 0 },
  { level: 2, title: "ひらめき研究員", xp: 60 },
  { level: 3, title: "ことば研究員", xp: 150 },
  { level: 4, title: "文づくり研究員", xp: 270 },
  { level: 5, title: "つながり博士", xp: 420 },
  { level: 6, title: "伝える博士", xp: 600 },
  { level: 7, title: "ことば名人", xp: 820 },
  { level: 8, title: "ことば大名人", xp: 1080 },
  { level: 9, title: "ことばマスター", xp: 1380 },
  { level: 10, title: "ことばラボ所長", xp: 1720 },
];

export function getResearchStatus(value = 0) {
  const xp = Math.max(0, Number(value) || 0);
  let index = 0;
  for (let i = 1; i < RANKS.length; i += 1) {
    if (xp >= RANKS[i].xp) index = i;
  }
  const rank = RANKS[index];
  const next = RANKS[index + 1] || null;
  const progress = next
    ? Math.max(0, Math.min(100, Math.round((xp - rank.xp) / (next.xp - rank.xp) * 100)))
    : 100;
  return { ...rank, xp, nextAt: next?.xp ?? null, progress };
}

export function awardResearchXP({ quality, usedHint, tryNumber }) {
  const base = quality === "best" ? 12 : quality === "acceptable" ? 8 : 2;
  const supportAdjustment = (usedHint ? -2 : 0) + (tryNumber > 1 ? -2 : 0);
  return Math.max(1, base + supportAdjustment);
}
