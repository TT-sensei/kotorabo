import { LABS, DEPTH_LABELS, getSkill } from "./data/skill-map.js";
import { QUESTIONS, DIAGNOSTIC_IDS, getQuestion } from "./data/questions.js";
import { buildProgress, buildSession, findDelayedRetry, labReadiness } from "./core/engine.js";
import { loadAttempts, loadProfile, resetLearningData, saveAttempts, saveProfile } from "./core/storage.js";

const app = document.querySelector("#app");
const roleLabel = { recall:"思い出す", retry:"もう一度", current:"今の研究", stretch:"一歩先へ", transfer:"ちがう場面で", diagnostic:"最初の研究" };
const qualityCopy = {
  best: { mark:"◎", title:"この場面に一番ぴったり！", className:"best" },
  acceptable: { mark:"○", title:"これも合っているね", className:"okay" },
  incorrect: { mark:"↺", title:"もう一度考えてみよう", className:"retry" },
};

const state = {
  profile: loadProfile() || { grade:3, furigana:"grade", onboarded:false, createdAt:new Date().toISOString() },
  attempts: loadAttempts(),
  screen: loadProfile()?.onboarded ? "home" : "onboarding",
  onboardingResult: false,
  queue: [], position:0, selectedId:null, quality:null, tryNumber:1,
  usedHint:false, showHint:false, showWhy:false, sessionAttempts:[], sessionComplete:false,
  resetConfirm:false,
};

const labKeys = Object.keys(LABS);
const progress = () => buildProgress(state.attempts);

function header() {
  return `<header class="site-header">
    <button class="brand" data-action="home" aria-label="ホームへ戻る"><span class="brand-mark small">こ</span><span><strong>ことラボ</strong><small>ことばをためす。伝える力が育つ。</small></span></button>
    <nav aria-label="メインメニュー"><button data-action="home" class="${state.screen === "home" ? "active" : ""}">今日の研究</button><button data-action="carte" class="${state.screen === "carte" ? "active" : ""}">研究カルテ</button><span class="grade-chip">小学${state.profile.grade}年</span></nav>
  </header>`;
}

function render() {
  if (state.screen === "onboarding") return renderOnboarding();
  app.innerHTML = header() + (
    state.screen === "home" ? homeTemplate() :
    state.screen === "carte" ? carteTemplate() :
    state.sessionComplete ? resultTemplate() : questionTemplate()
  );
  window.scrollTo({ top:0, behavior:"smooth" });
}

function renderOnboarding() {
  if (state.onboardingResult) {
    app.innerHTML = `<main class="center-page"><section class="result-card diagnosis-result"><div class="discovery-burst">✦</div><p class="eyebrow">最初の研究データができました！</p><h1>いいスタートです</h1><p>ここから、答え方に合わせて毎日の研究を少しずつ組み立てます。</p><div class="diagnosis-grid">${labKeys.map((lab) => { const info = labReadiness(progress(), lab); return `<div class="diagnosis-item ${LABS[lab].color}"><span>${LABS[lab].icon}</span><div><strong>${LABS[lab].short}</strong><small>${info.label}</small></div></div>`; }).join("")}</div><button class="primary-button" data-action="finish-onboarding">今日の研究へ <span>→</span></button></section></main>`;
    return;
  }
  app.innerHTML = `<main class="onboarding-page">
    <section class="onboarding-copy"><p class="eyebrow"><b>NEW</b> ことばの研究をはじめよう</p><h1><span>ことば</span>をためす。<br>伝える力が育つ。</h1><p>正解の数だけではなく、「どう考えたか」を少しずつ見つける国語の研究室です。</p><div class="lab-mini-row">${labKeys.map((id) => `<div class="lab-mini ${LABS[id].color}"><b>${LABS[id].icon}</b><span>${LABS[id].short}</span></div>`).join("")}</div></section>
    <section class="setup-card"><p class="step-label">最初の設定</p><h2>あなたに合う研究を準備します</h2><fieldset><legend>いま、何年生？</legend><div class="grade-grid">${[1,2,3,4,5,6].map((grade) => `<button data-grade="${grade}" class="${state.profile.grade === grade ? "selected" : ""}"><strong>${grade}</strong><span>年</span></button>`).join("")}</div></fieldset><fieldset><legend>漢字の読み方サポート</legend><div class="choice-row"><button data-furigana="grade" class="${state.profile.furigana === "grade" ? "selected" : ""}">学年に合わせる</button><button data-furigana="more" class="${state.profile.furigana === "more" ? "selected" : ""}">ひらがな多め</button></div></fieldset><button class="primary-button full" data-action="diagnostic">最初の研究をはじめる <span>→</span></button><p class="safe-note">点数や「苦手」の判定はしません。今のスタート地点を見つけます。</p></section>
  </main>`;
}

function homeTemplate() {
  const p = progress();
  const reviewCount = p.filter((item) => item.needsReview).length;
  return `<main class="home-page"><section class="research-hero"><div><p class="eyebrow light"><i></i> きょうのあなたにぴったり</p><h1>今日の研究</h1><p>${reviewCount ? "前に迷ったところも、ちがう場面で確かめます。" : "4つのラボをめぐって、ことばの力を試します。"}</p></div><div class="flask-art" aria-hidden="true"><span>あ</span><span>文</span><span>→</span></div></section>
    <section class="session-picker"><div class="section-heading"><div><p>研究の長さをえらぶ</p><h2>今日はどのくらい試す？</h2></div><span>いつでも途中で休めます</span></div><div class="session-grid">
      <button data-size="3"><span class="session-icon bolt">↯</span><div><small>ちょこっと</small><strong>3問</strong><p>約2分・すきま時間に</p></div><b>→</b></button>
      <button data-size="5" class="recommended"><em>おすすめ</em><span class="session-icon scope">◎</span><div><small>いつもの</small><strong>5問</strong><p>復習・今の力・一歩先</p></div><b>→</b></button>
      <button data-size="10"><span class="session-icon flame">♨</span><div><small>しっかり</small><strong>10問</strong><p>約8分・じっくり研究</p></div><b>→</b></button>
    </div></section>
    <section class="lab-overview"><div class="section-heading"><div><p>4つの研究分野</p><h2>ことばから文章へ</h2></div><button class="text-button" data-action="carte">研究カルテを見る →</button></div><div class="lab-grid">${labKeys.map((lab) => { const info = labReadiness(p, lab); return `<article class="lab-card ${LABS[lab].color}"><div><span>${LABS[lab].icon}</span><small>${info.label}</small></div><h3>${LABS[lab].label}</h3><p>${LABS[lab].question}</p><i><b style="width:${Math.max(4, info.value)}%"></b></i></article>`; }).join("")}</div><p class="history-note">これまでの研究記録：${state.attempts.length}回の考え方を端末に保存中</p></section></main>`;
}

function startQueue(items, screen) {
  Object.assign(state, { queue:items, screen, position:0, selectedId:null, quality:null, tryNumber:1, usedHint:false, showHint:false, showWhy:false, sessionAttempts:[], sessionComplete:false });
  render();
}

function startDiagnostic() {
  const items = DIAGNOSTIC_IDS.map(getQuestion).filter((q) => q && q.gradeMin <= state.profile.grade).map((q) => ({ questionId:q.id, role:"diagnostic" }));
  startQueue(items, "diagnosis");
}

function questionTemplate() {
  const item = state.queue[state.position];
  const q = getQuestion(item?.questionId);
  if (!q) return `<main class="center-page"><section class="result-card"><h1>問題を準備できませんでした</h1><button class="primary-button" data-action="home">ホームへ</button></section></main>`;
  const lab = LABS[q.lab];
  const selected = q.options.find((option) => option.id === state.selectedId);
  const feedback = state.quality ? qualityCopy[state.quality] : null;
  const canRetry = state.quality !== "best" && state.tryNumber < 2;
  return `<main class="research-page"><section class="research-topline"><div><span class="lab-token ${lab.color}">${lab.icon}</span><div><small>${lab.label}</small><strong>${roleLabel[item.role]}</strong></div></div><p><b>${state.position + 1}</b> / ${state.queue.length}</p></section><div class="research-progress"><i style="width:${((state.position + 1) / state.queue.length) * 100}%"></i></div>
    <section class="question-card"><div class="question-meta"><span>研究テーマ</span><b>${q.subskill}</b><small>深さ：${DEPTH_LABELS[q.depth]}</small></div>
    ${(q.audience || q.goal) ? `<div class="situation-strip">${q.audience ? `<span><b>相手</b>${q.audience}</span>` : ""}${q.goal ? `<span><b>目的</b>${q.goal}</span>` : ""}</div>` : ""}
    ${q.context ? `<p class="question-context">${q.context}</p>` : ""}<h1>${q.prompt}</h1><div class="option-grid">${q.options.map((option, index) => { const chosen = state.selectedId === option.id; return `<button data-option="${option.id}" class="${chosen ? `selected ${state.quality}` : ""}" ${(state.quality === "best" || (state.quality && !canRetry)) ? "disabled" : ""}><span>${String.fromCharCode(65 + index)}</span><strong>${option.text}</strong>${chosen && state.quality ? `<b>${qualityCopy[state.quality].mark}</b>` : ""}</button>`; }).join("")}</div>
    ${!state.quality ? `<button class="hint-button" data-action="hint" ${state.usedHint ? "disabled" : ""}>💡 ${state.usedHint ? "ヒントを表示中" : "ヒントを見る"}</button>` : ""}
    ${state.showHint && !state.quality ? `<div class="hint-box"><b>小さな手がかり</b><p>${q.hint}</p></div>` : ""}
    ${feedback ? `<div class="feedback-box ${feedback.className}" role="status"><span>${feedback.mark}</span><div><h2>${feedback.title}</h2>${selected?.feedback ? `<p>${selected.feedback}</p>` : ""}</div></div><div class="answer-actions">${canRetry ? `<button class="secondary-button" data-action="retry">もう一度選ぶ</button>` : ""}${(state.quality === "best" || !canRetry || state.quality === "acceptable") ? `<button class="primary-button" data-action="next">${state.position === state.queue.length - 1 ? (state.screen === "diagnosis" ? "研究データを見る" : "研究をまとめる") : "次の研究へ"} <span>→</span></button>` : ""}<button class="why-button" data-action="why">💡 なぜこれなの？</button></div>` : ""}
    ${state.showWhy && state.quality ? `<div class="why-panel"><h3>考え方の発見</h3><p>${q.explanation}</p>${q.visual ? `<div class="relation-visual"><span>${q.visual[0]}</span><b>${q.visual[1]}<i>→</i></b><span>${q.visual[2]}</span></div>` : ""}</div>` : ""}</section></main>`;
}

function recordAnswer(q, quality) {
  const event = { questionId:q.id, questionVersion:q.version, lab:q.lab, skill:q.skill, contentLevel:q.contentLevel, depth:q.depth, quality, tryNumber:state.tryNumber, usedHint:state.usedHint, answeredAt:new Date().toISOString() };
  state.attempts.push(event); state.sessionAttempts.push(event); saveAttempts(state.attempts);
}

function chooseOption(id) {
  if (state.quality === "best") return;
  const q = getQuestion(state.queue[state.position]?.questionId);
  const option = q?.options.find((item) => item.id === id);
  if (!q || !option) return;
  state.selectedId = id; state.quality = option.quality; recordAnswer(q, option.quality);
  if (option.quality === "incorrect" && state.tryNumber === 1) {
    const retry = findDelayedRetry(QUESTIONS, q, new Set(state.queue.map((item) => item.questionId)), state.profile.grade);
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
  Object.assign(state, { selectedId:null, quality:null, tryNumber:1, usedHint:false, showHint:false, showWhy:false });
  render();
}

function resultTemplate() {
  const byQuestion = new Map(); state.sessionAttempts.forEach((item) => byQuestion.set(item.questionId, item));
  const records = [...byQuestion.values()];
  const best = records.filter((item) => item.quality === "best").length;
  const recovered = records.filter((item) => item.quality === "best" && item.tryNumber > 1).length;
  const skills = [...new Set(records.filter((item) => item.quality !== "incorrect").map((item) => getSkill(item.skill)?.label).filter(Boolean))];
  const tryPrompt = state.queue.map((item) => getQuestion(item.questionId)?.tryIt).find(Boolean);
  return `<main class="center-page result-page"><section class="result-card"><div class="discovery-burst">✦</div><p class="eyebrow">研究完了</p><h1>今日の発見が増えました！</h1><div class="result-numbers"><div><strong>${records.length}</strong><span>研究した問題</span></div><div><strong>${best}</strong><span>一番ぴったり</span></div><div><strong>${recovered}</strong><span>考え直して発見</span></div></div>${skills.length ? `<div class="discoveries"><h2>深まった研究</h2>${skills.slice(0,3).map((skill) => `<span>✦ ${skill}</span>`).join("")}</div>` : ""}${tryPrompt ? `<div class="try-it"><small>ためしてみよう</small><p>${tryPrompt}</p><span>採点はしません。声に出したり、短く書いたりしてみよう。</span></div>` : ""}<div class="button-row"><button class="secondary-button" data-action="again">もう一度研究</button><button class="primary-button" data-action="home">ホームへ <span>→</span></button></div></section></main>`;
}

function carteTemplate() {
  const p = progress().filter((item) => item.attempts > 0);
  const groups = {
    strong: p.filter((item) => item.stableDepth >= 4 && !item.needsReview),
    growing: p.filter((item) => item.stableDepth >= 2 && item.stableDepth < 4),
    next: p.filter((item) => item.needsReview || item.stableDepth < 2),
  };
  const section = (title, icon, items, empty) => `<section class="carte-section"><h2><span>${icon}</span>${title}</h2>${items.length ? `<div class="skill-list">${items.map((item) => { const skill = getSkill(item.skill); return `<article><div><span class="${LABS[item.lab].color}">${LABS[item.lab].icon}</span><div><strong>${skill?.label}</strong><small>${item.stableDepth >= 5 ? "ちがう文章でも使えています" : `${DEPTH_LABELS[Math.max(1,item.stableDepth)]}まで研究中`}</small></div></div><b>${item.needsReview ? "もう一度" : "成長中"}</b></article>`; }).join("")}</div>` : `<p class="empty-state">${empty}</p>`}</section>`;
  return `<main class="carte-page"><section class="carte-hero"><div><p class="eyebrow">わたしの研究記録</p><h1>研究カルテ</h1><p>点数ではなく、できるようになってきたことを集めます。</p></div><div class="carte-stamp"><strong>${state.attempts.length}</strong><span>研究記録</span><small>小学${state.profile.grade}年</small></div></section><div class="carte-columns">${section("身についてきた","✦",groups.strong,"研究を続けると、ここに発見が集まります。")} ${section("研究中","↗",groups.growing,"今は新しい研究を準備中です。")} ${section("次の研究","◎",groups.next,"迷ったところは、今日の研究に自動で入ります。")}</div><section class="teacher-note"><div><h2>記録の見方</h2><p>正解だけでなく、ヒント・考え直し・別場面での答え方から研究の進み方を見ています。</p></div><button data-action="home">今日の研究へ →</button></section><details class="data-settings"><summary>設定とデータ</summary><p>この端末にだけ学習履歴を保存しています。</p><button data-action="reset">${state.resetConfirm ? "本当に最初からやり直す" : "最初からやり直す"}</button></details></main>`;
}

app.addEventListener("click", (event) => {
  const button = event.target.closest("button"); if (!button) return;
  if (button.dataset.grade) { state.profile.grade = Number(button.dataset.grade); saveProfile(state.profile); return render(); }
  if (button.dataset.furigana) { state.profile.furigana = button.dataset.furigana; saveProfile(state.profile); return render(); }
  if (button.dataset.option) return chooseOption(button.dataset.option);
  if (button.dataset.size) return startQueue(buildSession(QUESTIONS, state.profile, state.attempts, Number(button.dataset.size)), "research");
  const action = button.dataset.action;
  if (action === "diagnostic") return startDiagnostic();
  if (action === "finish-onboarding") { state.onboardingResult = false; state.screen = "home"; return render(); }
  if (action === "home") { state.screen = "home"; state.sessionComplete = false; return render(); }
  if (action === "carte") { state.screen = "carte"; return render(); }
  if (action === "hint") { state.usedHint = true; state.showHint = true; return render(); }
  if (action === "why") { state.showWhy = !state.showWhy; return render(); }
  if (action === "retry") { state.tryNumber += 1; state.selectedId = null; state.quality = null; state.showWhy = false; return render(); }
  if (action === "next") return nextQuestion();
  if (action === "again") return startQueue(buildSession(QUESTIONS, state.profile, state.attempts, state.queue.length <= 3 ? 3 : state.queue.length <= 6 ? 5 : 10), "research");
  if (action === "reset") {
    if (!state.resetConfirm) { state.resetConfirm = true; return render(); }
    resetLearningData(); Object.assign(state, { profile:{ grade:3, furigana:"grade", onboarded:false, createdAt:new Date().toISOString() }, attempts:[], screen:"onboarding", onboardingResult:false, resetConfirm:false }); return render();
  }
});

render();
