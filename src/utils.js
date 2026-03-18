import { SK } from './constants.js';

export const ld = (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } };
export const sv = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export const p2 = n => String(n).padStart(2, "0");
export const ds = d => `${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;
export const today = () => ds(new Date());
export const getMon = d => { const r = new Date(d); r.setDate(d.getDate() - (d.getDay()+6)%7); return r; };

export const fmtM = m => {
  if (!m) return "—";
  const h = Math.floor(m/60), min = m%60;
  return h > 0 ? `${h}s ${min}dk` : `${min}dk`;
};
export const fmtS = s => {
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  return h > 0 ? `${h}:${p2(m)}:${p2(sec)}` : `${m}:${p2(sec)}`;
};

export const calcStreak = ({ tasks, ci }) => {
  let s = 0;
  const c = new Date();
  for (let i = 0; i < 365; i++) {
    const d = ds(c);
    if (!tasks.some(t => t.date === d && t.done) && !ci[d]) break;
    s++;
    c.setDate(c.getDate() - 1);
  }
  return s;
};

export const calcPenalty = ({ tasks, ci, now }) => {
  let emptyStreak = 0;
  const c = new Date(now);
  for (let i = 0; i < 7; i++) {
    const dstr = ds(c);
    if (!tasks.some(t => t.date === dstr && t.done) && !ci[dstr]) emptyStreak++;
    else break;
    c.setDate(c.getDate() - 1);
  }
  if (emptyStreak >= 3) return Math.min(30, emptyStreak * 5);
  return 0;
};

export const calcDisc = ({ tasks, ci, streak, now }) => {
  const dow = (now.getDay()+6)%7;
  let wT=0, wD=0, wE=0, wCI=0;
  for (let i = 0; i <= dow; i++) {
    const d = new Date(now); d.setDate(now.getDate()-i);
    const dstr = ds(d), dt = tasks.filter(t => t.date === dstr);
    wT += dt.length;
    wD += dt.filter(t => t.done).length;
    wE += dt.filter(t => t.done && t.eff).reduce((s,t) => s + Math.round(t.eff/60), 0);
    if (ci[dstr] || dt.some(t => t.done)) wCI++;
  }
  const days = dow+1;
  const cP = wT === 0 ? 0 : Math.round(wD/wT*100);
  const eN = Math.min(100, Math.round(wE/240*100));
  const cI = Math.round(wCI/days*100);
  const sN = Math.min(100, Math.round(streak/30*100));
  const raw = Math.round(cP*.30 + eN*.30 + cI*.25 + sN*.15);
  const penalty = calcPenalty({ tasks, ci, now });
  return Math.max(0, raw - penalty);
};

export const motivMsg = (pct, streak) => {
  if (pct === 100) return "Mükemmel. Bugün her şeyi yaptın. 🔥";
  if (pct >= 80)   return "Neredeyse bitti. Son hamleyi yap.";
  if (pct >= 50)   return "Yarısını geçtin. Devam et.";
  if (pct > 0)     return "Başladın. Bu en önemli adım.";
  if (streak > 7)  return `${streak} günlük serin var. Kırma.`;
  return "Bugün küçük bir adım bile yeterli.";
};

export const buildUserContext = ({ tasks, journal, stats, discScore, now, profile }) => {
  const td = today();
  const yesterday = new Date(now); yesterday.setDate(now.getDate()-1);
  const yStr = ds(yesterday);
  const yTasks = tasks.filter(x => x.date === yStr);
  const yDone = yTasks.filter(x => x.done);
  const tdTasks = tasks.filter(x => x.date === td);

  const last7 = Array.from({length:7},(_,i) => {
    const d = new Date(now); d.setDate(now.getDate()-i);
    const dstr = ds(d), dt = tasks.filter(x => x.date === dstr);
    const done = dt.filter(x => x.done).length;
    return { date: dstr, total: dt.length, done, pct: dt.length ? Math.round(done/dt.length*100) : 0 };
  }).reverse();

  const catCounts = {};
  tasks.filter(x => x.done).forEach(t => { catCounts[t.cat] = (catCounts[t.cat]||0)+1; });
  const topCats = Object.entries(catCounts).sort((a,b) => b[1]-a[1]).slice(0,3).map(([k]) => k);

  const recentMoods = Array.from({length:7},(_,i) => {
    const d = new Date(now); d.setDate(now.getDate()-i);
    return journal[ds(d)]?.mood || 0;
  }).filter(m => m > 0);
  const avgMood = recentMoods.length ? Math.round(recentMoods.reduce((s,m) => s+m, 0)/recentMoods.length) : 0;

  const gunler = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];

  return `
Kullanıcı: ${profile.name}
Bugün: ${gunler[now.getDay()]}, ${now.getDate()} - Saat: ${now.getHours()}:${p2(now.getMinutes())}
Streak: ${stats.streak} gün
Disiplin skoru: ${discScore}/100
Bu hafta: %${stats.weekPct}
Bugün: ${tdTasks.filter(x=>x.done).length}/${tdTasks.length} görev
Dün: ${yDone.length}/${yTasks.length} görev
Son 7 gün: ${last7.map(d=>`${d.date}:%${d.pct}`).join(', ')}
Ortalama mood: ${avgMood}/5
En çok çalıştığı kategoriler: ${topCats.join(', ') || 'henüz veri yok'}
  `.trim();
};

export const callAI = async (systemPrompt, userPrompt) => {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || null;
  } catch { return null; }
};

export const defBoard = () => [
  {id:"u1",n:"Ahmet K.", av:"🦁",st:23,wp:91,ef:540,disc:84,me:false},
  {id:"u2",n:"Zeynep A.",av:"🌟",st:18,wp:88,ef:420,disc:79,me:false},
  {id:"u3",n:"Can M.",  av:"⚡",st:15,wp:75,ef:300,disc:68,me:false},
  {id:"u4",n:"Elif S.", av:"💎",st:12,wp:83,ef:260,disc:72,me:false},
  {id:"u5",n:"Burak T.",av:"🔥",st:9, wp:70,ef:180,disc:61,me:false},
  {id:"u6",n:"Selin Y.",av:"🦊",st:7, wp:65,ef:120,disc:55,me:false},
  {id:"u7",n:"Mert D.", av:"🐺",st:5, wp:60,ef:90, disc:48,me:false},
  {id:"u8",n:"Ayşe N.", av:"🧑‍🎓",st:3,wp:100,ef:15,disc:32,me:false},
  {id:"me",n:"Sen",    av:"🧑",st:0, wp:0, ef:0,  disc:0, me:true},
];