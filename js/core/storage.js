const PROFILE_KEY = "kotorabo.profile.v1";
const ATTEMPTS_KEY = "kotorabo.attempts.v1";
const BADGES_KEY = "kotorabo.badges.v1";
const NOTEBOOK_KEY = "kotorabo.notebook.v1";

function read(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export const loadProfile = () => read(PROFILE_KEY, null);
export const saveProfile = (profile) => localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
export const loadAttempts = () => {
  const value = read(ATTEMPTS_KEY, []);
  return Array.isArray(value) ? value.slice(-1000) : [];
};
export const saveAttempts = (attempts) => localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts.slice(-1000)));
export const loadBadges = () => {
  const value = read(BADGES_KEY, []);
  return Array.isArray(value) ? value.filter((id) => typeof id === "string") : [];
};
export const saveBadges = (badgeIds) => localStorage.setItem(BADGES_KEY, JSON.stringify([...new Set(badgeIds)]));
export const loadNotebook = () => {
  const value = read(NOTEBOOK_KEY, {});
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
};
export const saveNotebook = (notes) => localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(notes || {}));
export function resetLearningData() {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(ATTEMPTS_KEY);
  localStorage.removeItem(BADGES_KEY);
  localStorage.removeItem(NOTEBOOK_KEY);
}
