/* main.js - updated: login enforcement, artist auto-fill, stage 360 rotate, particles, print/download */

document.addEventListener('DOMContentLoaded', ()=>{

  /* ---------- Helpers ---------- */
  function qs(name, url){
    if(!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if(!results) return null;
    if(!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  function escapeHtml(s){ return (''+s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function requireLogin(next){
    const userRaw = localStorage.getItem('nf_user');
    if(!userRaw){
      // redirect to login with next param preserved
      const target = encodeURIComponent(next || window.location.pathname + window.location.search);
      window.location.href = `login.html?next=${target}`;
      return false;
    }
    return true;
  }

  /* ---------- Day toggle (lineup) ---------- */
  document.querySelectorAll('.day-toggle').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const body = btn.nextElementSibling;
      const open = body.style.display === 'block';
      document.querySelectorAll('.day-body').forEach(d=>d.style.display='none');
      body.style.display = open ? 'none' : 'block';
    });
  });

  /* ---------- artist "more" toggles ---------- */
  document.querySelectorAll('.more-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const more = btn.parentElement.querySelector('.more');
      more.style.display = more.style.display === 'block' ? 'none' : 'block';
    });
  });

  /* ---------- Stage preview interactivity (360°) ---------- */
  const stage = document.getElementById('stage');
  const stageWrap = document.getElementById('stageWrap');
  const performer = document.getElementById('performer');
  const performerImg = document.getElementById('performerImg');
  const artistSelect = document.getElementById('artistSelect');
  const rot = document.getElementById('rot');
  const tilt = document.getElementById('tilt');
  const light = document.getElementById('light');
  const freezeBtn = document.getElementById('freezeBtn');
  const bookArtistBtn = document.getElementById('bookArtistBtn');
  let frozen = false;

  const artistPhotoMap = {
    'Arijit Singh': 'https://i.scdn.co/image/ab6761610000e5eb5ba2d75eb08a2d672f9b69b7',
    'Diljit Dosanjh': 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQoL3mrq-XhFSWpYswTIjkLKhRnLm06vBB5U41sm2xJbGg2BkQH1pooxDevaSTsBRMEbvdl5SpxYim2JeM2wLvn4A8q5Zl_uINbEDpNbA',
    'Ed Sheeran': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxWHMN1jBRj6JYCqkwviOSYNZ5uv1IOoXVBA&s',
    'Justin Bieber': 'https://upload.wikimedia.org/wikipedia/commons/d/da/Justin_Bieber_in_2015.jpg',
    'KR$NA': 'https://yt3.googleusercontent.com/ytc/AIdro_n00p_ZePoxDQQ9m1fOAv5f6CPy-GyG97eU5hKHI3wX5cM=s900-c-k-c0x00ffffff-no-rj',
    'Travis Scott': 'https://media.npr.org/assets/img/2021/11/16/gettyimages-1235223332_sq-e88ad790d447bd7dfcb0c1571047db26d39a8ee0.jpg'
  };

  function setPerformerImage(name){
    if(!performerImg) return;
    const url = artistPhotoMap[name] || '';
    performerImg.src = url;
    performerImg.alt = name;
    performerImg.loading = 'lazy';
    performerImg.referrerPolicy = 'no-referrer';
    performerImg.crossOrigin = 'anonymous';
    performerImg.onerror = ()=>{
      performerImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQwIiBoZWlnaHQ9IjE0MCIgdmlld0JveD0iMCAwIDE0MCAxNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNDAiIGhlaWdodD0iMTQwIiByeD0iMTIiIGZpbGw9IiMwMDAiLz4KPHN2ZyB4PSI0OCIgeT0iNDgiIHdpZHRoPSI0NCIgaGVpZ2h0PSI0NCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjIwQzE0IDIxLjEgMTMuMSAyMiAxMiAyMkMxMC45IDIyIDEwIDIxLjEgMTAgMjBWNFMxMC45IDIgMTIgMloiIGZpbGw9IiNmZmYiLz4KPC9zdmc+Cjwvc3ZnPgo=';
    };
  }

  function updateStageTransform(xDeg, yDeg){
    // xDeg = rotateX (tilt), yDeg = rotateY (spin)
    if(!stage) return;
    stage.style.transform = `rotateX(${xDeg}deg) rotateY(${yDeg}deg) translateZ(0)`;
  }

  // Keep track of rotation values
  let rotY = rot ? parseFloat(rot.value) : 0;
  let rotX = tilt ? parseFloat(tilt.value) : -10;

  function updateStageUI(){
    if(rot) rot.value = ((rotY + 180) % 360) - 180;
    if(tilt) tilt.value = Math.max(-90, Math.min(90, rotX));
    if(light) document.querySelectorAll('.spotlight').forEach(s=>{
      s.style.opacity = (light ? light.value : 0.9);
    });
    updateStageTransform(rotX, rotY);
  }

  if(rot) rot.addEventListener('input', e=>{
    rotY = parseFloat(e.target.value);
    updateStageUI();
  });
  if(tilt) tilt.addEventListener('input', e=>{
    rotX = parseFloat(e.target.value);
    updateStageUI();
  });
  if(light) light.addEventListener('input', ()=> updateStageUI());

  if(artistSelect){
    artistSelect.addEventListener('change', e=>{
      performer.textContent = e.target.value.toUpperCase();
      setPerformerImage(e.target.value);
    });
    // initialize
    performer.textContent = artistSelect.value.toUpperCase();
    setPerformerImage(artistSelect.value);
  }

  // Pointer drag to rotate freely in both axes:
  let dragging = false, lastX=0, lastY=0;
  stageWrap && stageWrap.addEventListener('pointerdown', (ev)=>{
    if(frozen) return;
    dragging = true; lastX = ev.clientX; lastY = ev.clientY;
    stageWrap.setPointerCapture(ev.pointerId);
  });
  window.addEventListener('pointermove', (ev)=>{
    if(!dragging || frozen) return;
    const dx = ev.clientX - lastX;
    const dy = ev.clientY - lastY;
    lastX = ev.clientX; lastY = ev.clientY;
    // sensitivity
    rotY += dx * 0.35;
    rotX -= dy * 0.25;
    // clamp X to avoid flipping too far
    rotX = Math.max(-90, Math.min(90, rotX));
    updateStageUI();
  });
  window.addEventListener('pointerup', ()=>{ dragging=false; });

  freezeBtn && freezeBtn.addEventListener('click', ()=>{
    frozen = !frozen;
    freezeBtn.textContent = frozen ? 'Unfreeze Camera' : 'Freeze Camera';
  });

  // Book for this artist button: pass artist as query param and require login
  bookArtistBtn && bookArtistBtn.addEventListener('click', ()=>{
    const artist = artistSelect ? encodeURIComponent(artistSelect.value) : '';
    const href = `booking.html?artist=${artist}`;
    // require login first (preserves next)
    if(!requireLogin(href)) return;
    window.location.href = href;
  });

  updateStageUI();

  /* ---------- Scroll reveal for highlight cards ---------- */
  const srItems = document.querySelectorAll('.sr-item');
  if(srItems.length){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
    srItems.forEach(el=>io.observe(el));
  }

  /* ---------- Booking form handling ---------- */
  const bookingForm = document.getElementById('bookingForm');
  if(bookingForm){
    // Auto-fill artist from query string (from stage)
    const artistParam = qs('artist');
    if(artistParam){
      const artistSelectEl = document.getElementById('artist');
      if(artistSelectEl){
        // try to find an option matching the value
        for(const opt of artistSelectEl.options){
          if(opt.textContent.trim().toLowerCase() === artistParam.trim().toLowerCase()){
            opt.selected = true; break;
          }
        }
      }
    }

    // Ensure date cannot be in the past
    const dateInput = document.getElementById('date');
    if(dateInput){
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;
    }

    bookingForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      // require logged-in user before proceeding
      if(!requireLogin(window.location.pathname + window.location.search)) return;

      const data = {
        fullname: document.getElementById('fullname').value,
        email: document.getElementById('email').value,
        artist: document.getElementById('artist').value,
        date: document.getElementById('date').value,
        qty: document.getElementById('qty').value,
        tier: document.getElementById('tier').value,
        timestamp: Date.now()
      };
      localStorage.setItem('nf_booking', JSON.stringify(data));
      // go to confirmation
      window.location.href = 'confirmation.html';
    });
  }

  /* ---------- Login handling ---------- */
  const loginForm = document.getElementById('loginForm');
  if(loginForm){
    loginForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const pass = document.getElementById('loginPass').value;
      if(!email || !pass){ return; }
      localStorage.setItem('nf_user', JSON.stringify({ email, ts: Date.now() }));
      // after login, redirect to next if provided
      const next = qs('next');
      if(next){
        try {
          window.location.href = decodeURIComponent(next);
        } catch(_){
          window.location.href = 'index.html';
        }
      } else {
        window.location.href = 'index.html';
      }
    });
  }

  /* ---------- Nav login/logout state ---------- */
  const userRaw = localStorage.getItem('nf_user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const loginLink = Array.from(document.querySelectorAll('nav a')).find(a => a.getAttribute('href') === 'login.html');
  if(loginLink){
    if(user){
      loginLink.textContent = 'Logout';
      loginLink.setAttribute('href', '#');
      loginLink.addEventListener('click', (e)=>{
        e.preventDefault();
        localStorage.removeItem('nf_user');
        location.reload();
      });
      // subtle greeting
      loginLink.title = `Signed in as ${user.email}`;
    } else {
      loginLink.textContent = 'Login';
      loginLink.setAttribute('href', 'login.html');
    }
  }

  /* ---------- Confirmation page render + print/download ---------- */
  const confirmCard = document.getElementById('confirmCard');
  if(confirmCard){
    const raw = localStorage.getItem('nf_booking');
    if(!raw){
      confirmCard.innerHTML = `<p class="muted">No booking found. Start from the booking page.</p>
        <p><a class="btn" href="booking.html">Book now</a></p>`;
    } else {
      const data = JSON.parse(raw);
      const priceMap = { general:999, vip:2499, vvip:4999 };
      const pricePer = priceMap[data.tier] || 999;
      const total = pricePer * Number(data.qty || 1);
      confirmCard.innerHTML = `
        <div id="ticketPrintArea">
          <h3>Thanks, ${escapeHtml(data.fullname)} — your booking is confirmed (mock)</h3>
          <p><strong>Artist:</strong> ${escapeHtml(data.artist)}</p>
          <p><strong>Date:</strong> ${escapeHtml(data.date)}</p>
          <p><strong>Tickets:</strong> ${escapeHtml(data.qty)} × ₹${pricePer.toLocaleString()}</p>
          <p><strong>Total:</strong> ₹${total.toLocaleString()}</p>
          <p class="muted">A confirmation email would be sent to: ${escapeHtml(data.email)} (mock)</p>
          <small class="muted">Booking ID: RF-${String(data.timestamp).slice(-6)}</small>
        </div>
      `;
    }

    const clearBtn = document.getElementById('clear');
    clearBtn && clearBtn.addEventListener('click', ()=>{
      localStorage.removeItem('nf_booking');
      location.reload();
    });

    // Print button
    const printBtn = document.getElementById('printBtn');
    printBtn && printBtn.addEventListener('click', ()=>{
      // temporarily open a print window with the ticket area only
      const raw2 = localStorage.getItem('nf_booking');
      if(!raw2) return alert('No booking to print.');
      const data = JSON.parse(raw2);
      const priceMap = { general:999, vip:2499, vvip:4999 };
      const pricePer = priceMap[data.tier] || 999;
      const total = pricePer * Number(data.qty || 1);
      const ticketHtml = `
        <html><head><title>Ticket — RHYTHM INDIA</title>
        <style>
          body{font-family:Arial,Helvetica,sans-serif;color:#000;padding:18px}
          .ticket{border:2px dashed #333;padding:18px;border-radius:8px;max-width:520px}
          h2{margin-top:0}
        </style>
        </head><body>
        <div class="ticket">
          <h2>RHYTHM INDIA — Ticket</h2>
          <p><strong>Booking ID:</strong> RF-${String(data.timestamp).slice(-6)}</p>
          <p><strong>Name:</strong> ${escapeHtml(data.fullname)}</p>
          <p><strong>Artist:</strong> ${escapeHtml(data.artist)}</p>
          <p><strong>Date:</strong> ${escapeHtml(data.date)}</p>
          <p><strong>Tickets:</strong> ${escapeHtml(data.qty)} × ₹${pricePer.toLocaleString()}</p>
          <p><strong>Total:</strong> ₹${total.toLocaleString()}</p>
          <p style="margin-top:18px;color:#666;font-size:12px">This is a demo ticket (no real entry).</p>
        </div>
        </body></html>
      `;
      const w = window.open('', '_blank', 'noopener');
      if(!w) return alert('Pop-up blocked. Please allow pop-ups for this site to print.');
      w.document.write(ticketHtml);
      w.document.close();
      w.focus();
      setTimeout(()=>{ w.print(); }, 300);
    });

    // Download button -> text file with ticket details
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn && downloadBtn.addEventListener('click', ()=>{
      const raw2 = localStorage.getItem('nf_booking');
      if(!raw2) return alert('No booking to download.');
      const data = JSON.parse(raw2);
      const priceMap = { general:999, vip:2499, vvip:4999 };
      const pricePer = priceMap[data.tier] || 999;
      const total = pricePer * Number(data.qty || 1);
      const text = [
        'RHYTHM INDIA - TICKET (Demo)',
        `Booking ID: RF-${String(data.timestamp).slice(-6)}`,
        `Name: ${data.fullname}`,
        `Email: ${data.email}`,
        `Artist: ${data.artist}`,
        `Date: ${data.date}`,
        `Tickets: ${data.qty} × ₹${pricePer}`,
        `Total: ₹${total}`,
        '',
        'This is a demo ticket. No real entry.'
      ].join('\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RHYTHM-${String(data.timestamp).slice(-6)}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  /* ---------- Particles effect for landing page ---------- */
  (function particlesInit(){
    const canvas = document.getElementById('bgParticles');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = innerWidth;
    let H = canvas.height = innerHeight;
    const particles = [];
    const count = Math.floor((W * H) / 90000) + 25; // scale with screen

    function rand(min, max){ return Math.random() * (max - min) + min; }

    for(let i=0;i<count;i++){
      particles.push({
        x: rand(0, W),
        y: rand(0, H),
        r: rand(0.6, 2.8),
        vx: rand(-0.3, 0.3),
        vy: rand(-0.15, 0.15),
        hue: rand(180,320),
        life: rand(80, 220)
      });
    }

    function resize(){
      W = canvas.width = innerWidth;
      H = canvas.height = innerHeight;
    }
    window.addEventListener('resize', resize);

    function tick(){
      ctx.clearRect(0,0,W,H);
      for(const p of particles){
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.2;
        if(p.x < -20) p.x = W + 20;
        if(p.x > W + 20) p.x = -20;
        if(p.y < -20) p.y = H + 20;
        if(p.y > H + 20) p.y = -20;
        if(p.life <= 0){
          p.x = rand(0, W); p.y = rand(0, H); p.life = rand(80,220);
        }
        ctx.beginPath();
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r*10);
        g.addColorStop(0, `hsla(${p.hue},100%,65%,0.12)`);
        g.addColorStop(0.5, `hsla(${p.hue},80%,60%,0.06)`);
        g.addColorStop(1, `rgba(255,255,255,0)`);
        ctx.fillStyle = g;
        ctx.fillRect(p.x - p.r*4, p.y - p.r*4, p.r*8, p.r*8);
      }
      requestAnimationFrame(tick);
    }
    tick();
  })();

  /* ---------- Misc: escape console errors ---------- */
  try{ } catch(e){ console.error(e); }
});
