/* ============================================================
   BUBU & DUDU BIRTHDAY  ·  js/script.js
   17 scenes · smart sticker loader · photo galleries ·
   romantic typewriter letter · built-in soft melody.
   ============================================================ */

const totalPages = 17;
const $ = id => document.getElementById(id);

const pages      = Array.from(document.querySelectorAll('.page'));
const backBtn    = $('backBtn');
const nextBtn    = $('nextBtn');
const indicator  = $('pageIndicator');
const musicBtn   = $('musicBtn');
const audio      = $('bgMusic');
const lightbox   = $('lightbox');

let currentPage     = 0;
let busy            = false;
let musicOn         = false;
let wishTriggered   = false;
let letterTimer     = [];
let sequenceTimers  = [];
let photoCache      = null;
let kingCache       = null;
const probedCache   = new Map();

const PHOTO_EXTS = ['jpg', 'jpeg', 'png', 'webp'];

/* ------------------------------------------------------------------
   STICKERS · Bubu & Dudu
   Har page apni matching file khud dhoondti hai. File
   assets/characters/ me rakho aur naam us page ke list se match karo —
   pehla mila hua naam us page par laga diya jata hai. Format koi bhi:
   .gif · .webp · .mp4 · .webm · .png
   Naam se pehle scene number bhi chalta hai (1.mp4 … 17.mp4).
   Agar tumhari file ka naam list me nahi hai to assets/characters/
   manifest.json me us page ke id ke saamne likh do (ya "default").
   ------------------------------------------------------------------ */
const STICKER_EXTS = ['gif', 'webp', 'mp4', 'webm', 'png', 'jpg', 'jpeg'];
const STICKER_DIR = 'assets/characters/';

const CHAR_STICKERS = [
    { id: 'char-welcome',   page: 1,  names: ['wave', 'welcome', 'hello', 'hi', 'greeting', '1'] },
    { id: 'char-surprise',  page: 2,  names: ['surprise', 'secret', 'peek', 'reveal', '2'] },
    { id: 'char-celebrate', page: 3,  names: ['celebration', 'celebrate', 'cheer', 'party', '3'] },
    { id: 'char-birthday',  page: 4,  names: ['birthday', 'happy-birthday', 'birthday-cake', '4'] },
    { id: 'char-hug',       page: 5,  names: ['hug', 'hugging', 'hugs', '5'] },
    { id: 'char-love',      page: 6,  names: ['love', 'in-love', 'hearts', 'romantic', '6'] },
    { id: 'char-smile',     page: 7,  names: ['smile', 'smiling', 'laugh', 'happy', '7'] },
    { id: 'char-fav',       page: 8,  names: [] },
    { id: 'char-there',     page: 9,  names: [] },
    { id: 'char-wish',      page: 12, names: [] },
    { id: 'char-dance',     page: 13, names: [] },
    { id: 'char-letter',    page: 14, names: [] },
    { id: 'char-cake',      page: 16, names: [] },
    { id: 'char-final',     page: 17, names: [] }
];

const CHAR_FILES = {};
CHAR_STICKERS.forEach(s => { CHAR_FILES[s.id] = s.names; });

/* optional: assets/characters/manifest.json → { "char-hug": "hug.mp4", "default": "us.mp4" } */
let manifestPromise = null;
function loadManifest() {
    if (manifestPromise) return manifestPromise;
    manifestPromise = fetch('assets/characters/manifest.json', { cache: 'no-cache' })
        .then(r => (r.ok ? r.json() : null))
        .then(j => (j && typeof j === 'object' ? j : null))
        .catch(() => null);
    return manifestPromise;
}

/* ------------------------------------------------------------------
   FILE PROBING
   ------------------------------------------------------------------ */
function mediaKind(src) {
    return /\.(mp4|webm)$/i.test(src) ? 'video' : 'image';
}

/* returns a promise, cached — ek hi file baar baar probe nahi hoti */
function probeFile(src, kind) {
    if (probedCache.has(src)) return probedCache.get(src);
    const p = new Promise(resolve => {
        const done = ok => resolve(ok);
        if (kind === 'video') {
            const v = document.createElement('video');
            v.preload = 'metadata';
            v.onloadeddata = () => done(true);
            v.onerror      = () => done(false);
            v.src = src;
        } else if (kind === 'audio') {
            const a = document.createElement('audio');
            a.preload = 'metadata';
            a.onloadeddata = () => done(true);
            a.onerror      = () => done(false);
            a.src = src;
        } else {
            const img = new Image();
            img.decoding = 'async';
            img.onload  = () => done(true);
            img.onerror = () => done(false);
            img.src = src;
        }
    });
    probedCache.set(src, p);
    return p;
}

async function firstExisting(base, exts) {
    for (const ext of exts) {
        const src = `${base}.${ext}`;
        if (await probeFile(src, 'image')) return src;
    }
    return null;
}

/* ------------------------------------------------------------------
   STICKERS
   Priority: manifest entry → page ke apy names (format-layer me, taaki
   preferred naam kisi bhi format me jeet sake) → manifest default.
   Kuch bhi na mile to slot chhupa rehta hai (koi tooti image nahi).
   ------------------------------------------------------------------ */
function stickerUrls(base) {
    const list = /\.(gif|webp|mp4|webm|png|jpe?g)$/i.test(base)
        ? [base]
        : STICKER_EXTS.map(ext => `${base}.${ext}`);
    return list.map(u => (u.includes('/') ? u : STICKER_DIR + u));
}

async function probeAny(urls) {
    const hits = await Promise.all(
        urls.map(u => probeFile(u, mediaKind(u)).then(ok => (ok ? u : null)))
    );
    return hits.find(Boolean) || null;
}

async function pickSticker(names, mapped, fallback) {
    // 1. Try manifest mapped first
    if (mapped) {
        const hit = await probeAny(stickerUrls(mapped));
        if (hit) return hit;
    }
    // 2. Try page names with all exts
    for (const ext of STICKER_EXTS) {
        const hit = await probeAny((names || []).map(n => `${STICKER_DIR}${n}.${ext}`));
        if (hit) return hit;
    }
    // 3. Fallback
    if (fallback) {
        const hit = await probeAny(stickerUrls(fallback));
        if (hit) return hit;
    }
    return null;
}

function renderSticker(container, src) {
    container.classList.remove('loading');
    const isVideo = /\.(mp4|webm)$/i.test(src);
    if (isVideo) {
        const v = document.createElement('video');
        v.src = src;
        v.autoplay = true;
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        v.preload = 'metadata';
        v.setAttribute('aria-label', 'Bubu and Dudu, my cute couple');
        v.classList.add('char-video');
        v.addEventListener('error', () => dropSticker(container));
        container.appendChild(v);
        try { v.play().catch(() => {}); } catch (e) {}
    } else {
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Bubu and Dudu, my cute couple';
        img.draggable = false;
        img.loading = 'lazy';
        img.classList.add('char-img');
        img.style.animation = 'none';
        img.addEventListener('error', () => dropSticker(container));
        container.appendChild(img);
    }
}

/* file na mile to slot ko chhupa do + console me bata do ki kya daalna hai */
function dropSticker(container) {
    if (!container) return;
    container.classList.remove('loading');
    container.replaceChildren();
    container.classList.add('no-sticker');
    if (!container.dataset.told) {
        container.dataset.told = '1';
        console.info(
            `[sticker] scene ${CHAR_STICKERS.find(s => s.id === container.id)?.page ?? '?'} ke liye ` +
            'file nahi mili → assets/characters/ me ' +
            (CHAR_FILES[container.id] || []).slice(0, 3).join(' / ') + ' (ya 1.gif … 17.gif)'
        );
    }
}

const charLoaded = {};
async function loadChar(id) {
    const el = $(id);
    if (!el || charLoaded[id]) return;
    charLoaded[id] = true;
    el.classList.add('loading');

    const manifest = await loadManifest();
    const mapped   = manifest ? (manifest[id]) : null;
    const src = await pickSticker(CHAR_FILES[id] || [], mapped, manifest && manifest.default);

    if (!src) { dropSticker(el); return; }
    if (!el.isConnected) return;
    renderSticker(el, src);
    manageVideos();
}

/* har page par sirf us page ka sticker load karo */
function loadPageChars(idx) {
    const page = pages[idx];
    if (!page) return;
    page.querySelectorAll('.char-wrap').forEach(el => loadChar(el.id));
}

/* ------------------------------------------------------------------
   NAVIGATION
   ------------------------------------------------------------------ */
function showPage(index) {
    if (busy || index === currentPage || index < 0 || index >= totalPages) return;

    const oldIdx = currentPage;
    busy = true;

    pages[oldIdx].classList.remove('active');
    pages[oldIdx].classList.add('leaving');

    clearTimers(sequenceTimers);

    pages[index].classList.add('entering');
    pages[index].classList.add('active');

    currentPage = index;
    updateUI();
    onPageEnter(index);

    manageVideos();
    setTimeout(() => {
        pages[oldIdx].classList.remove('leaving');
        pages[index].classList.remove('entering');
        busy = false;
    }, 680);
}

function nextScene() {
    if (currentPage === 0) {
        startMusic();
        setTimeout(() => showPage(1), 650);
    } else if (currentPage === totalPages - 2) {
        makeWish();
    } else if (currentPage === totalPages - 1) {
        replayAll();
    } else {
        showPage(currentPage + 1);
    }
}

function replayAll() {
    wishTriggered = false;
    currentPage = 0;
    clearTimers(sequenceTimers);
    clearTimers(letterTimer);
    pages.forEach(p => p.classList.remove('active', 'leaving', 'entering'));
    pages[0].classList.add('active');
    updateUI();
    onPageEnter(0);
    manageVideos();
}

function updateUI() {
    indicator.textContent = (currentPage + 1) + ' / ' + totalPages;

    const first = currentPage === 0;
    const last  = currentPage === totalPages - 1;
    const wish  = currentPage === totalPages - 2;

    backBtn.style.visibility = (first || last) ? 'hidden' : 'visible';

    if (first)            nextBtn.textContent = 'START THE SURPRISE \u2728';
    else if (wish)        nextBtn.textContent = 'MAKE A WISH \u{1F382}\u2728';
    else if (last)        nextBtn.textContent = 'REPLAY \u21BB';
    else                  nextBtn.textContent = 'NEXT \u25B8';

    nextBtn.classList.toggle('btn-start', first);
    nextBtn.classList.toggle('btn-wish',  wish);
    nextBtn.classList.toggle('btn-replay', last);
}

backBtn.addEventListener('click', () => showPage(currentPage - 1));
nextBtn.addEventListener('click', nextScene);
musicBtn.addEventListener('click', toggleMusic);

/* ------------------------------------------------------------------
   PAGE ENTER HOOKS
   ------------------------------------------------------------------ */
function onPageEnter(idx) {
    loadPageChars(idx);
    loadScenePhoto(idx);
    switch (idx) {
        case 4:  hugSequence(); break;
        case 7:  favSequence(); break;
        case 8:  thereSequence(); break;
        case 9:  reasonSequence(); break;
        case 10: initMoments(); break;
        case 11: wishLines(); break;
        case 12: celebrateSequence(); break;
        case 13: typeLetter(); break;
        case 14: initKingGallery(); break;
        case 15: wishTriggered = false; break;
        case 16: finalSequence(); break;
        default: break;
    }
}

function clearTimers(arr) {
    while (arr.length) clearTimeout(arr.pop());
}

function manageVideos() {
    pages.forEach((p, i) => {
        p.querySelectorAll('video').forEach(v => {
            if (i === currentPage) v.play().catch(() => { });
            else v.pause();
        });
    });
}

function stagger(ids, start, gap) {
    clearTimers(sequenceTimers);
    ids.forEach((id, i) => {
        const el = typeof id === 'string' ? $(id) : id;
        if (el) el.classList.remove('on');
    });
    ids.forEach((id, i) => {
        const el = typeof id === 'string' ? $(id) : id;
        if (el) sequenceTimers.push(setTimeout(() => el.classList.add('on'), start + i * gap));
    });
}

/* ------------------------------------------------------------------
   AUDIO — mp3 if present, otherwise a soft built-in melody
   ------------------------------------------------------------------ */
let mp3Ok = false;

function startMusic() {
    if (musicOn) return;
    musicOn = true;
    musicBtn.classList.add('on');
    musicBtn.classList.remove('no');

    if (mp3Ok) {
        audio.volume = 0.45;
        audio.play().catch(() => { });
    } else {
        Melody.play();
    }
}

function toggleMusic() {
    if (musicOn) {
        musicOn = false;
        musicBtn.classList.remove('on');
        if (mp3Ok) audio.pause(); else Melody.stop();
    } else {
        startMusic();
    }
}

/* ------------------------------------------------------------------
   BUILT-IN SOFT ROMANTIC MELODY (Web Audio, no file needed)
   ------------------------------------------------------------------ */
const Melody = (() => {
    const BPM = 64;
    const STEP = 60 / BPM / 2;              /* eighth note */
    const LOOKAHEAD = 0.18;
    const TICK = 40;

    /* one bar per chord · midi note numbers */
    const BARS = [
        { pad: [53, 60, 64, 69], bass: 41, notes: [77, 81, 84, 81, 79, 81, 84, 88] },
        { pad: [48, 55, 59, 64], bass: 36, notes: [76, 79, 84, 83, 79, 76, 72, 76] },
        { pad: [50, 57, 60, 65], bass: 38, notes: [77, 81, 86, 84, 81, 77, 74, 77] },
        { pad: [46, 53, 58, 62], bass: 34, notes: [70, 74, 82, 81, 77, 74, 70, 74] }
    ];

    const freq = m => 440 * Math.pow(2, (m - 69) / 12);

    let ctx = null, master = null, wet = null, timer = null;
    let nextTime = 0, step = 0, running = false;

    function build() {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ctx = new AC();

        master = ctx.createGain();
        master.gain.value = 0;

        const soft = ctx.createBiquadFilter();
        soft.type = 'lowpass';
        soft.frequency.value = 5200;
        soft.Q.value = 0.4;

        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -22;
        comp.ratio.value = 6;

        master.connect(soft);
        soft.connect(comp);
        comp.connect(ctx.destination);

        /* gentle shimmer: short feedback delay */
        const delay = ctx.createDelay(1);
        delay.delayTime.value = STEP * 1.5;
        const fb = ctx.createGain();
        fb.gain.value = 0.24;
        const wetGain = ctx.createGain();
        wetGain.gain.value = 0.3;
        delay.connect(fb);
        fb.connect(delay);
        delay.connect(wetGain);
        wetGain.connect(soft);
        wet = delay;

        return true;
    }

    function bell(t, m, gain) {
        const f = freq(m);
        const o = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = f;
        o2.type = 'sine';
        o2.frequency.value = f * 2;
        const g2 = ctx.createGain();
        g2.gain.value = 0.22;

        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);

        o.connect(g);
        o2.connect(g2);
        g2.connect(g);
        g.connect(master);
        g.connect(wet);

        o.start(t);  o.stop(t + 1.6);
        o2.start(t); o2.stop(t + 1.6);
    }

    function pad(t, midis, dur) {
        midis.forEach(m => {
            const f = freq(m);
            const o1 = ctx.createOscillator();
            const o2 = ctx.createOscillator();
            const g = ctx.createGain();
            o1.type = 'triangle';
            o2.type = 'triangle';
            o1.frequency.value = f;
            o2.frequency.value = f;
            o1.detune.value = -5;
            o2.detune.value = 5;

            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(0.030, t + dur * 0.35);
            g.gain.linearRampToValueAtTime(0.0001, t + dur);

            o1.connect(g); o2.connect(g);
            g.connect(master);
            o1.start(t); o1.stop(t + dur + 0.05);
            o2.start(t); o2.stop(t + dur + 0.05);
        });
    }

    function bass(t, m, dur) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 420;
        o.type = 'sine';
        o.frequency.value = freq(m);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.075, t + 0.08);
        g.gain.linearRampToValueAtTime(0.0001, t + dur);
        o.connect(lp); lp.connect(g); g.connect(master);
        o.start(t); o.stop(t + dur + 0.05);
    }

    function schedule() {
        const barLen = STEP * BARS[0].notes.length;
        while (nextTime < ctx.currentTime + LOOKAHEAD) {
            const bar = BARS[Math.floor(step / 8) % BARS.length];
            const pos = step % 8;

            if (pos === 0) {
                pad(nextTime, bar.pad, barLen);
                bass(nextTime, bar.bass, barLen * 0.9);
            }
            const n = bar.notes[pos];
            const accent = pos === 0 ? 0.075 : (pos % 2 === 0 ? 0.058 : 0.044);
            bell(nextTime, n, accent);

            nextTime += STEP;
            step++;
        }
    }

    return {
        play() {
            if (running) return;
            if (!ctx && !build()) return;
            running = true;
            if (ctx.state === 'suspended') ctx.resume();
            step = 0;
            nextTime = ctx.currentTime + 0.15;
            master.gain.cancelScheduledValues(ctx.currentTime);
            master.gain.setValueAtTime(0.0001, ctx.currentTime);
            master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.6);
            timer = setInterval(schedule, TICK);
            schedule();
        },
        stop() {
            if (!running) return;
            running = false;
            clearInterval(timer);
            timer = null;
            if (!ctx) return;
            master.gain.cancelScheduledValues(ctx.currentTime);
            master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
            master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
        }
    };
})();

if (audio) audio.addEventListener('error', () => { /* handled by probe */ });

/* ------------------------------------------------------------------
   SCENE PHOTO SLOTS
   assets/moments/scene1.jpg → page 1, scene2.jpg → page 2, ...
   ------------------------------------------------------------------ */
const scenePhotoDone = {};
async function loadScenePhoto(idx) {
    const slot = pages[idx] && pages[idx].querySelector('.scene-photo');
    if (!slot || scenePhotoDone[idx]) return;
    scenePhotoDone[idx] = true;

    const src = await firstExisting(`assets/moments/scene${slot.dataset.slot}`, PHOTO_EXTS);
    if (!src) {
        const src2 = await firstExisting(`assets/images/scene${slot.dataset.slot}`, PHOTO_EXTS);
        if (!src2) return;
        const img = document.createElement('img');
        img.src = src2;
        img.alt = 'A memory of us';
        img.draggable = false;
        slot.appendChild(img);
        slot.classList.add('has-photo');
        return;
    }

    const img = document.createElement('img');
    img.src = src;
    img.alt = 'A memory of us';
    img.draggable = false;
    slot.appendChild(img);
    slot.classList.add('has-photo');
}

/* ------------------------------------------------------------------
   PAGE 5 · HUG SEQUENCE
   ------------------------------------------------------------------ */
function hugSequence() {
    clearTimers(sequenceTimers);
    const lines = [hugLine(1), hugLine(2), hugLine(3)];
    lines.forEach(l => l && l.classList.remove('on'));
    const wrap = $('char-hug');
    wrap.classList.add('c-fx-beat');

    const t = (ms, fn) => sequenceTimers.push(setTimeout(fn, ms));
    t(300,  () => lines[0] && lines[0].classList.add('on'));
    t(1900, () => lines[1] && lines[1].classList.add('on'));
    t(3400, () => {
        if (lines[2]) lines[2].classList.add('on');
        wrap.classList.add('glow-pink');
    });
}
function hugLine(n) { return $('hugL' + n); }

function favSequence()    { stagger(['favL1', 'favL2', 'favL3'], 300, 1300); }
function thereSequence()  { stagger(['thereL1', 'thereL2', 'thereL3'], 400, 1200); }
function wishLines()      { stagger(['wishL1', 'wishL2', 'wishL3', 'wishL4'], 350, 1200); }
function celebrateSequence() { stagger(['celL1', 'celL2', 'celL3'], 400, 1000); }
function reasonSequence()  { stagger(['reason1', 'reason2', 'reason3'], 350, 900); }

/* ------------------------------------------------------------------
   PAGE 14 · MY LETTER TO HIM (typewriter, tap to skip)
   ------------------------------------------------------------------ */
const LETTER_LINES = [
    'Aaj se kuch saal pehle mujhe nahi pata tha,',
    'ki koi itna khaas ho sakta hai.',
    'Tum aaye — aur meri har cheez badal gayi.',
    '',
    'Holi ke rang, chai ki khushbu, lambi baatein —',
    'sab kuch tumhare saath hi aurat hua.',
    '',
    'Tumse baat karna meri favourite aadat hai,',
    'tumhare bina ghanton nikalna meri sabse badi musibat,',
    'aur tumhari har chhoti si baat par hasna —',
    'yeh meri zindagi ke sabse pyaare lamhe hain.',
    '',
    'Tum mujhe itni aadat nahi lagte,',
    'tum mujhe zaroorat lagte ho.',
    '',
    'Kabhi kabhi main sochti hoon —',
    'agar duniya mein sirf ek cheez meri ho sake,',
    'toh woh hamesha tumhari hui rahegi.',
    '',
    'Aaj tera din hai, aur meri dua hai —',
    'ki tera har sapna poora ho,',
    'teri har mehnat ka sahi phal mile,',
    'tera dil hamesha sukoon se bhara rahe,',
    'aur teri zindagi mein utna hi pyaar mile',
    'jitna main tumhe deti hoon.',
    '',
    'Tum mujhe itni acchi tarah pasand ho,',
    'ki mujhe tumse shikayat bhi nahi hai.',
    '',
    'Happy Birthday, meri jaan. \u2764\uFE0F',
    '— Tumhari Bubu \u{1F495}'
];

let letterRunning = false;

function typeLetter() {
    clearTimers(letterTimer);
    letterRunning = false;
    const body = $('letterBody');
    if (!body) return;
    body.innerHTML = '';
    document.querySelectorAll('.letter-heart').forEach(h => h.remove());

    const nodes = LETTER_LINES.map(text => {
        const p = document.createElement('p');
        p.className = 'type-line';
        body.appendChild(p);
        return { p, text };
    });

    const heart = document.createElement('div');
    heart.className = 'letter-heart';
    heart.textContent = '\u2764\uFE0F';

    function finish() {
        if (!letterRunning) return;
        letterRunning = false;
        nodes.forEach(({ p, text }) => {
            p.classList.remove('type-caret');
            p.textContent = text;
        });
        body.appendChild(heart);
        letterTimer.push(setTimeout(() => heart.classList.add('show'), 60));
    }

    let li = 0;
    function typeLine() {
        if (li >= nodes.length) { finish(); return; }
        const { p, text } = nodes[li];
        if (!text) { p.innerHTML = '&nbsp;'; li++; letterTimer.push(setTimeout(typeLine, 120)); return; }

        p.classList.add('type-caret');
        let ci = 0;
        const charT = setInterval(() => {
            ci++;
            p.textContent = text.slice(0, ci);
            if (ci >= text.length) {
                clearInterval(charT);
                p.classList.remove('type-caret');
                li++;
                letterTimer.push(setTimeout(typeLine, 230));
            }
        }, 18);
        letterTimer.push(charT);
    }

    letterRunning = true;
    letterTimer.push(setTimeout(typeLine, 250));
}

function skipLetter() {
    if (letterRunning) finish();
}

const letterCard = $('letterCard');
if (letterCard) letterCard.addEventListener('click', skipLetter);

/* ------------------------------------------------------------------
   PAGE 11 · OUR MOMENTS
   Pehle assets/moments/moment1.jpg… — agar wahan kuch nahi to
   assets/photos/photo1.webp… se utha leti hai (wahi pics, bina copy).
   ------------------------------------------------------------------ */
const MOMENT_CAPTIONS = [
    'Yeh din humara hai',
    'Phir se yahan aana hai',
    'Bas tum aur main',
    'Aisi hi khoobsurat yaadein',
    'Aur bhi bahut hain...'
];

async function findMoments() {
    if (photoCache) return photoCache;
    const found = [];
    for (let i = 1; i <= 14; i++) {
        const own = await firstExisting(`assets/moments/moment${i}`, PHOTO_EXTS);
        if (own) { found.push(own); continue; }
        const shared = await firstExisting(`assets/images/${i}`, PHOTO_EXTS);
        if (shared) { found.push(shared); continue; }
        const sharedImg = await firstExisting(`assets/images/photo${i}`, PHOTO_EXTS);
        if (sharedImg) { found.push(sharedImg); continue; }
        const shared2 = await firstExisting(`assets/photos/photo${i}`, PHOTO_EXTS);
        if (!shared2) break;
        found.push(shared2);
    }
    photoCache = found;
    return found;
}

async function initMoments() {
    const grid = $('momentGrid');
    if (!grid || grid.childElementCount) return;
    const photos = await findMoments();

    if (photos.length === 0) {
        const ph = document.createElement('div');
        ph.className = 'photo-placeholder';
        ph.innerHTML =
            '<span class="ph-icon">\u{1F4F7}</span>' +
            '<span class="ph-text">Yahan apni photos daalo</span>' +
            '<span class="ph-hint">assets/moments/moment1.jpg &rarr; moment2.jpg &hellip;</span>' +
            '<span class="ph-hint">warna assets/photos/photo1.webp &hellip; se uth jayengi</span>' +
            '<span class="ph-hint">Aapki saari yaadein yahan dikhengi \u2764\uFE0F</span>';
        grid.appendChild(ph);
        return;
    }

    photos.forEach((src, i) => {
        const card = document.createElement('figure');
        card.className = 'polaroid';
        card.style.opacity = '0';
        card.style.transform = 'translateY(16px)';
        card.style.transition = 'opacity .7s ease, transform .7s ease';

        const img = document.createElement('img');
        img.className = 'polaroid-img';
        img.loading = 'lazy';
        img.alt = 'A memory with you';
        img.src = src;

        const cap = document.createElement('figcaption');
        cap.className = 'polaroid-caption';
        cap.textContent = MOMENT_CAPTIONS[i % MOMENT_CAPTIONS.length];

        card.appendChild(img);
        card.appendChild(cap);
        card.addEventListener('click', () => openLightbox(src, cap.textContent));
        grid.appendChild(card);

        setTimeout(() => { card.style.opacity = '1'; card.style.transform = ''; }, 120 + i * 130);
    });
}

/* ------------------------------------------------------------------
   PAGE 15 · MY KING — birthday boy photos
   ------------------------------------------------------------------ */
const KING_CAPTIONS = [
    'Yeh muskaan meri favourite hai',
    'Jis din tum mile, din ban gaya',
    'Chup hoke bhi tum cute lagte ho',
    'Tumhare saath waqt slow ho jata hai',
    'Aankhon mein khushi, hont par muskaan',
    'Aaj ka din — sirf tumhare naam',
    'Har photo mein bas tum... aur main',
    'Yehi hai mera reason \u2014 tum'
];

async function findKingPhotos() {
    if (kingCache) return kingCache;
    const found = [];
    for (let i = 1; i <= 16; i++) {
        const src = await firstExisting(`assets/images/${i}`, PHOTO_EXTS);
        if (src) { found.push(src); continue; }
        const srcImg = await firstExisting(`assets/images/photo${i}`, PHOTO_EXTS);
        if (srcImg) { found.push(srcImg); continue; }
        const src2 = await firstExisting(`assets/photos/photo${i}`, PHOTO_EXTS);
        if (!src2) break;
        found.push(src2);
    }
    kingCache = found;
    return found;
}

async function initKingGallery() {
    const grid = $('kingGrid');
    if (!grid || grid.childElementCount) return;
    const photos = await findKingPhotos();

    if (photos.length === 0) {
        const ph = document.createElement('div');
        ph.className = 'photo-placeholder';
        ph.innerHTML =
            '<span class="ph-icon">\u{1F451}</span>' +
            '<span class="ph-text">Birthday boy ki photos yahan</span>' +
            '<span class="ph-hint">assets/photos/photo1.webp &rarr; photo2.webp &hellip;</span>';
        grid.appendChild(ph);
        return;
    }

    photos.forEach((src, i) => {
        const card = document.createElement('figure');
        card.className = 'king-card';

        const img = document.createElement('img');
        img.loading = 'lazy';
        img.alt = 'Birthday boy';
        img.src = src;

        const cap = document.createElement('figcaption');
        cap.textContent = KING_CAPTIONS[i % KING_CAPTIONS.length];

        if (i === 0) {
            const crown = document.createElement('span');
            crown.className = 'king-crown';
            crown.textContent = '\u{1F451}';
            card.appendChild(crown);
        }

        card.appendChild(img);
        card.appendChild(cap);
        card.addEventListener('click', () => openLightbox(src, cap.textContent));
        grid.appendChild(card);

        setTimeout(() => card.classList.add('on'), 120 + i * 120);
    });
}

/* ------------------------------------------------------------------
   PHOTO LIGHTBOX
   ------------------------------------------------------------------ */
function openLightbox(src, caption) {
    const img = $('lightboxImg');
    const cap = $('lightboxCap');
    if (!lightbox || !img) return;
    img.src = src;
    cap.textContent = caption || '';
    lightbox.classList.add('show');
    lightbox.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('show');
    lightbox.setAttribute('aria-hidden', 'true');
}

if (lightbox) {
    lightbox.addEventListener('click', e => {
        if (e.target === lightbox || e.target.id === 'lightboxClose') closeLightbox();
    });
}
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
});

/* ------------------------------------------------------------------
   PAGE 16 · MAKE A WISH
   ------------------------------------------------------------------ */
function makeWish() {
    if (wishTriggered) return;
    wishTriggered = true;

    [1, 2, 3].forEach(n => {
        const el = $('step' + n);
        if (el) el.classList.add('on');
    });

    burst($('burstZone'));
    const glow = $('candleGlow');
    if (glow) glow.style.animationPlayState = 'running';

    const wrap = $('char-cake');
    if (wrap) wrap.classList.add('glow-pink');

    sequenceTimers.push(setTimeout(() => {
        if (currentPage === totalPages - 2) showPage(totalPages - 1);
    }, 1900));
}

function burst(zone) {
    if (!zone) return;
    const symbols = ['\u2728', '\u2726', '\u2B50', '\u2665', '\u2727', '\u2728'];
    const colors = ['#ff6b9d', '#e2b0ff', '#ffeaa7', '#7cdfb0', '#ff8fa3', '#ffffff'];
    for (let i = 0; i < 46; i++) {
        const b = document.createElement('span');
        b.className = 'burst';
        b.textContent = symbols[i % symbols.length];
        b.style.left = (5 + Math.random() * 90) + '%';
        b.style.top = (10 + Math.random() * 60) + '%';
        b.style.fontSize = (10 + Math.random() * 16) + 'px';
        b.style.color = colors[Math.floor(Math.random() * colors.length)];
        b.style.setProperty('--dx', ((Math.random() * 160) - 80).toFixed(1) + 'px');
        b.style.setProperty('--rot', ((Math.random() * 540) - 270).toFixed(0) + 'deg');
        b.style.animationDelay = (Math.random() * 0.35) + 's';
        zone.appendChild(b);
        setTimeout(() => b.remove(), 2100);
    }
}

/* ------------------------------------------------------------------
   PAGE 17 · FINAL REVEAL
   ------------------------------------------------------------------ */
function finalSequence() {
    clearTimers(sequenceTimers);
    ['finNote', 'finL1', 'finL2', 'finL3', 'finTitle'].forEach((id, i) => {
        const el = $(id);
        if (!el) return;
        el.classList.remove('on', 'show');
        sequenceTimers.push(setTimeout(() => {
            el.classList.toggle('on', id !== 'finTitle');
            el.classList.toggle('show', id === 'finTitle');
        }, 500 + i * 1100));
    });
}

/* ------------------------------------------------------------------
   FLOATERS
   ------------------------------------------------------------------ */
const FLOAT_SETS = {
    hearts:   ['\u2764\uFE0F', '\u{1F496}', '\u{1F497}', '\u2764', '\u{1F495}', '\u{1F493}'],
    stars:    ['\u2728', '\u2B50', '\u{1F4AB}', '\u{1F31F}'],
    confetti: ['\u25CF', '\u25A0', '\u2665', '\u2726', '\u2727'],
    bubbles:  ['\u25CB', '\u25CB', '\u25CB'],
    spark:    ['\u2726', '\u2728', '\u02DA', '\u2727'],
    balloons: ['\u{1F388}', '\u{1F388}', '\u{1F389}']
};

function spawnFloaters() {
    pages.forEach(page => {
        const wrappers = page.querySelectorAll('.floaters');
        wrappers.forEach(wrap => {
            const type = wrap.dataset.f;
            const set = FLOAT_SETS[type] || FLOAT_SETS.hearts;
            const count = type === 'balloons' ? 4 : 14;
            for (let i = 0; i < count; i++) {
                const s = document.createElement('span');
                s.className = 'floaty';
                if (type === 'confetti') {
                    s.textContent = set[i % set.length];
                    s.style.color = ['#ff6b9d', '#e2b0ff', '#ffeaa7', '#7cdfb0', '#ff8fa3', '#a29bfe'][i % 6];
                    s.style.fontSize = (7 + Math.random() * 9) + 'px';
                } else if (type === 'bubbles') {
                    s.style.width = (8 + Math.random() * 16) + 'px';
                    s.style.height = s.style.width;
                    s.style.border = '2px solid rgba(255,107,157,.45)';
                    s.style.borderRadius = '50%';
                    s.style.background = 'rgba(255,255,255,.35)';
                } else {
                    s.textContent = set[Math.floor(Math.random() * set.length)];
                    s.style.fontSize = (9 + Math.random() * 13) + 'px';
                    if (type === 'stars') s.style.textShadow = '0 0 18px rgba(255,255,255,.9)';
                }
                s.style.left = (Math.random() * 100) + '%';
                s.style.animationDuration = (7 + Math.random() * 8) + 's';
                s.style.animationDelay = (Math.random() * 9) + 's';
                s.style.opacity = (0.5 + Math.random() * 0.4).toFixed(2);
                wrap.appendChild(s);
            }
        });
    });
}

/* ------------------------------------------------------------------
   KEYBOARD + SWIPE + SCROLL GUARD
   ------------------------------------------------------------------ */
const SCROLLERS = '.album-grid, .king-grid';
function insideScroller(target) {
    return !!(target && target.closest && target.closest(SCROLLERS));
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeLightbox(); return; }
    if (lightbox && lightbox.classList.contains('show')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextBtn.click(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); backBtn.click(); }
});

let touchX = 0, touchY = 0, touchScroll = false;
document.addEventListener('touchstart', e => {
    touchX = e.changedTouches[0].screenX;
    touchY = e.changedTouches[0].screenY;
    touchScroll = insideScroller(e.target);
}, { passive: true });

document.addEventListener('touchend', e => {
    if (touchScroll) return;
    const dx = e.changedTouches[0].screenX - touchX;
    const dy = e.changedTouches[0].screenY - touchY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 55) {
        dx < 0 ? nextBtn.click() : backBtn.click();
    }
}, { passive: true });

document.addEventListener('touchmove', e => {
    if (!insideScroller(e.target)) e.preventDefault();
}, { passive: false });
document.addEventListener('wheel', e => {
    if (!insideScroller(e.target)) e.preventDefault();
}, { passive: false });

/* ------------------------------------------------------------------
   INIT
   ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
    // preload only first page chars to avoid heavy loading
    loadPageChars(0);
    spawnFloaters();
    updateUI();
    loadScenePhoto(0);

    /* mp3 agar maujood hai to wo, warna built-in soft melody */
    probeFile('assets/music/birthday.mp3', 'audio').then(ok => {
        mp3Ok = ok;
        musicBtn.title = ok ? 'Background music' : 'Built-in soft melody';
        if (!ok) musicBtn.classList.add('no');
    });
});