/* ============================================================
   1. MOTOR DE FASES Y DATOS BÁSICOS
   ============================================================ */
const SYNODIC_MONTH = 29.530588853;
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0);

function moonAge(now = Date.now()) {
  let age = ((now - REF_NEW_MOON) / 86400000) % SYNODIC_MONTH;
  if (age < 0) age += SYNODIC_MONTH;
  return age;
}
function moonPhase(now = Date.now()) { return moonAge(now) / SYNODIC_MONTH; }
function illumination(phase) { return (1 - Math.cos(2 * Math.PI * phase)) / 2 * 100; }

function phaseName(phase) {
  if (phase < 0.03125 || phase >= 0.96875) return "Luna Nueva";
  if (phase < 0.21875) return "Creciente Córnica";
  if (phase < 0.28125) return "Cuarto Creciente";
  if (phase < 0.46875) return "Gibosa Creciente";
  if (phase < 0.53125) return "Luna Llena";
  if (phase < 0.71875) return "Gibosa Menguante";
  if (phase < 0.78125) return "Cuarto Menguante";
  return "Menguante Córnica";
}
function trend(phase) { return phase < 0.5 ? "Creciente 🌒" : (phase > 0.5 ? "Menguante 🌖" : "Llena 🌕"); }

function nextPhaseInfo(phase) {
  const phases = [{name:"Luna Nueva",t:0},{name:"Cuarto Creciente",t:0.25},{name:"Luna Llena",t:0.5},{name:"Cuarto Menguante",t:0.75}];
  for (const p of phases) if (p.t > phase + 0.001) return { name: p.name, days: (p.t - phase) * SYNODIC_MONTH };
  return { name: "Luna Nueva", days: (1 - phase) * SYNODIC_MONTH };
}
function formatCountdown(days) {
  const d = Math.floor(days), h = Math.floor((days - d) * 24), m = Math.floor(((days - d) * 24 - h) * 60);
  if (d > 0) return `${d}d ${h}h ${m}m`; if (h > 0) return `${h}h ${m}m`; return `${m}m`;
}
function distanceKm(phase) { return Math.round(384400 + 25100 * Math.cos(2 * Math.PI * phase)); }

function constellationForPhase(phase) {
  const degrees = (phase * 360 + 280) % 360;
  const signs = [{name:"Capricornio ♑",min:270},{name:"Acuario ♒",min:300},{name:"Piscis ♓",min:330},{name:"Aries ♈",min:0},{name:"Tauro ♉",min:30},{name:"Géminis ♊",min:60},{name:"Cáncer ♋",min:90},{name:"Leo ♌",min:120},{name:"Virgo ♍",min:150},{name:"Libra ♎",min:180},{name:"Escorpio ♏",min:210},{name:"Sagitario ♐",min:240}];
  for (let i = signs.length - 1; i >= 0; i--) if (degrees >= signs[i].min) return signs[i].name;
  return signs[0].name;
}

function observationTip(phase) {
  if (phase < 0.03 || phase > 0.97) return "Cielo oscuro ideal para estrellas y Vía Láctea.";
  if (phase < 0.25) return "Buen momento para ver cráteres cerca del terminador.";
  if (phase < 0.5) return "Cuarto creciente: sombras largas, gran detalle lunar.";
  if (phase < 0.53) return "¡Luna llena! Perfecta para fotografía, pero poco relieve.";
  if (phase < 0.75) return "Gibosa menguante: buena para observar mares lunares.";
  if (phase < 0.78) return "Cuarto menguante: salida cerca de la medianoche.";
  return "Menguante: mejor observación antes del amanecer.";
}

function updateClock() {
  const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false };
  document.getElementById('clock').textContent = 'hora local: ' + new Date().toLocaleDateString('es-VE', opts);
}

/* ============================================================
   2. CALENDARIOS LUNARES CALCULADOS
   ============================================================ */
const HEB_MONTHS = [
  {t:"Tishrei", n:"תִּשְׁרֵי", m:"Comienzo · mes del nuevo año y las fiestas sagradas"},
  {t:"Jeshván", n:"חֶשְׁוָן", m:"Octavo mes · también llamado Marjeshván"},
  {t:"Kislev", n:"כִּסְלֵו", m:"Confianza y esperanza · mes de Janucá"},
  {t:"Tevet", n:"טֵבֵת", m:"Bueno · mes del ayuno del décimo"},
  {t:"Shevat", n:"שְׁבָט", m:"Vara · mes de los árboles (Tu BiShvat)"},
  {t:"Adar", n:"אֲדָר", m:"Gloria y fuerza · mes de la alegría (Purim)"},
  {t:"Adar II", n:"אֲדָר בֵּית", m:"Segundo Adar · en años bisiestos"},
  {t:"Nisán", n:"נִיסָן", m:"Milagro · primer mes del año religioso (Pésaj)"},
  {t:"Iyar", n:"אִיָּר", m:"Resplandor · mes de la cuenta del Omer"},
  {t:"Siván", n:"סִיוָן", m:"Estación · mes de Shavuot"},
  {t:"Tamuz", n:"תַּמּוּז", m:"Calor del verano · mes del ayuno"},
  {t:"Av", n:"אָב", m:"Padre · mes de la destrucción y la consolación"},
  {t:"Elul", n:"אֱלוּל", m:"Búsqueda · mes de preparación y arrepentimiento"}
];

const ISL_MONTHS = [
  {t:"Muharram", n:"محرم", m:"Sagrado y prohibido · primer mes del año"},
  {t:"Safar", n:"صفر", m:"El vacío · segundo mes"},
  {t:"Rabi al-Awwal", n:"ربيع الأول", m:"Primera primavera · nacimiento del Profeta"},
  {t:"Rabi al-Thani", n:"ربيع الآخر", m:"Segunda primavera"},
  {t:"Yumada al-Ula", n:"جمادى الأولى", m:"La sequía primera"},
  {t:"Yumada al-Akhira", n:"جمادى الآخرة", m:"La sequía segunda"},
  {t:"Rayab", n:"رجب", m:"El respetado · uno de los meses sagrados"},
  {t:"Shaabán", n:"شعبان", m:"La separación · mes previo al ayuno"},
  {t:"Ramadán", n:"رمضان", m:"El calor abrasador · mes del ayuno"},
  {t:"Shawwal", n:"شوال", m:"La elevación · mes de la fiesta del Eid"},
  {t:"Dhu al-Qa'da", n:"ذو القعدة", m:"El que descansa · mes de reposo"},
  {t:"Dhu al-Hiyya", n:"ذو الحجة", m:"El de la peregrinación · mes del Hajj"}
];

const HEB_EPOCH = 347995.5;
function hebElapsed(year) {
  const monthsElapsed = Math.floor((235*year - 234)/19);
  const parts = 12084 + 13753*monthsElapsed;
  let day = monthsElapsed*29 + Math.floor(parts/25920);
  if ((3*(day+1)) % 7 < 3) day++;
  const moladDay = day % 7, moladParts = parts % 25920;
  if (year % 4 === 2 || year % 4 === 1) {
    if (moladDay > 2 || (moladDay === 2 && moladParts >= 16789)) { day++; if (year % 4 === 1 && moladDay === 2 && moladParts >= 16789) day++; }
  } else {
    if (moladDay > 1 || (moladDay === 1 && moladParts >= 12316)) { day++; if (year % 4 === 0 && moladDay === 1 && moladParts >= 12316) day++; }
  }
  return day;
}
function hebYearLen(year) { return hebElapsed(year+1) - hebElapsed(year); }
function hebIsLeap(year) { return (((7*year)+1) % 19) < 7; }
function hebMonthLen(year, month) {
  const len = hebYearLen(year), leap = hebIsLeap(year);
  if (month === 1) return 30;
  if (month === 2) return (len % 65 === 30) ? 30 : 29;
  if (month === 3) return (len % 65 === 28) ? 29 : 30;
  if (month === 4) return 29;
  if (month === 5) return 30;
  if (month === 6) return leap ? 30 : 29;
  if (month === 7) return leap ? 29 : 30;
  if (month === 8) return 29;
  if (month === 9) return 30;
  if (month === 10) return 29;
  if (month === 11) return 30;
  if (month === 12) return leap ? 29 : 30;
  if (month === 13) return 29;
  return 29;
}
function jdnFromDate(d) {
  let y = d.getFullYear(), m = d.getMonth()+1, day = d.getDate();
  if (m <= 2) { y -= 1; m += 12; }
  const a = Math.floor(y/100), b = 2 - a + Math.floor(a/4);
  return Math.floor(365.25*(y+4716)) + Math.floor(30.6001*(m+1)) + day + b - 1524.5;
}
function hebMonthForDate(d) {
  const jdn = jdnFromDate(d);
  let year = Math.floor((jdn - HEB_EPOCH)/365.25) + 1;
  while (hebElapsed(year) > (jdn - HEB_EPOCH)) year--;
  while (hebElapsed(year+1) <= (jdn - HEB_EPOCH)) year++;
  const leap = hebIsLeap(year);
  const dayOfYear = jdn - (HEB_EPOCH + hebElapsed(year));
  let acc = 0, monthIdx = 1;
  const totalMonths = leap ? 13 : 12;
  for (let m = 1; m <= totalMonths; m++) {
    const L = hebMonthLen(year, m);
    if (dayOfYear < acc + L) { monthIdx = m; break; }
    acc += L;
  }
  let nameIdx = (!leap) ? monthIdx : (monthIdx <= 5 ? monthIdx : (monthIdx === 6 ? 6 : (monthIdx === 7 ? 7 : monthIdx)));
  return HEB_MONTHS[Math.min(nameIdx-1, HEB_MONTHS.length-1)];
}

function islMonthForDate(d) {
  const jdn = Math.floor(jdnFromDate(d)) + 1;
  let l = jdn - 1948440 + 10632;
  let n = Math.floor((l-1)/10631);
  l = l - 10631*n + 354;
  const j = Math.floor((10985-l)/5316)*Math.floor((50*l)/17719) + Math.floor(l/5670)*Math.floor((43*l)/15238);
  l = l - Math.floor((30-j)/15)*Math.floor((17719*j)/50) - Math.floor(j/16)*Math.floor((15238*j)/43) + 29;
  const month = Math.floor((24*l)/709);
  return ISL_MONTHS[Math.max(0, Math.min(month-1, ISL_MONTHS.length-1))];
}

function updateCalendars() {
  const now = new Date();
  const age = moonAge(now.getTime());
  const startNewMoon = new Date(now.getTime() - age*86400000);
  const endNewMoon = new Date(startNewMoon.getTime() + SYNODIC_MONTH*86400000);
  const fmt = { day:'numeric', month:'long' };
  const range = `Del ${startNewMoon.toLocaleDateString('es-VE', fmt)} al ${endNewMoon.toLocaleDateString('es-VE', fmt)} (hora de Caracas).`;

  const hb = hebMonthForDate(now);
  document.getElementById('hebTranslit').textContent = hb.t;
  document.getElementById('hebNative').textContent = hb.n;
  document.getElementById('hebMeaning').textContent = hb.m;
  document.getElementById('hebDates').textContent = range;

  const is = islMonthForDate(now);
  document.getElementById('islTranslit').textContent = is.t;
  document.getElementById('islNative').textContent = is.n;
  document.getElementById('islMeaning').textContent = is.m;
  document.getElementById('islDates').textContent = range;
}

/* ============================================================
   3. MOTOR DE POSICIÓN LUNAR Y SALIDA/PUESTA (Caracas)
   ============================================================ */
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const sin = x => Math.sin(x * D2R), cos = x => Math.cos(x * D2R), tan = x => Math.tan(x * D2R);
const asin = x => Math.asin(Math.max(-1, Math.min(1, x))) * R2D;
const atan2 = (y, x) => { let a = Math.atan2(y, x) * R2D; return a < 0 ? a + 360 : a; };

function jdFromDate(ms) { return ms / 86400000 + 2440587.5; }

function moonEcliptic(JD) {
  const T = (JD - 2451545.0) / 36525;
  const L0 = 218.3164477 + 481267.88123421*T - 0.0015786*T*T + T*T*T/538841;
  const D  = 297.8501921 + 445267.1114034*T - 0.0018819*T*T + T*T*T/545868;
  const M  = 357.5291092 + 35999.0503402*T - 0.0001536*T*T + T*T*T/24490000;
  const M1 = 134.9633964 + 477198.8675055*T + 0.0087414*T*T + T*T*T/69694;
  const F  = 93.2720950 + 483202.0175233*T - 0.0036539*T*T - T*T*T/3526000;
  const lam = L0 + 6.288774*sin(M1) + 1.274027*sin(2*D-M1) + 0.658314*sin(2*D) + 0.213618*sin(2*M1) - 0.185116*sin(M) - 0.114332*sin(2*F) + 0.058793*sin(2*D-M1-M) + 0.057066*sin(2*D-M1+M) + 0.053322*sin(2*D+M1) + 0.045758*sin(2*D-M) + 0.040923*sin(M1-M) + 0.03472*sin(M1+M) + 0.030383*sin(2*D+M1-M) - 0.015327*sin(D-M1);
  const bet = 5.128122*sin(F) + 0.2806028*sin(M1+F) + 0.277694*sin(M1-F) + 0.173237*sin(2*D-F) + 0.055413*sin(2*D+M1-F) + 0.046271*sin(2*D-M1+F) + 0.032573*sin(2*F+M1) + 0.017198*sin(2*D+M1) - 0.009262*sin(2*D-F) + 0.008821*sin(2*D+M1-F);
  const eps = 23.439291 - 0.0130042*T;
  const ra = atan2( sin(lam)*cos(eps) - tan(bet)*sin(eps), cos(lam) );
  const dec = asin( sin(bet)*cos(eps) + cos(bet)*sin(eps)*sin(lam) );
  return { ra, dec };
}

function gmst(JD) {
  const T = (JD - 2451545.0) / 36525;
  let g = 280.46061837 + 360.98564736629*(JD - 2451545.0) + 0.000387933*T*T - T*T*T/38710000;
  return ((g % 360) + 360) % 360;
}

const LAT = 10.5009, LON = -66.9046;

function moonAltitude(ms) {
  const JD = jdFromDate(ms);
  const { ra, dec } = moonEcliptic(JD);
  const lst = (gmst(JD) + LON) % 360;
  let H = lst - ra; if (H > 180) H -= 360; if (H < -180) H += 360;
  return asin( sin(LAT)*sin(dec) + cos(LAT)*cos(dec)*cos(H) );
}

function computeRiseSet() {
  const midnight = new Date(); midnight.setHours(0,0,0,0);
  const start = midnight.getTime(), end = start + 86400000;
  const h0 = -0.833, step = 5 * 60000;
  let rise = null, set = null, prev = moonAltitude(start);
  for (let t = start + step; t <= end; t += step) {
    const cur = moonAltitude(t);
    if (rise === null && prev < h0 && cur >= h0) { const f = (h0 - prev) / (cur - prev); rise = t - step + f * step; }
    if (set === null && prev >= h0 && cur < h0) { const f = (h0 - prev) / (cur - prev); set = t - step + f * step; }
    if (rise !== null && set !== null) break;
    prev = cur;
  }
  const fmt = ms => ms === null ? '—' : new Date(ms).toLocaleTimeString('es-VE', { hour:'2-digit', minute:'2-digit' });
  return { rise: fmt(rise), set: fmt(set) };
}

/* ============================================================
   4. DIBUJO DE LA LUNA CON TEXTURA LOCAL
   ============================================================ */
const canvas = document.getElementById('moonCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const CX = W / 2, CY = H / 2, R = W / 2 - 4;

const MOON_TEXTURE_URL = 'moon-texture.jpg';
const moonImage = new Image();
let textureLoaded = false;

moonImage.onload = () => {
  textureLoaded = true;
  document.getElementById('loadingMsg').style.display = 'none';
  drawMoon(moonPhase());
};
moonImage.onerror = () => {
  document.getElementById('loadingMsg').textContent = 'textura local no encontrada';
};
moonImage.src = MOON_TEXTURE_URL;

function drawMoon(phase) {
  ctx.clearRect(0, 0, W, H);
  const isWaxing = phase < 0.5;
  const halfPhase = isWaxing ? phase * 2 : (1 - phase) * 2;

  ctx.save();
  ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.clip();
  
  if (textureLoaded) {
    const sx = moonImage.width / 4, sw = moonImage.width / 2;
    ctx.drawImage(moonImage, sx, 0, sw, moonImage.height, 0, 0, W, H);
  } else {
    const grad = ctx.createRadialGradient(CX - R*0.3, CY - R*0.3, R*0.1, CX, CY, R);
    grad.addColorStop(0, '#f0ead6'); grad.addColorStop(1, '#a89f85');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  }

  ctx.beginPath();
  const curve = Math.cos(halfPhase * Math.PI) * R;
  if (isWaxing) {
    ctx.moveTo(CX, CY - R); ctx.arc(CX, CY, R, -Math.PI/2, Math.PI/2, true);
    ctx.ellipse(CX, CY, Math.abs(curve), R, 0, Math.PI/2, -Math.PI/2, curve > 0 ? false : true);
  } else {
    ctx.moveTo(CX, CY - R); ctx.arc(CX, CY, R, Math.PI/2, -Math.PI/2, true);
    ctx.ellipse(CX, CY, Math.abs(curve), R, 0, -Math.PI/2, Math.PI/2, curve > 0 ? false : true);
  }
  ctx.closePath(); ctx.fillStyle = 'rgba(8, 12, 25, 0.92)'; ctx.fill();
  ctx.restore();

  const sh = ctx.createRadialGradient(CX - R*0.35, CY - R*0.35, R*0.1, CX, CY, R);
  sh.addColorStop(0, 'rgba(255,255,255,0.08)'); sh.addColorStop(0.6, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.fillStyle = sh; ctx.fill();

  const glow = ctx.createRadialGradient(CX, CY, R*0.95, CX, CY, R*1.4);
  glow.addColorStop(0, 'rgba(200,220,255,0.12)'); glow.addColorStop(1, 'rgba(200,220,255,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
}

/* ============================================================
   5. BUCLE DE ACTUALIZACIÓN
   ============================================================ */
let lastRiseCalc = 0;

function updateAll() {
  const now = Date.now();
  const age = moonAge(now), phase = moonPhase(now), illum = illumination(phase);
  const name = phaseName(phase), tr = trend(phase), next = nextPhaseInfo(phase);

  document.getElementById('phaseName').textContent = name;
  document.getElementById('illumTag').textContent = illum.toFixed(1) + '% iluminada · ' + tr;
  document.getElementById('age').textContent = age.toFixed(2) + ' días';
  document.getElementById('trend').textContent = tr;
  document.getElementById('next').textContent = next.name;
  document.getElementById('countdown').textContent = formatCountdown(next.days);
  document.getElementById('illum').textContent = illum.toFixed(1) + '%';
  document.getElementById('dist').textContent = distanceKm(phase).toLocaleString('es') + ' km';
  document.getElementById('constellation').textContent = constellationForPhase(phase);
  document.getElementById('tip').textContent = observationTip(phase);

  if (textureLoaded) drawMoon(phase);
  updateClock();
  updateCalendars();

  if (now - lastRiseCalc > 5 * 60000 || lastRiseCalc === 0) {
    const rs = computeRiseSet();
    document.getElementById('rise').textContent = rs.rise;
    document.getElementById('set').textContent = rs.set;
    lastRiseCalc = now;
  }
}

updateAll();
setInterval(updateAll, 1000);
