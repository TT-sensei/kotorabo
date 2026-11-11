const ROOT = "https://tt-sensei.github.io/navi-character-/assets/web";

const SITE = "https://tt-sensei.github.io/navi-character-";

export const NAVI = Object.freeze({
  groupStudying: `${ROOT}/groups/group-studying.webp`,
  // トップのヒーロー用：ことばの学びに合う場面イラストを読み込みごとに切り替える
  // group-learning-pair-* は原本PNGがサーバー上で壊れているためweb版を使う
  heroScenes: [
    `${ROOT}/groups/learning/group-learning-pair-reading.webp`,
    `${ROOT}/groups/learning/group-learning-pair-diagram.webp`,
    `${SITE}/assets/groups/learning/pair-learning-readaloud-saku-nami.png`,
  ],
  start: `${ROOT}/characters/sora/fullbody/waving.webp`,
  correct: `${ROOT}/characters/tsuki/fullbody/correct.webp`,
  acceptable: `${ROOT}/characters/kai/fullbody/hint.webp`,
  retry: `${ROOT}/characters/nami/fullbody/retry.webp`,
  hint: `${ROOT}/characters/kai/fullbody/thinking.webp`,
  focus: `${ROOT}/characters/riku/fullbody/pointing.webp`,
  complete: `${ROOT}/characters/saku/fullbody/complete.webp`,
});

export const naviImage = (src, alt = "", className = "navi-image") =>
  `<img class="${className}" src="${src}" alt="${alt}" loading="lazy" decoding="async" onerror="this.hidden=true">`;

