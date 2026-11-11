// 学習指導要領の学年系統を、ことラボ独自の場面・説明・分類で問題化したデータです。
// 特定の教科書の掲載語一覧、分類順、例文は使用していません。

const CATEGORY_BY_SKILL = {
  "words.semantic_groups": "ことばの意味・仲間",
  "words.feeling_character": "気持ち・人がら",
  "words.word_formation": "ことばの成り立ち",
  "words.learning_terms": "学習・思考のことば",
};
const DEPTH_BY_LEVEL = [0, 1, 2, 3, 4, 5, 6];

const entries = [
  // 1・2年：身近な語句を意味のまとまりで捉える
  { id:"group-01", level:1, skill:"words.semantic_groups", subskill:"動物の仲間", theme:"生き物", context:"いぬ・ねこ・うさぎ", prompt:"おなじ なかまの ことばは？", best:"どうぶつ", acceptable:"いきもの", wrong:["たべもの","のりもの"], reason:"どれも身近な動物の名前です。", hint:"いきていて、うごくものだね。" },
  { id:"group-02", level:1, skill:"words.semantic_groups", subskill:"色の仲間", theme:"図工", context:"あか・あお・きいろ", prompt:"おなじ なかまの ことばは？", best:"いろ", wrong:["かたち","おと","うごき"], reason:"どれも色を表す言葉です。", hint:"えを かくときに えらぶものだよ。" },
  { id:"group-03", level:1, skill:"words.semantic_groups", subskill:"形の仲間", theme:"図工", context:"まる・さんかく・しかく", prompt:"おなじ なかまの ことばは？", best:"かたち", wrong:["いろ","きもち","ばしょ"], reason:"どれも物の形を表します。", hint:"みための どんな ところかな。" },
  { id:"group-04", level:1, skill:"words.semantic_groups", subskill:"動きの仲間", theme:"運動", context:"はしる・とぶ・なげる", prompt:"おなじ なかまの ことばは？", best:"うごき", wrong:["ものの なまえ","いろ","きもち"], reason:"どれも体を使った動きを表します。", hint:"からだで することを さがそう。" },
  { id:"group-05", level:1, skill:"words.semantic_groups", subskill:"学校の物", theme:"学校", context:"えんぴつ・けしごむ・ものさし", prompt:"この なかまに 入る ことばは？", best:"ノート", wrong:["こうえん","はしる","やさしい"], reason:"どれも学習で使う物の名前です。", hint:"つくえの うえで つかうものは？" },
  { id:"group-06", level:1, skill:"words.semantic_groups", subskill:"仲間ではない言葉", theme:"食べ物", context:"りんご・みかん・バナナ・でんしゃ", prompt:"なかまでは ない ことばは？", best:"でんしゃ", wrong:["りんご","みかん","バナナ"], reason:"三つは果物ですが、電車だけは乗り物です。", hint:"たべられないものが 一つあるよ。" },
  { id:"group-07", level:2, skill:"words.semantic_groups", subskill:"天気の言葉", theme:"天気", context:"晴れ・くもり・雨", prompt:"同じ仲間に入る言葉は？", best:"雪", wrong:["机","元気","走る"], reason:"どれも空や天気の様子を表します。", hint:"空からふってくるものを考えよう。" },
  { id:"group-08", level:2, skill:"words.semantic_groups", subskill:"反対の意味", theme:"生活", context:"「重い」と反対の意味", prompt:"ぴったりの言葉は？", best:"軽い", wrong:["広い","長い","暗い"], reason:"重さが小さいことを「軽い」と言います。", hint:"同じ荷物でも、もちやすい方は？" },
  { id:"group-09", level:2, skill:"words.semantic_groups", subskill:"音を表す言葉", theme:"雨", context:"大つぶの雨が、強くふっています。", prompt:"音や様子に合う言葉は？", best:"ざあざあ", acceptable:"ばらばら", wrong:["きらきら","ふわふわ"], reason:"強い雨の大きな音には「ざあざあ」が合います。", hint:"雨の音を口に出してみよう。" },
  { id:"group-10", level:2, skill:"words.semantic_groups", subskill:"様子を表す言葉", theme:"自然", context:"風で葉が軽く動いています。", prompt:"様子に合う言葉は？", best:"ゆらゆら", acceptable:"ひらひら", wrong:["ぐうぐう","ぴかぴか"], reason:"左右にゆっくり動く様子は「ゆらゆら」です。", hint:"葉がどちらへ動くか想像しよう。" },
  { id:"group-11", level:2, skill:"words.semantic_groups", subskill:"場所の仲間", theme:"町", context:"図書館・学校・病院", prompt:"三つに共通することは？", best:"町にある場所", acceptable:"人が集まる所", wrong:["食べ物の名前","動きを表す言葉"], reason:"どれも町の中にあり、人が利用する場所です。", hint:"何を表す名前か考えよう。" },
  { id:"group-12", level:2, skill:"words.semantic_groups", subskill:"違う場面で仲間分け", theme:"生活", context:"「食べる・飲む・かむ」と同じ仲間", prompt:"仲間に入る言葉は？", best:"味わう", acceptable:"料理する", wrong:["青い","食器"], reason:"口を使って食べ物を受け取る動きの仲間です。", hint:"何をする言葉かに注目しよう。", purpose:"transfer" },

  // 3・4年：様子・行動・気持ち・性格
  { id:"feeling-01", level:3, skill:"words.feeling_character", subskill:"安心する気持ち", theme:"生活", context:"なくした鍵が見つかり、肩の力がぬけました。", prompt:"気持ちに一番合う言葉は？", best:"ほっとする", acceptable:"うれしい", wrong:["あせる","うらやましい"], reason:"心配がなくなって安心する場面です。", hint:"見つかる前と後で、心配はどうなったかな。" },
  { id:"feeling-02", level:3, skill:"words.feeling_character", subskill:"くやしい気持ち", theme:"運動", context:"あと一回で成功だったのに、時間切れになりました。", prompt:"気持ちに一番合う言葉は？", best:"くやしい", acceptable:"ざんねん", wrong:["たいくつ","なつかしい"], reason:"できそうだったのに届かなかった気持ちには「くやしい」が合います。", hint:"もう少しだったときの気持ちは？" },
  { id:"feeling-03", level:3, skill:"words.feeling_character", subskill:"心配な様子", theme:"友達", context:"友達の帰りが遅く、何度も時計を見ています。", prompt:"様子に合う言葉は？", best:"そわそわする", acceptable:"落ち着かない", wrong:["のんびりする","うきうきする"], reason:"心配で気持ちが落ち着かない様子です。", hint:"じっと待てる気持ちかな。" },
  { id:"feeling-04", level:3, skill:"words.feeling_character", subskill:"行動から性格を考える", theme:"係活動", context:"係の仕事を忘れないよう、毎日予定を確かめています。", prompt:"人がらに合う言葉は？", best:"責任感がある", acceptable:"まじめ", wrong:["気まぐれ","あわてんぼう"], reason:"任された仕事を最後までしようとする姿です。", hint:"任されたことに、どう向き合っているかな。" },
  { id:"feeling-05", level:3, skill:"words.feeling_character", subskill:"人への接し方", theme:"学校", context:"困っている一年生に、自分からやさしく声をかけました。", prompt:"人がらに合う言葉は？", best:"思いやりがある", acceptable:"親切", wrong:["強がり","短気"], reason:"相手の気持ちを考えて助ける行動です。", hint:"だれのことを考えた行動かな。" },
  { id:"feeling-06", level:3, skill:"words.feeling_character", subskill:"おどろきの表現", theme:"自然", context:"夜空に、とても大きな流れ星が現れました。", prompt:"様子に一番合う言葉は？", best:"目を丸くする", acceptable:"びっくりする", wrong:["頭をかかえる","胸をなで下ろす"], reason:"思いがけないものを見て強く驚く様子です。", hint:"目の前のものに、どんな反応をしたかな。" },
  { id:"feeling-07", level:4, skill:"words.feeling_character", subskill:"期待する気持ち", theme:"行事", context:"明日の発表会を思うと、楽しみで眠れません。", prompt:"気持ちに一番合う言葉は？", best:"待ち遠しい", acceptable:"わくわくする", wrong:["気が重い","あきれる"], reason:"早くその時が来てほしい気持ちです。", hint:"明日が早く来てほしいかな。" },
  { id:"feeling-08", level:4, skill:"words.feeling_character", subskill:"反省する気持ち", theme:"友達", context:"強い言い方で友達を傷つけたことを、あとから考え直しました。", prompt:"気持ちに一番合う言葉は？", best:"後悔する", acceptable:"反省する", wrong:["得意になる","うかれる"], reason:"してしまったことを悔やむ気持ちです。", hint:"もう一度やり直せたら、と思っているかな。" },
  { id:"feeling-09", level:4, skill:"words.feeling_character", subskill:"落ち着いた人がら", theme:"話合い", context:"意見が分かれても、声を荒らげずに理由を聞きました。", prompt:"人がらに一番合う言葉は？", best:"冷静", acceptable:"おだやか", wrong:["せっかち","向こう見ず"], reason:"感情に流されず、落ち着いて考えています。", hint:"気持ちが高ぶったまま話しているかな。" },
  { id:"feeling-10", level:4, skill:"words.feeling_character", subskill:"取り組み方を表す", theme:"学習", context:"分からないところをそのままにせず、何度も調べました。", prompt:"取り組み方に合う言葉は？", best:"ねばり強い", acceptable:"熱心", wrong:["いいかげん","気弱"], reason:"すぐにあきらめず、続けて取り組んでいます。", hint:"一回でやめたかな、続けたかな。" },
  { id:"feeling-11", level:4, skill:"words.feeling_character", subskill:"似た気持ちの使い分け", theme:"発表", context:"大勢の前に立つと、失敗しないか心配で胸がどきどきしました。", prompt:"一番ぴったりの言葉は？", best:"緊張する", acceptable:"不安になる", wrong:["興奮する","満足する"], reason:"うまくできるか心配し、体に力が入る場面です。", hint:"楽しみだけのどきどきかな。" },
  { id:"feeling-12", level:4, skill:"words.feeling_character", subskill:"別の場面で人がらを捉える", theme:"地域", context:"道に落ちていたごみを、だれにも言われず拾いました。", prompt:"行動から考えられる人がらは？", best:"自分から行動する", acceptable:"まじめ", wrong:["おくびょう","のんき"], reason:"必要なことに気付き、自分の判断で動いています。", hint:"だれかに命令されてから動いたかな。", purpose:"transfer" },

  // 3・4年：ことわざ・慣用句・故事成語
  { id:"traditional-01", level:3, skill:"words.traditional_expressions", subskill:"ことわざの意味", theme:"練習", context:"すぐには上達しなくても、毎日こつこつ練習を続けました。", prompt:"合うことわざは？", best:"石の上にも三年", wrong:["棚からぼたもち","馬の耳に念仏","二階から目薬"], reason:"つらくても続ければ成果につながるという意味です。", hint:"続けることの大切さを表すものは？" },
  { id:"traditional-02", level:3, skill:"words.traditional_expressions", subskill:"ことわざを場面で選ぶ", theme:"安全", context:"近道は危ないので、少し遠くても安全な道を選びました。", prompt:"合うことわざは？", best:"急がば回れ", wrong:["猫に小判","口は災いの元","花より団子"], reason:"急ぐときほど、安全で確実な方法を選ぶという意味です。", hint:"早さと安全のどちらを選んだかな。" },
  { id:"traditional-03", level:3, skill:"words.traditional_expressions", subskill:"失敗から学ぶ", theme:"工作", context:"一度失敗したので、次は作り方を変えて成功しました。", prompt:"合うことわざは？", best:"失敗は成功のもと", acceptable:"習うより慣れよ", wrong:["犬も歩けば棒に当たる","絵にかいたもち"], reason:"失敗を次の成功に生かしています。", hint:"失敗したあと、どうしたかな。" },
  { id:"traditional-04", level:3, skill:"words.traditional_expressions", subskill:"確かめる大切さ", theme:"見学", context:"話で百回聞くより、工場を一度見学するとよく分かりました。", prompt:"合うことわざは？", best:"百聞は一見にしかず", wrong:["ちりも積もれば山となる","灯台下暗し","笑う門には福来る"], reason:"何度も聞くより、一度実際に見る方が分かるという意味です。", hint:"聞くことと見ることを比べているよ。" },
  { id:"traditional-05", level:3, skill:"words.traditional_expressions", subskill:"慣用句の意味", theme:"学習", context:"難しい問題がどうしても解けず、どうしようかと困りました。", prompt:"「頭をかかえる」の意味は？", best:"困って考えこむ", wrong:["頭が痛くなる","うれしくて笑う","急いで走る"], reason:"解決方法が見つからず、困る様子を表します。", hint:"本当に頭を持つ動作だけかな。" },
  { id:"traditional-06", level:3, skill:"words.traditional_expressions", subskill:"安心する慣用句", theme:"生活", context:"迷子だった弟が見つかり、母は胸をなで下ろしました。", prompt:"どんな気持ち？", best:"安心した", acceptable:"うれしかった", wrong:["腹を立てた","あきらめた"], reason:"心配がなくなり、安心する様子を表す慣用句です。", hint:"弟が見つかる前は心配だったね。" },
  { id:"traditional-07", level:4, skill:"words.traditional_expressions", subskill:"矛盾", theme:"話合い", context:"「電気を大切に」と言いながら、だれもいない部屋の電気をつけたままにしています。", prompt:"言っていることと行動の関係は？", best:"矛盾している", wrong:["一致している","省略している","対比している"], reason:"言っていることと実際の行動が食い違っています。", hint:"言葉と行動は同じ向きかな。" },
  { id:"traditional-08", level:4, skill:"words.traditional_expressions", subskill:"蛇足", theme:"文章", context:"必要な説明のあとに、関係のない話を長く付け足して分かりにくくなりました。", prompt:"この付け足しを表す故事成語は？", best:"蛇足", wrong:["矛盾","推敲","完璧"], reason:"なくてもよい余計な付け足しを「蛇足」と言います。", hint:"足さない方がよかったものは？" },
  { id:"traditional-09", level:4, skill:"words.traditional_expressions", subskill:"五十歩百歩", theme:"生活", context:"二人とも忘れ物が多いのに、回数が一回違うだけで相手を笑いました。", prompt:"合う故事成語は？", best:"五十歩百歩", wrong:["漁夫の利","蛇足","四面楚歌"], reason:"少し違って見えても、本質的には同じという意味です。", hint:"二人に大きな違いはあるかな。" },
  { id:"traditional-10", level:4, skill:"words.traditional_expressions", subskill:"漁夫の利", theme:"遊び", context:"二つの班が場所を取り合っている間に、別の班がその場所を使いました。", prompt:"別の班が得をした様子を表す言葉は？", best:"漁夫の利", wrong:["急がば回れ","蛇足","自業自得"], reason:"争っている二者の間で、別の者が利益を得るという意味です。", hint:"争っていた二つの班ではない班が得をしたね。" },
  { id:"traditional-11", level:4, skill:"words.traditional_expressions", subskill:"慣用句を文で使う", theme:"発表", context:"発表の順番が近づき、とても緊張しました。", prompt:"慣用句を使った文は？", best:"胸がどきどきした。", acceptable:"とても緊張した。", wrong:["胸を食べた。","胸が走った。"], reason:"「胸がどきどきする」は、緊張や期待を表す慣用的な言い方です。", hint:"体の一部を使った決まった言い方は？" },
  { id:"traditional-12", level:4, skill:"words.traditional_expressions", subskill:"違う場面で意味を使う", theme:"委員会", context:"計画を立てただけで満足し、実際には何もしませんでした。", prompt:"合う言葉は？", best:"絵にかいたもち", acceptable:"計画倒れ", wrong:["石の上にも三年","百聞は一見にしかず"], reason:"役に立ちそうでも、実現しなければ実際の役には立たないという意味です。", hint:"計画は本当に実行されたかな。", purpose:"transfer" },

  // 5・6年：語句の構成と変化
  { id:"formation-01", level:5, skill:"words.word_formation", subskill:"接頭語「再」", theme:"学習", context:"もう一度調べること", prompt:"「再」を使った言葉は？", best:"再調査", wrong:["未調査","調査中","調査員"], reason:"接頭語「再」は「もう一度」という意味を加えます。", hint:"言葉の前に付く「再」に注目しよう。" },
  { id:"formation-02", level:5, skill:"words.word_formation", subskill:"接頭語「無」", theme:"生活", context:"音がない状態", prompt:"「無」を使った言葉は？", best:"無音", wrong:["消音","音量","音楽"], reason:"接頭語「無」は「ない」という意味を加えます。", hint:"「ない」を表す一字は？" },
  { id:"formation-03", level:5, skill:"words.word_formation", subskill:"接頭語「真」", theme:"位置", context:"ちょうど中心にあること", prompt:"「真」を使った言葉は？", best:"真ん中", acceptable:"中心", wrong:["中ほど","半分"], reason:"「真」は、まさにその位置という意味を強めます。", hint:"「まさに中心」を表したいよ。" },
  { id:"formation-04", level:5, skill:"words.word_formation", subskill:"接頭語で丁寧にする", theme:"生活", context:"「茶」に言葉を付けて、丁寧な言い方にする。", prompt:"自然な言葉は？", best:"お茶", wrong:["再茶","無茶色","茶的"], reason:"接頭語「お」は、言葉を丁寧にする働きがあります。", hint:"日常でよく聞く言い方を思い出そう。" },
  { id:"formation-05", level:5, skill:"words.word_formation", subskill:"接尾語「者」", theme:"仕事", context:"研究する人", prompt:"「者」を使った言葉は？", best:"研究者", wrong:["再研究","研究中","研究的"], reason:"接尾語「者」は、その行動をする人を表します。", hint:"言葉の後ろに付いて、人を表すものは？" },
  { id:"formation-06", level:5, skill:"words.word_formation", subskill:"接尾語「中」", theme:"学校", context:"会議をしている途中", prompt:"「中」を使った言葉は？", best:"会議中", wrong:["再会議","会議者","無会議"], reason:"接尾語「中」は、今その最中であることを表します。", hint:"今している途中だと示したいよ。" },
  { id:"formation-07", level:6, skill:"words.word_formation", subskill:"接尾語「的」", theme:"説明", context:"客観に基づくような見方", prompt:"自然な言葉は？", best:"客観的", wrong:["再客観","客観者","客観中"], reason:"「的」は、そのような性質をもつという意味を加えます。", hint:"性質を表すため、後ろに付く一字は？" },
  { id:"formation-08", level:6, skill:"words.word_formation", subskill:"接尾語「化」", theme:"社会", context:"デジタルな形へ変わること", prompt:"自然な言葉は？", best:"デジタル化", wrong:["再デジタル","デジタル者","デジタル中"], reason:"「化」は、ある状態に変わることを表します。", hint:"状態の変化を表す言葉は？" },
  { id:"formation-09", level:6, skill:"words.word_formation", subskill:"複合語の成り立ち", theme:"自然", context:"「山」と「道」を組み合わせた「山道」", prompt:"どんな意味？", best:"山にある道", acceptable:"山へ向かう道", wrong:["山のように大きい道","道が山になること"], reason:"二つの名詞が結び付き、場所と物の関係を表します。", hint:"前の「山」は、後ろの「道」をどう詳しくするかな。" },
  { id:"formation-10", level:6, skill:"words.word_formation", subskill:"長い複合語を分ける", theme:"国語", context:"読書感想文", prompt:"意味のまとまりとして自然な分け方は？", best:"読書／感想／文", wrong:["読／書感／想文","読書感／想／文","読／書／感想文"], reason:"読書についての感想を書く文、という三つのまとまりです。", hint:"知っている言葉のまとまりを探そう。" },
  { id:"formation-11", level:6, skill:"words.word_formation", subskill:"似た接尾語の使い分け", theme:"学校", context:"図書館で働く人", prompt:"一番自然な言葉は？", best:"図書館員", acceptable:"図書館の人", wrong:["図書館中","再図書館"], reason:"「員」は、組織や場所で役割をもつ人を表します。", hint:"場所で働く人を表す後ろの言葉は？" },
  { id:"formation-12", level:6, skill:"words.word_formation", subskill:"別の語で成り立ちを考える", theme:"環境", context:"ごみをもう一度資源として利用すること", prompt:"意味に合う言葉は？", best:"再利用", acceptable:"リサイクル", wrong:["無利用","利用者"], reason:"「再」と「利用」を組み合わせ、もう一度利用する意味になります。", hint:"「もう一度」を表す接頭語を使おう。", purpose:"transfer" },

  // 5・6年：思考と学習を支える語句
  { id:"learning-01", level:5, skill:"words.learning_terms", subskill:"あらすじ", theme:"物語", context:"物語の主な出来事を、順序に沿って短くまとめました。", prompt:"このまとめを何という？", best:"あらすじ", acceptable:"まとめ", wrong:["感想","引用"], reason:"物語の主な出来事を順にまとめたものが「あらすじ」です。", hint:"物語で何が起きたかを短く表す言葉は？" },
  { id:"learning-02", level:5, skill:"words.learning_terms", subskill:"要旨", theme:"説明文", context:"筆者が文章全体で最も伝えたいことを短くまとめました。", prompt:"この内容を何という？", best:"要旨", acceptable:"中心となる考え", wrong:["例文","登場人物"], reason:"説明的な文章の中心となる内容をまとめたものが「要旨」です。", hint:"文章全体の中心に注目しよう。" },
  { id:"learning-03", level:5, skill:"words.learning_terms", subskill:"対比", theme:"説明", context:"紙の本と電子書籍を、持ち運びやすさという同じ観点で比べました。", prompt:"この比べ方を何という？", best:"対比", acceptable:"比較", wrong:["引用","要約"], reason:"二つを同じ観点で並べ、違いを明らかにすることです。", hint:"二つの違いをはっきりさせているね。" },
  { id:"learning-04", level:5, skill:"words.learning_terms", subskill:"根拠", theme:"話合い", context:"「休み時間を長くしたい」という意見に、アンケート結果を添えました。", prompt:"意見を支える資料を何という？", best:"根拠", acceptable:"理由", wrong:["結論","題名"], reason:"考えが確かだと支える事実や資料が「根拠」です。", hint:"意見を下から支えているものは？" },
  { id:"learning-05", level:5, skill:"words.learning_terms", subskill:"主張", theme:"意見文", context:"「校庭に日かげを増やすべきだ」と書きました。", prompt:"筆者が最も伝えたい考えを何という？", best:"主張", acceptable:"意見", wrong:["具体例","段落"], reason:"文章で相手に認めてもらいたい中心の考えが「主張」です。", hint:"筆者が「こうすべき」と伝えている部分だよ。" },
  { id:"learning-06", level:5, skill:"words.learning_terms", subskill:"段落", theme:"文章", context:"文章を内容のまとまりごとに分け、一字下げて書き始めました。", prompt:"一つ一つのまとまりを何という？", best:"段落", wrong:["文節","題名","引用"], reason:"文章を内容で分けたまとまりが「段落」です。", hint:"文章の中の、大きなまとまりだよ。" },
  { id:"learning-07", level:6, skill:"words.learning_terms", subskill:"構成", theme:"提案文", context:"問題、原因、解決案、期待できる効果の順に文章を組み立てました。", prompt:"文章全体の組み立てを何という？", best:"構成", acceptable:"順序", wrong:["表記","発音"], reason:"文章の各部分をどのように組み立てるかが「構成」です。", hint:"文章の部品を並べる設計図のような言葉は？" },
  { id:"learning-08", level:6, skill:"words.learning_terms", subskill:"具体例", theme:"説明", context:"「身近な省エネ」の後に、「使わない照明を消すこと」と書きました。", prompt:"後ろの内容の役割は？", best:"具体例", acceptable:"説明", wrong:["反対意見","結論"], reason:"前の一般的な内容を、実際の行動で分かりやすくしています。", hint:"「例えば」と言い換えられるかな。" },
  { id:"learning-09", level:6, skill:"words.learning_terms", subskill:"引用", theme:"調査", context:"資料に書かれた文を、かぎ括弧で示して自分の文章に取り入れました。", prompt:"この使い方を何という？", best:"引用", acceptable:"資料を使う", wrong:["要約","推測"], reason:"他の文章の一部を、出典を示して取り入れることが「引用」です。", hint:"元の文を区別して取り入れているね。" },
  { id:"learning-10", level:6, skill:"words.learning_terms", subskill:"要約", theme:"説明文", context:"長い文章の大切な部分を残し、自分の言葉で短くしました。", prompt:"このまとめ方を何という？", best:"要約", acceptable:"短くまとめる", wrong:["引用","対比"], reason:"文章の要点を保ちながら短くまとめることが「要約」です。", hint:"長さは変わっても、大切な内容は残るよ。" },
  { id:"learning-11", level:6, skill:"words.learning_terms", subskill:"原因と結果", theme:"理科", context:"気温が上がったので、氷がとけました。", prompt:"「気温が上がった」の役割は？", best:"原因", acceptable:"理由", wrong:["結果","具体例"], reason:"後に起きた「氷がとけた」ことを引き起こしています。", hint:"先に起きて、後の出来事につながったものは？" },
  { id:"learning-12", level:6, skill:"words.learning_terms", subskill:"違う文章で学習語を使う", theme:"社会", context:"二つの地域を、人口という同じ観点で並べて違いを示しました。", prompt:"使った考え方は？", best:"対比", acceptable:"比較", wrong:["要約","引用"], reason:"同じ観点で二つを並べ、違いを明確にしています。", hint:"二つのものを同じものさしで比べているよ。", purpose:"transfer" },

  // 5・6年：相手・場面に応じた敬語と言葉の使い分け
  { id:"register-01", level:5, skill:"sentence.register_keigo", subskill:"丁寧な言い方", theme:"学校", context:"先生に、窓を閉めてよいか尋ねます。", prompt:"一番場面に合う言い方は？", best:"窓を閉めてもよろしいですか。", acceptable:"窓を閉めてもいいですか。", wrong:["窓、閉めるね。","窓を閉めろ。"], reason:"先生への丁寧な尋ね方になっています。", hint:"相手に許可を求める言い方を選ぼう。" },
  { id:"register-02", level:5, skill:"sentence.register_keigo", subskill:"尊敬する言い方", theme:"来校者", context:"校長先生が体育館へ行きました。", prompt:"校長先生の行動を丁寧に表す文は？", best:"校長先生が体育館へいらっしゃいました。", acceptable:"校長先生が体育館へ行かれました。", wrong:["校長先生が体育館へ参りました。","校長先生が体育館へ行った。"], reason:"相手側の「行く」を高める「いらっしゃる」が合います。", hint:"行動したのは自分かな、相手かな。" },
  { id:"register-03", level:5, skill:"sentence.register_keigo", subskill:"自分をへりくだる言い方", theme:"職員室", context:"自分が先生の話を聞きに行きます。", prompt:"一番丁寧な言い方は？", best:"先生のお話を伺いに行きます。", acceptable:"先生のお話を聞きに行きます。", wrong:["先生が伺いに行きます。","話を聞きに行くよ。"], reason:"自分の「聞く・訪ねる」をへりくだる「伺う」を使っています。", hint:"丁寧にするのは、自分の行動だよ。" },
  { id:"register-04", level:5, skill:"sentence.register_keigo", subskill:"見るの敬語", theme:"作品展", context:"先生に作品を見てもらいたい場面です。", prompt:"一番丁寧な言い方は？", best:"こちらの作品をご覧ください。", acceptable:"こちらの作品を見てください。", wrong:["この作品を拝見してください。","これ、見て。"], reason:"相手の「見る」を高める「ご覧になる」を使っています。", hint:"作品を見るのは先生だね。" },
  { id:"register-05", level:5, skill:"sentence.register_keigo", subskill:"話すの敬語", theme:"集会", context:"先生が大切なことを話しました。", prompt:"場面に合う文は？", best:"先生が大切なことをおっしゃいました。", acceptable:"先生が大切なことを話されました。", wrong:["先生が大切なことを申しました。","先生が大切なことをしゃべった。"], reason:"相手の「言う」を高める「おっしゃる」が合います。", hint:"話したのは先生だよ。" },
  { id:"register-06", level:5, skill:"sentence.register_keigo", subskill:"依頼の言い方", theme:"委員会", context:"上級生に、資料を見せてほしいと頼みます。", prompt:"一番場面に合う言い方は？", best:"資料を見せていただけますか。", acceptable:"資料を見せてもらえますか。", wrong:["資料を見せて。","資料を見せなさい。"], reason:"相手の都合を考えた丁寧な依頼です。", hint:"命令ではなく、お願いの形にしよう。" },
  { id:"register-07", level:6, skill:"sentence.register_keigo", subskill:"話し言葉と書き言葉", theme:"報告書", context:"委員会の活動を、学校に提出する報告書へ書きます。", prompt:"書き言葉として一番合う文は？", best:"話合いの結果、清掃方法を変更することになった。", acceptable:"話し合って、そうじのやり方を変えることになりました。", wrong:["話してたら、やり方変わった。","そうじ、変えることになったよ。"], reason:"内容が明確で、報告書に合う落ち着いた書き言葉です。", hint:"友達との会話ではなく、記録に残す文章だよ。" },
  { id:"register-08", level:6, skill:"sentence.register_keigo", subskill:"相手に応じた説明", theme:"学校案内", context:"一年生に、避難訓練の行動を説明します。", prompt:"一番伝わりやすい言い方は？", best:"放送をよく聞いて、先生と一緒に静かに歩きます。", acceptable:"指示に従って避難してください。", wrong:["所定の経路で速やかに退避する。","ちゃんとやってね。"], reason:"一年生が何をすればよいか、具体的で分かりやすい文です。", hint:"初めて聞く一年生が動ける文かな。" },
  { id:"register-09", level:6, skill:"sentence.register_keigo", subskill:"断り方", theme:"友達", context:"今は係の仕事があるため、誘いを断ります。", prompt:"相手を大切にした言い方は？", best:"誘ってくれてありがとう。係の仕事があるから、今日は行けないんだ。", acceptable:"今日は行けません。", wrong:["無理。","行かないから。"], reason:"感謝と理由を伝え、相手とのつながりを保つ言い方です。", hint:"断る前後に、どんな言葉があるとよいかな。" },
  { id:"register-10", level:6, skill:"sentence.register_keigo", subskill:"意見が違うとき", theme:"話合い", context:"友達の意見とは違う考えを伝えます。", prompt:"話合いに合う言い方は？", best:"その考えも分かります。一方で、わたしは安全の点から別の方法がよいと思います。", acceptable:"わたしは別の考えです。", wrong:["それは絶対にまちがいです。","そんな考えはだめです。"], reason:"相手を認めた上で、観点と自分の意見を伝えています。", hint:"相手を否定せず、違う理由を示そう。" },
  { id:"register-11", level:6, skill:"sentence.register_keigo", subskill:"メールの書き方", theme:"連絡", context:"見学先の方へ、お礼のメールを送ります。", prompt:"書き出しとして合うものは？", best:"先日は、工場を案内してくださり、ありがとうございました。", acceptable:"この前は、ありがとうございました。", wrong:["工場、楽しかったです！","こんにちは。覚えていますか。"], reason:"いつ、何に対するお礼かが分かる丁寧な書き出しです。", hint:"相手が何のお礼か分かるようにしよう。" },
  { id:"register-12", level:6, skill:"sentence.register_keigo", subskill:"違う場面で言い方を選ぶ", theme:"地域", context:"地域の方に、昔の町の様子を教えてほしいとお願いします。", prompt:"一番場面に合う言い方は？", best:"昔の町の様子について、教えていただけますか。", acceptable:"昔の町のことを教えてもらえますか。", wrong:["昔のこと、教えて。","昔の町を説明しなさい。"], reason:"内容を明確にし、相手を尊重してお願いしています。", hint:"初めて話す地域の方へのお願いだよ。", purpose:"transfer" },
];

function buildOptions(entry) {
  const options = [
    [entry.best, "best", entry.reason],
    ...(entry.acceptable ? [[entry.acceptable, "acceptable", `意味は近いですが、この場面では「${entry.best}」の方がよりぴったりです。`]] : []),
    ...entry.wrong.map((text) => [text, "incorrect", `「${text}」は、この場面の意味や目的には合いません。`]),
  ];
  return options.slice(0, 4);
}

export const SYSTEMATIC_LANGUAGE_DATA = entries.filter((entry) => entry.skill !== "sentence.register_keigo" && entry.skill !== "words.traditional_expressions").map((entry) => [
  `sys-${entry.id}`,
  {
    lab: "words",
    skill: entry.skill,
    subskill: entry.subskill,
    contentLevel: entry.level,
    depth: entry.depth || DEPTH_BY_LEVEL[entry.level],
    purpose: entry.purpose || "practice",
    thinkingTags: [entry.subskill, CATEGORY_BY_SKILL[entry.skill]],
    crossTags: ["学年系統", "語彙"],
    curriculumTags: [entry.level <= 2 ? "1-2年" : entry.level <= 4 ? "3-4年" : "5-6年", CATEGORY_BY_SKILL[entry.skill]],
    vocabularyIds: [`sys-vocab-${entry.id}`],
    theme: entry.theme,
    context: entry.context,
    prompt: entry.prompt,
    options: buildOptions(entry),
    hint: entry.hint,
    explanation: entry.reason,
    ...(entry.purpose === "transfer" ? { transferGroup: entry.skill } : {}),
  },
]);

export const SYSTEMATIC_VOCABULARY = entries.filter((entry) => entry.skill !== "sentence.register_keigo" && entry.skill !== "words.traditional_expressions").map((entry) => ({
  id: `sys-vocab-${entry.id}`,
  term: entry.best,
  category: CATEGORY_BY_SKILL[entry.skill],
  gradeBand: entry.level <= 2 ? "1・2年" : entry.level <= 4 ? "3・4年" : "5・6年",
  meaning: entry.reason,
  example: entry.context,
  related: entry.acceptable || "",
  questionIds: [`sys-${entry.id}`],
}));

