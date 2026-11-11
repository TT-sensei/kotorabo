import { question } from "./helpers.js";

const meaning = question("meaning", "usem");
const precise = question("precise", "usep");
const feelings = question("feelings", "usef");
const sensory = question("sensory", "uses");
const learning = question("learning", "usel");
const structure = question("structure", "uset");

// 光村図書の公開資料からは、語彙を「心情・人物・事物」「伝え合い」「学習で用いる言葉」といった
// 観点で捉える考え方のみを参照。語句・場面・設問・選択肢・解説は本アプリ用に独自作成。
export const LANGUAGE_USE_DATA = [
  // 言葉の宝箱：気持ちや様子を、場面に合う言葉で表す
  feelings("use-feelings-01", 4, "vocab.feelings", "気持ちを具体的に表す", "友達との関わり", "発表の前、何度も練習したので、みんなの前でも落ち着いて話せました。", "このときの気持ちに最も近い言葉は？", [
    ["自信", "best", "練習を重ね、自分の力を信じている気持ちです。"],
    ["遠慮", "incorrect", "相手に気をつかい、自分の行動を控える気持ちです。"],
    ["後悔", "incorrect", "済んだことを、こうすればよかったと思う気持ちです。"],
    ["疑い", "incorrect", "本当かどうか、確かでないと思う気持ちです。"],
  ], "練習した経験が、発表するときの心を支えているよ。", "「自信」は、自分の力や価値を信じる気持ちです。", { vocabularyTerm:"自信", vocabularyMeaning:"自分の力や価値を信じる気持ち。", vocabularyExample:"練習を続けたことで、自信をもって発表できました。", purpose:"transfer", thinkingTags:["言葉の宝箱","心情"], learningLens:"treasure", useStage:"context" }),
  feelings("use-feelings-02", 5, "vocab.feelings", "人への接し方を表す", "学級活動", "意見が違っても、相手の話を最後まで聞き、よいところを見つけて伝えました。", "この人の態度を表す言葉として最も合うものは？", [
    ["寛容", "best", "自分と異なる考えも受け止める、心の広さを表します。"],
    ["強引", "incorrect", "自分の考えを無理に通そうとする様子です。"],
    ["軽率", "incorrect", "よく考えずに行動する様子です。"],
    ["無関心", "incorrect", "物事に関心を示さない様子です。"],
  ], "自分と違う考えを、どのように受け止めているかな。", "「寛容」は、自分と異なる考えや立場を受け入れる心の広さを表します。", { vocabularyTerm:"寛容", vocabularyMeaning:"自分と異なる考えや立場を受け入れる心の広さ。", vocabularyExample:"互いに寛容な気持ちで話し合いました。", purpose:"transfer", thinkingTags:["言葉の宝箱","人がら"], learningLens:"treasure", useStage:"context" }),

  // 言葉の宝箱：動きや様子を、より具体的に表す
  sensory("use-sensory-01", 3, "vocab.sensory", "音の様子を表す", "自然", "風が木の葉を通り抜け、細かな音を立てています。", "この音の様子を表す言葉として最も合うものは？", [
    ["そよそよ", "best", "弱く穏やかに風が吹く様子に合います。"],
    ["ごうごう", "incorrect", "強く大きな音を立てる様子です。"],
    ["ぱちぱち", "incorrect", "小さくはじける音などを表します。"],
    ["どしどし", "incorrect", "重いものが続けて動く様子などを表します。"],
  ], "強い風ではなく、葉を静かに揺らす風だね。", "「そよそよ」は、風が静かに穏やかに吹く様子を表します。", { vocabularyTerm:"そよそよ", vocabularyMeaning:"風が静かに穏やかに吹く様子。", vocabularyExample:"春の風がそよそよと吹いていました。", purpose:"transfer", thinkingTags:["言葉の宝箱","感覚"], learningLens:"treasure", useStage:"context" }),
  sensory("use-sensory-02", 4, "vocab.sensory", "動きの様子を表す", "生き物", "小さな虫が、草の間を止まったり進んだりしながら動いています。", "この動きに合う言葉は？", [
    ["ちょこちょこ", "best", "小さく、せわしなく動く様子に合います。"],
    ["のそのそ", "incorrect", "ゆっくりと重そうに動く様子です。"],
    ["すいすい", "incorrect", "なめらかに、つかえず進む様子です。"],
    ["ぐんぐん", "incorrect", "勢いよく大きく進む様子です。"],
  ], "小さな動きが何度も続く様子を思い浮かべよう。", "「ちょこちょこ」は、小さく細かな動きを繰り返す様子を表します。", { vocabularyTerm:"ちょこちょこ", vocabularyMeaning:"小さく細かな動きを繰り返す様子。", vocabularyExample:"小鳥が庭をちょこちょこと歩いていました。", purpose:"transfer", thinkingTags:["言葉の宝箱","動き"], learningLens:"treasure", useStage:"context" }),

  // ぴったりのことば：伝え合う場面で、相手に伝わる語を選ぶ
  precise("use-precise-01", 4, "vocab.precise", "意見を伝える言葉", "話合い", "友達の案にはよい点があると認めたうえで、自分の考えも伝えたいです。", "文の空欄に入れる言葉として最も合うものは？「その案のよさは分かります。＿＿、安全面では別の方法も考えたいです。」", [
    ["一方で", "best", "相手の考えを受け止めたうえで、異なる面を示せます。"],
    ["つまり", "incorrect", "前の内容をまとめたり、言い換えたりするときに使います。"],
    ["たとえば", "incorrect", "具体的な例を示すときに使います。"],
    ["なぜなら", "incorrect", "理由を説明するときに使います。"],
  ], "相手の案を認めつつ、別の見方を加えるつなぎ方だよ。", "「一方で」は、ある面に対して別の面を示すときに使います。", { vocabularyTerm:"一方で", vocabularyMeaning:"ある面に対して、別の面や異なる見方を示す表現。", vocabularyExample:"便利な一方で、使いすぎには注意が必要です。", purpose:"transfer", thinkingTags:["伝え合い","意見"], learningLens:"dialogue", useStage:"context" }),
  precise("use-precise-02", 5, "vocab.precise", "考えの理由を伝える", "話合い", "自分の意見が、調べた記録や数値に支えられていることを伝えます。", "「この考えには、調査結果という＿＿があります。」に入る言葉は？", [
    ["根拠", "best", "考えや判断を支える、よりどころとなる事実や資料です。"],
    ["目的", "incorrect", "何のために行うかというねらいです。"],
    ["順序", "incorrect", "物事を進める並び方です。"],
    ["印象", "incorrect", "見たり聞いたりしたときに心に受ける感じです。"],
  ], "意見を支えている資料や事実のことを考えよう。", "「根拠」は、考えや判断が正しいと説明するためのよりどころです。", { vocabularyTerm:"根拠", vocabularyMeaning:"考えや判断を支える、よりどころとなる事実や資料。", vocabularyExample:"資料を根拠にして、自分の意見を説明しました。", purpose:"transfer", thinkingTags:["伝え合い","理由"], learningLens:"dialogue", useStage:"context" }),

  // 学習で使う言葉：調べたり考えたりする場面で使う
  learning("use-learning-01", 5, "vocab.learning", "調べる観点を表す", "社会", "二つの地域を比べるため、人口、交通、土地の使われ方に注目しました。", "比べるときに注目した「人口」「交通」などを何という？", [
    ["観点", "best", "物事を見たり比べたりするときに注目する点です。"],
    ["結論", "incorrect", "考えたり調べたりした最後にまとめる内容です。"],
    ["結果", "incorrect", "行動や実験のあとに生じたことです。"],
    ["手順", "incorrect", "物事を進めるときの順番です。"],
  ], "何に注目して比べたのか、その「見るポイント」を表す言葉だよ。", "「観点」は、物事を考えたり比べたりするときに注目する点です。", { vocabularyTerm:"観点", vocabularyMeaning:"物事を考えたり比べたりするときに注目する点。", vocabularyExample:"複数の観点から、二つの地域を比べました。", purpose:"transfer", thinkingTags:["学習で使う言葉","比較"], learningLens:"academic", useStage:"context" }),
  learning("use-learning-02", 6, "vocab.learning", "調べたことをまとめる", "総合", "集めた情報の中から大切な内容を選び、短く整理して伝えます。", "このまとめ方を表す言葉は？", [
    ["要約", "best", "大切な内容を残して、短くまとめることです。"],
    ["引用", "incorrect", "ほかの人の文章や言葉を、出典を示して取り入れることです。"],
    ["推測", "incorrect", "分かっていることをもとに、まだ分からないことを考えることです。"],
    ["対比", "incorrect", "二つのものを比べ、違いをはっきりさせることです。"],
  ], "情報をそのまま全部写すのではなく、大切な点を残して短くするよ。", "「要約」は、文章や話の中心となる内容を保ちながら短くまとめることです。", { vocabularyTerm:"要約", vocabularyMeaning:"文章や話の中心となる内容を保ちながら、短くまとめること。", vocabularyExample:"資料の内容を要約して、発表カードにまとめました。", purpose:"transfer", thinkingTags:["学習で使う言葉","整理"], learningLens:"academic", useStage:"context" }),

  // ことばの意味・仲間：学習や説明の中で抽象的な語を使う
  meaning("use-meaning-01", 4, "vocab.meaning", "共通点を表す", "理科", "アサガオとヘチマは、どちらも種から育ち、花を咲かせます。", "二つの植物に同じように見られる点を何という？", [
    ["共通点", "best", "二つ以上のものに共に見られるところです。"],
    ["相違点", "incorrect", "二つ以上のものの違うところです。"],
    ["特徴", "incorrect", "そのものらしさを表す目立つ点です。"],
    ["条件", "incorrect", "物事が成り立つために必要な事柄です。"],
  ], "二つに同じように当てはまるところに注目しよう。", "「共通点」は、二つ以上のものに共に見られるところです。", { vocabularyTerm:"共通点", vocabularyMeaning:"二つ以上のものに共に見られるところ。", vocabularyExample:"二つの地域の共通点を見つけました。", purpose:"transfer", thinkingTags:["意味","比較"], learningLens:"academic", useStage:"context" }),
  meaning("use-meaning-02", 5, "vocab.meaning", "違いを表す", "社会", "二つの地域を調べると、交通の便利さや人口に違いがありました。", "二つ以上のものを比べたとき、異なっているところを何という？", [
    ["相違点", "best", "二つ以上のものの異なるところです。"],
    ["共通点", "incorrect", "同じように見られるところです。"],
    ["目的", "incorrect", "何のために行うかというねらいです。"],
    ["順序", "incorrect", "物事の並び方です。"],
  ], "同じところではなく、異なっている部分を表す言葉だよ。", "「相違点」は、二つ以上のものを比べたときの違いです。", { vocabularyTerm:"相違点", vocabularyMeaning:"二つ以上のものを比べたときの、異なっているところ。", vocabularyExample:"資料から、二つの考えの相違点を整理しました。", purpose:"transfer", thinkingTags:["意味","比較"], learningLens:"academic", useStage:"context" }),

  // ことばの成り立ち：学んだ知識を別の語にも生かす
  structure("use-structure-01", 5, "vocab.structure", "熟語の意味を組み立てる", "熟語の構成", "「読書」は、本を読むことを表す熟語です。", "「読書」と同じように、上の漢字が動作、下の漢字がその対象を表す熟語は？", [
    ["登山", "best", "山に登ることを表し、下の漢字が動作の対象です。"],
    ["寒暖", "incorrect", "寒いことと暖かいことを表す、反対の意味の組合せです。"],
    ["大小", "incorrect", "大きいことと小さいことを表す、反対の意味の組合せです。"],
    ["美しい", "incorrect", "漢字二字の熟語ではありません。"],
  ], "「何をするのか」と読める熟語を探そう。", "「登山」は「山に登る」と読めます。下の漢字「山」が動作の対象です。", { vocabularyTerm:"登山", vocabularyMeaning:"山に登ること。下の漢字が動作の対象を表す熟語。", vocabularyExample:"家族で登山を楽しみました。", purpose:"transfer", thinkingTags:["言葉の成り立ち","熟語"], learningLens:"structure", useStage:"transfer" }),
  structure("use-structure-02", 5, "vocab.structure", "熟語の意味を組み立てる", "熟語の構成", "「左右」は、左と右のように反対の向きを表します。", "「左右」と同じように、反対の意味の漢字を組み合わせた熟語は？", [
    ["上下", "best", "上と下という反対の意味の漢字を組み合わせています。"],
    ["道路", "incorrect", "道と路は似た意味を表す漢字です。"],
    ["読書", "incorrect", "本を読むという動作と対象の関係です。"],
    ["登山", "incorrect", "山に登るという動作と対象の関係です。"],
  ], "二つの漢字が反対の意味になっているか確かめよう。", "「上下」は「上」と「下」という反対の意味の漢字を組み合わせています。", { vocabularyTerm:"上下", vocabularyMeaning:"上と下。反対の意味の漢字を組み合わせた熟語。", vocabularyExample:"階段を使って、建物の上下を移動しました。", purpose:"transfer", thinkingTags:["言葉の成り立ち","熟語"], learningLens:"structure", useStage:"transfer" }),
];
