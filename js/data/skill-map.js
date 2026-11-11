export const LABS = {
  meaning: { icon: "Aa", label: "ことばの意味・仲間", short: "意味・仲間", color: "mint", question: "言葉の意味や仲間を見つけよう。" },
  precise: { icon: "◇", label: "ぴったりのことば", short: "ぴったり", color: "blue", question: "似た言葉の違いや、場面に合う言葉を考えよう。" },
  feelings: { icon: "♡", label: "気持ち・人がら", short: "気持ち", color: "amber", question: "心の動きや人がらを表す言葉を知ろう。" },
  sensory: { icon: "〰", label: "動き・様子・感覚", short: "動き・様子", color: "violet", question: "動きや様子を細やかに表す言葉を知ろう。" },
  learning: { icon: "学", label: "学習・思考のことば", short: "学習・思考", color: "rose", question: "調べる・比べる・考えるときに使う言葉を知ろう。" },
  structure: { icon: "組", label: "ことばの成り立ち・熟語の構成", short: "成り立ち", color: "teal", question: "言葉や熟語がどのようにできているか考えよう。" },
};

export const SKILL_MAP = [
  { id: "vocab.meaning", lab: "meaning", label: "意味と仲間を広げる", description: "言葉の意味、類義語・対義語・仲間分けを捉える。" },
  { id: "vocab.precise", lab: "precise", label: "似た言葉を使い分ける", description: "意味の近い言葉の違いや、場面に合う語を選ぶ。" },
  { id: "vocab.feelings", lab: "feelings", label: "気持ちと人がらを表す", description: "心情・性格・人への接し方を表す言葉を広げる。" },
  { id: "vocab.sensory", lab: "sensory", label: "動きや様子を細かく表す", description: "動作・音・感覚・状態を具体的に表す言葉を知る。" },
  { id: "vocab.learning", lab: "learning", label: "学習・思考の言葉を知る", description: "観点・仮説・検証など、教科の学習や考えを整理するときに使う語彙を広げる。" },
  { id: "vocab.structure", lab: "structure", label: "言葉・熟語の成り立ちを考える", description: "接頭語・接尾語・複合語・二字熟語の構成を捉える。" },
];

export const DEPTH_LABELS = ["", "見つける", "意味を知る", "比べて選ぶ", "使い分ける", "使ってみる", "別の場面でも"];
export const LEVEL_WORLDS = ["", "身近な言葉", "意味を広げる", "似た言葉を比べる", "表現を使い分ける", "抽象語や熟語を知る", "言葉を使いこなす"];
export const getSkill = (id) => SKILL_MAP.find((skill) => skill.id === id);
