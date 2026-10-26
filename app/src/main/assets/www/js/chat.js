/* ============================================================
   chat.js — la discussion avec l'ami(e), ses prises de parole,
   les parcours (se confier, respirer, parler à quelqu'un) et le mode « soin ».
   ============================================================ */
(function () {
  'use strict';
  const JA = window.JA, A = JA.app;
  const { $, esc, state, V, ui, save } = A;
  const kid = () => state.profile.age === 'kid';
  const chip = (id, label, arg) => ({ id, label: V.fill(label), arg: arg === undefined ? null : arg });
  ui.gen = 0; ui.busy = false; ui.chipList = [];

  // ---------- affichage ----------
  const msgHTML = (m) => m.from === 'buddy'
    ? `<div class="msg buddy">${A.avatar(null, 30)}<div class="bub">${esc(m.text)}</div></div>`
    : `<div class="msg me"><div class="bub">${esc(m.text)}</div></div>`;
  const scrollDown = () => { const b = $('#msgs'); if (b) b.scrollTop = b.scrollHeight; };

  // ---------- jeux de boutons de réponse ----------
  const idleChips = () => [chip('confide', '💭 Je veux me confier'), chip('ideas', '🎈 Change-moi les idées'), chip('breathe', '🌬️ Respirer ensemble'), chip('journal', '✍️ Écrire dans mon journal')];
  const roOpenChips = () => [chip('ro_yes', 'J’ai besoin d’en parler'), chip('ro_hug', 'Un câlin 🤗'), chip('ro_later', 'Pas maintenant')];
  const careChips = () => [chip('care_safe', 'Oui, je suis en sécurité'), chip('care_unsafe', 'Pas vraiment'), chip('care_skip', 'Je préfère ne pas répondre')];
  const helpChips = () => [chip('breathe', '🌬️ Respirer'), chip('journal', '✍️ Écrire ce que je ressens'), chip('trust', '💞 Parler à quelqu’un de confiance'), chip('ideas', '🎈 Me changer les idées'), chip('better', 'Ça va un peu mieux')];
  const afterBreathChips = () => [chip('breath_res', '😢 Pas mieux', 1), chip('breath_res', '😕 Un peu mieux', 2), chip('breath_res', '🙂 Mieux', 3), chip('breath_res', '😄 Beaucoup mieux', 4)];
  const trustChips = () => (kid()
    ? ['Un parent', 'Un(e) ami(e)', 'Un prof ou un adulte de l’école', 'Un membre de la famille']
    : ['Un ami proche', 'Un membre de ma famille', 'Un professionnel (psy, médecin)', 'Je ne sais pas encore']).map((l) => chip('trust_pick', l));
  function topicChips(det) {
    const list = [];
    (det || []).slice(0, 2).forEach((t) => { if (list.indexOf(t) < 0) list.push(t); });
    (kid() ? ['ecole', 'famille', 'amis', 'solitude', 'fatigue'] : ['ecole', 'famille', 'amis', 'amour', 'travail', 'solitude']).forEach((t) => { if (list.length < 5 && list.indexOf(t) < 0) list.push(t); });
    list.push('autre');
    return list.map((t) => chip('topic', V.topicLabel(t), t));
  }

  function currentChips() {
    if (ui.busy) return [];
    if (state.ctx.chips) return state.ctx.chips;
    return !state.ctx.step || state.ctx.step === 'idle' ? idleChips() : [];
  }
  function chipsHTML() {
    ui.chipList = currentChips();
    return ui.chipList.map((c, i) => `<button class="chip" data-act="chip" data-i="${i}">${esc(c.label)}</button>`).join('');
  }
  function renderChips() { const el = $('#chips'); if (el) el.innerHTML = chipsHTML(); }

  A.views.chat = () => {
    const b = state.buddy;
    return `<header class="chat-top">${A.avatar(null, 44)}<div class="grow"><b>${esc(b.name)}</b><small>🟢 sur ton téléphone · rien n’est envoyé</small></div><button class="icon" data-act="breathe" aria-label="Respirer">🌬️</button></header>
      <div id="msgs" class="msgs">${state.chat.map(msgHTML).join('')}<div id="typing"></div></div>
      <div id="chips" class="chips-bar">${chipsHTML()}</div>
      <form id="composer" class="composer" autocomplete="off"><textarea id="cin" rows="1" placeholder="Écris à ${esc(b.name)}…" maxlength="1000"></textarea><button class="send" type="submit" aria-label="Envoyer">➤</button></form>`;
  };
  A.after.chat = () => {
    scrollDown();
    const f = $('#composer'), t = $('#cin');
    if (!f) return;
    f.addEventListener('submit', (e) => { e.preventDefault(); send(); });
    t.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
    t.addEventListener('input', () => { t.style.height = 'auto'; t.style.height = Math.min(120, t.scrollHeight) + 'px'; });
  };

  function showTyping(on) {
    const t = $('#typing');
    if (t) t.innerHTML = on ? `<div class="msg buddy">${A.avatar(null, 30)}<div class="bub typing"><i></i><i></i><i></i></div></div>` : '';
    if (on) scrollDown();
  }

  function pushMsg(from, text) {
    const m = { id: A.uid(), ts: Date.now(), from, text };
    state.chat.push(m);
    if (state.chat.length > 300) state.chat.splice(0, state.chat.length - 300);
    if (from === 'buddy' && ui.tab !== 'chat') state.ctx.unread = 1;
    save();
    if (ui.tab === 'chat') { const t = $('#typing'); if (t) { t.insertAdjacentHTML('beforebegin', msgHTML(m)); scrollDown(); } }
    else if (from === 'buddy') A.renderTabs();
    return m;
  }

  /** L'ami(e) parle : une phrase à la fois, avec les trois petits points. */
  function buddySay(lines, chips, done) {
    if (!Array.isArray(lines)) lines = [lines];
    const g = ++ui.gen;
    ui.busy = true; state.ctx.chips = null; renderChips();
    let i = 0;
    (function next() {
      if (g !== ui.gen) { showTyping(false); return; }
      if (i >= lines.length) { ui.busy = false; state.ctx.chips = chips || null; save(); renderChips(); if (done) done(); return; }
      const text = lines[i++];
      showTyping(true);
      setTimeout(() => {
        showTyping(false);
        if (g !== ui.gen) return;
        pushMsg('buddy', text);
        next();
      }, Math.min(1500, 500 + text.length * 14));
    })();
  }

  function ctxSet(step, extra) { state.ctx.step = step; if (extra) Object.assign(state.ctx, extra); save(); }

  // ---------- parcours ----------
  const FLOW = {
    confide() { ctxSet('free'); buddySay(V.seq('confide'), [chip('stuck', 'Je ne sais pas par où commencer')]); },
    stuck() { ctxSet('ro_topic'); buddySay(['Pas de souci, on y va doucement. Qu’est-ce qui prend le plus de place dans ta tête ?'], topicChips([])); },
    ideas() { ctxSet('idle'); buddySay([V.one('ideas')], [chip('ideas', 'Encore une 😄'), chip('confide', '💭 Je veux me confier'), chip('thanks', 'Merci !')]); },
    thanks() { ctxSet('idle'); buddySay([V.one('thanks')]); },
    journal() { ctxSet('idle'); buddySay(['Je t’attends ici. Prends ton temps 💛'], null, () => A.openEditor()); },
    breathe() {
      ctxSet('breath');
      buddySay(V.seq('breathIntro'), null, () => A.openBreath((finished) => {
        if (finished) { ctxSet('after_breath'); buddySay(V.seq('afterBreath'), afterBreathChips()); }
        else { ctxSet('idle'); buddySay(['Pas de souci, on peut recommencer quand tu veux 🌱']); }
      }));
    },
    breath_res(n) {
      if (n <= 1) { ctxSet('ro_help'); buddySay(V.seq('breathNo'), [chip('trust', '💞 Penser à quelqu’un de confiance'), chip('confide', '💭 En parler'), chip('journal', '✍️ Écrire')]); }
      else if (n === 2) { ctxSet('idle'); buddySay(V.seq('breathLittle'), [chip('breathe', '🌬️ Encore une fois'), chip('confide', '💭 En parler'), chip('thanks', 'Merci !')]); }
      else { ctxSet('idle'); buddySay(V.seq('breathYes'), [chip('journal', '✍️ Écrire'), chip('thanks', 'Merci ' + state.buddy.name)]); }
    },
    ro_yes() { ctxSet('ro_topic'); buddySay(V.seq('roYes'), topicChips(state.ctx.topics || [])); },
    ro_hug() { ctxSet('ro_hug'); buddySay(V.seq('roHug').concat(V.seq('roHug2')), [chip('breathe', '🌬️ Respirer'), chip('ro_yes', 'J’ai besoin d’en parler'), chip('ro_later', 'Ça va aller')]); },
    ro_later() { ctxSet('idle'); buddySay(V.seq('roLater')); },
    topic(t) { ctxSet('ro_story', { topic: t }); buddySay([V.topicQ(t)], [chip('story_skip', 'Je préfère l’écrire dans mon journal'), chip('story_idk', 'Je ne sais pas comment l’expliquer')]); },
    story_skip() { FLOW.journal(); },
    story_idk() { buddySay(['Ce n’est pas grave. Tu peux me dire juste un mot, une couleur ou un emoji : qu’est-ce qui te vient ?']); },
    trust() { ctxSet('trust'); buddySay(V.seq('trustQ'), trustChips()); },
    trust_pick() { ctxSet('trust_draft'); buddySay(V.seq('trustDraft'), [chip('copy', '📋 Copier la phrase'), chip('thanks', 'Merci')]); },
    copy() {
      const phrase = 'J’ai besoin de parler, tu as un moment ?';
      if (A.NA) A.safe(() => A.NA.copyText(phrase)); else A.safe(() => navigator.clipboard.writeText(phrase));
      A.toast('Phrase copiée 📋');
      buddySay(V.seq('trustCopied'), [chip('thanks', 'Merci'), chip('journal', '✍️ Écrire ce que je ressens')]);
    },
    better() { ctxSet('idle'); buddySay(V.seq('better'), [chip('journal', '✍️ L’écrire dans mon journal'), chip('thanks', 'Merci')]); },
    care_safe() { ctxSet('care_done'); buddySay(V.seq('careSafe'), [chip('trust', 'Oui, aidons-moi à choisir'), chip('breathe', '🌬️ Respirer'), chip('help_res', '🆘 Ressources')]); },
    care_unsafe() { ctxSet('care_done'); buddySay(V.seq('careUnsafe'), [chip('help_res', '🆘 Voir les ressources'), chip('trust', '💞 Parler à quelqu’un'), chip('breathe', '🌬️ Respirer')]); },
    care_skip() { ctxSet('care_done'); buddySay(V.seq('careSkip'), [chip('help_res', '🆘 Voir les ressources'), chip('trust', '💞 Parler à quelqu’un')]); },
    help_res() { A.openResources(); }
  };
  A.flow = (id, arg) => { if (FLOW[id]) FLOW[id](arg); };

  function careFlow() {
    const again = ['care_open', 'care_done'].indexOf(state.ctx.step) >= 0;
    if (again) {
      ctxSet('care_done');
      return buddySay(V.seq('careAgain'), [chip('help_res', '🆘 Voir les ressources'), chip('trust', '💞 Parler à quelqu’un'), chip('breathe', '🌬️ Respirer')]);
    }
    ctxSet('care_open');
    buddySay(V.seq('reachCare'), careChips());
  }

  /** Ce que l'utilisateur écrit librement dans la discussion. */
  function onFreeText(text) {
    const a = JA.analyze(text, null), n = JA.norm(text), step = state.ctx.step || 'idle';
    if (a.care) return careFlow();
    const lines = [];
    if (a.safety) lines.push(V.one('safetyNote'));
    const inTalk = ['ro_story', 'free', 'ro_help', 'ro_topic', 'after_breath', 'ro_hug', 'trust', 'trust_draft', 'care_done'].indexOf(step) >= 0;
    if (a.heavy >= 0.4 || (a.dominant && a.heavy >= 0.2) || (inTalk && a.heavy >= 0.1)) {
      state.ctx.turns = (state.ctx.turns || 0) + 1;
      lines.push(V.reflect(a.dominant));
      let chips;
      if (state.ctx.turns >= 3) {
        lines.push('Tu m’en as dit beaucoup, merci. Ce que tu portes mérite aussi d’être entendu par une vraie personne. On réfléchit à qui pourrait t’écouter ?');
        chips = [chip('trust', '💞 Choisir quelqu’un'), chip('breathe', '🌬️ Respirer'), chip('journal', '✍️ Écrire')];
        state.ctx.turns = 0;
      } else {
        lines.push(V.one('afterStory'));
        chips = helpChips();
      }
      ctxSet('ro_help');
      return buddySay(lines, chips);
    }
    if (/^(salut|bonjour|bonsoir|coucou|hello|hey|yo)\b/.test(n)) return buddySay([V.one('greet')]);
    if (/\bmerci\b/.test(n)) return buddySay([V.one('thanks')]);
    if (/comment (tu vas|vas tu|ca va)|^ca va ?\??$/.test(n)) return buddySay([V.one('howAreYou')]);
    if (/(au revoir|\bbye\b|a plus|a demain|bonne nuit)/.test(n)) return buddySay([V.one('bye')]);
    if (a.sent > 0.2) { ctxSet('idle'); return buddySay([V.one('celebrate')], [chip('journal', '✍️ Le garder dans mon journal'), chip('thanks', 'Merci')]); }
    ctxSet(step === 'idle' ? 'free' : step);
    buddySay([V.one('listen')]);
  }

  function send() {
    const t = $('#cin'); if (!t) return;
    const text = t.value.trim(); if (!text) return;
    t.value = ''; t.style.height = 'auto';
    ui.gen++; ui.busy = true;
    pushMsg('me', text);
    state.ctx.chips = null; renderChips();
    setTimeout(() => onFreeText(text), 450);
  }

  // ---------- actions ----------
  A.acts.chip = (el) => {
    const c = ui.chipList[+el.dataset.i]; if (!c) return;
    if (c.id === 'help_res') { FLOW.help_res(); return; }
    if (c.id !== 'copy') pushMsg('me', c.label);
    state.ctx.chips = null; ui.busy = true; renderChips();
    setTimeout(() => FLOW[c.id] && FLOW[c.id](c.arg), 350);
  };
  A.acts.breathe = () => { if (ui.busy) return; FLOW.breathe(); };
  A.acts.breathStop = () => A.closeLayer();

  // ---------- l'ami(e) prend la parole ----------
  A.startReach = (d) => {
    const last = state.entries.slice().sort((a, b) => b.ts - a.ts)[0];
    V.reach(d.level, d.reason).forEach((t) => pushMsg('buddy', t));
    if (d.level === 'care') { ctxSet('care_open', { topics: [] }); state.ctx.chips = careChips(); }
    else { ctxSet('ro_open', { topics: (last && last.a && last.a.topics) || [], turns: 0 }); state.ctx.chips = roOpenChips(); }
    state.ctx.unread = ui.tab === 'chat' ? 0 : 1;
    ui.busy = false; save(); renderChips();
  };
  A.welcome = () => {
    V.seq('intro').forEach((t) => pushMsg('buddy', t));
    state.ctx.step = 'idle'; state.ctx.chips = null; state.ctx.unread = 1; save();
  };

  // ---------- respiration guidée ----------
  A.openBreath = (done) => {
    const pat = kid()
      ? { inn: 3, hold: 0, out: 4, cycles: 4, tip: 'Comme pour souffler une bougie 🕯️' }
      : { inn: 4, hold: 4, out: 6, cycles: 3, tip: 'Par le nez, puis doucement par la bouche' };
    let finished = false, stopped = false, timer = null, cyc = 0;
    A.openLayer(`<div class="breath"><button class="icon close" data-act="breathStop" aria-label="Arrêter">✕</button>
      <div class="b-ring"><div class="b-circle" id="bc"></div><div class="b-text" id="bt">Prêt ?</div></div>
      <div class="b-tip">${esc(pat.tip)}</div><div class="b-count" id="bn"></div></div>`,
    { cls: 'full breath-layer', onClose: () => { stopped = true; clearTimeout(timer); if (!finished) done(false); } });
    const bc = $('#bc'), bt = $('#bt'), bn = $('#bn');
    function phase(secs, scale, label, next) {
      if (stopped) return;
      bt.textContent = label;
      bc.style.transition = 'transform ' + secs + 's ease-in-out';
      bc.style.transform = 'scale(' + scale + ')';
      timer = setTimeout(next, secs * 1000);
    }
    function out() { phase(pat.out, 0.55, 'Expire…', cycle); }
    function cycle() {
      if (stopped) return;
      if (cyc >= pat.cycles) {
        bt.textContent = 'Bravo 🌟'; bc.style.transform = 'scale(.8)';
        timer = setTimeout(() => { finished = true; A.closeLayer(); done(true); }, 1400);
        return;
      }
      cyc++; bn.textContent = cyc + ' / ' + pat.cycles;
      phase(pat.inn, 1, 'Inspire…', () => { if (pat.hold) phase(pat.hold, 1, 'Retiens…', out); else out(); });
    }
    bc.style.transform = 'scale(.55)';
    timer = setTimeout(cycle, 900);
  };
})();
