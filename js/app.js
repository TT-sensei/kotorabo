import { LABS, SKILL_MAP, DEPTH_LABELS, LEVEL_WORLDS, getSkill } from "./data/skill-map.js";
import { QUESTIONS, DIAGNOSTIC_IDS, getQuestion } from "./data/questions.js";
import { buildFocusSession, buildProgress, buildSession, findDelayedRetry, labReadiness } from "./core/engine.js";
import { loadAttempts, loadProfile, resetLearningData, saveAttempts, saveProfile } from "./core/storage.js";

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
  ? { ...savedProfile, challengeLevel:savedProfile.challengeLevel ?? savedProfile.grade ?? 3 }
  : { grade:3, challengeLevel:3, furigana:"grade", onboarded:false, createdAt:new Date().toISOString() };

const state = {
  profile: initialProfile,
  attempts: loadAttempts(),
  screen: initialProfile.onboarded ? "home" : "onboarding",
  onboardingResult: false,
  queue: [], position:0, selectedId:null, quality:null, tryNumber:1,
  usedHint:false, showHint:false, showWhy:false, sessionAttempts:[], sessionComplete:false,
  sessionKind:"adaptive", focusLab:"words", focusSkill:null, focusSize:5,
  resetConfirm:false,
};

const labKeys = Object.keys(LABS);
const progress = () => buildProgress(state.attempts);

function header() {
  return `<header class="site-header">
    <button class="brand" data-action="home" aria-label="ホームへ戻る"><span class="brand-mark small">こ</span><span><strong>ことラボ</strong><small>ことばをためして、伝える力をのばそう！</small></span></button>
    <nav aria-label="メインメニュー"><button data-action="home" class="${state.screen === "home" ? "active" : ""}">今日のチャレンジ</button><button data-action="focus" class="${state.screen === "focus" ? "active" : ""}">特訓する</button><button data-action="carte" class="${state.screen === "carte" ? "active" : ""}">できたこと</button><button data-action="settings" class="${state.screen === "settings" ? "active" : ""}">せってい</button><span class="grade-chip">${state.profile.grade}年生・レベル${state.profile.challengeLevel}</span></nav>
  </header>`;
}

function render() {
  if (state.screen === "onboarding") return renderOnboarding();
  app.innerHTML = header() + (
    state.screen === "home" ? homeTemplate() :
    state.screen === "carte" ? carteTemplate() :
    state.screen === "settings" ? settingsTemplate() :
    state.screen === "focus" ? focusTemplate() :
    state.sessionComplete ? resultTemplate() : questionTemplate()
  );
  window.scrollTo({ top:0, behavior:"smooth" });
}

function renderOnboarding() {
  if (state.onboardingResult) {
    app.innerHTML = `<main class="center-page"><section class="result-card diagnosis-result"><div class="discovery-burst">🎉</div><p class="eyebrow">はじめのチャレンジ クリア！</p><h1>いいスタート！</h1><p>きみの答え方が少し分かったよ。ぴったりの問題をえらんでいくね。</p><div class="diagnosis-grid">${labKeys.map((lab) => { const info = labReadiness(progress(), lab); return `<div class="diagnosis-item ${LABS[lab].color}"><span>${LABS[lab].icon}</span><div><strong>${LABS[lab].short}</strong><small>${info.label}</small></div></div>`; }).join("")}</div><button class="primary-button" data-action="finish-onboarding">今日のチャレンジへ <span>→</span></button></section></main>`;
    return;
  }
  app.innerHTML = `<main class="onboarding-page">
    <section class="onboarding-copy"><p class="eyebrow"><b>NEW</b> ことばの冒険へようこそ！</p><h1><span>ことば</span>をためす。<br>「伝わる！」がふえる。</h1><p>ことばをえらんだり、文をつないだり。まちがえても大丈夫！ 少しずつ、伝える力をのばそう。</p><div class="lab-mini-row">${labKeys.map((id) => `<div class="lab-mini ${LABS[id].color}"><b>${LABS[id].icon}</b><span>${LABS[id].short}</span></div>`).join("")}</div></section>
    <section class="setup-card"><p class="step-label">はじめに おしえてね</p><h2>きみにぴったりの問題をえらぶよ</h2><fieldset><legend>いま、何年生？</legend><div class="grade-grid">${[1,2,3,4,5,6].map((grade) => `<button data-grade="${grade}" class="${state.profile.grade === grade ? "selected" : ""}"><strong>${grade}</strong><span>年</span></button>`).join("")}</div></fieldset><fieldset><legend>文字の読みやすさ</legend><div class="choice-row"><button data-furigana="grade" class="${state.profile.furigana === "grade" ? "selected" : ""}">学年に合わせる</button><button data-furigana="more" class="${state.profile.furigana === "more" ? "selected" : ""}">ひらがな多め</button></div></fieldset><button class="primary-button full" data-action="diagnostic">はじめのチャレンジ！ <span>→</span></button><p class="safe-note">ここはテストじゃないよ。今できるところから始めよう！</p></section>
  </main>`;
}

function homeTemplate() {
  const p = progress();
  const reviewCount = p.filter((item) => item.needsReview).length;
  return `<main class="home-page"><section class="research-hero"><div><p class="eyebrow light"><i></i> きょうのきみにぴったり</p><h1>今日のチャレンジ</h1><p>${reviewCount ? "前に迷った問題も、ちがうお話でもう一度チャレンジ！" : "4つのラボをめぐって、ことばパワーをのばそう！"}</p></div><div class="flask-art" aria-hidden="true"><span>あ</span><span>文</span><span>→</span></div></section>
    <section class="session-picker"><div class="section-heading"><div><p>コースをえらぼう</p><h2>どれにチャレンジする？</h2></div><span>途中で休んでもだいじょうぶ</span></div><div class="session-grid">
      <button data-size="3"><span class="session-icon bolt">⚡</span><div><small>サクッと</small><strong>3問</strong><p>まずは気軽にやってみよう</p></div><b>→</b></button>
      <button data-size="5" class="recommended"><em>おすすめ</em><span class="session-icon scope">🔬</span><div><small>いいとこどり</small><strong>5問</strong><p>おさらい＋ちょいむず</p></div><b>→</b></button>
      <button data-size="10"><span class="session-icon flame">🔥</span><div><small>ぐんぐん</small><strong>10問</strong><p>ことばパワーをたっぷりためよう</p></div><b>→</b></button>
    </div></section>
    <section class="quick-actions" aria-label="えらべるチャレンジ"><button class="quick-action-card focus-action" data-action="focus"><span>🎯</span><div><small>ここだけやりたい！</small><strong>特訓する</strong><p>気になる力をえらんで、ぐっとのばそう。</p></div><b>→</b></button><button class="quick-action-card settings-action" data-action="settings"><span>⚙️</span><div><small>むずかしさを変える</small><strong>レベルをえらぶ</strong><p>むずかしい・かんたんに合わせていつでも変更。</p></div><b>→</b></button></section>
    <section class="lab-overview"><div class="section-heading"><div><p>4つのラボをのぞいてみよう</p><h2>できることが、どんどんふえる！</h2></div><button class="text-button" data-action="carte">✨ できたことを見る →</button></div><div class="lab-grid">${labKeys.map((lab) => { const info = labReadiness(p, lab); return `<article class="lab-card ${LABS[lab].color}"><div><span>${LABS[lab].icon}</span><small>${info.label}</small></div><h3>${LABS[lab].label}</h3><p>${LABS[lab].question}</p><i><b style="width:${Math.max(4, info.value)}%"></b></i></article>`; }).join("")}</div><p class="history-note">👏 これまでに ${state.attempts.length}回、ことばをじっくり考えたよ！</p></section></main>`;
}

function settingsTemplate() {
  return `<main class="settings-page"><section class="page-intro"><p class="eyebrow">⚙️ いつでも変えてOK！</p><h1>じぶんに合うレベルにしよう</h1><p>「ちょっとむずかしい」「もっとできそう」と思ったら、ここで変えよう。これまでのできたことは消えないよ。</p></section>
    <section class="settings-card"><div class="settings-heading"><span>🏫</span><div><h2>学校では何年生？</h2><p>学校の学年として記録するよ。問題のむずかしさとは別にしてあるよ。</p></div></div><div class="level-grid school-grade-grid">${[1,2,3,4,5,6].map((grade) => `<button data-school-grade="${grade}" class="${state.profile.grade === grade ? "selected" : ""}"><strong>${grade}</strong><span>年生</span></button>`).join("")}</div></section>
    <section class="settings-card challenge-card"><div class="settings-heading"><span>🚀</span><div><h2>問題のレベル</h2><p>むずかしければ下げて、かんたんなら上げてみよう。何度でも変えられるよ。</p></div></div><div class="level-grid challenge-level-grid">${[1,2,3,4,5,6].map((level) => `<button data-level="${level}" class="${state.profile.challengeLevel === level ? "selected" : ""}"><strong>Lv.${level}</strong><span>${LEVEL_WORLDS[level]}</span></button>`).join("")}</div><div class="level-summary"><span>いまの組み合わせ</span><strong>${state.profile.grade}年生 ／ チャレンジ Lv.${state.profile.challengeLevel}</strong><p>${state.profile.challengeLevel < state.profile.grade ? "少しやさしいところから、じっくり力をためよう！" : state.profile.challengeLevel > state.profile.grade ? "学年をこえて、ひと足先にチャレンジ中！" : "学年に近いレベルでチャレンジ中！"}</p></div></section>
    <section class="settings-card"><div class="settings-heading"><span>🔤</span><div><h2>文字の読みやすさ</h2><p>読みやすいほうをえらんでね。</p></div></div><div class="choice-row wide"><button data-furigana="grade" class="${state.profile.furigana === "grade" ? "selected" : ""}">学年に合わせる</button><button data-furigana="more" class="${state.profile.furigana === "more" ? "selected" : ""}">ひらがな多め</button></div></section>
    <div class="page-actions"><button class="primary-button" data-action="home">この設定ではじめる <span>→</span></button></div></main>`;
}

function focusTemplate() {
  const skillProgress = new Map(progress().map((item) => [item.skill, item]));
  const skills = SKILL_MAP.filter((skill) => skill.lab === state.focusLab);
  const selected = getSkill(state.focusSkill);
  return `<main class="focus-page"><section class="page-intro focus-intro"><p class="eyebrow">🎯 ここだけぐんぐん！</p><h1>特訓する</h1><p>気になる力をひとつえらぼう。今までの答え方を見ながら、やさしい問題も、ちょいむず問題もまぜて出すよ。</p><div class="focus-level-chip">いまの目安：チャレンジ Lv.${state.profile.challengeLevel}</div></section>
    <section class="focus-panel"><div class="focus-step"><span>1</span><div><h2>どのラボにする？</h2><p>まずは4つからえらぼう。</p></div></div><div class="focus-labs">${labKeys.map((lab) => `<button data-focus-lab="${lab}" class="${LABS[lab].color} ${state.focusLab === lab ? "selected" : ""}"><b>${LABS[lab].icon}</b><span>${LABS[lab].short}</span></button>`).join("")}</div></section>
    <section class="focus-panel"><div class="focus-step"><span>2</span><div><h2>何を特訓する？</h2><p>「もう一回」がついている力は、今ちょうど伸びどき！</p></div></div><div class="skill-choice-grid">${skills.map((skill) => { const item = skillProgress.get(skill.id); const status = item?.needsReview ? "もう一回！" : item?.attempts ? `いま ${DEPTH_LABELS[Math.max(1,item.stableDepth)]}` : "はじめて"; return `<button data-focus-skill="${skill.id}" class="skill-choice ${state.focusSkill === skill.id ? "selected" : ""}"><span>${status}</span><strong>${skill.label}</strong><p>${skill.description}</p><b>${state.focusSkill === skill.id ? "✓" : "→"}</b></button>`; }).join("")}</div></section>
    <section class="focus-panel"><div class="focus-step"><span>3</span><div><h2>何問やってみる？</h2><p>その日の気分でえらんでOK！</p></div></div><div class="focus-size-grid">${[3,5].map((size) => `<button data-focus-size="${size}" class="${state.focusSize === size ? "selected" : ""}"><strong>${size}問</strong><span>${size === 3 ? "サクッと" : "おすすめ"}</span></button>`).join("")}</div><div class="focus-start"><div><small>${selected ? `${LABS[selected.lab].short}ラボ` : "力をひとつえらんでね"}</small><strong>${selected?.label || "まだえらんでいません"}</strong></div><button class="primary-button" data-action="start-focus" ${selected ? "" : "disabled"}>特訓スタート！ <span>→</span></button></div><p class="focus-note">選んだ力を中心に、同じラボの近い問題も組み合わせるよ。学年より下や上の問題が入ることもあるよ。</p></section></main>`;
}

function startQueue(items, screen, sessionKind = "adaptive") {
  Object.assign(state, { queue:items, screen, sessionKind, position:0, selectedId:null, quality:null, tryNumber:1, usedHint:false, showHint:false, showWhy:false, sessionAttempts:[], sessionComplete:false });
  render();
}

function startDiagnostic() {
  const items = DIAGNOSTIC_IDS.map(getQuestion).filter((q) => q && q.gradeMin <= state.profile.challengeLevel).map((q) => ({ questionId:q.id, role:"diagnostic" }));
  startQueue(items, "diagnosis", "diagnostic");
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
    <section class="question-card"><div class="question-meta"><span>きょうのポイント</span><b>${q.subskill}</b><small>チャレンジ：${DEPTH_LABELS[q.depth]}</small></div>
    ${(q.audience || q.goal) ? `<div class="situation-strip">${q.audience ? `<span><b>だれに？</b>${q.audience}</span>` : ""}${q.goal ? `<span><b>何のため？</b>${q.goal}</span>` : ""}</div>` : ""}
    ${q.context ? `<p class="question-context">${q.context}</p>` : ""}<h1>${q.prompt}</h1><div class="option-grid">${q.options.map((option, index) => { const chosen = state.selectedId === option.id; return `<button data-option="${option.id}" class="${chosen ? `selected ${state.quality}` : ""}" ${(state.quality === "best" || (state.quality && !canRetry)) ? "disabled" : ""}><span>${String.fromCharCode(65 + index)}</span><strong>${option.text}</strong>${chosen && state.quality ? `<b>${qualityCopy[state.quality].mark}</b>` : ""}</button>`; }).join("")}</div>
    ${!state.quality ? `<button class="hint-button" data-action="hint" ${state.usedHint ? "disabled" : ""}>💡 ${state.usedHint ? "ヒントを表示中" : "ヒントを見る"}</button>` : ""}
    ${state.showHint && !state.quality ? `<div class="hint-box"><b>ちょこっとヒント</b><p>${q.hint}</p></div>` : ""}
    ${feedback ? `<div class="feedback-box ${feedback.className}" role="status"><span>${feedback.mark}</span><div><h2>${feedback.title}</h2>${selected?.feedback ? `<p>${selected.feedback}</p>` : ""}</div></div><div class="answer-actions">${canRetry ? `<button class="secondary-button" data-action="retry">もう一度えらぶ</button>` : ""}${(state.quality === "best" || !canRetry || state.quality === "acceptable") ? `<button class="primary-button" data-action="next">${state.position === state.queue.length - 1 ? (state.screen === "diagnosis" ? "できたことを見る" : "ゴールへ！") : "つぎの問題へ"} <span>→</span></button>` : ""}<button class="why-button" data-action="why">💡 どうして？を見てみる</button></div>` : ""}
    ${state.showWhy && state.quality ? `<div class="why-panel"><h3>なるほど！</h3><p>${q.explanation}</p>${q.visual ? `<div class="relation-visual"><span>${q.visual[0]}</span><b>${q.visual[1]}<i>→</i></b><span>${q.visual[2]}</span></div>` : ""}</div>` : ""}</section></main>`;
}

function recordAnswer(q, quality) {
  const event = { questionId:q.id, questionVersion:q.version, lab:q.lab, skill:q.skill, contentLevel:q.contentLevel, depth:q.depth, quality, tryNumber:state.tryNumber, usedHint:state.usedHint, mode:state.sessionKind, answeredAt:new Date().toISOString() };
  state.attempts.push(event); state.sessionAttempts.push(event); saveAttempts(state.attempts);
}

function chooseOption(id) {
  if (state.quality === "best") return;
  const q = getQuestion(state.queue[state.position]?.questionId);
  const option = q?.options.find((item) => item.id === id);
  if (!q || !option) return;
  state.selectedId = id; state.quality = option.quality; recordAnswer(q, option.quality);
  if (option.quality === "incorrect" && state.tryNumber === 1) {
    const retryLevel = state.sessionKind === "focus" ? 6 : state.profile.challengeLevel;
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
  return `<main class="center-page result-page"><section class="result-card"><div class="discovery-burst">🎉</div><p class="eyebrow">${state.sessionKind === "focus" ? "特訓クリア！" : "チャレンジ クリア！"}</p><h1>ことばパワーがアップ！</h1><div class="result-numbers"><div><strong>${records.length}</strong><span>考えた問題</span></div><div><strong>${best}</strong><span>一番ぴったり</span></div><div><strong>${recovered}</strong><span>考え直してできた</span></div></div>${skills.length ? `<div class="discoveries"><h2>できるようになってきたよ</h2>${skills.slice(0,3).map((skill) => `<span>✦ ${skill}</span>`).join("")}</div>` : ""}${tryPrompt ? `<div class="try-it"><small>やってみよう！</small><p>${tryPrompt}</p><span>正解・不正解はないよ。声に出したり、短く書いたりしてみよう。</span></div>` : ""}<div class="button-row"><button class="secondary-button" data-action="again">もう一回！</button><button class="primary-button" data-action="home">ホームへ <span>→</span></button></div></section></main>`;
}

function carteTemplate() {
  const p = progress().filter((item) => item.attempts > 0);
  const groups = {
    strong: p.filter((item) => item.stableDepth >= 4 && !item.needsReview),
    growing: p.filter((item) => item.stableDepth >= 2 && item.stableDepth < 4),
    next: p.filter((item) => item.needsReview || item.stableDepth < 2),
  };
  const section = (title, icon, items, empty) => `<section class="carte-section"><h2><span>${icon}</span>${title}</h2>${items.length ? `<div class="skill-list">${items.map((item) => { const skill = getSkill(item.skill); return `<article><div><span class="${LABS[item.lab].color}">${LABS[item.lab].icon}</span><div><strong>${skill?.label}</strong><small>${item.stableDepth >= 5 ? "ちがうお話でもできたよ！" : `${DEPTH_LABELS[Math.max(1,item.stableDepth)]}にチャレンジ中`}</small></div></div><b>${item.needsReview ? "もう一回" : "のびてる！"}</b></article>`; }).join("")}</div>` : `<p class="empty-state">${empty}</p>`}</section>`;
  return `<main class="carte-page"><section class="carte-hero"><div><p class="eyebrow">きみのがんばり</p><h1>できたこと</h1><p>ことばを考えた分だけ、できることがふえていくよ。</p></div><div class="carte-stamp"><strong>${state.attempts.length}</strong><span>考えた回数</span><small>小学${state.profile.grade}年</small></div></section><div class="carte-columns">${section("できるようになった！","✦",groups.strong,"チャレンジすると、ここにできたことが集まるよ！")} ${section("ぐんぐん成長中","↗",groups.growing,"これから、できることがふえていくよ。")} ${section("つぎにチャレンジ","◎",groups.next,"迷った問題は、またちがうお話で出てくるよ。")}</div><section class="teacher-note"><div><h2>ちゃんと見ているよ</h2><p>正解だけでなく、ヒントを見たことや、考え直してできたことも大切にしています。</p></div><button data-action="home">今日のチャレンジへ →</button></section><details class="data-settings"><summary>せってい</summary><p>この端末に、これまでのがんばりを保存しています。</p><button data-action="reset">${state.resetConfirm ? "本当に最初からやり直す" : "最初からやり直す"}</button></details></main>`;
}

app.addEventListener("click", (event) => {
  const button = event.target.closest("button"); if (!button) return;
  if (button.dataset.grade) { state.profile.grade = Number(button.dataset.grade); state.profile.challengeLevel = Number(button.dataset.grade); saveProfile(state.profile); return render(); }
  if (button.dataset.schoolGrade) { state.profile.grade = Number(button.dataset.schoolGrade); saveProfile(state.profile); return render(); }
  if (button.dataset.level) { state.profile.challengeLevel = Number(button.dataset.level); saveProfile(state.profile); return render(); }
  if (button.dataset.furigana) { state.profile.furigana = button.dataset.furigana; saveProfile(state.profile); return render(); }
  if (button.dataset.focusLab) { state.focusLab = button.dataset.focusLab; state.focusSkill = null; return render(); }
  if (button.dataset.focusSkill) { state.focusSkill = button.dataset.focusSkill; return render(); }
  if (button.dataset.focusSize) { state.focusSize = Number(button.dataset.focusSize); return render(); }
  if (button.dataset.option) return chooseOption(button.dataset.option);
  if (button.dataset.size) return startQueue(buildSession(QUESTIONS, state.profile, state.attempts, Number(button.dataset.size)), "research", "adaptive");
  const action = button.dataset.action;
  if (action === "diagnostic") return startDiagnostic();
  if (action === "finish-onboarding") { state.onboardingResult = false; state.screen = "home"; return render(); }
  if (action === "home") { state.screen = "home"; state.sessionComplete = false; return render(); }
  if (action === "carte") { state.screen = "carte"; return render(); }
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
    resetLearningData(); Object.assign(state, { profile:{ grade:3, challengeLevel:3, furigana:"grade", onboarded:false, createdAt:new Date().toISOString() }, attempts:[], screen:"onboarding", onboardingResult:false, resetConfirm:false, focusLab:"words", focusSkill:null, focusSize:5 }); return render();
  }
});

render();
