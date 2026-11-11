import { WORD_QUESTION_DATA } from "./question-sets/words.js";
import { SYSTEMATIC_LANGUAGE_DATA, SYSTEMATIC_VOCABULARY } from "./question-sets/systematic-language.js";
import { COMPOUND_STRUCTURE_DATA } from "./question-sets/compound-structure.js";
import { VOCABULARY_EXPANSION_DATA } from "./question-sets/vocabulary-expansion.js";
import { LANGUAGE_USE_DATA } from "./question-sets/language-use.js";
import { MUNICIPAL_VOCABULARY_DATA } from "./question-sets/municipal-vocabulary.js";
import { LABS } from "./skill-map.js";

// ことラボで扱うのは語彙・表現に関する問題だけです。
// 文法、接続詞、敬語、主語・述語、文章構成の問題はこの問題バンクに含めません。
const categoryFor = (skill, subskill = "") => {
  if (skill === "vocab.structure") return "structure";
  if (skill === "words.basic_meaning") {
    if (/気持ち/.test(subskill)) return "feelings";
    if (/動き|音|様子|雨|持ち方|話し方|感覚/.test(subskill)) return "sensory";
    return "meaning";
  }
  if (skill === "words.precise_choice") {
    if (/気持ち/.test(subskill)) return "feelings";
    if (/動作語/.test(subskill)) return "sensory";
    return "precise";
  }
  if (skill === "words.learning_terms") return "learning";
  if (skill === "words.abstract_objective") return "meaning";
  if (skill === "words.semantic_groups") {
    if (/動き|音|様子/.test(subskill)) return "sensory";
    return "meaning";
  }
  if (skill === "words.feeling_character") return "feelings";
  if (skill === "words.word_formation") return "structure";
  return null;
};

const make = (id, data) => ({
  id,
  version: 1,
  format: "choice",
  thinkingTags: [],
  crossTags: [],
  ...data,
  options: data.options.map(([text, quality, feedback], index) => ({
    id: String.fromCharCode(97 + index),
    text,
    quality,
    feedback: feedback || "",
  })),
});

const normalizeLegacyPair = ([id, data]) => {
  const category = categoryFor(data.skill, data.subskill);
  if (!category) return null;
  return [id, { ...data, lab: category, skill: `vocab.${category}` }];
};

const rawPairs = [
  ...WORD_QUESTION_DATA.map(normalizeLegacyPair),
  ...SYSTEMATIC_LANGUAGE_DATA.map(normalizeLegacyPair),
  ...COMPOUND_STRUCTURE_DATA,
  ...VOCABULARY_EXPANSION_DATA,
  ...LANGUAGE_USE_DATA,
  ...MUNICIPAL_VOCABULARY_DATA,
].filter(Boolean);

export const QUESTIONS = rawPairs.map(([id, data]) => make(id, data));
export const DIAGNOSTIC_IDS = [
  "kb2-w-l1-03",
  "kb2-w-l3-01",
  "kb2-w-l1-01",
  "kb2-w-l1-02",
  "sys-learning-04",
  "kb2-cs-similar-01",
];
export const getQuestion = (id) => QUESTIONS.find((question) => question.id === id);

// 問題で実際に出会った言葉だけを、ことばファイルへ登録します。
// 複数の問題で同じ語句に出会ったときは、一つのカードにまとめます。
const systematicByQuestion = new Map(
  SYSTEMATIC_VOCABULARY.flatMap((word) => word.questionIds.map((id) => [id, word])),
);
const vocabularyMap = new Map();

for (const question of QUESTIONS) {
  const saved = systematicByQuestion.get(question.id);
  const best = question.options.find((option) => option.quality === "best");
  const related = question.options.find((option) => option.quality === "acceptable");
  const term = question.vocabularyTerm || saved?.term || best?.text;
  if (!term) continue;

  const key = `${question.lab}::${term}`;
  const existing = vocabularyMap.get(key);
  if (existing) {
    existing.questionIds.push(question.id);
    existing.contentLevel = Math.min(existing.contentLevel, question.contentLevel || 1);
    existing.levelLabel = `内容L${existing.contentLevel}`;
    continue;
  }

  const contentLevel = question.contentLevel || 1;
  vocabularyMap.set(key, {
    id: `vocab-${question.id}`,
    term,
    category: LABS[question.lab].short,
    contentLevel,
    levelLabel: `内容L${contentLevel}`,
    meaning: question.vocabularyMeaning || saved?.meaning || question.explanation || "問題の中で意味を確かめた言葉です。",
    example: question.vocabularyExample || saved?.example || question.context || question.prompt,
    related: saved?.related || related?.text || "",
    questionIds: [question.id],
  });
}

export const VOCABULARY_DATA = [...vocabularyMap.values()];
