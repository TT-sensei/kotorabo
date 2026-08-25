const ROOT = "https://tt-sensei.github.io/navi-character-/assets/web";

export const NAVI = Object.freeze({
  groupStudying: `${ROOT}/groups/group-studying.webp`,
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

