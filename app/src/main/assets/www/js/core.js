/* ============================================================
   core.js — état, écrans (journal, humeur, réglages), éditeur,
   accueil des nouveaux, code PIN, sauvegarde.
   chat.js ajoute l'écran de discussion ; main.js branche les clics.
   ============================================================ */
(function () {
  'use strict';
  const JA = window.JA;
  const A = (JA.app = { acts: {}, views: {}, after: {} });
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  A.$ = $; A.$$ = $$; A.esc = esc;

  const KEY = 'ja.v1', DRAFT_KEY = 'ja.draft';
  const MOODS = [null,
    { e: '😢', l: 'Très mal', c: '#E0645C' }, { e: '😕', l: 'Pas top', c: '#EE9B5B' },
    { e: '😐', l: 'Bof', c: '#E8C85A' }, { e: '🙂', l: 'Bien', c: '#9CCC65' }, { e: '😄', l: 'Super', c: '#4DBF8B' }];
  const AVATARS = ['🐱', '🐶', '🦊', '🐼', '🐰', '🦉', '🐻', '🐧', '🦄', '🐲', '🤖', '👾', '🌸', '⭐', '🐢', '🦋'];
  const ACCS = [['', 'Aucun'], ['🎀', 'Nœud'], ['👑', 'Couronne'], ['🎩', 'Chapeau'], ['🕶️', 'Lunettes'], ['🎧', 'Casque'], ['🌸', 'Fleur'], ['⭐', 'Étoile']];
  const HUES = [330, 280, 230, 190, 150, 100, 40, 10];
  const PERSONAS = [['douce', '🌷', 'Douce', 'te réconforte'], ['drole', '😄', 'Drôle', 'te fait sourire'], ['calme', '🍃', 'Calme', 't’apaise'], ['motivante', '🔥', 'Motivante', 'te pousse']];
  const EMO = { tristesse: ['😢', 'tristesse'], colere: ['😠', 'colère'], peur: ['😨', 'peur'], stress: ['😰', 'stress'], fatigue: ['😴', 'fatigue'], solitude: ['🌧️', 'solitude'], honte: ['😔', 'doute de soi'] };
  A.MOODS = MOODS;

  // ---------- état ----------
  function defaults() {
    return {
      v: 1, onboarded: false,
      profile: { name: '', nick: '', gender: 'x', age: 'big', theme: 'papier' },
      buddy: { name: '', avatar: '🐱', acc: '', hue: 280, personality: 'douce' },
      entries: [], chat: [],
      ctx: { step: 'idle', topic: null, turns: 0, unread: 0, chips: null },
      settings: { reminder: { on: false, time: '20:30' }, pin: null, secure: false },
      flags: { lastReach: 0 }
    };
  }
  function merge(d, s) {
    Object.keys(s || {}).forEach((k) => {
      if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k]) && d[k] && typeof d[k] === 'object' && !Array.isArray(d[k])) d[k] = Object.assign(d[k], s[k]);
      else d[k] = s[k];
    });
    return d;
  }
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) return merge(defaults(), JSON.parse(raw)); } catch (e) { /* mémoire indisponible */ }
    return defaults();
  }
  const state = (A.state = load());
  const V = (A.V = JA.makeVoice(() => state));
  const ui = (A.ui = { tab: 'home', month: new Date(new Date().getFullYear(), new Date().getMonth(), 1), homeLine: null, layers: [], locked: false, pinFails: 0, pinBlockUntil: 0 });

  A.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { A.toast('Mémoire pleine ou indisponible 😕'); }
  };
  const save = A.save;

  // ---------- pont Android (inexistant dans un navigateur) ----------
  const NA = window.Android || null;
  A.NA = NA;
  function safe(fn) { try { return fn(); } catch (e) { return undefined; } }
  A.safe = safe;

  // ---------- utilitaires ----------
  const uid = (A.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
  const pad = (n) => (n < 10 ? '0' : '') + n;
  const dayKey = (A.dayKey = (ts) => { const d = new Date(ts); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); });
  const today = (A.today = () => dayKey(Date.now()));
  const fmtDay = (A.fmtDay = (key) => { const p = key.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); });
  const fmtTime = (ts) => { const d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const entry = (id) => state.entries.find((e) => e.id === id);
  const hasToday = (A.hasToday = () => state.entries.some((e) => e.day === today()));
  const kid = () => state.profile.age === 'kid';
  A.kid = kid;

  const streak = (A.streak = () => {
    const days = {}; state.entries.forEach((e) => (days[e.day] = 1));
    const d = new Date(); let n = 0;
    if (!days[dayKey(d)]) d.setDate(d.getDate() - 1);
    while (days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  });
  /** Dernière page lourde il y a moins de 3 jours → ami(e) plus douce. */
  const isGentle = (A.isGentle = () => {
    if (!state.entries.length) return false;
    const last = state.entries.slice().sort((a, b) => b.ts - a.ts)[0];
    return !!(last.a && last.a.heavy >= 0.5 && Date.now() - last.ts < 3 * 86400000);
  });
  const dayMoods = () => {
    const acc = {};
    state.entries.forEach((e) => { (acc[e.day] = acc[e.day] || []).push(e.mood); });
    const out = {};
    Object.keys(acc).forEach((k) => { out[k] = Math.round(acc[k].reduce((a, b) => a + b, 0) / acc[k].length); });
    return out;
  };

  let toastTimer;
  const toast = (A.toast = (msg) => {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  });

  // ---------- rappels ----------
  const syncReminder = (A.syncReminder = () => {
    safe(() => {
      if (!NA) return;
      const r = state.settings.reminder;
      if (r.on) {
        const p = r.time.split(':');
        NA.scheduleReminder(+p[0], +p[1], V.reminder.title(), V.reminder.normal().join('\n'), V.reminder.gentle().join('\n'));
        NA.setGentle(isGentle());
        NA.markWritten(hasToday() ? today() : '');
      } else {
        NA.cancelReminder();
      }
    });
  });

  // ---------- couches (fenêtres) ----------
  const openLayer = (A.openLayer = (html, opts) => {
    opts = opts || {};
    const el = document.createElement('div');
    el.className = 'layer ' + (opts.cls || '');
    el.innerHTML = html;
    $('#layer').appendChild(el);
    ui.layers.push({ el, lock: !!opts.lock, onBack: opts.onBack, onClose: opts.onClose });
    return el;
  });
  const closeLayer = (A.closeLayer = () => {
    const l = ui.layers.pop();
    if (l) { l.el.remove(); if (l.onClose) l.onClose(); }
  });
  A.topLayer = () => ui.layers[ui.layers.length - 1];
  const confirmBox = (A.confirmBox = (msg, okLabel, cb, danger) => {
    openLayer(`<div class="dialog card"><p>${esc(msg)}</p><div class="row end"><button class="btn ghost" data-act="closeLayer">Annuler</button><button class="btn ${danger ? 'danger' : ''}" data-act="dlgYes">${esc(okLabel)}</button></div></div>`, { cls: 'center' });
    ui.layers[ui.layers.length - 1].cb = cb;
  });

  // ---------- éléments d'interface ----------
  const avatar = (A.avatar = (b, size) => {
    b = b || state.buddy;
    return `<span class="avatar" style="--s:${size}px;--h:${b.hue}"><span class="av-face">${esc(b.avatar)}</span>${b.acc ? `<span class="av-acc">${esc(b.acc)}</span>` : ''}</span>`;
  });
  const chipBtn = (act, label, sel, data) => `<button class="chip${sel ? ' sel' : ''}" data-act="${act}" ${data || ''}>${label}</button>`;
  const toggle = (act, on) => `<button class="switch${on ? ' on' : ''}" data-act="${act}" role="switch" aria-checked="${on}"><i></i></button>`;

  // ---------- navigation ----------
  function renderTabs() {
    const items = [['home', '📖', 'Journal'], ['chat', esc(state.buddy.avatar), esc(state.buddy.name || 'Ami(e)')], ['write'], ['mood', '📅', 'Humeur'], ['settings', '⚙️', 'Réglages']];
    $('#tabs').innerHTML = items.map((it) => it[0] === 'write'
      ? '<button class="fab" data-act="write" aria-label="Écrire">✍️</button>'
      : `<button class="tab${ui.tab === it[0] ? ' on' : ''}" data-act="tab" data-v="${it[0]}"><span class="ti">${it[1]}${it[0] === 'chat' && state.ctx.unread ? '<b class="dot"></b>' : ''}</span><span class="tl">${it[2]}</span></button>`).join('');
  }
  A.renderTabs = renderTabs;

  const render = (A.render = () => {
    const view = $('#view');
    view.classList.toggle('chatmode', ui.tab === 'chat');
    view.innerHTML = (A.views[ui.tab] || A.views.home)();
    if (A.after[ui.tab]) A.after[ui.tab]();
    renderTabs();
  });
  A.rerender = () => { const v = $('#view'); const st = v.scrollTop; render(); v.scrollTop = st; };
  A.goTab = (tab) => {
    ui.tab = tab;
    if (tab === 'home') ui.homeLine = null;
    if (tab === 'chat') { state.ctx.unread = 0; save(); }
    render();
    $('#view').scrollTop = 0;
  };

  // ---------- écran : journal ----------
  A.entriesHTML = (q) => {
    let list = state.entries.slice().sort((a, b) => b.ts - a.ts);
    if (q) { const nq = JA.norm(q); list = list.filter((e) => JA.norm((e.title || '') + ' ' + e.text).indexOf(nq) >= 0); }
    if (!list.length) return `<div class="empty card">${q ? 'Aucune page trouvée 🔎' : '<div class="big-emoji">📖</div><p>Ton journal est encore vide.<br>Écris ta première page, même courte !</p>'}</div>`;
    let out = '', last = '';
    list.forEach((e) => {
      if (e.day !== last) { last = e.day; out += `<h4 class="dayh">${esc(fmtDay(e.day))}</h4>`; }
      const first = (e.title || e.text.split('\n')[0]).slice(0, 60);
      const snip = e.text.replace(/\s+/g, ' ').slice(0, 110);
      const m = MOODS[e.mood] || MOODS[3];
      out += `<article class="entry" data-act="openEntry" data-v="${e.id}"><span class="em" style="--c:${m.c}">${m.e}</span><div class="eb"><div class="et">${esc(first)}</div><div class="es">${esc(snip)}</div></div><time>${fmtTime(e.ts)}</time></article>`;
    });
    return out;
  };

  A.views.home = () => {
    const n = state.entries.length, st = streak(), h = new Date().getHours();
    if (!ui.homeLine) ui.homeLine = V.home({ hasToday: hasToday(), streak: st, recentHeavy: isGentle(), count: n, hour: h });
    const greet = h < 5 ? 'Coucou' : h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
    const name = state.profile.nick || state.profile.name;
    return `<header class="top"><div class="hello">${greet}${name ? ` <b>${esc(name)}</b>` : ''}</div>${st > 0 ? `<span class="pill">🔥 ${st}</span>` : ''}</header>
      ${state.ctx.unread ? `<button class="reach-banner" data-act="goChat">${avatar(null, 36)}<span><b>${esc(state.buddy.name)}</b> voudrait te parler</span><i>›</i></button>` : ''}
      <section class="card buddy-card" data-act="goChat">${avatar(null, 58)}<div class="bubble">${esc(ui.homeLine)}</div></section>
      <button class="btn big wide" data-act="write">✍️ ${hasToday() ? 'Ajouter une page' : 'Écrire ma page du jour'}</button>
      ${n ? '<div class="search"><input id="q" data-bind="search" type="search" placeholder="🔎 Rechercher dans mon journal…" autocomplete="off"></div>' : ''}
      <div id="entries">${A.entriesHTML('')}</div>`;
  };

  // ---------- écran : humeur ----------
  A.views.mood = () => {
    const m = ui.month, y = m.getFullYear(), mo = m.getMonth();
    const offset = (new Date(y, mo, 1).getDay() + 6) % 7, dim = new Date(y, mo + 1, 0).getDate();
    const byDay = dayMoods(), tk = today();
    let cells = '<span></span>'.repeat(offset);
    for (let d = 1; d <= dim; d++) {
      const key = y + '-' + pad(mo + 1) + '-' + pad(d), mood = byDay[key];
      cells += `<button class="day${mood ? ' has' : ''}${key === tk ? ' today' : ''}" ${mood ? `style="--c:${MOODS[mood].c}" data-act="openDay" data-v="${key}"` : 'disabled'}>${d}</button>`;
    }
    // 30 derniers jours + 14 derniers jours
    const now = new Date(); const last14 = [];
    for (let i = 13; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); last14.push({ d: d.getDate(), mood: byDay[dayKey(d)] || 0 }); }
    const cutoff30 = Date.now() - 30 * 86400000;
    const recent = state.entries.filter((e) => e.ts >= cutoff30);
    const avg = recent.length ? Math.round(recent.reduce((a, e) => a + e.mood, 0) / recent.length) : 0;
    const emoSum = {};
    state.entries.filter((e) => e.ts >= Date.now() - 14 * 86400000).forEach((e) => { Object.keys((e.a && e.a.emo) || {}).forEach((k) => (emoSum[k] = (emoSum[k] || 0) + e.a.emo[k])); });
    const top = Object.keys(emoSum).filter((k) => EMO[k]).sort((a, b) => emoSum[b] - emoSum[a]).slice(0, 3);
    const title = new Date(y, mo, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return `<header class="top"><h2 class="h">Mon humeur</h2></header>
      <section class="stats">
        <div class="stat card"><b>${state.entries.length}</b><span>page${state.entries.length > 1 ? 's' : ''}</span></div>
        <div class="stat card"><b>🔥 ${streak()}</b><span>jour${streak() > 1 ? 's' : ''} d’affilée</span></div>
        <div class="stat card"><b>${avg ? MOODS[avg].e : '–'}</b><span>humeur (30 j)</span></div>
      </section>
      <section class="card">
        <div class="cal-head"><button class="icon" data-act="monthPrev" aria-label="Mois précédent">‹</button><b>${esc(title)}</b><button class="icon" data-act="monthNext" aria-label="Mois suivant">›</button></div>
        <div class="cal-week"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
        <div class="cal">${cells}</div>
        <div class="legend">${MOODS.slice(1).map((x) => `<span><i style="background:${x.c}"></i>${x.l}</span>`).join('')}</div>
      </section>
      <section class="card"><h3>14 derniers jours</h3>
        <div class="bars">${last14.map((b) => `<div class="bar"><i style="height:${b.mood ? b.mood * 20 : 4}%;background:${b.mood ? MOODS[b.mood].c : 'var(--line)'}"></i><span>${b.d}</span></div>`).join('')}</div>
      </section>
      <section class="card"><h3>Ce qui revient en ce moment</h3>
        ${top.length ? `<div class="chips">${top.map((k) => `<span class="chip static">${EMO[k][0]} ${EMO[k][1]}</span>`).join('')}</div><p class="small">Repéré dans tes pages des 14 derniers jours.</p>` : '<p class="small">Rien de particulier pour l’instant. Continue d’écrire pour voir apparaître des tendances 🌱</p>'}
      </section>`;
  };

  // ---------- écran : réglages ----------
  const themeCard = (t, sel) => `<button class="tcard${sel ? ' sel' : ''}" data-act="setTheme" data-v="${t.id}" style="background:linear-gradient(160deg,${t.v.bg},${t.v.bg2});color:${t.v.ink};border-color:${sel ? t.v.accent : t.v.line}"><span class="t-emoji">${t.emoji}</span><b>${esc(t.name)}</b><span class="t-dots"><i style="background:${t.v.accent}"></i><i style="background:${t.v.accent2}"></i><i style="background:${t.v.surface}"></i></span></button>`;
  A.themeCard = themeCard;

  A.views.settings = () => {
    const p = state.profile, b = state.buddy, r = state.settings.reminder;
    const per = PERSONAS.find((x) => x[0] === b.personality) || PERSONAS[0];
    return `<header class="top"><h2 class="h">Réglages</h2></header>
      <section class="card"><h3>🎨 Thème</h3><div class="themes">${JA.THEMES.map((t) => themeCard(t, t.id === p.theme)).join('')}</div></section>
      <section class="card"><h3>🙋 Moi</h3>
        <label class="fld">Mon prénom<input data-bind="name" value="${esc(p.name)}" maxlength="24" autocomplete="off"></label>
        <label class="fld">Comment ${esc(b.name || 'ton ami(e)')} m’appelle<input data-bind="nick" value="${esc(p.nick)}" maxlength="24" placeholder="${esc(p.name || 'un surnom, par exemple')}" autocomplete="off"></label>
        <div class="fld">Je suis…<div class="chips">${chipBtn('setGender', 'Une fille', p.gender === 'f', 'data-v="f"')}${chipBtn('setGender', 'Un garçon', p.gender === 'm', 'data-v="m"')}${chipBtn('setGender', 'Autre', p.gender === 'x', 'data-v="x"')}</div></div>
        <div class="fld">Mon âge<div class="chips">${chipBtn('setAge', '🧒 Petit(e)', p.age === 'kid', 'data-v="kid"')}${chipBtn('setAge', '🧑 Grand(e)', p.age === 'big', 'data-v="big"')}</div></div>
      </section>
      <section class="card"><h3>💬 Mon ami(e)</h3>
        <div class="row">${avatar(null, 64)}<div class="grow"><b>${esc(b.name)}</b><div class="small">${per[1]} ${per[2]} · ${per[3]}</div></div></div>
        <button class="btn ghost wide" data-act="editBuddy">Personnaliser ${esc(b.name)}</button>
      </section>
      <section class="card"><h3>⏰ Rappel quotidien</h3>
        <div class="row"><div class="grow">${esc(b.name)} me rappelle d’écrire</div>${toggle('toggleReminder', r.on)}</div>
        ${r.on ? `<label class="fld">À quelle heure ?<input type="time" data-bind="remtime" value="${esc(r.time)}"></label><p class="small">Pas de rappel si tu as déjà écrit aujourd’hui. Après une page lourde, le rappel devient plus doux 💛</p>` : ''}
        ${NA ? '' : '<p class="small">Les rappels fonctionnent dans l’application Android.</p>'}
      </section>
      <section class="card"><h3>🔒 Sécurité</h3>
        <div class="row"><div class="grow">Code secret à 4 chiffres</div>${toggle('togglePin', !!state.settings.pin)}</div>
        <div class="row"><div class="grow">Bloquer les captures d’écran</div>${toggle('toggleSecure', !!state.settings.secure)}</div>
        <p class="small">Le code garde ton journal à l’abri des regards, mais les pages ne sont pas chiffrées.</p>
      </section>
      <section class="card"><h3>💾 Sauvegarde</h3>
        <p class="small">Ton journal vit uniquement sur ce téléphone. Si tu le désinstalles, il disparaît : pense à sauvegarder.</p>
        <div class="row wrap"><button class="btn ghost" data-act="backupShare">Envoyer / partager</button><button class="btn ghost" data-act="backupCopy">Copier</button><button class="btn ghost" data-act="restoreOpen">Restaurer</button></div>
      </section>
      <section class="card help"><h3>🆘 Besoin d’aide ?</h3>
        <p class="small">Si ça va très mal, tu n’as pas à rester seul(e) avec ça.</p>
        <button class="btn wide" data-act="resources">Voir les ressources</button>
      </section>
      <section class="card"><h3>ℹ️ À propos</h3>
        <p class="small">${esc(b.name)} tourne uniquement sur ton téléphone : rien n’est envoyé sur internet. Ce n’est pas une vraie personne ni un professionnel de santé : il lit tes mots et réagit avec des règles simples, donc il peut se tromper.</p>
      </section>
      <button class="btn danger wide" data-act="wipe">Effacer toutes mes données</button>
      <div class="spacer"></div>`;
  };

  // ---------- ressources d'aide ----------
  A.openResources = () => {
    openLayer(`<div class="sheet card scroll"><button class="icon close" data-act="closeLayer" aria-label="Fermer">✕</button>
      <h2>🆘 Besoin d’aide maintenant ?</h2>
      <p><b>Si tu es en danger immédiat</b> : appelle le numéro d’urgence de ton pays, ou va tout de suite vers une personne près de toi (un adulte, un voisin, un proche).</p>
      <p><b>Parle à quelqu’un de confiance</b> : un parent, un ami, un enseignant, un médecin, un psychologue. Tu peux commencer par : « J’ai besoin de parler, tu as un moment ? »</p>
      <p><b>Trouver une ligne d’écoute dans ton pays</b> : l’annuaire <i>findahelpline.com</i> liste des services gratuits dans le monde entier.</p>
      <button class="btn wide" data-act="helpUrl">Ouvrir findahelpline.com</button>
      <p class="small">${esc(state.buddy.name)} est une application : elle ne peut pas appeler de l’aide à ta place ni remplacer une vraie personne.</p></div>`, { cls: 'center' });
  };

  // ---------- éditeur de page ----------
  const loadDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)); } catch (e) { return null; } };
  const saveDraft = () => {
    const ed = ui.editor; if (!ed || ed.id) return;
    const text = ($('#ed-text') || {}).value || '', title = ($('#ed-title') || {}).value || '';
    try { if (text.trim() || title.trim()) localStorage.setItem(DRAFT_KEY, JSON.stringify({ mood: ed.mood, title, text })); else localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
  };
  const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ } };
  const countWords = (t) => (t.trim() ? t.trim().split(/\s+/).length : 0);
  const moodRowHTML = (cur) => MOODS.slice(1).map((m, i) => `<button class="mood${cur === i + 1 ? ' on' : ''}" data-act="editorMood" data-v="${i + 1}" style="--c:${m.c}"><span class="me">${m.e}</span><span class="ml">${m.l}</span></button>`).join('');

  A.openEditor = (id) => {
    const e = id ? entry(id) : null;
    const d = !e ? loadDraft() : null;
    ui.editor = { id: id || null, mood: e ? e.mood : d ? d.mood || 0 : 0, changed: false };
    const v = e ? { title: e.title || '', text: e.text } : d ? { title: d.title || '', text: d.text || '' } : { title: '', text: '' };
    const prompts = V.prompts(3);
    const el = openLayer(`<div class="editor">
      <header class="ed-top"><button class="icon" data-act="closeEditor" aria-label="Fermer">✕</button><div class="ed-date">${esc(fmtDay(e ? e.day : today()))}</div><button class="btn small" data-act="saveEntry">Enregistrer</button></header>
      <div class="ed-body">
        <div class="q">Comment tu te sens ?</div>
        <div class="moods" id="moods">${moodRowHTML(ui.editor.mood)}</div>
        <input id="ed-title" data-bind="edtitle" class="ed-title" placeholder="Un titre (facultatif)" maxlength="80" value="${esc(v.title)}" autocomplete="off">
        <div class="prompts"><span class="small">💡 Une idée pour commencer :</span>${prompts.map((p) => `<button class="chip small" data-act="editorPrompt" data-t="${esc(p)}">${esc(p)}</button>`).join('')}</div>
        <textarea id="ed-text" data-bind="edtext" placeholder="${esc(V.fill('Écris ici… tout reste entre toi et {b}.'))}">${esc(v.text)}</textarea>
      </div>
      <footer class="ed-foot"><span id="wc">${countWords(v.text)} mot${countWords(v.text) > 1 ? 's' : ''}</span>${e ? '<button class="link danger" data-act="deleteEntry">🗑️ Supprimer</button>' : '<span class="small">Brouillon gardé automatiquement</span>'}</footer>
    </div>`, { cls: 'full', onBack: () => A.acts.closeEditor() });
    setTimeout(() => { const t = $('#ed-text', el); if (t && !e && !v.text) t.focus(); }, 250);
  };

  function showReaction(reaction, d) {
    const name = esc(state.buddy.name);
    const sn = streak();
    openLayer(`<div class="sheet card reaction">
      <div class="rx-av">${avatar(null, 88)}</div>
      <p class="rx-text">${esc(reaction || V.fill('Merci d’avoir écrit ça, {u}. Je suis là.'))}</p>
      ${!d && sn >= 2 ? `<div class="pill">🔥 ${sn} jours d’affilée</div>` : ''}
      ${d ? `<div class="rx-reach"><b>${name}</b> voudrait te parler</div>
        <button class="btn big wide" data-act="sheetChat">💬 Parler avec ${name}</button>
        <button class="btn ghost wide" data-act="closeLayer">Plus tard</button>`
          : `<button class="btn big wide" data-act="closeLayer">Merci ${name} 💛</button>`}
      ${d && d.level === 'care' ? '<button class="link" data-act="resources">🆘 Besoin d’aide maintenant</button>' : ''}
    </div>`, { cls: 'center' });
  }

  function afterSave(e) {
    ui.homeLine = null;
    syncReminder();
    const d = JA.decide(state.entries, state.flags);
    const reaction = e.a.care ? null : V.reaction(e.a, e.mood, state.entries.length);
    if (d) { state.flags.lastReach = Date.now(); A.startReach(d); }
    save();
    A.rerender();
    showReaction(reaction, d);
  }

  // ---------- fiche « mon ami(e) » (réglages + accueil) ----------
  A.buddyFormHTML = (b) => `
    <div class="bf-prev">${avatar(b, 96)}<div class="bf-name" id="bf-name">${esc(b.name || '…')}</div></div>
    <label class="fld">Son prénom
      <div class="row"><input id="bd-name" data-bind="bdname" value="${esc(b.name)}" maxlength="16" placeholder="Donne-lui un nom" autocomplete="off"><button class="btn ghost small" data-act="bdDice" aria-label="Idée de nom">🎲</button></div></label>
    <div class="fld">Son visage<div class="avgrid">${AVATARS.map((a) => `<button class="avopt${b.avatar === a ? ' sel' : ''}" data-act="bdAvatar" data-v="${a}">${a}</button>`).join('')}</div></div>
    <div class="fld">Son accessoire<div class="chips">${ACCS.map((a) => chipBtn('bdAcc', (a[0] || '∅') + ' ' + a[1], b.acc === a[0], `data-v="${a[0]}"`)).join('')}</div></div>
    <div class="fld">Sa couleur<div class="hues">${HUES.map((h) => `<button class="hue${b.hue === h ? ' sel' : ''}" data-act="bdHue" data-v="${h}" style="background:hsl(${h} 70% 60%)" aria-label="couleur"></button>`).join('')}</div></div>
    <div class="fld">Sa personnalité<div class="persos">${PERSONAS.map((p) => `<button class="perso${b.personality === p[0] ? ' sel' : ''}" data-act="bdPersona" data-v="${p[0]}"><span>${p[1]}</span><b>${p[2]}</b><small>${p[3]}</small></button>`).join('')}</div></div>`;

  function refreshBuddyForm() { const f = $('#bf'); if (f) f.innerHTML = A.buddyFormHTML(ui.bd); }
  A.refreshBuddyForm = refreshBuddyForm;

  // ---------- accueil des nouveaux ----------
  const ONB_LAST = 4;
  function onbHTML() {
    const s = ui.onb, p = state.profile, name = esc(ui.bd ? ui.bd.name || 'ton ami(e)' : state.buddy.name || 'ton ami(e)');
    if (s === 0) return `<div class="onb-hero">📖💬</div><h1>Mon Journal Ami</h1>
      <p class="lead">Un journal intime avec un(e) ami(e) qui t’écoute, te rappelle d’écrire et vient te parler quand ça devient lourd.</p>
      <p class="small">🔒 Tout reste sur ton téléphone. Rien n’est envoyé sur internet.</p>
      <button class="btn big wide" data-act="onbNext">Commencer</button>`;
    if (s === 1) return `<h2>Faisons connaissance</h2>
      <label class="fld">Ton prénom (ou un surnom)<input id="onb-name" data-bind="name" value="${esc(p.name)}" maxlength="24" autocomplete="off"></label>
      <div class="fld">Je suis…<div class="chips">${chipBtn('setGender', 'Une fille', p.gender === 'f', 'data-v="f"')}${chipBtn('setGender', 'Un garçon', p.gender === 'm', 'data-v="m"')}${chipBtn('setGender', 'Autre / je préfère ne pas dire', p.gender === 'x', 'data-v="x"')}</div></div>
      <div class="fld">Mon âge<div class="chips">${chipBtn('setAge', '🧒 Petit(e) · jusqu’à 12 ans', p.age === 'kid', 'data-v="kid"')}${chipBtn('setAge', '🧑 Grand(e) · 13 ans et plus', p.age === 'big', 'data-v="big"')}</div></div>
      <p class="small">Ça sert à choisir les thèmes et la façon de te parler. Tu pourras tout changer plus tard.</p>
      <button class="btn big wide" data-act="onbNext">Suivant</button>`;
    if (s === 2) {
      const rec = JA.themesFor(p.gender, p.age), list = ui.onbAll ? JA.THEMES : rec;
      return `<h2>Choisis ton thème 🎨</h2><p class="small">Touche un thème pour l’essayer tout de suite.</p>
        <div class="themes">${list.map((t) => themeCard(t, t.id === p.theme)).join('')}</div>
        ${ui.onbAll ? '' : '<button class="link" data-act="onbAll">Voir tous les thèmes</button>'}
        <button class="btn big wide" data-act="onbNext">Suivant</button>`;
    }
    if (s === 3) return `<h2>Crée ton ami(e) 💬</h2><p class="small">Il/elle te rappellera d’écrire et viendra te parler quand tu en auras besoin.</p>
      <div id="bf">${A.buddyFormHTML(ui.bd)}</div>
      <button class="btn big wide" data-act="onbNext">C’est parti !</button>`;
    return `<div class="onb-hero">⏰</div><h2>Un petit rappel ?</h2>
      <p class="lead">${name} peut te rappeler d’écrire chaque jour, avec un petit mot à son image.</p>
      <label class="fld">À quelle heure ?<input type="time" data-bind="remtime" value="${esc(state.settings.reminder.time)}"></label>
      <button class="btn big wide" data-act="onbRemind" data-v="1">Oui, rappelle-moi</button>
      <button class="btn ghost wide" data-act="onbRemind" data-v="0">Plus tard</button>`;
  }
  A.onbRender = () => {
    const box = $('#onb-box'); if (!box) return;
    box.innerHTML = (ui.onb > 0 ? '<button class="icon back" data-act="onbBack" aria-label="Retour">‹</button>' : '') +
      `<div class="onb-dots">${[0, 1, 2, 3, 4].map((i) => `<i class="${i === ui.onb ? 'on' : ''}"></i>`).join('')}</div>` + onbHTML();
  };
  A.openOnboarding = () => {
    ui.onb = 0; ui.onbAll = false;
    ui.bd = Object.assign({}, state.buddy);
    if (!state.profile.theme) state.profile.theme = 'papier';
    openLayer('<div class="onb"><div id="onb-box" class="onb-box"></div></div>', { cls: 'full', lock: true, onBack: () => { if (ui.onb > 0) { ui.onb--; A.onbRender(); } return true; } });
    A.onbRender();
  };
  A.finishOnboarding = (remind) => {
    state.buddy = Object.assign({}, ui.bd);
    state.onboarded = true;
    state.settings.reminder.on = !!remind;
    if (remind) safe(() => NA && NA.requestNotificationPermission());
    ui.layers.splice(0).forEach((l) => l.el.remove());
    save(); syncReminder();
    A.welcome();
    ui.tab = 'home';
    render();
  };

  // ---------- code PIN ----------
  const pinCheck = (p) => state.settings.pin && JA.sha256(state.settings.pin.salt + p) === state.settings.pin.hash;
  function pinDots() { const d = $('#pin-dots'); if (d) d.innerHTML = [0, 1, 2, 3].map((i) => `<i class="${i < ui.pin.buf.length ? 'on' : ''}"></i>`).join(''); }
  A.openPin = (opts) => {
    ui.pin = { buf: '', opts };
    openLayer(`<div class="pin"><h2>${esc(opts.title)}</h2><p class="small" id="pin-sub">${esc(opts.sub || '')}</p><div class="dots" id="pin-dots"></div>
      <div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-act="pinKey" data-v="${n}">${n}</button>`).join('')}<span></span><button data-act="pinKey" data-v="0">0</button><button data-act="pinDel" aria-label="Effacer">⌫</button></div>
      ${opts.forgot ? '<button class="link" data-act="pinForgot">Code oublié ?</button>' : ''}</div>`, { cls: 'full pin-layer', lock: !!opts.lock, onBack: opts.onBack });
    pinDots();
  };
  A.pinKey = (v) => {
    const p = ui.pin; if (!p || p.buf.length >= 4) return;
    p.buf += v; pinDots();
    if (p.buf.length === 4) {
      setTimeout(() => {
        const pin = p.buf; p.buf = ''; pinDots();
        p.opts.onDone(pin, {
          close: () => closeLayer(),
          shake: (msg) => { const el = $('.pin'); if (el) { el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 500); } const s = $('#pin-sub'); if (s) s.textContent = msg || ''; }
        });
      }, 140);
    }
  };
  A.pinDel = () => { const p = ui.pin; if (p) { p.buf = p.buf.slice(0, -1); pinDots(); } };
  A.pinSetup = () => {
    A.openPin({ title: 'Choisis ton code', sub: '4 chiffres, juste pour toi', onDone: (p1, c1) => {
      c1.close();
      setTimeout(() => A.openPin({ title: 'Répète ton code', sub: 'Pour être sûr(e) de ne pas te tromper', onDone: (p2, c2) => {
        if (p1 !== p2) { c2.shake('Les deux codes sont différents, réessaie'); return; }
        const salt = uid(); state.settings.pin = { salt, hash: JA.sha256(salt + p2) };
        save(); c2.close(); toast('Code activé 🔒'); A.rerender();
      } }), 160);
    } });
  };
  A.pinDisable = () => {
    A.openPin({ title: 'Ton code actuel', sub: 'Pour désactiver le verrou', onDone: (p, c) => {
      if (!pinCheck(p)) { c.shake('Code incorrect'); return; }
      state.settings.pin = null; save(); c.close(); toast('Code désactivé'); A.rerender();
    } });
  };
  A.lockApp = () => {
    if (ui.locked || !state.settings.pin) return;
    ui.locked = true;
    A.openPin({ title: 'Journal verrouillé 🔒', sub: 'Entre ton code secret', lock: true, forgot: true, onDone: (p, c) => {
      const wait = Math.ceil((ui.pinBlockUntil - Date.now()) / 1000);
      if (wait > 0) { c.shake('Trop d’essais. Réessaie dans ' + wait + ' s'); return; }
      if (pinCheck(p)) { ui.locked = false; ui.pinFails = 0; c.close(); return; }
      ui.pinFails++;
      if (ui.pinFails >= 5) { ui.pinFails = 0; ui.pinBlockUntil = Date.now() + 30000; c.shake('Trop d’essais. Réessaie dans 30 s'); } else c.shake('Code incorrect');
    } });
  };

  // ---------- sauvegarde / effacement ----------
  A.exportJSON = () => {
    const copy = JSON.parse(JSON.stringify(state));
    delete copy.settings.pin; copy.exportedAt = new Date().toISOString();
    return JSON.stringify(copy);
  };
  A.restore = (text) => {
    let obj;
    try { obj = JSON.parse(text); } catch (e) { toast('Ce texte n’est pas une sauvegarde valide'); return; }
    if (!obj || !Array.isArray(obj.entries)) { toast('Ce texte n’est pas une sauvegarde valide'); return; }
    confirmBox('Remplacer ton journal actuel par cette sauvegarde ?', 'Restaurer', () => {
      const pin = state.settings.pin;
      Object.keys(state).forEach((k) => delete state[k]);
      Object.assign(state, merge(defaults(), obj));
      state.settings.pin = pin; state.onboarded = true;
      save(); location.reload();
    }, true);
  };
  A.wipe = () => {
    confirmBox('Effacer tout ton journal, ton ami(e) et tes réglages ? Cette action est définitive.', 'Tout effacer', () => {
      safe(() => { localStorage.removeItem(KEY); localStorage.removeItem(DRAFT_KEY); });
      safe(() => { if (NA) { NA.cancelReminder(); NA.markWritten(''); NA.setSecure(false); } });
      location.reload();
    }, true);
  };

  // ---------- actions (clics) ----------
  const acts = A.acts;
  acts.tab = (el) => A.goTab(el.dataset.v);
  acts.write = () => { if (!ui.layers.length) A.openEditor(); };
  acts.goChat = () => A.goTab('chat');
  acts.openEntry = (el) => A.openEditor(el.dataset.v);
  acts.openDay = (el) => {
    const list = state.entries.filter((e) => e.day === el.dataset.v).sort((a, b) => b.ts - a.ts);
    if (list.length) A.openEditor(list[0].id);
  };
  acts.monthPrev = () => { ui.month = new Date(ui.month.getFullYear(), ui.month.getMonth() - 1, 1); A.rerender(); };
  acts.monthNext = () => { ui.month = new Date(ui.month.getFullYear(), ui.month.getMonth() + 1, 1); A.rerender(); };
  acts.closeLayer = () => closeLayer();
  acts.dlgYes = () => { const l = A.topLayer(); const cb = l && l.cb; closeLayer(); if (cb) cb(); };
  acts.sheetChat = () => { closeLayer(); A.goTab('chat'); };
  acts.resources = () => A.openResources();
  acts.helpUrl = () => { if (NA) safe(() => NA.openUrl('https://findahelpline.com')); else window.open('https://findahelpline.com', '_blank'); };

  acts.editorMood = (el) => {
    ui.editor.mood = +el.dataset.v; ui.editor.changed = true;
    $('#moods').innerHTML = moodRowHTML(ui.editor.mood); saveDraft();
  };
  acts.editorPrompt = (el) => {
    const t = $('#ed-text'), p = el.dataset.t;
    t.value = t.value.trim() ? t.value.replace(/\s+$/, '') + '\n\n' + p + ' ' : p + ' ';
    ui.editor.changed = true; t.focus(); t.setSelectionRange(t.value.length, t.value.length);
    A.onInput(t); el.remove();
  };
  acts.closeEditor = () => {
    const ed = ui.editor;
    const hasText = (($('#ed-text') || {}).value || '').trim().length > 0;
    if (ed && ed.changed && hasText) {
      if (ed.id) { confirmBox('Quitter sans enregistrer tes changements ?', 'Quitter', () => { closeLayer(); }, true); return true; }
      saveDraft(); toast('Brouillon gardé 📝');
    }
    closeLayer(); return true;
  };
  acts.saveEntry = () => {
    const ed = ui.editor, text = $('#ed-text').value.trim(), title = $('#ed-title').value.trim();
    if (!ed.mood) { const m = $('#moods'); m.classList.add('shake'); setTimeout(() => m.classList.remove('shake'), 500); toast('Choisis comment tu te sens 🙂'); return; }
    if (!text) { toast('Écris au moins quelques mots ✍️'); return; }
    const a = JA.analyze(title + ' ' + text, ed.mood);
    let e = ed.id ? entry(ed.id) : null;
    if (e) { Object.assign(e, { mood: ed.mood, title, text, a, edited: Date.now() }); }
    else { e = { id: uid(), ts: Date.now(), day: today(), mood: ed.mood, title, text, a }; state.entries.push(e); }
    clearDraft(); save(); closeLayer();
    afterSave(e);
  };
  acts.deleteEntry = () => {
    const id = ui.editor.id;
    confirmBox('Supprimer cette page définitivement ?', 'Supprimer', () => {
      state.entries = state.entries.filter((e) => e.id !== id);
      save(); syncReminder(); closeLayer(); ui.homeLine = null; A.rerender(); toast('Page supprimée');
    }, true);
  };

  acts.setTheme = (el) => {
    state.profile.theme = el.dataset.v; JA.applyTheme(el.dataset.v, state.profile.age); save();
    if ($('#onb-box')) A.onbRender(); else A.rerender();
  };
  acts.setGender = (el) => { state.profile.gender = el.dataset.v; save(); if ($('#onb-box')) A.onbRender(); else A.rerender(); };
  acts.setAge = (el) => { state.profile.age = el.dataset.v; JA.applyTheme(state.profile.theme, state.profile.age); save(); if ($('#onb-box')) A.onbRender(); else A.rerender(); };

  acts.editBuddy = () => {
    ui.bd = Object.assign({}, state.buddy);
    openLayer(`<div class="sheet card scroll"><button class="icon close" data-act="closeLayer" aria-label="Fermer">✕</button><h2>Mon ami(e)</h2><div id="bf">${A.buddyFormHTML(ui.bd)}</div><button class="btn big wide" data-act="bdDone">Enregistrer</button></div>`, { cls: 'center tall' });
  };
  acts.bdAvatar = (el) => { ui.bd.avatar = el.dataset.v; refreshBuddyForm(); };
  acts.bdAcc = (el) => { ui.bd.acc = el.dataset.v; refreshBuddyForm(); };
  acts.bdHue = (el) => { ui.bd.hue = +el.dataset.v; refreshBuddyForm(); };
  acts.bdPersona = (el) => { ui.bd.personality = el.dataset.v; refreshBuddyForm(); };
  acts.bdDice = () => { ui.bd.name = JA.NAME_IDEAS[Math.floor(Math.random() * JA.NAME_IDEAS.length)]; refreshBuddyForm(); };
  acts.bdDone = () => {
    if (!ui.bd.name.trim()) { toast('Donne un prénom à ton ami(e) 💬'); return; }
    state.buddy = Object.assign({}, ui.bd, { name: ui.bd.name.trim() });
    save(); closeLayer(); syncReminder(); A.rerender(); toast(state.buddy.name + ' est prêt(e) 💛');
  };

  acts.onbNext = () => {
    if (ui.onb === 2) { ui.bd.hue = ui.bd.hue; }
    if (ui.onb === 3) {
      if (!ui.bd.name.trim()) ui.bd.name = JA.NAME_IDEAS[Math.floor(Math.random() * JA.NAME_IDEAS.length)];
      ui.bd.name = ui.bd.name.trim();
      state.settings.reminder.time = kid() ? '19:00' : state.settings.reminder.time;
    }
    if (ui.onb === 1) state.profile.nick = '';
    save(); ui.onb++; A.onbRender();
    const box = $('#onb-box'); if (box) box.scrollTop = 0;
  };
  acts.onbBack = () => { if (ui.onb > 0) { ui.onb--; A.onbRender(); } };
  acts.onbAll = () => { ui.onbAll = true; A.onbRender(); };
  acts.onbRemind = (el) => A.finishOnboarding(el.dataset.v === '1');

  acts.toggleReminder = () => {
    const r = state.settings.reminder; r.on = !r.on;
    if (r.on) safe(() => NA && NA.requestNotificationPermission());
    save(); syncReminder(); A.rerender();
  };
  acts.toggleSecure = () => {
    state.settings.secure = !state.settings.secure; save();
    safe(() => NA && NA.setSecure(state.settings.secure));
    if (!NA && state.settings.secure) toast('Le blocage des captures marche dans l’application Android');
    A.rerender();
  };
  acts.togglePin = () => { if (state.settings.pin) A.pinDisable(); else A.pinSetup(); };

  acts.backupShare = () => { const j = A.exportJSON(); if (NA) safe(() => NA.shareText(j)); else { acts.backupCopy(); } };
  acts.backupCopy = () => {
    const j = A.exportJSON();
    if (NA) safe(() => NA.copyText(j)); else safe(() => navigator.clipboard.writeText(j));
    toast('Sauvegarde copiée 📋 Colle-la dans une note ou un message à toi-même');
  };
  acts.restoreOpen = () => {
    openLayer(`<div class="sheet card scroll"><button class="icon close" data-act="closeLayer" aria-label="Fermer">✕</button><h2>Restaurer</h2><p class="small">Colle ici le texte de ta sauvegarde.</p><textarea id="restore-text" class="restore" placeholder="{ … }"></textarea><button class="btn wide" data-act="restoreDo">Restaurer</button></div>`, { cls: 'center' });
  };
  acts.restoreDo = () => A.restore($('#restore-text').value.trim());
  acts.wipe = () => A.wipe();
  acts.pinKey = (el) => A.pinKey(el.dataset.v);
  acts.pinDel = () => A.pinDel();
  // Le code ne peut pas être récupéré : la seule issue est de tout effacer (A.wipe demande confirmation).
  acts.pinForgot = () => A.wipe();

  // ---------- saisie (champs) ----------
  A.onInput = (t) => {
    const b = t.dataset.bind;
    if (b === 'name') { state.profile.name = t.value; save(); }
    else if (b === 'nick') { state.profile.nick = t.value; save(); }
    else if (b === 'remtime') { state.settings.reminder.time = t.value || '20:30'; save(); syncReminder(); }
    else if (b === 'bdname') { ui.bd.name = t.value; const n = $('#bf-name'); if (n) n.textContent = t.value || '…'; }
    else if (b === 'search') { $('#entries').innerHTML = A.entriesHTML(t.value.trim()); }
    else if (b === 'edtext' || b === 'edtitle') {
      ui.editor.changed = true; saveDraft();
      const tx = $('#ed-text'); const n = countWords(tx.value);
      $('#wc').textContent = n + ' mot' + (n > 1 ? 's' : '');
    }
  };

  // retour arrière Android + retour de l'arrière-plan
  window.__onBack = () => {
    const top = A.topLayer();
    if (top) { if (top.lock && !top.onBack) return true; if (top.onBack) { top.onBack(); return true; } closeLayer(); return true; }
    if (ui.tab !== 'home') { A.goTab('home'); return true; }
    return false;
  };
  window.__fg = (awayMs) => { if (state.settings.pin && awayMs > 15000) A.lockApp(); };

  A.syncAll = () => { syncReminder(); };
  A.afterSave = afterSave;
})();
