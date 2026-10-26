/* ============================================================
   engine.js — le « cerveau » de l'ami(e)
   Tout tourne sur le téléphone, sans internet : analyse par lexique
   (mots, négations, intensité, humeur choisie) + suivi de tendance.
   Ce n'est PAS un modèle de langage : c'est volontairement simple,
   transparent et privé.
   ============================================================ */
(function () {
  var JA = (window.JA = window.JA || {});

  function norm(s) {
    return (s || '')
      .toString()
      .toLowerCase()
      .replace(/[’`´]/g, "'")
      .replace(/œ/g, 'oe')
      .replace(/æ/g, 'ae')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  // [motif (préfixe de mot), poids, émotion, alerte-sécurité?]
  var NEG = [
    // tristesse
    ['triste', 1, 'tristesse'], ['deprim', 2, 'tristesse'], ['desesper', 2, 'tristesse'],
    ['pleur', 2, 'tristesse'], ['larmes?\\b', 1, 'tristesse'], ['chagrin', 2, 'tristesse'],
    ['melanco', 1, 'tristesse'], ['cafard', 1, 'tristesse'], ['vide\\b', 2, 'tristesse'],
    ['coeur lourd', 2, 'tristesse'], ['effondr', 2, 'tristesse'], ['morose', 1, 'tristesse'],
    ['sans espoir', 2, 'tristesse'], ['plus envie', 2, 'tristesse'], ['a quoi bon', 2, 'tristesse'],
    ['rien ne va', 2, 'tristesse'], ['malheureu', 2, 'tristesse'], ['decourag', 2, 'tristesse'],
    ['ca ne va pas', 1, 'tristesse'], ['ca va pas', 1, 'tristesse'], ['pas bien\\b', 1, 'tristesse'],
    ['pourquoi moi', 1, 'tristesse'],
    // colère
    ['colere', 1, 'colere'], ['enerv', 1, 'colere'], ['furieu', 2, 'colere'], ['rage', 2, 'colere'],
    ['deteste', 2, 'colere'], ['hais\\b', 2, 'colere'], ['haine', 2, 'colere'], ['marre\\b', 1, 'colere'],
    ['agace', 1, 'colere'], ['injuste', 1, 'colere'], ['fache', 1, 'colere'], ['ras le bol', 2, 'colere'],
    ['insupportable', 1, 'colere'],
    // peur
    ['peur', 1, 'peur'], ['effray', 2, 'peur'], ['terrifi', 2, 'peur'], ['inquiet', 1, 'peur'],
    ['angoiss', 2, 'peur'], ['panique', 2, 'peur'], ['cauchemar', 1, 'peur'], ['flippe', 1, 'peur'],
    ['trouille', 1, 'peur'], ['anxi', 2, 'peur'], ['crains\\b', 1, 'peur'],
    // stress
    ['stress', 1, 'stress'], ['pression', 1, 'stress'], ['deborde', 2, 'stress'], ['surcharg', 1, 'stress'],
    ['nerveu', 1, 'stress'], ['tendu', 1, 'stress'], ['en peux plus', 2, 'stress'],
    ['en peux pas', 2, 'stress'], ['trop de choses', 1, 'stress'], ['pas le temps', 1, 'stress'],
    // fatigue
    ['fatigu', 1, 'fatigue'], ['epuis', 2, 'fatigue'], ['creve', 1, 'fatigue'], ['lessive\\b', 1, 'fatigue'],
    ['plus d\'energie', 1, 'fatigue'], ['insomnie', 1, 'fatigue'], ['pas dormi', 1, 'fatigue'],
    ['dors pas', 1, 'fatigue'], ['dors plus', 1, 'fatigue'],
    // solitude
    ['seul(?:e|s|es)?\\b', 2, 'solitude'], ['solitude', 2, 'solitude'], ['isole', 2, 'solitude'],
    ['personne ne', 2, 'solitude'], ['abandon', 2, 'solitude'], ['rejet', 2, 'solitude'],
    ['exclu', 2, 'solitude'], ['incompris', 2, 'solitude'], ['delaisse', 2, 'solitude'],
    ['pas d\'amis', 2, 'solitude'], ['aucun ami', 2, 'solitude'], ['laisse de cote', 2, 'solitude'],
    // honte / dévalorisation
    ['honte', 2, 'honte'], ['coupable', 2, 'honte'], ['ma faute', 2, 'honte'],
    ['suis nul', 2, 'honte'], ['sers a rien', 2, 'honte'], ['incapable', 2, 'honte'],
    ['idiot', 1, 'honte'], ['ridicule', 1, 'honte'], ['humili', 2, 'honte'], ['minable', 2, 'honte'],
    ['decu', 1, 'honte'], ['echec', 1, 'honte'], ['jamais assez', 2, 'honte'], ['moque', 1, 'honte'],
    // général
    ['mal\\b', 1, 'tristesse'], ['souffr', 2, 'tristesse'], ['douleur', 1, 'tristesse'],
    ['probleme', 1, 'stress'], ['dispute', 1, 'colere'], ['crie\\b', 1, 'colere'], ['criait', 1, 'colere'],
    ['hurl', 1, 'colere'], ['difficile', 1, 'stress'], ['galere', 1, 'stress'], ['lourd', 1, 'tristesse'],
    ['pesant', 1, 'tristesse'], ['perdu', 1, 'tristesse'], ['mauvais', 1, 'tristesse'],
    ['horrible', 2, 'tristesse'], ['terrible', 1, 'tristesse'], ['nul(?:le)?s?\\b', 1, 'honte'],
    ['dur(?:e|s|es)?\\b', 1, 'stress'], ['pire\\b', 1, 'tristesse'], ['jalou', 1, 'colere'],
    // alertes sécurité (violence, harcèlement)
    ['harcel', 2, 'peur', true], ['menace', 2, 'peur', true], ['me frappe', 2, 'peur', true],
    ['m\'a frappe', 2, 'peur', true], ['me bat\\b', 2, 'peur', true], ['m\'a battu', 2, 'peur', true],
    ['abus', 2, 'peur', true], ['violence', 2, 'peur', true]
  ];

  var POS = [
    ['content', 1], ['heureu', 2], ['joie', 2], ['genial', 2], ['super\\b', 1], ['fier', 2],
    ['bien\\b', 1], ['rire\\b', 1], ['rigol', 1], ['sourir', 1], ['amour', 1], ['aime', 1],
    ['adore', 2], ['reussi', 2], ['gagne', 1], ['merci', 1], ['calme', 1], ['serein', 2],
    ['paisible', 2], ['soulag', 2], ['motive', 1], ['excit', 1], ['chance', 1], ['cool\\b', 1],
    ['magnifi', 2], ['parfait', 2], ['apais', 2], ['tranquille', 1], ['bonne journee', 2],
    ['trop bien', 2], ['fete', 1], ['sympa', 1], ['gentil', 1], ['soleil', 1], ['rassure', 1],
    ['confiance', 1], ['espoir', 1], ['mieux\\b', 1], ['jouer', 1], ['cadeau', 1], ['recompense', 1]
  ];

  // Phrases qui déclenchent le mode « soin » (pensées de mort / de se faire du mal).
  var CARE = [
    'suicid', 'me tuer', 'envie de mourir', 'veux mourir', 'vouloir mourir', 'voudrais mourir',
    'en finir', 'plus envie de vivre', 'plus vivre', 'disparaitre', 'me faire du mal',
    'me blesser', 'me couper', 'ne plus exister', 'mieux sans moi', 'mourir(?! de (?:rire|faim|honte|chaud|froid|sommeil|peur))',
    'plus la force de vivre', 'detester vivre', 'hais ma vie'
  ];

  var TOPICS = {
    ecole: ['ecole', 'classe', 'prof\\b', 'profs', 'professeur', 'maitre', 'maitresse', 'examen', 'devoir', 'notes?\\b', 'cours\\b', 'universite', 'fac\\b', 'bulletin', 'interro', 'controle'],
    famille: ['maman', 'papa', 'mere\\b', 'pere\\b', 'frere', 'soeur', 'parents', 'famille', 'oncle', 'tante', 'grand-?mere', 'grand-?pere', 'mes parents'],
    amis: ['amis?\\b', 'amie', 'copain', 'copine', 'pote', 'camarade', 'groupe'],
    amour: ['amoureu', 'crush', 'petit ami', 'petite amie', 'rupture', 'ex\\b', 'je l\'aime'],
    travail: ['travail', 'boulot', 'patron', 'collegue', 'argent', 'salaire', 'facture', 'loyer', 'dette', 'chef\\b'],
    sante: ['malade', 'hopital', 'medecin', 'docteur', 'fievre', 'mal a la tete', 'mal au ventre'],
    sommeil: ['dormi', 'sommeil', 'insomnie', 'cauchemar', 'reveille']
  };

  function compile(src) { return new RegExp('\\b(?:' + src + ')', 'g'); }
  var NEG_RE = NEG.map(function (e) { return { re: compile(e[0]), w: e[1], emo: e[2], safety: !!e[3] }; });
  var POS_RE = POS.map(function (e) { return { re: compile(e[0]), w: e[1] }; });
  var CARE_RE = CARE.map(compile);
  var TOPIC_RE = {};
  Object.keys(TOPICS).forEach(function (k) { TOPIC_RE[k] = new RegExp('\\b(?:' + TOPICS[k].join('|') + ')'); });

  var NEGATOR = /\b(?:pas|jamais|aucun|aucune)\s+(?:[a-z']+\s+)?$/;
  var BOOST = /\b(?:tres|trop|tellement|vraiment|super|extremement|completement|totalement|toujours)\s+$/;
  var MOOD_H = [0.25, 1, 0.65, 0.25, 0.05, 0]; // humeur 1..5 → poids

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function r2(x) { return Math.round(x * 100) / 100; }

  function analyze(text, mood) {
    var t = norm(text);
    var words = (t.match(/[a-z]+/g) || []).length;
    var neg = 0, pos = 0, boosts = 0, safety = false, emo = {};

    NEG_RE.forEach(function (e) {
      e.re.lastIndex = 0;
      var m, n = 0;
      while ((m = e.re.exec(t)) && n < 4) {
        n++;
        if (m[0].length === 0) { e.re.lastIndex++; continue; }
        var before = t.slice(Math.max(0, m.index - 20), m.index);
        if (NEGATOR.test(before)) continue; // « pas triste » → on ignore
        var b = BOOST.test(before) ? 1.5 : 1;
        if (b > 1) boosts++;
        neg += e.w * b;
        emo[e.emo] = (emo[e.emo] || 0) + e.w * b;
        if (e.safety) safety = true;
      }
    });

    POS_RE.forEach(function (e) {
      e.re.lastIndex = 0;
      var m, n = 0;
      while ((m = e.re.exec(t)) && n < 4) {
        n++;
        if (m[0].length === 0) { e.re.lastIndex++; continue; }
        var before = t.slice(Math.max(0, m.index - 20), m.index);
        if (NEGATOR.test(before)) { // « pas content » → plutôt négatif
          neg += 0.7;
          emo.tristesse = (emo.tristesse || 0) + 0.7;
        } else {
          pos += e.w * (BOOST.test(before) ? 1.5 : 1);
        }
      }
    });

    var care = CARE_RE.some(function (re) { re.lastIndex = 0; return re.test(t); });

    var heavyText = clamp((neg - 0.5 * pos) / (5 + words / 30), 0, 1);
    var moodH = mood ? MOOD_H[mood] : 0.25;
    var excl = (String(text || '').match(/!/g) || []).length;
    var intensity = clamp(boosts / 4, 0, 1) * 0.5 + clamp(excl / 6, 0, 1) * 0.5;
    var heavy = clamp(0.5 * moodH + 0.65 * heavyText + (neg > 0 ? 0.1 * intensity : 0), 0, 1);
    if (care) heavy = Math.max(heavy, 0.9);
    if (safety) heavy = Math.max(heavy, 0.6);

    var dominant = null, best = 0;
    Object.keys(emo).forEach(function (k) { if (emo[k] > best) { best = emo[k]; dominant = k; } });

    var topics = Object.keys(TOPIC_RE).filter(function (k) { return TOPIC_RE[k].test(t); });

    return {
      heavy: r2(heavy),
      sent: r2(clamp((pos - neg) / (pos + neg + 2), -1, 1)),
      care: care,
      safety: safety,
      emo: emo,
      dominant: dominant,
      topics: topics,
      words: words
    };
  }

  /**
   * Faut-il que l'ami(e) vienne parler ? Regarde la dernière page et la tendance des dernières.
   * entries : tableau d'entrées { ts, a:{heavy,care} }.  flags.lastReach : dernier moment où l'ami(e) a pris la parole.
   * Retourne null ou { level: 'care'|'strong'|'soft', reason: 'page'|'tendance' }.
   */
  function decide(entries, flags, now) {
    now = now || Date.now();
    flags = flags || {};
    if (!entries || !entries.length) return null;
    var sorted = entries.slice().sort(function (a, b) { return a.ts - b.ts; });
    var last = sorted[sorted.length - 1];
    if (!last.a) return null;
    if (last.a.care) return { level: 'care', reason: 'page' };

    var recent = sorted.slice(-4).map(function (e) { return e.a ? e.a.heavy : 0; });
    var ema = recent.reduce(function (acc, h) { return acc === null ? h : acc * 0.5 + h * 0.5; }, null);
    var lastH = last.a.heavy;

    var level = null, reason = 'page';
    if (lastH >= 0.7) {
      level = 'strong';
    } else if (lastH >= 0.5) {
      level = 'soft';
    } else if (recent.length >= 2 && ema >= 0.5 && lastH >= 0.4) {
      level = 'soft'; reason = 'tendance';
    } else if (recent.length >= 3 && recent.slice(-3).every(function (h) { return h >= 0.45; })) {
      level = 'soft'; reason = 'tendance';
    }
    if (!level) return null;

    // Pas de harcèlement : une seule prise de parole toutes les 6 h (sauf page très lourde).
    var cooldown = 6 * 3600 * 1000;
    if (flags.lastReach && now - flags.lastReach < cooldown && lastH < 0.8) return null;
    return { level: level, reason: reason };
  }

  // --- SHA-256 synchrone (pour le code PIN : on ne stocke jamais le PIN en clair) ---
  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  function sha256(str) {
    var bytes = [];
    var utf = unescape(encodeURIComponent(str));
    for (var i = 0; i < utf.length; i++) bytes.push(utf.charCodeAt(i));
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (var s = 7; s >= 0; s--) bytes.push(s >= 4 ? 0 : (bitLen >>> (s * 8)) & 0xff);
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
    for (var off = 0; off < bytes.length; off += 64) {
      var w = new Array(64);
      for (var j = 0; j < 16; j++) {
        w[j] = (bytes[off + j * 4] << 24) | (bytes[off + j * 4 + 1] << 16) | (bytes[off + j * 4 + 2] << 8) | bytes[off + j * 4 + 3];
      }
      for (j = 16; j < 64; j++) {
        var s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        var s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (j = 0; j < 64; j++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[j] + w[j]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    return H.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
  }

  JA.norm = norm;
  JA.analyze = analyze;
  JA.decide = decide;
  JA.sha256 = sha256;
  if (typeof module !== 'undefined') module.exports = JA;
})();
