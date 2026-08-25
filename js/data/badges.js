const ASSET = "https://tt-sensei.github.io/edu-assets/assets/web/badges";
const common = (name) => `${ASSET}/common/${name}/badge.webp`;
const japanese = (name) => `${ASSET}/japanese/${name}/badge.webp`;

const processBadges = [
  { id:"process-first-step", title:"はじめの一歩", description:"ことラボで初めて問題を考えた。", image:common("first-step") },
  { id:"process-ten", title:"ことば研究10", description:"10の違う問題を考えた。", image:common("curiosity") },
  { id:"process-fifty", title:"ことば研究50", description:"50の違う問題を考えた。", image:common("hard-worker") },
  { id:"process-comeback", title:"考え直してできた", description:"もう一度考えて、一番ぴったりを見つけた。", image:common("comeback") },
  { id:"process-never-give-up", title:"あきらめない心", description:"考え直してできた問題が5つになった。", image:common("never-give-up") },
  { id:"process-hint", title:"手がかり名人", description:"ヒントを使って考えを進めた。", image:common("idea") },
  { id:"process-independent", title:"自分で見つけた", description:"ヒントなしで10問、一番ぴったりを選んだ。", image:common("independent") },
  { id:"process-review", title:"ふりかえり名人", description:"特訓で苦手な力にもう一度取り組んだ。", image:common("review-master") },
  { id:"process-transfer", title:"別の場面でも", description:"同じ考え方を違う場面で使えた。", image:common("growth") },
  { id:"process-five-days", title:"こつこつ研究員", description:"5日、ことばの研究に取り組んだ。", image:common("steady-progress") },
];

const skillImages = [
  "word-sprout", "word-detective", "expression", "between-the-lines", "language-explorer",
  "word-tree", "key-point", "paraphrase", "word-weaver", "careful-writing",
  "communication", "active-listening", "words-connect", "structure-reader", "text-evidence",
  "deeper-reading", "revision", "self-correction", "language-rhythm",
];

const skillBadges = [
  ["words.basic_meaning","ことばの意味"], ["words.semantic_groups","ことばの仲間"],
  ["words.precise_choice","ぴったりのことば"], ["words.feeling_character","気持ちと人がら"],
  ["words.traditional_expressions","昔から伝わる言葉"], ["words.word_formation","ことばの組み立て"],
  ["words.learning_terms","学習に使う言葉"], ["words.abstract_objective","説明のことば"],
  ["sentence.core","文のほねぐみ"], ["sentence.detail_order","くわしく伝える"],
  ["sentence.reader_design","相手に伝わる文"], ["sentence.register_keigo","場面に合う言い方"],
  ["connection.sequence_cause","順序とわけ"], ["connection.connectives","接続詞"],
  ["connection.logic_relations","文と文のつながり"], ["connection.logic_quality","つながりを確かめる"],
  ["passage.order_topic","文のまとまり"], ["passage.structure","文章の組み立て"],
  ["passage.revision_design","もっと伝わる文章"],
].map(([skillId, label], index) => ({
  id:`skill-${skillId.replaceAll(".", "-")}`,
  skillId,
  title:`${label}研究員`,
  description:`「${label}」で、違う問題を3つ考えた。`,
  image:japanese(skillImages[index]),
}));

const labInfo = [
  ["words","ことば", "word-detective", "mastery"],
  ["sentence","文づくり", "careful-writing", "great-answer"],
  ["connection","つながり", "words-connect", "connection"],
  ["passage","文章", "structure-reader", "problem-solver"],
];

const labBadges = labInfo.flatMap(([lab, label, japaneseImage, commonImage]) => [
  { id:`lab-${lab}-growing`, lab, stage:"growing", title:`${label}ラボ 成長中`, description:`${label}ラボで5つの問題に取り組んだ。`, image:japanese(japaneseImage) },
  { id:`lab-${lab}-transfer`, lab, stage:"transfer", title:`${label}ラボ 深まり`, description:`${label}ラボで深く考え、別の場面にも挑戦した。`, image:common(commonImage) },
]);

const rankBadges = [
  [2,"ひらめき研究員","new-skill"], [4,"文づくり研究員","level-up"],
  [6,"伝える博士","knowledge"], [8,"ことば大名人","mastery"], [10,"ことばラボ所長","champion"],
].map(([rank, title, image]) => ({ id:`rank-${rank}`, rank, title, description:`研究者レベル${rank}に到達した。`, image:common(image) }));

export const BADGES = [...processBadges, ...skillBadges, ...labBadges, ...rankBadges];
export const getBadge = (id) => BADGES.find((badge) => badge.id === id);

export function evaluateBadgeIds({ attempts = [], questions = [], researchLevel = 1 }) {
  const awarded = new Set();
  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const uniqueQuestions = new Set(attempts.map((attempt) => attempt.questionId));
  const best = attempts.filter((attempt) => attempt.quality === "best");
  const recovered = best.filter((attempt) => attempt.tryNumber > 1);
  const dates = new Set(attempts.map((attempt) => String(attempt.answeredAt || "").slice(0, 10)).filter(Boolean));

  if (attempts.length) awarded.add("process-first-step");
  if (uniqueQuestions.size >= 10) awarded.add("process-ten");
  if (uniqueQuestions.size >= 50) awarded.add("process-fifty");
  if (recovered.length) awarded.add("process-comeback");
  if (new Set(recovered.map((attempt) => attempt.questionId)).size >= 5) awarded.add("process-never-give-up");
  if (attempts.some((attempt) => attempt.usedHint)) awarded.add("process-hint");
  if (new Set(best.filter((attempt) => !attempt.usedHint).map((attempt) => attempt.questionId)).size >= 10) awarded.add("process-independent");
  if (attempts.some((attempt) => attempt.mode === "focus")) awarded.add("process-review");
  if (best.some((attempt) => questionMap.get(attempt.questionId)?.purpose === "transfer")) awarded.add("process-transfer");
  if (dates.size >= 5) awarded.add("process-five-days");

  skillBadges.forEach((badge) => {
    const skillAttempts = attempts.filter((attempt) => attempt.skill === badge.skillId && attempt.quality !== "incorrect");
    if (new Set(skillAttempts.map((attempt) => attempt.questionId)).size >= 3 && skillAttempts.some((attempt) => attempt.quality === "best")) awarded.add(badge.id);
  });

  labBadges.forEach((badge) => {
    const labAttempts = attempts.filter((attempt) => attempt.lab === badge.lab);
    const unique = new Set(labAttempts.map((attempt) => attempt.questionId)).size;
    if (badge.stage === "growing" && unique >= 5) awarded.add(badge.id);
    if (badge.stage === "transfer") {
      const deepBest = labAttempts.filter((attempt) => attempt.quality === "best" && attempt.depth >= 5);
      const transferred = labAttempts.some((attempt) => attempt.quality === "best" && questionMap.get(attempt.questionId)?.purpose === "transfer");
      if (new Set(deepBest.map((attempt) => attempt.questionId)).size >= 3 && transferred) awarded.add(badge.id);
    }
  });

  rankBadges.forEach((badge) => { if (researchLevel >= badge.rank) awarded.add(badge.id); });
  return [...awarded];
}

