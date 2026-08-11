const DEFAULT_DEPTH = [0, 1, 3, 3, 4, 5, 6];

// 問題を追加するときは、各LABのファイルでこの関数を使います。
// options は [表示文, best/acceptable/incorrect, 選んだときの短い説明] の順です。
export const question = (lab, prefix) => (
  id,
  level,
  skill,
  subskill,
  theme,
  context,
  prompt,
  options,
  hint,
  explanation,
  meta = {},
) => [
  `kb2-${prefix}-${id}`,
  {
    lab,
    skill,
    subskill,
    contentLevel: level,
    depth: meta.depth ?? DEFAULT_DEPTH[level],
    purpose: meta.purpose ?? (id.endsWith("05") ? "transfer" : "practice"),
    thinkingTags: meta.thinkingTags ?? [],
    crossTags: meta.crossTags ?? [],
    theme,
    gradeMin: meta.gradeMin ?? level,
    ...(context ? { context } : {}),
    ...(meta.audience ? { audience: meta.audience } : {}),
    ...(meta.goal ? { goal: meta.goal } : {}),
    ...(meta.similarGroup ? { similarGroup: meta.similarGroup } : {}),
    ...(meta.transferGroup ? { transferGroup: meta.transferGroup } : {}),
    prompt,
    // 原稿では正解を先頭に書けるようにしつつ、実際の表示位置はIDから安定的に分散します。
    options: (() => {
      const offset = [...`${prefix}-${id}`].reduce((sum, char) => sum + char.charCodeAt(0), 0) % options.length;
      return [...options.slice(offset), ...options.slice(0, offset)];
    })(),
    hint,
    explanation,
    ...(meta.tryIt ? { tryIt: meta.tryIt } : {}),
  },
];
