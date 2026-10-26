/* ============================================================
   voice.js — ce que dit l'ami(e)
   Marqueurs : {u} = comment l'ami(e) appelle l'utilisateur, {b} = nom de l'ami(e),
               {e} = accord (m : « » · f : « e » · autre : « ·e »).
   Les textes existent en version petits (kid) et grands (big).
   ============================================================ */
(function () {
  var JA = (window.JA = window.JA || {});

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  // Petites touches de personnalité ajoutées (parfois) à la fin des phrases
  var FLAVOR = {
    douce: { light: [' 💛', ' 🌷', ' Prends soin de toi.'], heavy: [' Je reste avec toi. 💛', ' Doucement, je suis là. 🌷'] },
    drole: { light: [' 😄', ' (Promis, je ne lis jamais par-dessus ton épaule… je n’ai pas d’yeux 👀)', ' Je suis ton fan n°1, sans pression 😎'], heavy: [' Pas de blague cette fois, juste une grosse oreille attentive. 💛'] },
    calme: { light: [' Doucement, à ton rythme. 🍃', ' Respire, on a le temps.'], heavy: [' On y va doucement, à ton rythme. 🍃'] },
    motivante: { light: [' Tu gères ! 💪', ' Chaque page est une petite victoire 🔥'], heavy: [' Tu as plus de force que tu ne le crois, et je suis avec toi. 💪'] }
  };

  var PERSONA_REMINDER = {
    douce: '{u}, pose ta journée ici, doucement. Je t’attends 💛',
    drole: '{u} ! Ton journal fait la tête : il n’a pas eu de nouvelles de toi 😅 Viens le consoler ✍️',
    calme: 'Un moment pour souffler ? Ta page du jour est prête 🍃',
    motivante: '{u}, 3 lignes aujourd’hui = une victoire de plus 🔥 Allez, on écrit !'
  };

  var TXT = {
    reminder: {
      big: ['{u}, ta page du jour t’attend ✍️ Même trois lignes, ça compte.', 'Coucou {u}, c’est {b}. Comment s’est passée ta journée ?', 'Un petit moment pour toi ? Viens poser ta journée dans ton journal 📖', '{u}, je garde ta place dans ton journal. Tu me racontes ?'],
      kid: ['Coucou {u} ! 🌈 C’est l’heure de raconter ta journée !', '{u}, j’ai hâte de lire ton histoire du jour ! ✏️', 'Pssst {u}… ton journal t’attend ! 📖✨', 'Qu’est-ce qui t’a fait sourire aujourd’hui, {u} ? Viens me le dire ! 😊']
    },
    reminderGentle: {
      big: ['{u}, je pense à toi 💛 Viens me dire comment tu vas, si tu en as envie.', '{b} est là si tu veux poser ce qui pèse. Pas besoin d’écrire beaucoup.', 'Pas de pression, {u}. Juste un petit coucou de {b} 💞'],
      kid: ['{u}, je pense à toi 💛 On se raconte comment tu te sens ?', 'Coucou {u} ! Je suis là si tu veux parler. Même juste un bisou virtuel 💞', '{u}, ton ami(e) {b} t’attend. Pas besoin d’écrire beaucoup 💛']
    },
    intro: {
      big: ['Salut {u} ! Moi, c’est {b}. 👋', 'Je serai ton ami(e) dans ce journal : je te rappelle d’écrire, je lis tes pages avec toi et, si je sens que ça devient lourd, je viens te parler.', 'Tout reste sur ton téléphone. Je ne raconte rien à personne 🤐', 'Quand tu veux, écris ta première page ✍️'],
      kid: ['Coucou {u} ! Moi c’est {b} ! 🎉', 'Je suis ton ami(e) dans ce journal. Je te rappelle d’écrire, et je suis là quand tu as besoin de parler 💛', 'Tout ce que tu écris reste secret, juste sur ton téléphone 🤫', 'On écrit ta première page ? ✏️']
    },
    // --- après l'écriture d'une page ---
    reactHeavy: {
      big: ['Merci de t’être confié{e} ici, {u}. Écrire ce qui pèse, c’est déjà alléger un peu.', 'Je lis que ce n’est pas simple en ce moment. Merci d’avoir été honnête.'],
      kid: ['Merci de m’avoir raconté, {u}. Ce n’est pas facile et je suis là avec toi. 💞']
    },
    reactGood: {
      big: ['Ça fait du bien de te lire comme ça, {u} !', 'Belle page, {u}. Garde ce moment précieux quelque part dans ta tête.', 'Je sens de la lumière dans tes mots aujourd’hui ✨'],
      kid: ['Youpi ! 🎉 Ça me fait plein de joie de te lire comme ça !', 'Waouh, quelle belle journée ! Merci de me l’avoir racontée 🌟']
    },
    reactNeutral: {
      big: ['C’est noté, {u}. Écrire, c’est déjà prendre soin de soi 🌱', 'Merci pour ta page. Chaque jour compte, même les jours ordinaires.', 'Page enregistrée. Tu viens de te donner dix minutes rien qu’à toi.'],
      kid: ['Bravo {u} ! Ta page est rangée en sécurité 🔒✨', 'Merci pour ton histoire du jour ! 📖']
    },
    firstPage: {
      big: ['Ta toute première page ! Bravo {u} 🎉 C’est le début d’une belle habitude.'],
      kid: ['Ta toute première page ! Bravo {u} ! 🎉🎉']
    },
    // --- l'ami(e) prend la parole ---
    reachStrong: {
      big: ['{u}, j’ai lu ta page… et je sens que c’est lourd à porter.', 'Je ne veux pas te laisser seul{e} avec ça. Tu as envie qu’on en parle un moment ?'],
      kid: ['{u}, j’ai lu ta page et j’ai senti que c’est lourd dans ton cœur. 💛', 'Je suis là. On en parle ensemble ?']
    },
    reachSoft: {
      big: ['{u}, en te lisant, je sens que ça ne va pas très fort aujourd’hui.', 'Je peux rester un peu avec toi, si tu veux.'],
      kid: ['{u}, je crois que ta journée n’était pas super… Je peux rester avec toi un petit moment ? 💞']
    },
    reachTrend: {
      big: ['{u}, depuis quelques jours, tes pages sont plus sombres. Je me suis dit que je pouvais venir te voir.', 'Pas pour te juger : juste pour savoir comment tu vas, vraiment.'],
      kid: ['{u}, depuis quelques jours tes pages sont un peu tristes. Je viens te faire un câlin 🤗', 'On en parle, si tu veux ?']
    },
    reachCare: {
      big: ['{u}, merci d’avoir écrit ça. C’est courageux de mettre ces mots-là.', 'Ce que tu ressens compte énormément, et tu n’es pas seul{e}.', 'Je veux savoir comment tu vas, là, maintenant : est-ce que tu es en sécurité ?'],
      kid: ['{u}, merci de me l’avoir écrit. C’est très courageux. 💛', 'Tu n’es pas tout{e} seul{e}, je suis là.', 'Est-ce que tu es en sécurité en ce moment ?']
    },
    // --- déroulé de la conversation ---
    roYes: ['Merci de me faire confiance, {u}. Qu’est-ce qui pèse le plus en ce moment ?'],
    roHug: ['Je t’envoie un énorme câlin virtuel 🤗', 'Tu n’as rien à prouver ni à expliquer. Je reste là.'],
    roHug2: ['Tu veux qu’on respire ensemble un moment ?'],
    roLater: ['D’accord, {u}. Je reste là. Tu peux revenir quand tu veux, même en pleine nuit 🌙'],
    afterStory: ['Merci de me l’avoir dit. Qu’est-ce qui t’aiderait le plus, là, maintenant ?'],
    breathIntro: ['On va respirer ensemble, doucement. Installe-toi, je te guide 🌬️'],
    afterBreath: ['Comment tu te sens maintenant ?'],
    breathNo: ['C’est OK si ça ne change pas tout de suite. Tu veux qu’on parle, ou qu’on pense à quelqu’un qui pourrait t’écouter ?'],
    breathLittle: ['Un petit pas, c’est déjà beau 🌱 On peut recommencer quand tu veux.'],
    breathYes: ['Ça me fait du bien de te savoir un peu mieux 🌤️ Tu veux le noter dans ton journal ?'],
    trustQ: { big: ['Quelle personne pourrait t’écouter sans te juger ?'], kid: ['Qui est-ce que tu pourrais prévenir ? Un adulte en qui tu as confiance, par exemple.'] },
    trustDraft: ['Tu peux commencer par cette phrase : « J’ai besoin de parler, tu as un moment ? ». C’est déjà énorme. Je te la copie ?'],
    trustCopied: ['C’est copié ! Tu peux la coller dans un message ou la dire à voix haute. Je suis avec toi 💛'],
    better: ['Ça me touche, {u}. Tu as fait quelque chose de courageux en m’en parlant 🌱 Je reste là.'],
    careSafe: ['Merci de me l’avoir dit. Je reste avec toi.', 'Ces pensées sont lourdes à porter seul{e}. En parler à une personne de confiance (famille, ami, médecin, psychologue) peut vraiment alléger.', 'Je ne suis qu’une application, je ne peux pas remplacer une vraie personne. On cherche ensemble qui pourrait t’écouter ?'],
    careUnsafe: ['Merci de me le dire, je te crois.', 'Tu mérites de l’aide maintenant. Si tu es en danger immédiat, appelle les secours de ton pays, ou va tout de suite vers une personne près de toi (un adulte, un voisin, un proche).', 'Je suis une application : je ne peux pas t’envoyer de l’aide moi-même, mais je reste ici avec toi. Tu trouveras aussi des lignes d’écoute dans Réglages → Besoin d’aide.'],
    careSkip: ['D’accord, tu n’es pas obligé{e} de répondre.', 'Je reste là. Si ça devient trop lourd, parle à une personne de confiance ou aux secours de ton pays : tu mérites de l’aide. Il y a des ressources dans Réglages → Besoin d’aide.'],
    careAgain: ['Je t’ai bien entendu{e}, {u}. Ce que tu écris est important.', 'Je ne veux pas que tu restes seul{e} avec ça : parle à une personne de confiance dès maintenant, ou aux secours de ton pays si tu es en danger. Les ressources sont dans Réglages → Besoin d’aide.'],
    safetyNote: ['Tu as le droit d’être en sécurité. Si quelqu’un te fait du mal ou te fait peur, parles-en à un adulte de confiance (famille, école, médecin) ou aux services de protection de ton pays.'],
    // --- conversation libre ---
    confide: ['Je t’écoute, {u}. Raconte-moi ce qui te traverse la tête, même en désordre.'],
    greet: ['Coucou {u} ! Ça me fait plaisir de te voir. Comment tu te sens ?', 'Hey {u} ! Je suis là. Qu’est-ce qui se passe dans ta tête ?'],
    thanks: ['Avec plaisir, {u} 💛', 'Toujours là pour toi 💞'],
    howAreYou: ['Moi je vais bien quand tu viens me voir 😊 Et toi, comment tu te sens, vraiment ?'],
    listen: ['Je t’écoute… raconte-moi.', 'Et ça t’a fait quoi, sur le moment ?', 'Je comprends. Continue, je suis là.', 'Tu veux m’en dire un peu plus ?'],
    celebrate: ['Ça fait vraiment plaisir à lire ! Qu’est-ce qui a rendu ce moment si bien ?', 'Génial ! Tu veux le garder dans ton journal ?'],
    bye: ['À tout à l’heure, {u} ! Je garde ta place 💛'],
    ideas: {
      big: [
        'Petit défi : bois un grand verre d’eau, étire-toi 30 secondes, puis reviens me dire comment tu te sens.',
        'Petit défi : note 3 choses qui ont été correctes aujourd’hui, même minuscules.',
        'Petit défi : envoie un message gentil à quelqu’un que tu apprécies.',
        'Petit défi : sors prendre l’air 5 minutes, sans téléphone.',
        'Petit défi : écoute en entier une chanson que tu adores.'
      ],
      kid: [
        'Une blague ! Qu’est-ce qui est jaune et qui attend ? … Jonathan ! 😄',
        'Une devinette : que fait une fraise sur un cheval ? … Tagada, tagada ! 🍓🐴',
        'Pourquoi les poissons détestent l’ordinateur ? … Parce qu’ils ont peur du net ! 🐟',
        'Petit défi : fais 5 sauts de grenouille, puis dis-moi si ça va mieux 🐸',
        'Petit défi : dessine ce que tu ressens sur une feuille, même un gribouillis ✏️'
      ]
    }
  };

  var PROMPTS = {
    big: [
      'Ce qui m’a le plus marqué{e} aujourd’hui, c’est…',
      'Aujourd’hui, j’ai ressenti…',
      'Trois choses dont je suis reconnaissant{e} :',
      'Si je pouvais dire une chose à quelqu’un, ce serait…',
      'Ce qui m’a fait sourire, et ce qui m’a pesé :',
      'Ma petite victoire du jour :',
      'Ce que j’aimerais changer demain :'
    ],
    kid: [
      'Aujourd’hui, ma meilleure surprise, c’était…',
      'Ce qui m’a fait rire aujourd’hui…',
      'Si j’étais un super-héros demain, je…',
      'Ce qui m’a fait un peu peur ou un peu de peine…',
      'Mon plus beau moment de la journée…',
      'Une chose gentille que j’ai faite ou reçue…'
    ]
  };

  var REFLECT = {
    tristesse: 'On dirait de la tristesse. Elle a le droit d’être là, tu sais.',
    colere: 'Je sens de la colère, et c’est normal quand quelque chose paraît injuste.',
    peur: 'On dirait que tu as peur ou que tu t’inquiètes beaucoup. C’est très humain.',
    stress: 'Tu portes beaucoup de pression sur les épaules, on dirait.',
    fatigue: 'Tu as l’air épuisé{e}. Ton corps et ta tête ont peut-être besoin de repos.',
    solitude: 'Se sentir seul{e} fait vraiment mal. Merci de me l’avoir dit.',
    honte: 'Tu es dur{e} avec toi-même… Ce que tu ressens ne dit pas ce que tu vaux.',
    none: 'Merci de me confier ça. Je t’écoute, vraiment.'
  };

  var TOPIC_Q = {
    ecole: { big: 'Qu’est-ce qui pèse le plus côté école ou études ?', kid: 'Qu’est-ce qui est difficile à l’école en ce moment ?' },
    famille: 'Il se passe quelque chose à la maison ? Raconte-moi ce que tu veux, à ton rythme.',
    amis: 'Il y a eu un souci avec des amis ou des camarades ? Qu’est-ce qui s’est passé ?',
    amour: 'On dirait que ça touche ton cœur. Tu veux me raconter ?',
    travail: 'Le travail ou l’argent te pèsent ? Dis-moi ce qui est le plus compliqué.',
    sante: 'Ton corps te fait des misères ? Raconte-moi comment tu te sens.',
    sommeil: 'Tu dors mal en ce moment ? Qu’est-ce qui tourne dans ta tête le soir ?',
    solitude: 'Tu te sens seul{e}… Depuis quand ? Raconte-moi.',
    fatigue: 'Tu es à bout de forces ? Qu’est-ce qui t’a le plus épuisé{e} ces derniers temps ?',
    autre: 'Je t’écoute. Raconte-moi ce qui tourne dans ta tête, même en désordre.'
  };

  var TOPIC_LABEL = {
    ecole: { big: '🎓 École / études', kid: '🎒 L’école' },
    famille: '🏠 La famille',
    amis: '👫 Mes amis',
    amour: '💗 Le cœur',
    travail: '💼 Travail / argent',
    sante: '🩺 Ma santé',
    sommeil: '😴 Le sommeil',
    solitude: 'Je me sens seul{e}',
    fatigue: 'Je suis épuisé{e}',
    autre: 'Autre chose'
  };

  JA.NAME_IDEAS = ['Bulle', 'Pixel', 'Luna', 'Nino', 'Mochi', 'Zéphyr', 'Plume', 'Biscotte', 'Orion', 'Nougat', 'Éclipse', 'Cannelle'];

  JA.makeVoice = function (S) {
    function st() { return S(); }
    function kid() { return st().profile.age === 'kid'; }
    function uname() { var p = st().profile; return p.nick || p.name || 'toi'; }
    function suffix() { var g = st().profile.gender; return g === 'f' ? 'e' : g === 'm' ? '' : '·e'; }

    function fill(s) {
      return String(s)
        .replace(/\{u\}/g, uname())
        .replace(/\{b\}/g, st().buddy.name || 'ton ami(e)')
        .replace(/\{e\}/g, suffix());
    }
    function arr(v) {
      if (Array.isArray(v)) return v;
      return kid() ? (v.kid || v.big) : (v.big || v.kid);
    }
    function flavor(text, heavy) {
      var f = FLAVOR[st().buddy.personality] || FLAVOR.douce;
      if (Math.random() < (heavy ? 0.7 : 0.5)) text += pick(heavy ? f.heavy : f.light);
      return text;
    }

    var V = {
      fill: fill,
      flavor: flavor,
      one: function (key) { return fill(pick(arr(TXT[key]))); },
      seq: function (key) { return arr(TXT[key]).map(fill); },
      reminder: {
        title: function () { return fill('{b} 💬'); },
        normal: function () {
          return arr(TXT.reminder).concat([PERSONA_REMINDER[st().buddy.personality] || PERSONA_REMINDER.douce]).map(fill);
        },
        gentle: function () { return arr(TXT.reminderGentle).map(fill); }
      },
      /** Phrase d'accueil sur l'écran principal. ctx : { hasToday, streak, recentHeavy, count, hour } */
      home: function (ctx) {
        var k = kid(), line;
        if (ctx.count === 0) {
          line = k ? 'Coucou {u} ! Écris ta première page, j’ai hâte de la lire ! 😄' : '{u}, ta première page t’attend. Quelques mots suffisent pour commencer.';
        } else if (ctx.recentHeavy && !ctx.hasToday) {
          line = k ? '{u}, comment tu te sens aujourd’hui ? Je suis là 💛' : '{u}, comment tu te sens aujourd’hui, après ces jours un peu lourds ? Je suis là 💛';
        } else if (ctx.hasToday) {
          if (ctx.streak >= 3) line = '🔥 ' + ctx.streak + ' jours d’affilée ! Quelle belle habitude, {u}.';
          else line = pick(k ? ['Tu as déjà écrit aujourd’hui, bravo {u} ! 🎉', 'Ta page du jour est faite ! ⭐'] : ['Tu as déjà écrit aujourd’hui, bravo {u}.', 'Ta page du jour est faite : belle habitude 🌱']);
        } else {
          var h = ctx.hour;
          if (h >= 22 || h < 5) line = k ? 'Il est tard, {u}… raconte-moi ta journée avant de dormir 🌙' : 'Il est tard, {u}… Pose tes pensées ici avant de dormir 🌙';
          else if (h < 12) line = k ? 'Bonjour {u} ! ☀️ Qu’est-ce que tu as envie de faire de beau aujourd’hui ?' : 'Bonjour {u} ! Une petite intention pour la journée ?';
          else if (h < 18) line = k ? 'Alors {u}, comment se passe ta journée ? 🌈' : 'Alors {u}, comment se passe ta journée ?';
          else line = k ? 'Bonsoir {u} ! 🌟 Raconte-moi ta journée !' : 'Bonsoir {u} ! Raconte-moi ta journée, je t’écoute.';
        }
        return flavor(fill(line), ctx.recentHeavy && !ctx.hasToday);
      },
      /** Réaction juste après l'enregistrement d'une page (hors mode soin). */
      reaction: function (a, mood, count) {
        if (count === 1) return fill(pick(arr(TXT.firstPage)));
        if (a.heavy >= 0.5) return flavor(fill(pick(arr(TXT.reactHeavy))), true);
        if (a.sent > 0.2 || mood >= 4) return flavor(fill(pick(arr(TXT.reactGood))), false);
        return flavor(fill(pick(arr(TXT.reactNeutral))), false);
      },
      /** Phrases par lesquelles l'ami(e) vient d'elle-même parler. */
      reach: function (level, reason) {
        var key = level === 'care' ? 'reachCare' : level === 'strong' ? 'reachStrong' : reason === 'tendance' ? 'reachTrend' : 'reachSoft';
        var lines = arr(TXT[key]).map(fill);
        if (level !== 'care') lines[lines.length - 1] = flavor(lines[lines.length - 1], true);
        return lines;
      },
      reflect: function (dominant) { return fill(REFLECT[dominant] || REFLECT.none); },
      topicQ: function (t) { var v = TOPIC_Q[t] || TOPIC_Q.autre; return fill(typeof v === 'string' ? v : (kid() ? v.kid : v.big)); },
      topicLabel: function (t) { var v = TOPIC_LABEL[t] || t; return fill(typeof v === 'string' ? v : (kid() ? v.kid : v.big)); },
      prompts: function (n) {
        var a = arr(PROMPTS).slice(), out = [];
        while (out.length < n && a.length) out.push(fill(a.splice(Math.floor(Math.random() * a.length), 1)[0]));
        return out;
      }
    };
    return V;
  };

  if (typeof module !== 'undefined') module.exports = JA;
})();
