export const LABS = {
  words: { icon: "Aa", label: "ことばラボ", short: "ことば", color: "mint", question: "どのことばがぴったり？" },
  sentence: { icon: "文", label: "文づくりラボ", short: "文づくり", color: "blue", question: "どうすれば伝わる文になる？" },
  connection: { icon: "⇄", label: "つながりラボ", short: "つながり", color: "amber", question: "どんな関係でつながっている？" },
  passage: { icon: "¶", label: "文章ラボ", short: "文章", color: "violet", question: "どう組み立てれば伝わる？" },
};

// idは学習履歴のキーです。一度公開したidは変更しません。
export const SKILL_MAP = [
  { id: "words.basic_meaning", lab: "words", label: "ことばの意味", description: "基本語の意味や仲間を捉える。" },
  { id: "words.semantic_groups", lab: "words", label: "ことばの仲間", description: "身近な言葉を意味のまとまりで整理する。" },
  { id: "words.precise_choice", lab: "words", label: "ぴったりのことば", description: "場面や目的に合う語を選ぶ。" },
  { id: "words.feeling_character", lab: "words", label: "気持ちと人がら", description: "心情・行動・性格を表す言葉を使い分ける。" },
  { id: "words.traditional_expressions", lab: "words", label: "昔から伝わる言葉", description: "ことわざ・慣用句・故事成語の意味を捉える。" },
  { id: "words.word_formation", lab: "words", label: "ことばの組み立て", description: "接頭語・接尾語・複合語の成り立ちを考える。" },
  { id: "words.learning_terms", lab: "words", label: "学習に使う言葉", description: "要旨・根拠・対比など、考えるための言葉を使う。" },
  { id: "words.abstract_objective", lab: "words", label: "説明のことば", description: "抽象語と客観・主観を扱う。" },
  { id: "sentence.core", lab: "sentence", label: "文のほねぐみ", description: "主語と述語の対応を捉える。" },
  { id: "sentence.detail_order", lab: "sentence", label: "くわしく伝える", description: "情報、修飾、語順を整える。" },
  { id: "sentence.reader_design", lab: "sentence", label: "相手に伝わる文", description: "目的と相手に合わせて文を調整する。" },
  { id: "sentence.register_keigo", lab: "sentence", label: "場面に合う言い方", description: "敬語や話し言葉・書き言葉を相手に合わせる。" },
  { id: "connection.sequence_cause", lab: "connection", label: "順序とわけ", description: "順序、原因、結果を捉える。" },
  { id: "connection.connectives", lab: "connection", label: "接続詞を使い分ける", description: "73問で、だから・しかし・例えばなどを文の関係に合わせて選ぶ。" },
  { id: "connection.logic_relations", lab: "connection", label: "文と文のつながり", description: "理由、具体例、対比などを区別する。" },
  { id: "connection.logic_quality", lab: "connection", label: "つながりを確かめる", description: "根拠や論理の十分さを考える。" },
  { id: "passage.order_topic", lab: "passage", label: "文のまとまり", description: "話題と自然な順序を捉える。" },
  { id: "passage.structure", lab: "passage", label: "文章の組み立て", description: "主張、理由、具体例、まとめを捉える。" },
  { id: "passage.revision_design", lab: "passage", label: "もっと伝わる文章", description: "不足やずれを直し、文章を設計する。" },
];

export const DEPTH_LABELS = ["", "見つける", "なかま分け", "えらぶ", "直してみる", "使ってみる", "ちがうお話でも"];
export const LEVEL_WORLDS = ["", "身近なことば", "詳しく伝える", "つながりを見つける", "分かりやすく伝える", "考えを組み立てる", "よりよく表現する"];
export const getSkill = (id) => SKILL_MAP.find((skill) => skill.id === id);
