(function(){
  'use strict';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);

  /* ============ نجوم خلفية ============ */
  function buildStars(container, count){
    if(!container) return;
    const frag = document.createDocumentFragment();
    const total = prefersReduced ? Math.min(count, 30) : count;
    for(let i=0;i<total;i++){
      const s = document.createElement('i');
      s.style.left = Math.random()*100 + '%';
      s.style.top = Math.random()*100 + '%';
      if(!prefersReduced){
        s.style.animationDelay = (Math.random()*4) + 's';
        s.style.animationDuration = (2.5 + Math.random()*3) + 's';
      }
      frag.appendChild(s);
    }
    container.appendChild(frag);
  }
  buildStars($('#introStars'), 80);
  buildStars($('#heroSky'), 60);
  buildStars($('#sky'), 130);

  /* ============ فتح الهدية ============ */
  const intro = $('#intro');
  const experience = $('#experience');
  const openGiftBtn = $('#openGift');

  openGiftBtn.addEventListener('click', () => {
    intro.classList.add('is-leaving');
    setTimeout(() => {
      experience.hidden = false;
      window.scrollTo({top:0, behavior:'auto'});
    }, 400);
    setTimeout(() => { intro.style.display = 'none'; }, 700);
    setTimeout(startAmbientHearts, 1200);
  });

  /* ============ الرسالة ============ */
  const envelope = $('#envelope');
  const letterCard = $('#letterCard');
  const letterText = $('#letterText');

  const LETTER_TEXT =
`إلى هديل...

ربما لا تستطيع الكلمات وصف كل المشاعر،
لكن هذه الهدية الصغيرة صُنعت خصيصاً لكِ.

أردت أن أجعل لكِ مساحةً جميلة
تحمل اسماً واحداً فقط... هديل.

أتمنى أن ترسم هذه المفاجأة
ابتسامةً على وجهكِ.

أنتِ شخصٌ مميز،
وتستحقين كل الأشياء الجميلة.`;

  let letterOpened = false;

  function typeLetter(text, el, speed){
    if(!el) return;
    el.textContent = '';
    el.classList.add('is-typing');
    if(prefersReduced){
      el.textContent = text;
      el.classList.remove('is-typing');
      return;
    }
    let i = 0;
    function step(){
      if(i >= text.length){
        el.classList.remove('is-typing');
        return;
      }
      const ch = text[i];
      el.textContent += ch;
      i++;
      let delay = speed;
      if(ch === '.' || ch === '،' || ch === '؟' || ch === '!') delay = speed * 6;
      else if(ch === '\n') delay = speed * 8;
      setTimeout(step, delay);
    }
    step();
  }

  envelope.addEventListener('click', () => {
    if(letterOpened) return;
    letterOpened = true;
    envelope.classList.add('is-open');
    envelope.setAttribute('aria-expanded','true');
    spawnHeartBurst(14);
    setTimeout(() => {
      letterCard.classList.add('is-visible');
      setTimeout(() => { typeLetter(LETTER_TEXT, letterText, 48); }, 350);
    }, 500);
  });
  envelope.addEventListener('keydown', e => {
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); envelope.click(); }
  });

  /* ============ الوردة ============ */
  const rose = $('.rose');
  const roseStage = $('#roseStage');
  if(rose && roseStage && 'IntersectionObserver' in window){
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if(en.isIntersecting){
          rose.classList.add('is-blooming');
          io.disconnect();
        }
      });
    }, {threshold: .3});
    io.observe(roseStage);
  } else if(rose){
    rose.classList.add('is-blooming');
  }

  /* ============ الرسالة المخفية ============ */
  const secretBtn = $('#secretBtn');
  const secretMsg = $('#secretMessage');
  secretBtn.addEventListener('click', () => {
    const v = secretMsg.classList.toggle('is-visible');
    secretBtn.setAttribute('aria-expanded', v ? 'true' : 'false');
    secretBtn.textContent = v ? 'أغلقي' : 'اضغطيني';
    if(v) spawnHeartBurst(6);
  });

  /* ============ القلوب الطائرة ============ */
  const heartsLayer = $('#heartsLayer');
  const HEART_CHARS = ['❤','♡','❥','♥'];

  function spawnFloatingHeart(){
    if(!heartsLayer || prefersReduced) return;
    const h = document.createElement('span');
    h.className = 'floating-heart';
    h.textContent = HEART_CHARS[Math.floor(Math.random()*HEART_CHARS.length)];
    const size = 12 + Math.random()*22;
    const duration = 8 + Math.random()*8;
    h.style.left = (Math.random()*100) + 'vw';
    h.style.bottom = '-40px';
    h.style.fontSize = size + 'px';
    h.style.color = Math.random() > .5 ? '#E6395B' : '#D4AF37';
    h.style.animationDuration = duration + 's';
    h.style.animationDelay = (Math.random()*.5) + 's';
    heartsLayer.appendChild(h);
    setTimeout(() => h.remove(), (duration + 1) * 1000);
  }
  function spawnHeartBurst(count){
    if(!heartsLayer) return;
    for(let i=0;i<count;i++) setTimeout(spawnFloatingHeart, i*80);
  }
  let heartsInterval = null;
  function startAmbientHearts(){
    if(prefersReduced || heartsInterval) return;
    heartsInterval = setInterval(spawnFloatingHeart, 1800);
  }
  document.addEventListener('visibilitychange', () => {
    if(document.hidden){
      if(heartsInterval){ clearInterval(heartsInterval); heartsInterval = null; }
    } else if(!experience.hidden){
      startAmbientHearts();
    }
  });

  /* ============ الموسيقى ============ */
  const audioBtn = $('#audioBtn');
  let audioCtx = null, masterGain = null, audioNodes = [], audioPlaying = false;
  const CHORDS = [
    [261.63, 329.63, 392.00],
    [220.00, 261.63, 329.63],
    [174.61, 220.00, 261.63],
    [196.00, 246.94, 293.66]
  ];

  function initAudio(){
    if(audioCtx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(audioCtx.destination);
  }
  function playChord(freqs, start, dur){
    const ctx = audioCtx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(.18, start + 1.2);
    g.gain.linearRampToValueAtTime(.14, start + dur - .5);
    g.gain.linearRampToValueAtTime(0, start + dur);
    g.connect(masterGain);
    freqs.forEach(f => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.detune.value = (Math.random() - .5) * 6;
      const og = ctx.createGain();
      og.gain.value = .4;
      o.connect(og); og.connect(g);
      o.start(start); o.stop(start + dur + .2);
      audioNodes.push(o);
    });
  }
  function scheduleProgression(){
    if(!audioCtx || !audioPlaying) return;
    let t = audioCtx.currentTime + .1;
    const d = 6;
    for(let i=0;i<CHORDS.length;i++) playChord(CHORDS[i], t + i*d, d + .5);
    setTimeout(scheduleProgression, (d * CHORDS.length - 1) * 1000);
  }
  audioBtn.addEventListener('click', async () => {
    initAudio();
    if(!audioCtx) return;
    if(audioCtx.state === 'suspended'){ try{ await audioCtx.resume(); }catch(e){} }
    if(!audioPlaying){
      audioPlaying = true;
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
      masterGain.gain.linearRampToValueAtTime(.55, audioCtx.currentTime + 1.5);
      scheduleProgression();
      audioBtn.setAttribute('aria-pressed','true');
      audioBtn.setAttribute('aria-label','إيقاف الموسيقى');
    } else {
      audioPlaying = false;
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + .8);
      audioBtn.setAttribute('aria-pressed','false');
      audioBtn.setAttribute('aria-label','تشغيل الموسيقى');
      setTimeout(() => {
        audioNodes.forEach(n => { try{ n.stop(); }catch(e){} });
        audioNodes = [];
      }, 900);
    }
  });

  /* ============ إعادة ============ */
  const replayBtn = $('#replayBtn');
  replayBtn.addEventListener('click', () => {
    letterOpened = false;
    envelope.classList.remove('is-open');
    envelope.setAttribute('aria-expanded','false');
    letterCard.classList.remove('is-visible');
    letterText.textContent = '';
    letterText.classList.remove('is-typing');
    secretMsg.classList.remove('is-visible');
    secretBtn.setAttribute('aria-expanded','false');
    secretBtn.textContent = 'اضغطيني';
    window.scrollTo({top:0, behavior:'smooth'});
    spawnHeartBurst(20);
  });
})();
