const PROFILE_KEY = "kotorabo.profile.v1";
const ATTEMPTS_KEY = "kotorabo.attempts.v1";

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
export function resetLearningData() {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(ATTEMPTS_KEY);
}
