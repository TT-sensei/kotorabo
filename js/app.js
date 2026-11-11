import { LABS, SKILL_MAP, DEPTH_LABELS, LEVEL_WORLDS, getSkill } from "./data/skill-map.js";
import { QUESTIONS, VOCABULARY_DATA, getQuestion } from "./data/questions.js";
import { buildFocusSession, buildProgress, buildSession, findDelayedRetry, labReadiness, orderQuestionOptions } from "./core/engine.js";
import { loadAttempts, loadBadges, loadNotebook, loadProfile, resetLearningData, saveAttempts, saveBadges, saveNotebook, saveProfile } from "./core/storage.js";
import { awardResearchXP, getResearchStatus } from "./core/research-xp.js";
import { BADGES, evaluateBadgeIds, getBadge } from "./data/badges.js";
import { NAVI, naviImage } from "./data/navi.js";

const app = document.querySelector("#app");
const roleLabel = {
  recall: "おぼえてるかな？",
  retry: "もういちど！",
  current: "いまの力で",
  stretch: "ちょいむず",
  transfer: "ちがうお話で",
  diagnostic: "はじめのチャレンジ",
  focus: "とことん特訓！",
};
const qualityCopy = {
  best: { mark:"◎", title:"やったね！ 一番ぴったり！", className:"best" },
  acceptable: { mark:"○", title:"いいね！ これも合っているよ", className:"okay" },
  incorrect: { mark:"↺", title:"おしい！ もう一度見てみよう", className:"retry" },
};

const savedProfile = loadProfile();
const initialProfile = savedProfile
  ? { ...savedProfile, onboarded:true, researchXP:savedProfile.researchXP ?? 0 }
  : { furigana:"grade", onboarded:true, researchXP:0, createdAt:new Date().toISOString() };

const vocabularyQuestionMap = new Map(QUESTIONS.map((question) => [question.id, question]));
const initialAttempts = loadAttempts()
  .filter((attempt) => vocabularyQuestionMap.has(attempt.questionId))
  .map((attempt) => {
    const question = vocabularyQuestionMap.get(attempt.questionId);
    return { ...attempt, lab:question.lab, skill:question.skill, depth:question.depth };
  });
const initialResearchLevel = getResearchStatus(initialProfile.researchXP).level;
const initialBadgeIds = [...new Set([
  ...loadBadges().filter((id) => BADGES.some((badge) => badge.id === id)),
  ...evaluateBadgeIds({ attempts:initialAttempts, questions:QUESTIONS, researchLevel:initialResearchLevel }),
])];
saveBadges(initialBadgeIds);

const state = {
  profile: initialProfile,
  attempts: initialAttempts,
  badgeIds: initialBadgeIds,
  newBadges: [],
  screen: "home",
  onboardingResult: false,
  queue: [], position:0, selectedId:null, quality:null, tryNumber:1,
  usedHint:false, showHint:false, showWhy:false, sessionAttempts:[], sessionComplete:false,
  sessionKind:"adaptive", focusLab:"meaning", focusSkill:"vocab.meaning", focusSize:5,
  resetConfirm:false,
  lastXpAward:0, lastRankUp:null,
  vocabularyCategory:"すべて",
  notebook: loadNotebook(),
  noteWordId: null,
  badgeCategory:"すべて",
};

const labKeys = Object.keys(LABS);
const progress = () => buildProgress(state.attempts);

const hiraganaReplacements = [
  ["類義語", "るいぎご"], ["対義語", "たいぎご"], ["慣用句", "かんようく"], ["故事成語", "こじせいご"],
  ["接頭語", "せっとうご"], ["接尾語", "せつびご"], ["熟語", "じゅくご"], ["構成", "こうせい"],
  ["客観的", "じじつにもとづいて"], ["具体例", "ぐたいてきな れい"], ["抽象語", "ちゅうしょうご"], ["温暖", "おんだん"],
  ["岩石", "がんせき"], ["不可能", "ふかのう"], ["未完成", "みかんせい"], ["運動場", "うんどうじょう"],
  ["図書室", "としょしつ"], ["観察", "かんさつ"], ["調査", "ちょうさ"], ["提案", "ていあん"],
  ["説明", "せつめい"], ["原因", "げんいん"], ["結果", "けっか"], ["理由", "りゆう"],
  ["順番", "じゅんばん"], ["範囲", "はんい"], ["関係", "かんけい"], ["目的", "もくてき"],
  ["相手", "あいて"], ["学習", "がくしゅう"], ["学校", "がっこう"], ["言葉", "ことば"],
  ["気持ち", "きもち"], ["一番", "いちばん"], ["考え", "かんがえ"], ["伝わ", "つたわ"],
  ["詳しく", "くわしく"], ["例えば", "たとえば"], ["最も", "もっとも"], ["選ぶ", "えらぶ"],
  ["選ん", "えらん"], ["選び", "えらび"], ["読書", "どくしょ"], ["読む", "よむ"], ["読ん", "よん"],
  ["書く", "かく"], ["書い", "かい"],
];

function displayText(value) {
  if (state.profile.furigana !== "more" || !value) return value || "";
  return hiraganaReplacements.reduce((text, [word, reading]) => text.replaceAll(word, reading), String(value));
}

function researchStatusTemplate(compact = false) {
  const status = getResearchStatus(state.profile.researchXP);
  return `<div class="research-status ${compact ? "compact" : ""}" aria-label="研究者レベル ${status.level}、研究XP ${status.xp}"><span class="research-badge">🔬</span><div><small>${status.title}・Lv.${status.level}</small><strong>${status.xp} XP</strong><i><b style="width:${status.progress}%"></b></i></div></div>`;
}

function header() {
  return `<header class="site-header">
    <button class="brand" data-action="home" aria-label="ホームへ戻る"><span class="brand-mark small">こ</span><span><strong>ことラボ</strong><small>言葉を知り、使いこなそう！</small></span></button>
    <nav aria-label="メインメニュー"><button data-action="home" class="${state.screen === "home" ? "active" : ""}">今日のチャレンジ</button><button data-action="focus" class="${state.screen === "focus" ? "active" : ""}">特訓する</button><button data-action="carte" class="${state.screen === "carte" ? "active" : ""}">できたこと</button><button data-action="settings" class="${state.screen === "settings" ? "active" : ""}">せってい</button>${researchStatusTemplate(true)}</nav>
  </header>`;
}

function render() {
  app.innerHTML = header() + (
    state.screen === "home" ? homeTemplate() :
    state.screen === "carte" ? carteTemplate() :
    state.screen === "vocabulary" ? vocabularyTemplate() :
    state.screen === "notebook" ? notebookTemplate() :
    state.screen === "badges" ? badgesTemplate() :
    state.screen === "settings" ? settingsTemplate() :
    state.screen === "focus" ? focusTemplate() :
    state.sessionComplete ? resultTemplate() : questionTemplate()
  );
  window.scrollTo({ top:0, behavior:"smooth" });
}


function homeTemplate() {
  const p = progress();
  const reviewCount = p.filter((item) => item.needsReview).length;
  const latestBadge = [...state.badgeIds].reverse().map(getBadge).find(Boolean);
  const foundWords = vocabularyProgress().filter((word) => word.stage > 0).length;
  return `<main class="home-page home-redesign">
    <section class="research-hero home-hero-simple">
      <div class="home-hero-copy">
        <p class="eyebrow light"><i></i> ことばの研究室</p>
        <h1>ことばを知る。<br>使えることばを増やす。</h1>
        <p>意味を知り、似た言葉と比べ、ぴったりの言葉を見つけよう。</p>
        <button class="primary-button home-start-button" data-size="5">今日のことばに挑戦 <span>→</span></button>
        <small class="home-start-note">${reviewCount ? `前に迷った言葉も、ちがう問題で確かめよう（${reviewCount}項目）` : "今の理解に合わせて、問題のむずかしさが少しずつ変わるよ。"}</small>
      </div>
      <div class="home-hero-side">${researchStatusTemplate()} ${naviImage(NAVI.groupStudying, "ことばの研究を応援する仲間たち", "hero-navi")}</div>
    </section>
    <section class="home-discover">
      <div class="section-heading"><div><p>ことばの探検</p><h2>気になるところから見てみよう</h2></div><span>どこから始めてもOK</span></div>
      <div class="theme-grid home-theme-grid">${labKeys.map((lab) => {
        const info = labReadiness(p, lab);
        return `<button class="theme-card ${LABS[lab].color}" data-focus-lab="${lab}">
          <span class="theme-card-icon">${LABS[lab].icon}</span>
          <span class="theme-card-copy"><strong>${LABS[lab].short}</strong><small>${LABS[lab].question}</small><em>${info.label}</em></span>
          <b class="theme-arrow">→</b>
        </button>`;
      }).join("")}</div>
    </section>
    <section class="home-library-row">
      <button class="home-library-card" data-action="vocabulary"><span class="home-library-icon">あ</span><span><small>出会った言葉を集める</small><strong>ことばファイル</strong><em>${foundWords}語</em></span><b>→</b></button>
      <button class="home-library-card" data-action="notebook"><span class="home-library-icon">✎</span><span><small>自分の言葉で残す</small><strong>学びノート</strong><em>${Object.keys(state.notebook).length}語を記録</em></span><b>→</b></button>
      <button class="home-library-card" data-action="carte"><span class="home-library-icon">↗</span><span><small>学びの足あと</small><strong>できたこと</strong><em>${state.attempts.length}回チャレンジ</em></span><b>→</b></button>
      <button class="home-library-card" data-action="badges"><span class="home-library-icon">✦</span><span><small>積み重ねの記録</small><strong>達成バッジ</strong><em>${state.badgeIds.length} / ${BADGES.length}</em></span><b>→</b></button>
    </section>
    ${latestBadge ? `<button class="latest-badge" data-action="badges"><img src="${latestBadge.image}" alt="" loading="lazy" onerror="this.hidden=true"><span><small>さいきんの達成</small><strong>${latestBadge.title}</strong></span><b>バッジを見る →</b></button>` : ""}
  </main>`;
}
function settingsTemplate() {
  return `<main class="settings-page"><section class="page-intro"><p class="eyebrow">⚙️ ことラボの設定</p><h1>読みやすさを整える</h1><p>学年や問題レベルを選ぶ必要はありません。答え方に合わせて、問題の難しさが自動で変わります。</p></section>
    <section class="settings-card"><div class="settings-heading"><span>🔤</span><div><h2>文字の読みやすさ</h2><p>読みやすいほうをえらんでね。</p></div></div><div class="choice-row wide"><button data-furigana="grade" class="${state.profile.furigana === "grade" ? "selected" : ""}">漢字をそのまま表示</button><button data-furigana="more" class="${state.profile.furigana === "more" ? "selected" : ""}">ひらがな多め</button></div></section>
    <section class="settings-card"><div class="settings-heading"><span>↗</span><div><h2>問題のむずかしさ</h2><p>正解が続くと少しずつ難しくなり、迷ったときは前の段階に戻って確かめます。</p></div></div><p class="adaptive-note">一人ひとりの学習履歴に合わせて調整します。学年の登録やレベル変更はありません。</p></section>
    <div class="page-actions"><button class="primary-button" data-action="home">ホームへ戻る <span>→</span></button></div></main>`;
}
function focusTemplate() {
  const skillProgress = new Map(progress().map((item) => [item.skill, item]));
  const skills = SKILL_MAP.filter((skill) => skill.lab === state.focusLab);
  const selected = getSkill(state.focusSkill) || skills[0];
  return `<main class="focus-page"><section class="page-intro focus-intro"><p class="eyebrow">🎯 言葉をじっくり身につけよう</p><h1>ジャンル別に特訓する</h1><p>覚えたい言葉のジャンルを選ぼう。意味を確かめたり、似た言葉と比べたりしながら、使える語彙を増やしていくよ。</p><div class="focus-level-chip">問題のむずかしさは、答え方に合わせて自動で変わるよ。</div></section>
    <section class="focus-panel"><div class="focus-step"><span>1</span><div><h2>どのジャンルにする？</h2><p>今、伸ばしたいところを選ぼう。</p></div></div><div class="focus-labs">${labKeys.map((lab) => `<button data-focus-lab="${lab}" class="${LABS[lab].color} ${state.focusLab === lab ? "selected" : ""}"><b>${LABS[lab].icon}</b><span>${LABS[lab].short}</span></button>`).join("")}</div></section>
    <section class="focus-panel"><div class="focus-step"><span>2</span><div><h2>このジャンルで学ぼう</h2><p>このジャンルの問題を中心に出題するよ。</p></div></div><div class="skill-choice-grid">${skills.map((skill) => { const item = skillProgress.get(skill.id); const status = item?.needsReview ? "もう一回！" : item?.attempts ? `いま ${DEPTH_LABELS[Math.max(1,item.stableDepth)]}` : "はじめて"; return `<button data-focus-skill="${skill.id}" class="skill-choice ${state.focusSkill === skill.id ? "selected" : ""}"><span>${status}</span><strong>${skill.label}</strong><p>${skill.description}</p><b>${state.focusSkill === skill.id ? "✓" : "→"}</b></button>`; }).join("")}</div></section>
    <section class="focus-panel"><div class="focus-step"><span>3</span><div><h2>何問やってみる？</h2><p>その日の気分でえらんでOK！</p></div></div><div class="focus-size-grid">${[3,5].map((size) => `<button data-focus-size="${size}" class="${state.focusSize === size ? "selected" : ""}"><strong>${size}問</strong><span>${size === 3 ? "サクッと" : "おすすめ"}</span></button>`).join("")}</div><div class="focus-start"><div><small>${selected ? LABS[selected.lab].short : "ジャンルをえらんでね"}</small><strong>${selected?.label || "まだえらんでいません"}</strong></div><button class="primary-button" data-action="start-focus" ${selected ? "" : "disabled"}>特訓スタート！ <span>→</span></button></div><p class="focus-note">まちがえた言葉は、少しあとに別の問題でもう一度出てくるよ。</p></section></main>`;
}

function startQueue(items, screen, sessionKind = "adaptive") {
  Object.assign(state, { queue:items, screen, sessionKind, position:0, selectedId:null, quality:null, tryNumber:1, usedHint:false, showHint:false, showWhy:false, sessionAttempts:[], sessionComplete:false, lastXpAward:0, lastRankUp:null, newBadges:[] });
  render();
}

function syncBadges() {
  const before = new Set(state.badgeIds);
  const evaluated = evaluateBadgeIds({ attempts:state.attempts, questions:QUESTIONS, researchLevel:getResearchStatus(state.profile.researchXP).level });
  const merged = [...new Set([...state.badgeIds, ...evaluated])];
  const added = merged.filter((id) => !before.has(id)).map(getBadge).filter(Boolean);
  if (added.length) state.newBadges.push(...added);
  state.badgeIds = merged;
  saveBadges(merged);
}

function questionTemplate() {
  const item = state.queue[state.position];
  const q = getQuestion(item?.questionId);
  if (!q) return `<main class="center-page"><section class="result-card"><h1>問題を準備できませんでした</h1><button class="primary-button" data-action="home">ホームへ</button></section></main>`;
  const lab = LABS[q.lab];
  const options = orderQuestionOptions(q);
  const selected = q.options.find((option) => option.id === state.selectedId);
  const feedback = state.quality ? qualityCopy[state.quality] : null;
  const feedbackNavi = state.quality === "best" ? NAVI.correct : state.quality === "acceptable" ? NAVI.acceptable : NAVI.retry;
  const canRetry = state.quality !== "best" && state.tryNumber < 2;
  return `<main class="research-page"><section class="research-topline"><div><span class="lab-token ${lab.color}">${lab.icon}</span><div><small>${lab.label}</small><strong>${roleLabel[item.role]}</strong></div></div><p><b>${state.position + 1}</b> / ${state.queue.length}</p></section><div class="research-progress"><i style="width:${((state.position + 1) / state.queue.length) * 100}%"></i></div>
    <section class="question-card"><div class="question-meta"><span>きょうのポイント</span><b>${displayText(q.subskill)}</b><small>チャレンジ：${DEPTH_LABELS[q.depth]}${state.profile.furigana === "more" ? " ／ 🔤 ひらがな多め" : ""}</small>${q.learningLens ? `<small class="learning-lens">${({treasure:"言葉の宝箱",dialogue:"伝え合い",academic:"学習で使う言葉",structure:"言葉の成り立ち"})[q.learningLens]}</small>` : ""}</div>
    ${(q.audience || q.goal) ? `<div class="situation-strip">${q.audience ? `<span><b>だれに？</b>${displayText(q.audience)}</span>` : ""}${q.goal ? `<span><b>何のため？</b>${displayText(q.goal)}</span>` : ""}</div>` : ""}
    ${q.context ? `<p class="question-context">${displayText(q.context)}</p>` : ""}<h1>${displayText(q.prompt)}</h1><div class="option-grid">${options.map((option, index) => { const chosen = state.selectedId === option.id; return `<button data-option="${option.id}" class="${chosen ? `selected ${state.quality}` : ""}" ${(state.quality === "best" || (state.quality && !canRetry)) ? "disabled" : ""}><span>${String.fromCharCode(65 + index)}</span><strong>${displayText(option.text)}</strong>${chosen && state.quality ? `<b>${qualityCopy[state.quality].mark}</b>` : ""}</button>`; }).join("")}</div>
    ${!state.quality ? `<button class="hint-button" data-action="hint" ${state.usedHint ? "disabled" : ""}>💡 ${state.usedHint ? "ヒントを表示中" : "ヒントを見る"}</button>` : ""}
    ${state.showHint && !state.quality ? `<div class="hint-box navi-support">${naviImage(NAVI.hint, "", "feedback-navi")}<div><b>ちょこっとヒント</b><p>${displayText(q.hint)}</p></div></div>` : ""}
    ${feedback ? `<div class="feedback-box ${feedback.className}" role="status"><span>${feedback.mark}</span>${naviImage(feedbackNavi, "", "feedback-navi")}<div><h2>${feedback.title}</h2>${selected?.feedback ? `<p>${displayText(selected.feedback)}</p>` : ""}${state.lastXpAward ? `<p class="xp-earned">🔬 研究XP +${state.lastXpAward}</p>` : ""}${state.lastRankUp ? `<p class="rank-up-message">🎉 研究者レベルアップ！ ${state.lastRankUp.title}になったよ！</p>` : ""}</div></div><div class="answer-actions">${canRetry ? `<button class="secondary-button" data-action="retry">もう一度えらぶ</button>` : ""}${(state.quality === "best" || !canRetry || state.quality === "acceptable") ? `<button class="primary-button" data-action="next">${state.position === state.queue.length - 1 ? (state.screen === "diagnosis" ? "できたことを見る" : "ゴールへ！") : "つぎの問題へ"} <span>→</span></button>` : ""}<button class="why-button" data-action="why">💡 どうして？を見てみる</button></div>` : ""}
    ${state.showWhy && state.quality ? `<div class="why-panel"><h3>なるほど！</h3><p>${displayText(q.explanation)}</p>${q.visual ? `<div class="relation-visual"><span>${displayText(q.visual[0])}</span><b>${displayText(q.visual[1])}<i>→</i></b><span>${displayText(q.visual[2])}</span></div>` : ""}</div>` : ""}</section></main>`;
}

function recordAnswer(q, quality) {
  const before = getResearchStatus(state.profile.researchXP);
  const xpAward = awardResearchXP({ quality, usedHint:state.usedHint, tryNumber:state.tryNumber });
  state.profile.researchXP = (Number(state.profile.researchXP) || 0) + xpAward;
  const after = getResearchStatus(state.profile.researchXP);
  state.lastXpAward = xpAward;
  state.lastRankUp = after.level > before.level ? after : null;
  const event = { questionId:q.id, questionVersion:q.version, lab:q.lab, skill:q.skill, contentLevel:q.contentLevel, depth:q.depth, quality, tryNumber:state.tryNumber, usedHint:state.usedHint, mode:state.sessionKind, xpAward, answeredAt:new Date().toISOString() };
  state.attempts.push(event); state.sessionAttempts.push(event); saveAttempts(state.attempts); saveProfile(state.profile); syncBadges();
}

function chooseOption(id) {
  if (state.quality === "best") return;
  const q = getQuestion(state.queue[state.position]?.questionId);
  const option = q?.options.find((item) => item.id === id);
  if (!q || !option) return;
  state.selectedId = id; state.quality = option.quality; recordAnswer(q, option.quality);
  if (option.quality === "incorrect" && state.tryNumber === 1) {
    const retryLevel = q.contentLevel || 1;
    const retry = findDelayedRetry(QUESTIONS, q, new Set(state.queue.map((item) => item.questionId)), retryLevel);
    if (retry) state.queue.splice(Math.min(state.queue.length, state.position + 3), 0, { questionId:retry.id, role:"retry" });
  }
  render();
}

function nextQuestion() {
  if (state.position >= state.queue.length - 1) {
    if (state.screen === "diagnosis") {
      state.profile.onboarded = true; saveProfile(state.profile); state.onboardingResult = true; state.screen = "onboarding";
    } else state.sessionComplete = true;
    return render();
  }
  state.position += 1;
  Object.assign(state, { selectedId:null, quality:null, tryNumber:1, usedHint:false, showHint:false, showWhy:false, lastXpAward:0, lastRankUp:null });
  render();
}

function resultTemplate() {
  const byQuestion = new Map(); state.sessionAttempts.forEach((item) => byQuestion.set(item.questionId, item));
  const records = [...byQuestion.values()];
  const best = records.filter((item) => item.quality === "best").length;
  const recovered = records.filter((item) => item.quality === "best" && item.tryNumber > 1).length;
  const skills = [...new Set(records.filter((item) => item.quality !== "incorrect").map((item) => getSkill(item.skill)?.label).filter(Boolean))];
  const tryPrompt = state.queue.map((item) => getQuestion(item.questionId)?.tryIt).find(Boolean);
  const sessionXP = state.sessionAttempts.reduce((sum, item) => sum + (item.xpAward || 0), 0);
  const researcher = getResearchStatus(state.profile.researchXP);
  return `<main class="center-page result-page"><section class="result-card result-with-navi">${naviImage(NAVI.complete, "", "result-navi")}<div class="discovery-burst">🎉</div><p class="eyebrow">${state.sessionKind === "focus" ? "特訓クリア！" : "チャレンジ クリア！"}</p><h1>ことばパワーがアップ！</h1><div class="result-xp"><span>今回ためた研究XP</span><strong>+${sessionXP} XP</strong><small>いまは ${researcher.title}・Lv.${researcher.level}</small></div><div class="result-numbers"><div><strong>${records.length}</strong><span>考えた問題</span></div><div><strong>${best}</strong><span>一番ぴったり</span></div><div><strong>${recovered}</strong><span>考え直してできた</span></div></div>${state.newBadges.length ? `<div class="new-badge-panel"><p>新しい達成バッジ！</p><div>${state.newBadges.slice(0,3).map((badge) => `<span><img src="${badge.image}" alt="" onerror="this.hidden=true"><b>${badge.title}</b></span>`).join("")}</div>${state.newBadges.length > 3 ? `<small>ほか ${state.newBadges.length - 3}個も獲得したよ</small>` : ""}<button data-action="badges">バッジを見る →</button></div>` : ""}${skills.length ? `<div class="discoveries"><h2>できるようになってきたよ</h2>${skills.slice(0,3).map((skill) => `<span>✦ ${skill}</span>`).join("")}</div>` : ""}${tryPrompt ? `<div class="try-it"><small>やってみよう！</small><p>${tryPrompt}</p><span>正解・不正解はないよ。声に出したり、短く書いたりしてみよう。</span></div>` : ""}<div class="button-row"><button class="secondary-button" data-action="again">もう一回！</button><button class="primary-button" data-action="home">ホームへ <span>→</span></button></div></section></main>`;
}

function vocabularyProgress() {
  const questionMap = new Map(QUESTIONS.map((question) => [question.id, question]));
  return VOCABULARY_DATA.map((word) => {
    const attempts = state.attempts.filter((attempt) => word.questionIds.includes(attempt.questionId));
    let stage = attempts.length ? 1 : 0;
    if (attempts.some((attempt) => attempt.quality !== "incorrect")) stage = 2;
    if (attempts.some((attempt) => attempt.quality === "best" && !attempt.usedHint)) stage = 3;
    const transferred = attempts.some((attempt) => {
      const question = questionMap.get(attempt.questionId);
      return attempt.quality === "best" && question?.purpose === "transfer";
    });
    const repeatedSuccess = new Set(attempts.filter((attempt) => attempt.quality === "best" && !attempt.usedHint).map((attempt) => attempt.questionId)).size >= 2;
    if (transferred || repeatedSuccess) stage = 4;
    return { ...word, stage };
  });
}

function escapeNote(value) {
  return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function vocabularyTemplate() {
  const labels = ["まだ出会っていない", "出会った", "意味が分かる", "使い分けられる", "別の場面でも使える"];
  const all = vocabularyProgress();
  const found = all.filter((word) => word.stage > 0);
  const categories = ["すべて", ...new Set(VOCABULARY_DATA.map((word) => word.category))];
  const shown = found.filter((word) => state.vocabularyCategory === "すべて" || word.category === state.vocabularyCategory);
  const strong = found.filter((word) => word.stage >= 3).length;
  return `<main class="collection-page vocabulary-page"><section class="collection-hero"><div><p class="eyebrow">出会った言葉を、自分のものに</p><h1>ことばファイル</h1><p>意味や使い分けの成長を見ながら、気になった言葉を学びノートに残せます。</p></div><div class="collection-count"><strong>${found.length}</strong><span>出会った言葉</span><small>${strong}語を使い分けた</small></div></section>
    <div class="vocab-notebook-link"><span>✎</span><div><strong>学びノート</strong><small>自分の言葉で意味や例文を書いてみよう</small></div><button data-action="notebook">ノートを見る →</button></div>
    <div class="filter-row" aria-label="ことばの分類">${categories.map((category) => `<button data-vocab-category="${category}" class="${state.vocabularyCategory === category ? "selected" : ""}">${category}</button>`).join("")}</div>
    ${shown.length ? `<section class="vocabulary-grid">${shown.map((word) => {
      const note = state.notebook[word.id] || {};
      const editing = state.noteWordId === word.id;
      return `<article class="vocabulary-card stage-${word.stage}"><div><span>${word.levelLabel}</span><b>${word.category}</b></div><h2>${displayText(word.term)}</h2><p>${displayText(word.meaning)}</p><blockquote>${displayText(word.example)}</blockquote>${word.related ? `<small>近い表現：${displayText(word.related)}</small>` : ""}<footer><i>${word.stage === 4 ? "✦" : word.stage === 3 ? "◎" : word.stage === 2 ? "○" : "・"}</i><strong>${labels[word.stage]}</strong></footer>
      <button class="word-note-toggle" data-note-word="${word.id}">${note.meaning || note.example || note.thought ? "✎ ノートを編集する" : "✎ 学びノートに書く"}</button>
      ${editing ? `<div class="word-note-editor"><label>自分の言葉で意味を書く<textarea id="note-meaning" rows="2" placeholder="この言葉は、どんな意味かな？">${escapeNote(note.meaning)}</textarea></label><label>自分で例文を作る<textarea id="note-example" rows="2" placeholder="この言葉を使って文を作ってみよう">${escapeNote(note.example)}</textarea></label><label>気づいたこと・似た言葉との違い<textarea id="note-thought" rows="2" placeholder="新しく気づいたことを書こう">${escapeNote(note.thought)}</textarea></label><div class="note-editor-actions"><button data-note-cancel>とじる</button><button class="primary-button" data-note-save="${word.id}">ノートを保存</button></div></div>` : note.meaning || note.example || note.thought ? `<div class="saved-note-preview"><b>✎ 自分の学びメモ</b><p>${escapeNote(note.meaning || note.example || note.thought)}</p></div>` : ""}
      </article>`;
    }).join("")}</section>` : `<section class="empty-collection"><span>あ</span><h2>${found.length ? "この分類の言葉は、これから！" : "最初の言葉を見つけよう！"}</h2><p>今日のチャレンジや特訓に取り組むと、ここに言葉が集まります。</p><button class="primary-button" data-action="home">今日のことばに挑戦 →</button></section>`}
    <div class="collection-actions"><button class="secondary-button" data-action="carte">できたことへ</button><button class="primary-button" data-action="home">ホームへ →</button></div></main>`;
}

function notebookTemplate() {
  const entries = Object.entries(state.notebook).filter(([id, note]) => VOCABULARY_DATA.some((word) => word.id === id) && (note.meaning || note.example || note.thought)).map(([id, note]) => ({ word:VOCABULARY_DATA.find((item) => item.id === id), note })).filter((item) => item.word);
  return `<main class="collection-page notebook-page"><section class="collection-hero"><div><p class="eyebrow">自分の言葉で、学びを残そう</p><h1>学びノート</h1><p>意味を説明したり、例文を作ったり。書きためた言葉は、いつでも見返せます。</p></div><div class="collection-count"><strong>${entries.length}</strong><span>ノートにまとめた言葉</span></div></section>
    <div class="notebook-guide"><b>書くときのヒント</b><span>① 自分の言葉で意味を書く</span><span>② その言葉を使って文を作る</span><span>③ 似た言葉との違いや気づきを残す</span></div>
    ${entries.length ? `<section class="notebook-entry-list">${entries.map(({word,note}) => `<article><div><small>${word.category}</small><h2>${displayText(word.term)}</h2></div>${note.meaning ? `<p><b>自分の説明</b>${escapeNote(note.meaning)}</p>` : ""}${note.example ? `<p><b>自分の例文</b>${escapeNote(note.example)}</p>` : ""}${note.thought ? `<p><b>気づいたこと</b>${escapeNote(note.thought)}</p>` : ""}<button data-edit-note="${word.id}">編集する →</button></article>`).join("")}</section>` : `<section class="empty-collection"><span>✎</span><h2>最初の学びを残そう</h2><p>ことばファイルで気になった言葉を選び、「学びノートに書く」からまとめられるよ。</p><button class="primary-button" data-action="vocabulary">ことばファイルを見る →</button></section>`}
    <div class="collection-actions"><button class="secondary-button" data-action="vocabulary">ことばファイルへ</button><button class="primary-button" data-action="home">ホームへ →</button></div></main>`;
}

function badgeGroup(badge) {
  if (badge.id.startsWith("process-")) return "学び方";
  if (badge.id.startsWith("skill-")) return "6つのジャンル";
  if (badge.id.startsWith("lab-")) return "6つのジャンル";
  return "研究者ランク";
}

function badgesTemplate() {
  const categories = ["すべて", "学び方", "ジャンル", "研究者ランク"];
  const shown = BADGES.filter((badge) => state.badgeCategory === "すべて" || badgeGroup(badge) === (state.badgeCategory === "ジャンル" ? "6つのジャンル" : state.badgeCategory));
  const awarded = new Set(state.badgeIds);
  return `<main class="collection-page badge-page"><section class="collection-hero badge-hero"><div><p class="eyebrow">正解だけじゃない達成</p><h1>達成バッジ</h1><p>挑戦、考え直し、継続、6ジャンルの成長を記録しています。</p></div><div class="collection-count"><strong>${state.badgeIds.length}</strong><span>獲得したバッジ</span><small>全 ${BADGES.length}個</small></div></section><div class="filter-row" aria-label="バッジの分類">${categories.map((category) => `<button data-badge-category="${category}" class="${state.badgeCategory === category ? "selected" : ""}">${category}</button>`).join("")}</div><section class="badge-grid">${shown.map((badge) => { const has = awarded.has(badge.id); return `<article class="badge-card ${has ? "earned" : "locked"}"><img src="${badge.image}" alt="" loading="lazy" decoding="async" onerror="this.hidden=true"><div><span>${badgeGroup(badge)}</span><h2>${has ? badge.title : "これからの達成"}</h2><p>${has ? badge.description : "学習を続けると、ここに新しいバッジが現れます。"}</p></div>${has ? `<b>獲得！</b>` : `<b>？</b>`}</article>`; }).join("")}</section><div class="collection-actions"><button class="secondary-button" data-action="carte">できたことへ</button><button class="primary-button" data-action="home">ホームへ →</button></div></main>`;
}

function carteTemplate() {
  const p = progress().filter((item) => item.attempts > 0);
  const groups = {
    strong: p.filter((item) => item.stableDepth >= 4 && !item.needsReview),
    growing: p.filter((item) => item.stableDepth >= 2 && item.stableDepth < 4),
    next: p.filter((item) => item.needsReview || item.stableDepth < 2),
  };
  const section = (title, icon, items, empty) => `<section class="carte-section"><h2><span>${icon}</span>${title}</h2>${items.length ? `<div class="skill-list">${items.map((item) => { const skill = getSkill(item.skill); return `<article><div><span class="${LABS[item.lab].color}">${LABS[item.lab].icon}</span><div><strong>${skill?.label}</strong><small>${item.stableDepth >= 5 ? "ちがうお話でもできたよ！" : `${DEPTH_LABELS[Math.max(1,item.stableDepth)]}にチャレンジ中`}</small></div></div><b>${item.needsReview ? "もう一回" : "のびてる！"}</b></article>`; }).join("")}</div>` : `<p class="empty-state">${empty}</p>`}</section>`;
  return `<main class="carte-page"><section class="carte-hero"><div><p class="eyebrow">きみのがんばり</p><h1>できたこと</h1><p>ことばを考えた分だけ、できることがふえていくよ。</p></div><div class="carte-research">${researchStatusTemplate()}</div><div class="carte-stamp"><strong>${state.attempts.length}</strong><span>考えた回数</span><small>ことばの研究記録</small></div></section><div class="carte-shortcuts"><button data-action="vocabulary"><span>あ</span><div><strong>ことばファイル</strong><small>${vocabularyProgress().filter((word) => word.stage > 0).length}語に出会った</small></div><b>→</b></button><button data-action="badges"><span>🏅</span><div><strong>達成バッジ</strong><small>${state.badgeIds.length} / ${BADGES.length}個</small></div><b>→</b></button></div><div class="carte-columns">${section("できるようになった！","✦",groups.strong,"チャレンジすると、ここにできたことが集まるよ！")} ${section("ぐんぐん成長中","↗",groups.growing,"これから、できることがふえていくよ。")} ${section("つぎにチャレンジ","◎",groups.next,"迷った問題は、またちがうお話で出てくるよ。")}</div><section class="teacher-note"><div><h2>ちゃんと見ているよ</h2><p>正解だけでなく、ヒントを見たことや、考え直してできたことも大切にしています。</p></div><button data-action="home">今日のチャレンジへ →</button></section><details class="data-settings"><summary>せってい</summary><p>この端末に、これまでのがんばりを保存しています。</p><button data-action="reset">${state.resetConfirm ? "本当に最初からやり直す" : "最初からやり直す"}</button></details></main>`;
}

app.addEventListener("click", (event) => {
  const button = event.target.closest("button"); if (!button) return;
  if (button.dataset.furigana) { state.profile.furigana = button.dataset.furigana; saveProfile(state.profile); return render(); }
  if (button.dataset.focusLab) {
    state.focusLab = button.dataset.focusLab;
    state.focusSkill = SKILL_MAP.find((skill) => skill.lab === state.focusLab)?.id || null;
    state.screen = "focus";
    return render();
  }
  if (button.dataset.focusSkill) { state.focusSkill = button.dataset.focusSkill; return render(); }
  if (button.dataset.focusSize) { state.focusSize = Number(button.dataset.focusSize); return render(); }
  if (button.dataset.vocabCategory) { state.vocabularyCategory = button.dataset.vocabCategory; return render(); }
  if (button.dataset.noteWord) { state.noteWordId = state.noteWordId === button.dataset.noteWord ? null : button.dataset.noteWord; return render(); }
  if (button.dataset.noteCancel !== undefined) { state.noteWordId = null; return render(); }
  if (button.dataset.noteSave) {
    const id = button.dataset.noteSave;
    state.notebook[id] = {
      meaning: app.querySelector("#note-meaning")?.value.trim() || "",
      example: app.querySelector("#note-example")?.value.trim() || "",
      thought: app.querySelector("#note-thought")?.value.trim() || "",
      updatedAt: new Date().toISOString(),
    };
    if (!state.notebook[id].meaning && !state.notebook[id].example && !state.notebook[id].thought) delete state.notebook[id];
    saveNotebook(state.notebook); state.noteWordId = null; return render();
  }
  if (button.dataset.editNote) { state.screen = "vocabulary"; state.vocabularyCategory = "すべて"; state.noteWordId = button.dataset.editNote; return render(); }
  if (button.dataset.badgeCategory) { state.badgeCategory = button.dataset.badgeCategory; return render(); }
  if (button.dataset.option) return chooseOption(button.dataset.option);
  if (button.dataset.size) return startQueue(buildSession(QUESTIONS, state.profile, state.attempts, Number(button.dataset.size)), "research", "adaptive");
  const action = button.dataset.action;
  if (action === "home") { state.screen = "home"; state.sessionComplete = false; return render(); }
  if (action === "carte") { state.screen = "carte"; return render(); }
  if (action === "vocabulary") { state.screen = "vocabulary"; state.noteWordId = null; return render(); }
  if (action === "notebook") { state.screen = "notebook"; return render(); }
  if (action === "badges") { state.screen = "badges"; return render(); }
  if (action === "settings") { state.screen = "settings"; return render(); }
  if (action === "focus") { state.screen = "focus"; return render(); }
  if (action === "start-focus" && state.focusSkill) return startQueue(buildFocusSession(QUESTIONS, state.profile, state.attempts, state.focusSkill, state.focusSize), "research", "focus");
  if (action === "hint") { state.usedHint = true; state.showHint = true; return render(); }
  if (action === "why") { state.showWhy = !state.showWhy; return render(); }
  if (action === "retry") { state.tryNumber += 1; state.selectedId = null; state.quality = null; state.showWhy = false; return render(); }
  if (action === "next") return nextQuestion();
  if (action === "again") {
    const size = state.queue.length <= 3 ? 3 : state.queue.length <= 6 ? 5 : 10;
    return state.sessionKind === "focus"
      ? startQueue(buildFocusSession(QUESTIONS, state.profile, state.attempts, state.focusSkill, state.focusSize), "research", "focus")
      : startQueue(buildSession(QUESTIONS, state.profile, state.attempts, size), "research", "adaptive");
  }
  if (action === "reset") {
    if (!state.resetConfirm) { state.resetConfirm = true; return render(); }
    resetLearningData(); Object.assign(state, { profile:{ furigana:"grade", onboarded:true, researchXP:0, createdAt:new Date().toISOString() }, attempts:[], badgeIds:[], newBadges:[], notebook:{}, screen:"home", onboardingResult:false, resetConfirm:false, focusLab:"meaning", focusSkill:"vocab.meaning", focusSize:5 }); saveNotebook({}); return render();
  }
});

render();
