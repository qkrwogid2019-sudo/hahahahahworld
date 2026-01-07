/* =========================
   DOM
========================= */
const emotions = document.querySelectorAll('.emotion');
const speech = document.getElementById('speech');
const speechText = document.getElementById('speechText');
const overflowFill = document.getElementById('overflowFill'); // HAPPY
const stabilityFill = document.getElementById('stabilityFill'); // SADNESS
const input = document.getElementById('chatInput');
const effectLayer = document.getElementById('effectLayer');

const emotionSound = document.getElementById('emotionSound');
const coinSound = document.getElementById('coinSound');
const coinRejectSound = document.getElementById('coinRejectSound');

/* =========================
   CONSTANTS
========================= */
const REFUSAL_THRESHOLD = 100;

/* =========================
   STATE
========================= */
let happy = 0;
let sadness = 0;
let isThinking = false;
let shuffleTimer = null;
let typingTimer = null;
let audioUnlocked = false;

/* =========================
   EMOTION ASSETS
========================= */
const negativeEmotions = [
  'img/angry_01.png','img/angry_02.png','img/angry_03.png','img/angry_04.png'
];
const positiveEmotions = [
  'img/love_01.png','img/love_02.png','img/love_03.png','img/love_04.png'
];

/* =========================
   WORDS
========================= */
const positiveWords = [
  '좋아','사랑','사랑해','보고싶어','안아','뽀뽀','키스',
  '행복','기뻐','설레','고마워','괜찮아','잘했어'
];
const negativeWords = [
  '힘들어','우울','불안','짜증','화나','외로워',
  '아파','지쳐','무서워','미워','포기'
];

/* =========================
   TEXT
========================= */
const thinkingTexts = ['하… 잠깐.'];
const refusalTexts = ['그만.', '말 안 해.'];

/* =========================
   ANALYZE
========================= */
function analyze(text) {
  let p = 0, n = 0;
  positiveWords.forEach(w => text.includes(w) && p++);
  negativeWords.forEach(w => text.includes(w) && n++);
  return { p, n };
}

/* =========================
   AUDIO UNLOCK
========================= */
function unlockAudio() {
  if (audioUnlocked) return;
  [emotionSound, coinSound, coinRejectSound].forEach(a => {
    a?.play().then(() => {
      a.pause();
      a.currentTime = 0;
    }).catch(()=>{});
  });
  audioUnlocked = true;
}

/* =========================
   EFFECTS
========================= */
function showHappyEffect() {
  const el = document.createElement('div');
  el.className = 'happy-effect';
  el.innerText = '+1 HAPPY';
  effectLayer.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

/* =========================
   EMOTION SHUFFLE
========================= */
function chararararak(finalGroup, interval = 100, loops = 2) {
  clearInterval(shuffleTimer);

  const all = [...emotions];
  let index = 0;
  let count = 0;
  const total = all.length * loops;

  shuffleTimer = setInterval(() => {
    all.forEach(e => e.classList.remove('active'));
    all[index % all.length].classList.add('active');

    index++;
    count++;

    if (count >= total) {
      clearInterval(shuffleTimer);
      setFinalEmotion(finalGroup); // 🔥 여기서만 고정
    }
  }, interval);
}
function setFinalEmotion(group) {
  emotions.forEach(e => e.classList.remove('active'));

  const candidates = [...emotions].filter(e =>
    group.includes(e.getAttribute('src'))
  );

  if (!candidates.length) return;

  candidates[Math.floor(Math.random() * candidates.length)]
    .classList.add('active');
}
/* =========================
   TYPE TEXT
========================= */
function typeText(text, speed = 45) {
  clearInterval(typingTimer);
  speechText.innerText = '';
  let i = 0;
  typingTimer = setInterval(() => {
    speechText.innerText += text[i++] ?? '';
    if (i >= text.length) clearInterval(typingTimer);
  }, speed);
}

/* =========================
   LOCAL RESPOND
========================= */
function localRespond(text) {
  const { p, n } = analyze(text);

  if (p > 0) {
    // 💖 사용자가 기쁨 → 쀼는 화냄
    happy = Math.min(100, happy + p * 10);
    showHappyEffect();
    chararararak(negativeEmotions); // 😡
  }

  if (n > 0) {
    // 💔 사용자가 슬픔 → 쀼는 웃음
    sadness = Math.min(100, sadness + n * 10);
    chararararak(positiveEmotions); // 😊
  }

  overflowFill.style.width = happy + '%';
  stabilityFill.style.width = sadness + '%';

  speech.classList.add('shaking');
  typeText(thinkingTexts[0], 35);
}

/* =========================
   API RESPOND
========================= */
async function apiRespond(text) {
  if (isThinking) return;
  isThinking = true;

  localRespond(text);

  if (happy >= REFUSAL_THRESHOLD) {
    setTimeout(() => {
      coinRejectSound.play();
      speech.classList.remove('shaking');
      typeText(refusalTexts[Math.floor(Math.random()*refusalTexts.length)]);
      isThinking = false;
    }, 600);
    return;
  }

  try {
    const res = await fetch('/api/respond', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    setTimeout(() => {
      speech.classList.remove('shaking');
      typeText(data.reply || '…');
      isThinking = false;
    }, 800);
  } catch {
    typeText('말 안 해.');
    isThinking = false;
  }
}

/* =========================
   INPUT
========================= */
input.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    unlockAudio();
    if (!input.value.trim() || isThinking) return;
    coinSound.play();
    apiRespond(input.value.trim());
    input.value = '';
  }
});
