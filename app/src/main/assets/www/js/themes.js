/* ============================================================
   themes.js — 12 thèmes
   group : f = filles, m = garçons, x = tout le monde
   age   : kid = petits (décor riche, gros textes, formes rondes)
           big = grands (plus sobre)  /  all = les deux
   ============================================================ */
(function () {
  var JA = (window.JA = window.JA || {});

  var T = [
    // ---------- Petites filles ----------
    {
      id: 'licorne', name: 'Licorne magique', emoji: '🦄', group: 'f', age: 'kid', dark: false,
      v: { bg: '#FFF1F8', bg2: '#EFE6FF', surface: '#FFFFFF', ink: '#4B2A5E', muted: '#9A7BB0', accent: '#FF5FB0', accent2: '#9B7BFF', onAccent: '#FFFFFF', bubbleMe: '#FFD6EC', bubbleBuddy: '#FFFFFF', line: '#F3D9EE' },
      pattern: ['🦄', '⭐', '🌈', '💖'], font: 'casual, "Comic Sans MS", sans-serif', head: 'casual, "Comic Sans MS", sans-serif'
    },
    {
      id: 'papillons', name: 'Jardin de papillons', emoji: '🦋', group: 'f', age: 'kid', dark: false,
      v: { bg: '#EAFBF6', bg2: '#E6F0FF', surface: '#FFFFFF', ink: '#1F4D4A', muted: '#6FA39C', accent: '#17B5A6', accent2: '#FF8FB8', onAccent: '#FFFFFF', bubbleMe: '#C9F2EA', bubbleBuddy: '#FFFFFF', line: '#CBEDE6' },
      pattern: ['🦋', '🌸', '🌼', '🍃'], font: 'casual, "Comic Sans MS", sans-serif', head: 'casual, "Comic Sans MS", sans-serif'
    },
    // ---------- Petits garçons ----------
    {
      id: 'dino', name: 'Dino jungle', emoji: '🦖', group: 'm', age: 'kid', dark: false,
      v: { bg: '#F1FAE8', bg2: '#FFF3D6', surface: '#FFFFFF', ink: '#2F4A1F', muted: '#7E9C63', accent: '#4CAF2E', accent2: '#FF9A1F', onAccent: '#FFFFFF', bubbleMe: '#D8F2BF', bubbleBuddy: '#FFFFFF', line: '#DCEBC8' },
      pattern: ['🦖', '🦕', '🌴', '🥚'], font: 'casual, "Comic Sans MS", sans-serif', head: 'casual, "Comic Sans MS", sans-serif'
    },
    {
      id: 'fusee', name: 'Fusée spatiale', emoji: '🚀', group: 'm', age: 'kid', dark: true,
      v: { bg: '#10173A', bg2: '#1C2559', surface: '#1E2859', ink: '#F3F5FF', muted: '#9BA7E0', accent: '#FFC933', accent2: '#35D0FF', onAccent: '#241A00', bubbleMe: '#34428F', bubbleBuddy: '#252F6B', line: '#2E3A7A' },
      pattern: ['🚀', '⭐', '🌍', '👽'], font: 'casual, "Comic Sans MS", sans-serif', head: 'casual, "Comic Sans MS", sans-serif'
    },
    // ---------- Grandes filles ----------
    {
      id: 'lavande', name: 'Lavande rêveuse', emoji: '💜', group: 'f', age: 'big', dark: false,
      v: { bg: '#F6F2FC', bg2: '#FBF3F8', surface: '#FFFFFF', ink: '#352A4A', muted: '#8C7FA6', accent: '#8E6BD8', accent2: '#E58FB8', onAccent: '#FFFFFF', bubbleMe: '#E6DBFA', bubbleBuddy: '#FFFFFF', line: '#E6DEF3' },
      pattern: ['✦', '·', '✧'], font: 'sans-serif', head: 'serif'
    },
    {
      id: 'rose-or', name: 'Rose & Or', emoji: '✨', group: 'f', age: 'big', dark: false,
      v: { bg: '#FFF5F2', bg2: '#FFF9EE', surface: '#FFFFFF', ink: '#4A2F2F', muted: '#A88983', accent: '#D4757F', accent2: '#C79A3B', onAccent: '#FFFFFF', bubbleMe: '#FBDDDC', bubbleBuddy: '#FFFFFF', line: '#F2DEDA' },
      pattern: ['✦', '❀', '·'], font: 'sans-serif', head: 'serif'
    },
    // ---------- Grands garçons ----------
    {
      id: 'ocean', name: 'Nuit océan', emoji: '🌊', group: 'm', age: 'big', dark: true,
      v: { bg: '#0B1F2E', bg2: '#0E2C3F', surface: '#12303F', ink: '#E6F3FA', muted: '#7FA6BA', accent: '#2FB8D6', accent2: '#5B8DEF', onAccent: '#04222D', bubbleMe: '#1D5A73', bubbleBuddy: '#173B4D', line: '#1D4659' },
      pattern: ['≈', '·', '○'], font: 'sans-serif', head: 'sans-serif-medium, sans-serif'
    },
    {
      id: 'carbone', name: 'Carbone', emoji: '⚡', group: 'm', age: 'big', dark: true,
      v: { bg: '#121212', bg2: '#1A1A1A', surface: '#1F1F1F', ink: '#F2F2F2', muted: '#8F8F8F', accent: '#FF7A1A', accent2: '#B6FF3B', onAccent: '#1A0D00', bubbleMe: '#4A2A10', bubbleBuddy: '#272727', line: '#2D2D2D' },
      pattern: ['·', '+', '·'], font: 'sans-serif', head: 'sans-serif-condensed, sans-serif'
    },
    // ---------- Pour tout le monde ----------
    {
      id: 'papier', name: 'Papier crème', emoji: '📜', group: 'x', age: 'big', dark: false,
      v: { bg: '#FAF3E3', bg2: '#F6EBD2', surface: '#FFFCF4', ink: '#3E3224', muted: '#948469', accent: '#A8642A', accent2: '#5E7F5A', onAccent: '#FFFFFF', bubbleMe: '#F0E0BC', bubbleBuddy: '#FFFCF4', line: '#E8DABB' },
      pattern: ['·', '·', '·'], font: 'serif', head: 'serif'
    },
    {
      id: 'nuit', name: 'Nuit étoilée', emoji: '🌙', group: 'x', age: 'all', dark: true,
      v: { bg: '#15122E', bg2: '#221A4A', surface: '#221D4A', ink: '#F1EEFF', muted: '#A59FD6', accent: '#B79BFF', accent2: '#FFD27A', onAccent: '#1A1040', bubbleMe: '#40358A', bubbleBuddy: '#2B2459', line: '#342C6C' },
      pattern: ['✦', '·', '☾', '✧'], font: 'sans-serif', head: 'sans-serif-medium, sans-serif'
    },
    {
      id: 'soleil', name: 'Soleil', emoji: '☀️', group: 'x', age: 'kid', dark: false,
      v: { bg: '#FFF8DC', bg2: '#FFE9C2', surface: '#FFFFFF', ink: '#5A3B00', muted: '#B08A3C', accent: '#FF9500', accent2: '#2FA4FF', onAccent: '#FFFFFF', bubbleMe: '#FFE3A3', bubbleBuddy: '#FFFFFF', line: '#F6E2A6' },
      pattern: ['☀️', '🌻', '🐝', '🍋'], font: 'casual, "Comic Sans MS", sans-serif', head: 'casual, "Comic Sans MS", sans-serif'
    },
    {
      id: 'arcenciel', name: 'Arc-en-ciel', emoji: '🌈', group: 'x', age: 'kid', dark: false,
      v: { bg: '#F4F9FF', bg2: '#FFF6F9', surface: '#FFFFFF', ink: '#2B3A55', muted: '#7F90AE', accent: '#FF5C7A', accent2: '#3E9BFF', onAccent: '#FFFFFF', bubbleMe: '#DCEBFF', bubbleBuddy: '#FFFFFF', line: '#E2EAF6' },
      pattern: ['🌈', '☁️', '⭐', '🎈'], font: 'casual, "Comic Sans MS", sans-serif', head: 'casual, "Comic Sans MS", sans-serif'
    }
  ];

  function byId(id) {
    for (var i = 0; i < T.length; i++) if (T[i].id === id) return T[i];
    return T[0];
  }

  /** Thèmes conseillés pour un profil : même groupe + même âge d'abord, puis neutres. */
  function recommended(gender, age) {
    var g = gender === 'f' || gender === 'm' ? gender : null;
    var list = T.filter(function (t) {
      var okAge = t.age === 'all' || t.age === age;
      var okGroup = t.group === 'x' || (g ? t.group === g : true);
      return okAge && okGroup;
    });
    return list.length ? list : T.slice();
  }

  function patternUrl(t) {
    var cells = t.pattern.slice(0, 4);
    var pos = [[14, 38], [76, 30], [40, 92], [100, 100]];
    var size = t.age === 'kid' ? 26 : 18;
    var op = t.age === 'kid' ? 0.2 : 0.16;
    var txt = cells.map(function (c, i) {
      return '<text x="' + pos[i][0] + '" y="' + pos[i][1] + '" font-size="' + (size - i * 2) + '" opacity="' + op + '" fill="' + t.v.muted + '">' + c + '</text>';
    }).join('');
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="130" height="130">' + txt + '</svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }

  /** Applique un thème à toute l'interface (variables CSS) et colore la barre système. */
  function apply(id, ageOverride) {
    var t = byId(id);
    var root = document.documentElement;
    var map = { bg: '--bg', bg2: '--bg2', surface: '--surface', ink: '--ink', muted: '--muted', accent: '--accent', accent2: '--accent2', onAccent: '--on-accent', bubbleMe: '--bubble-me', bubbleBuddy: '--bubble-buddy', line: '--line' };
    Object.keys(map).forEach(function (k) { root.style.setProperty(map[k], t.v[k]); });
    var kid = (ageOverride || t.age) === 'kid';
    root.style.setProperty('--font', t.font);
    root.style.setProperty('--font-head', t.head);
    root.style.setProperty('--radius', kid ? '24px' : '14px');
    root.style.setProperty('--scale', kid ? '1.1' : '1');
    root.style.setProperty('--pattern', patternUrl(t));
    root.setAttribute('data-theme', t.id);
    root.setAttribute('data-dark', t.dark ? '1' : '0');
    var meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.setAttribute('content', t.v.bg);
    try { if (window.Android && Android.setBars) Android.setBars(t.v.bg, !t.dark); } catch (e) {}
    return t;
  }

  JA.THEMES = T;
  JA.theme = byId;
  JA.themesFor = recommended;
  JA.applyTheme = apply;
  if (typeof module !== 'undefined') module.exports = JA;
})();
