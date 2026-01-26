// ====== IMPORTANT: You will paste your Apps Script URL here later ======
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwnpUkYrIOTr9Qhl0VSntsOjr_0OwwbUKrmux7eass5yT55GZaoMY_MWm6mV0qLokwf/exec";

const overlay = document.getElementById("envelopeOverlay");
const openBtn = document.getElementById("openBtn");
const mainContent = document.getElementById("mainContent");

// RSVP UI
const btnHadir = document.getElementById("btnHadir");
const btnTidak = document.getElementById("btnTidak");
const rsvpForm = document.getElementById("rsvpForm");
const rsvpMsg = document.getElementById("rsvpMsg");
const rsvpTidakMsg = document.getElementById("rsvpTidakMsg");
const rsvpSubmitBtn = document.getElementById("rsvpSubmitBtn");


let rsvpStatus = null;

openBtn.addEventListener("click", () => {
  overlay.classList.add("opening");
  document.getElementById("glitterCanvas").style.display = "block";


  setTimeout(() => {
    overlay.classList.add("gone");   // ✅ add this
    mainContent.classList.remove("hidden");
    initReveal();
  }, 650); // match the CSS transition (650ms)
});

const bgMusic = document.getElementById("bgMusic");
const musicBtn = document.getElementById("musicBtn");

const ICON_SOUND_ON = `
<svg viewBox="0 0 24 24" aria-hidden="true">
  <path d="M3 10v4h4l5 4V6L7 10H3zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
</svg>
`;

const ICON_SOUND_OFF = `
<svg viewBox="0 0 24 24" aria-hidden="true">
  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zM19 12c0 .94-.2 1.82-.56 2.62l1.51 1.51C20.63 14.95 21 13.52 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v4h4l5 4v-6.73l4.25 4.25c-.68.53-1.47.93-2.25 1.19v2.06c1.33-.3 2.56-.92 3.59-1.77L19.73 21 21 19.73 4.27 3zM12 6l-1.59 1.27L12 8.86V6z"/>
</svg>
`;

function setMusicUI(isPlaying){
  musicBtn.classList.toggle("is-playing", isPlaying);
  musicBtn.innerHTML = isPlaying ? ICON_SOUND_ON : ICON_SOUND_OFF;
}

function getSavedMusicPref(){
  // default: music ON
  const v = localStorage.getItem("invite_music_on");
  return v === null ? true : v === "true";
}

function saveMusicPref(isOn){
  localStorage.setItem("invite_music_on", String(isOn));
}

// Initial UI
setMusicUI(getSavedMusicPref());

// Start music after user opens invitation
async function tryStartMusic(){
  const wantOn = getSavedMusicPref();
  if(!wantOn) {
    bgMusic.pause();
    bgMusic.muted = true;
    setMusicUI(false);
    return;
  }

  try{
    bgMusic.muted = false;
    bgMusic.volume = 0.6;
    await bgMusic.play();
    setMusicUI(true);
  }catch(err){
    // If play fails, keep it off visually
    console.warn("Music play blocked:", err);
    setMusicUI(false);
  }
}

// When user taps the seal (your existing openBtn)
openBtn.addEventListener("click", () => {
  // your existing logic...
  // after opening, start music:
  tryStartMusic();
});

// Toggle button
musicBtn.addEventListener("click", async () => {
  const isPlaying = !bgMusic.paused && !bgMusic.muted;

  if(isPlaying){
    bgMusic.pause();
    bgMusic.muted = true;
    saveMusicPref(false);
    setMusicUI(false);
  }else{
    saveMusicPref(true);
    try{
      bgMusic.muted = false;
      bgMusic.volume = 0.6;
      await bgMusic.play();
      setMusicUI(true);
    }catch(err){
      console.warn("Music play blocked:", err);
      setMusicUI(false);
    }
  }
});



// Reveal on scroll (nice premium feel)
function initReveal(){
  const items = document.querySelectorAll(".fade-in");
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting) e.target.classList.add("visible");
    });
  }, { threshold: 0.12 });

  items.forEach(i => obs.observe(i));
}

// ===== RSVP buttons behavior =====
btnHadir.addEventListener("click", () => {
  rsvpStatus = "Hadir";

  // show form, hide "tidak hadir" msg
  rsvpForm.classList.remove("hidden");
  rsvpTidakMsg.classList.add("hidden");

  // active pill styling
  btnHadir.classList.add("pill-active");
  btnTidak.classList.remove("pill-active");
});


btnTidak.addEventListener("click", async () => {
  rsvpStatus = "Tidak Hadir";

  // hide form, show message
  rsvpForm.classList.add("hidden");
  rsvpTidakMsg.classList.remove("hidden");

  // active pill styling
  btnTidak.classList.add("pill-active");
  btnHadir.classList.remove("pill-active");

  // send "Tidak Hadir"
  try{
    await postJSON({ action:"rsvp", status:"Tidak Hadir", name:"", hp:"" });
  }catch(err){
    console.warn(err);
  }
});


// ===== RSVP form submit =====
rsvpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  rsvpMsg.textContent = "";

  const fd = new FormData(rsvpForm);
  const name = (fd.get("name") || "").toString().trim();
  const hp = (fd.get("hp") || "").toString().trim();

  if(!name){
    rsvpMsg.textContent = "Sila isi nama.";
    return;
  }

  // loading state
  rsvpSubmitBtn.disabled = true;
  rsvpSubmitBtn.textContent = "Menghantar...";

  try{
    await postJSON({ action:"rsvp", status:"Hadir", name, hp });
    rsvpMsg.textContent = "Terima kasih atas pengesahan. Jumpa anda di majlis nanti, insya-Allah.";
    rsvpForm.reset();
  }catch(err){
    rsvpMsg.textContent = "Maaf, terdapat masalah. Cuba lagi.";
    console.error(err);
  }finally{
    rsvpSubmitBtn.disabled = false;
    rsvpSubmitBtn.textContent = "Hantar";
  }
});


// ===== Guestbook =====
const guestForm = document.getElementById("guestForm");
const guestMsg = document.getElementById("guestMsg");
const guestList = document.getElementById("guestList");

const guestReloadBtn = document.getElementById("guestReloadBtn");
const guestCount = document.getElementById("guestCount");
const guestSubmitBtn = document.getElementById("guestSubmitBtn");

if(guestReloadBtn){
  guestReloadBtn.addEventListener("click", () => loadGuestbook(true));
}

guestForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  guestMsg.textContent = "";

  const fd = new FormData(guestForm);
  const name = (fd.get("name") || "").toString().trim();
  const message = (fd.get("message") || "").toString().trim();
  const hp = (fd.get("hp") || "").toString().trim();

  if(!name || !message){
    guestMsg.textContent = "Sila isi nama dan ucapan.";
    return;
  }

  guestSubmitBtn.disabled = true;
  guestSubmitBtn.textContent = "Menghantar...";

  try{
    await postJSON({ action:"guestbook", name, message, hp });
    guestMsg.textContent = "Ucapan diterima. Akan dipaparkan selepas semakan.";
    guestForm.reset();

    // optional: reload list (won't show the new one until approved, but keeps fresh)
    loadGuestbook(true);
  }catch(err){
    guestMsg.textContent = "Maaf, terdapat masalah. Cuba lagi.";
    console.error(err);
  }finally{
    guestSubmitBtn.disabled = false;
    guestSubmitBtn.textContent = "Hantar Ucapan";
  }
});


// Load approved guestbook messages
function formatMYDate(iso){
  if(!iso) return "";
  const d = new Date(iso);
  // Malaysia style: 25 Apr 2026
  return d.toLocaleDateString("ms-MY", { day:"2-digit", month:"short", year:"numeric" });
}

async function loadGuestbook(force=false){
  // if not connected, show message
  if(APPS_SCRIPT_URL.includes("script.google.com") === false){
    guestList.innerHTML = `<div class="subtle center">Guestbook belum disambungkan (Apps Script URL belum diisi).</div>`;
    if(guestCount) guestCount.textContent = "";
    return;
  }

  // show loading on refresh
  if(force){
    guestList.innerHTML = `<div class="subtle center">Memuatkan ucapan...</div>`;
    if(guestCount) guestCount.textContent = "";
  }

  try{
    const res = await fetch(`${APPS_SCRIPT_URL}?action=guestbook_list`, { method:"GET" });
    const data = await res.json();

    if(!Array.isArray(data) || data.length === 0){
      guestList.innerHTML = `<div class="subtle center">Belum ada ucapan yang disahkan.</div>`;
      if(guestCount) guestCount.textContent = "";
      return;
    }

    if(guestCount) guestCount.textContent = `${data.length} ucapan disahkan`;

    guestList.innerHTML = data.map(item => `
      <div class="guest-item">
        <div class="guest-top">
          <div class="guest-name">${escapeHTML(item.name || "")}</div>
          <div class="guest-date">${escapeHTML(formatMYDate(item.timestamp))}</div>
        </div>
        <div class="guest-msg">${escapeHTML(item.message || "")}</div>
      </div>
    `).join("");
  }catch(err){
    guestList.innerHTML = `<div class="subtle center">Tidak dapat memuatkan ucapan.</div>`;
    if(guestCount) guestCount.textContent = "";
    console.error(err);
  }
}



function escapeHTML(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// POST helper
async function postJSON(payload){
  if (payload.hp && payload.hp.length > 0) return;

  if (APPS_SCRIPT_URL.includes("PASTE_YOUR_SCRIPT_URL_HERE")) {
    throw new Error("Apps Script URL not set");
  }

  payload.userAgent = navigator.userAgent;

  // no-cors: request will go through, but you can't read response
  await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(payload),
  });

  // We assume success if no network error thrown
}

// On page load (after envelope opens, guestbook will load once visible)
// But we can start preloading too:
loadGuestbook();

// ===== Glitter Falling Animation =====
(() => {
  const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduce) return;

  const canvas = document.getElementById("glitterCanvas");
  if(!canvas) return;

  const ctx = canvas.getContext("2d");

  let W = 0, H = 0, DPR = 1;

  function resize(){
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.floor(window.innerWidth);
    H = Math.floor(window.innerHeight);
    canvas.width  = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  window.addEventListener("resize", resize);
  resize();

  // soft gold glitter
  const gold = [
    "rgba(176,140,78,0.95)",
    "rgba(210,175,110,0.85)",
    "rgba(235,210,160,0.75)",
    "rgba(176,140,78,0.65)"
  ];

  const particles = [];
  const MAX = 90;          // more = more glitter
  const SPAWN_RATE = 2.0;  // more = faster spawn

  const rand = (a,b) => Math.random()*(b-a)+a;

  function spawn(n=1){
    for(let i=0;i<n;i++){
      const r = rand(2.0, 4.5);
      particles.push({
        x: rand(0, W),
        y: rand(-60, -10),
        r,
        vy: rand(0.7, 1.9),
        vx: rand(-0.35, 0.35),
        rot: rand(0, Math.PI*2),
        vr: rand(-0.04, 0.04),
        alpha: rand(0.55, 0.95),
        c: gold[Math.floor(Math.random()*gold.length)],
        tw: rand(0.8, 1.6),
        tws: rand(0.01, 0.03)
      });
    }
  }

  let last = 0;

  function loop(ts){
    const dt = Math.min((ts - last) / 16.67, 2);
    last = ts;

    if(particles.length < MAX){
      spawn(Math.ceil(SPAWN_RATE * dt));
    }

    ctx.clearRect(0,0,W,H);

    for(let i=particles.length-1; i>=0; i--){
      const p = particles[i];

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;

      // twinkle
      p.tw += p.tws * dt;
      const twinkle = 0.6 + 0.4 * Math.sin(p.tw * Math.PI * 2);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);

      // diamond sparkle
      ctx.globalAlpha = p.alpha * twinkle;
      ctx.fillStyle = p.c;

      ctx.beginPath();
      ctx.moveTo(0, -p.r);
      ctx.lineTo(p.r, 0);
      ctx.lineTo(0, p.r);
      ctx.lineTo(-p.r, 0);
      ctx.closePath();
      ctx.fill();

      // subtle glow
      ctx.globalAlpha = p.alpha * 0.16;
      ctx.beginPath();
      ctx.arc(0, 0, p.r*2.2, 0, Math.PI*2);
      ctx.fill();

      ctx.restore();

      // recycle
      if(p.y > H + 60){
        particles.splice(i, 1);
      }
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();

