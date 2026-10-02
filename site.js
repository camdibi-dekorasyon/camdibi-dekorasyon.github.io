/* Çamdibi Dekorasyon — sayfa etkileşimleri */
(function () {
  // WhatsApp numaraları (ülke kodu ile, boşluksuz)
  const WHATSAPP = '905396443468';   // Tahsin Çamdibi — yüzen buton
  // const WHATSAPP_YASIN = '905399734413';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  $('#yr').textContent = new Date().getFullYear();

  // Menü
  const nav = $('#nav'), links = $('#navLinks'), burger = $('#burger');
  const onScroll = () => {
    nav.classList.toggle('scrolled', scrollY > 40);
    $('#waFloat').style.opacity = scrollY > innerHeight * .6 ? 1 : 0;
    $('#waFloat').style.pointerEvents = scrollY > innerHeight * .6 ? 'auto' : 'none';
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  burger.addEventListener('click', () => links.classList.toggle('open'));
  $$('a', links).forEach(a => a.addEventListener('click', () => links.classList.remove('open')));

  // Işık stüdyosu
  $$('#swatches .sw').forEach(b => b.addEventListener('click', () => {
    $$('#swatches .sw').forEach(x => x.classList.remove('active')); b.classList.add('active');
    window.Room3D && Room3D.setLed(b.dataset.color);
  }));
  const toggle = (id, fn) => { const b = $(id); b.addEventListener('click', () => { b.classList.toggle('on'); fn(b.classList.contains('on')); }); };
  toggle('#tglNight', on => window.Room3D && Room3D.setNight(on));
  toggle('#tglRotate', on => window.Room3D && Room3D.setRotate(on));
  toggle('#tglHot', on => $('#hotspots').classList.toggle('off', !on));

  // Görünce beliren bloklar
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
  $$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 3) * 90 + 'ms'; io.observe(el); });

  // 3D eğim (kartlar ve galeri)
  if (matchMedia('(hover: hover)').matches) {
    $$('.tilt').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.transform = `rotateX(${(.5 - y) * 10}deg) rotateY(${(x - .5) * 12}deg) translateZ(0)`;
        el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  // Video önizleme
  $$('.g-item--video video').forEach(v => {
    const it = v.closest('.g-item');
    it.addEventListener('mouseenter', () => v.play().catch(() => {}));
    it.addEventListener('mouseleave', () => v.pause());
  });

  // Reklam filmi: görününce sessiz oynat, butonla ses aç
  const pv = $('#promoVideo'), ps = $('#promoSound');
  if (pv) {
    new IntersectionObserver(([e]) => { e.isIntersecting ? pv.play().catch(() => {}) : pv.pause(); }, { threshold: .4 }).observe(pv);
    ps.addEventListener('click', () => {
      pv.muted = !pv.muted; if (!pv.muted) { pv.currentTime = 0; pv.play().catch(() => {}); }
      ps.textContent = pv.muted ? '🔇 Sesi aç' : '🔊 Sesi kapat';
    });
  }

  // Lightbox
  const lb = $('#lb'), stage = $('#lbStage'), cap = $('#lbCap');
  const close = () => { lb.hidden = true; stage.innerHTML = ''; document.body.style.overflow = ''; };
  $$('.g-item').forEach(it => it.addEventListener('click', () => {
    stage.innerHTML = it.dataset.video
      ? `<video src="${it.dataset.video}" controls autoplay playsinline></video>`
      : `<img src="${it.dataset.full}" alt="">`;
    cap.textContent = it.dataset.cap || '';
    lb.hidden = false; document.body.style.overflow = 'hidden';
  }));
  $('#lbX').addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) close(); });

  // WhatsApp
  const waLink = (msg, num = WHATSAPP) => `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  const waF = $('#waFloat');
  waF.href = waLink('Merhaba Çamdibi Dekorasyon, bilgi almak istiyorum.');
  waF.target = '_blank'; waF.rel = 'noopener';
  $('#form').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const msg = `Merhaba Çamdibi Dekorasyon,\nAd: ${f.get('ad')}\nHizmet: ${f.get('hizmet')}\nAdres: ${f.get('adres') || '-'}\n${f.get('mesaj') || ''}`;
    window.open(waLink(msg, f.get('kime') || WHATSAPP), '_blank');
    $('#formNote').textContent = 'WhatsApp açılıyor…';
  });
})();
