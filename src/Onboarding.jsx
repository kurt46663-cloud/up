import { useState, useRef } from 'react'
import { sv } from './utils'

const ROLES = [
  { val:'ogrenci',    icon:'🎓', title:'Öğrenci',    desc:'Ders, sınav, proje yönetimi' },
  { val:'calisan',    icon:'💼', title:'Çalışan',     desc:'Kurumsal iş hayatı' },
  { val:'girisimci',  icon:'🚀', title:'Girişimci',   desc:'Kendi işini kuruyorsun' },
  { val:'freelancer', icon:'💻', title:'Freelancer',  desc:'Serbest çalışıyorsun' },
  { val:'diger',      icon:'✦',  title:'Diğer',       desc:'Farklı bir yol' },
]
const PROBLEMS = [
  { val:'erteleme',   icon:'⏳', title:'Erteleme',          desc:'Başlamak zor geliyor' },
  { val:'motivasyon', icon:'🔋', title:'Motivasyon',         desc:'İsteksiz hissediyorum' },
  { val:'odak',       icon:'🎯', title:'Odak kaybı',         desc:'Konsantre olamıyorum' },
  { val:'hedef',      icon:'🗺', title:'Hedef belirsizliği', desc:'Ne yapacağımı bilmiyorum' },
  { val:'diger',      icon:'✦',  title:'Diğer',              desc:'' },
]
const TIMES = [
  { val:'sabah', icon:'🌅', title:'Sabah' },
  { val:'oglen', icon:'☀️', title:'Öğlen' },
  { val:'aksam', icon:'🌆', title:'Akşam' },
  { val:'gece',  icon:'🌙', title:'Gece'  },
]
const FOCUS_OPTS = [
  { val:'kariyer', icon:'💼', label:'Kariyer' },
  { val:'saglik',  icon:'💪', label:'Sağlık'  },
  { val:'egitim',  icon:'📚', label:'Eğitim'  },
  { val:'finans',  icon:'💰', label:'Finans'  },
  { val:'iliski',  icon:'❤️', label:'İlişkiler'},
  { val:'diger',   icon:'✦',  label:'Diğer'   },
]
const AVATARS = ['🧑','👨','👩','🦁','🐺','🦊','⚡','🔥','💎','🌟','🧙','🦸']

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [data, setData] = useState({
    name:'', age:'', role:null, problem:null,
    time:null, hours:3, focus:[], avatar:'🧑', photo:null
  })
  const [finished, setFinished] = useState(false)
  const fileRef = useRef()

  const set = (k, v) => setData(d => ({ ...d, [k]: v }))
  const toggleFocus = v => setData(d => ({
    ...d,
    focus: d.focus.includes(v) ? d.focus.filter(x => x !== v) : [...d.focus, v]
  }))

  const next = () => {
    if (step < 5) {
      setLeaving(true)
      setTimeout(() => { setStep(s => s + 1); setLeaving(false) }, 340)
    } else {
      sv('up_onboarding', data)
      setFinished(true)
      setTimeout(() => onDone(data), 1500)
    }
  }

  const handlePhoto = e => {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = ev => set('photo', ev.target.result)
    r.readAsDataURL(f)
  }

  const dots = Array.from({ length: 6 }, (_, i) => (
    <div key={i} style={{
      flex:1, height:2, borderRadius:1,
      background: i < step ? 'rgba(255,255,255,.7)' : i === step ? '#fff' : 'rgba(255,255,255,.12)',
      transition:'background .3s'
    }}/>
  ))

const sStyle = {
  position:'absolute', inset:0, display:'flex', flexDirection:'column',
  padding:'54px 24px 0', overflowY:'auto',
  opacity: leaving ? 0 : 1,
  transform: leaving ? 'translateX(-40px)' : 'translateX(0)',
  transition:'opacity .34s cubic-bezier(.25,.46,.45,.94), transform .34s cubic-bezier(.25,.46,.45,.94)',
  willChange:'transform, opacity',
  WebkitOverflowScrolling:'touch',
}

  const inp = {
    background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)',
    borderRadius:18, padding:'16px 20px', fontSize:16, fontWeight:500,
    color:'#fff', outline:'none', width:'100%', fontFamily:'inherit',
    letterSpacing:'-.01em', WebkitAppearance:'none', marginBottom:10,
    transition:'border-color .2s',
  }

  const opt = sel => ({
    background: sel ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.05)',
    border: `1px solid ${sel ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.08)'}`,
    borderRadius:16, padding:'13px 16px', cursor:'pointer',
    display:'flex', alignItems:'center', gap:12, marginBottom:7,
    transition:'all .15s', WebkitTapHighlightColor:'transparent',
  })

  const hdr = (n, title, sub) => (
    <>
      <div style={{display:'flex', gap:5, marginBottom:32}}>{dots}</div>
      <div style={{fontSize:11, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(255,255,255,.2)', marginBottom:8}}>Adım {n} / 6</div>
      <div style={{fontSize:28, fontWeight:800, color:'#fff', lineHeight:1.15, letterSpacing:'-.04em', marginBottom:6}}>{title}</div>
      <div style={{fontSize:13, color:'rgba(255,255,255,.35)', lineHeight:1.6, marginBottom:24}}>{sub}</div>
    </>
  )

  const optRow = (val, icon, title, desc, field) => (
    <div key={val} onClick={() => set(field, val)} style={opt(data[field] === val)}>
      <div style={{width:36, height:36, borderRadius:11, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0}}>{icon}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:14, fontWeight:600, color:'#fff', marginBottom:desc?2:0}}>{title}</div>
        {desc && <div style={{fontSize:12, color:'rgba(255,255,255,.35)'}}>{desc}</div>}
      </div>
      <div style={{width:18, height:18, borderRadius:'50%', border:`1.5px solid ${data[field]===val?'#fff':'rgba(255,255,255,.2)'}`, background:data[field]===val?'#fff':'transparent', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center'}}>
        {data[field]===val && <div style={{width:8, height:8, borderRadius:'50%', background:'#000'}}/>}
      </div>
    </div>
  )

  if (finished) return (
    <div style={{position:'fixed', inset:0, zIndex:9998, background:'#000', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20}}>
      <div style={{fontSize:64}}>{data.photo ? <img src={data.photo} style={{width:80, height:80, borderRadius:'50%', objectFit:'cover'}}/> : data.avatar}</div>
      <div style={{fontSize:32, fontWeight:800, color:'#fff', letterSpacing:'-.04em', textAlign:'center', lineHeight:1.2}}>
        Hazırsın,<br/><span style={{color:'rgba(255,255,255,.4)'}}>{data.name||'arkadaş'}</span>.
      </div>
      <div style={{fontSize:14, color:'rgba(255,255,255,.35)', textAlign:'center', lineHeight:1.6}}>
        Koçun hazır. Sistemi kurduk.<br/>Şimdi sıra sende.
      </div>
    </div>
  )

  return (
    <div style={{position:'fixed', inset:0, zIndex:9998, background:'#000', display:'flex', flexDirection:'column'}}>
      {/* Opal orbs */}
      <div style={{position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none'}}>
        <div style={{position:'absolute', width:380, height:380, borderRadius:'50%', background:'radial-gradient(circle,rgba(110,60,255,.15) 0%,transparent 65%)', top:-120, left:-80, filter:'blur(60px)'}}/>
        <div style={{position:'absolute', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,160,255,.08) 0%,transparent 65%)', top:100, right:-60, filter:'blur(55px)'}}/>
        <div style={{position:'absolute', width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,60,120,.06) 0%,transparent 65%)', bottom:200, left:-40, filter:'blur(65px)'}}/>
      </div>

      {/* Steps */}
      <div style={{flex:1, position:'relative', overflow:'hidden'}}>

        {step===0 && (
          <div style={sStyle}>
            {hdr(1,'Seni tanıyalım.','UP. seni ne kadar iyi tanırsa, koçun o kadar güçlü olur.')}
            <input style={inp} value={data.name} onChange={e=>set('name',e.target.value)} placeholder="İsmin ne?" autoComplete="off"/>
            <input style={inp} type="number" value={data.age} onChange={e=>set('age',e.target.value)} placeholder="Kaç yaşındasın?" inputMode="numeric"/>
          </div>
        )}

        {step===1 && (
          <div style={sStyle}>
            {hdr(2,'Ne yapıyorsun?','Görev önerilerini ve koç tonunu şekillendirir.')}
            {ROLES.map(r => optRow(r.val, r.icon, r.title, r.desc, 'role'))}
          </div>
        )}

        {step===2 && (
          <div style={sStyle}>
            {hdr(3,'Nerede takılıyorsun?','Dürüst ol. UP. yargılamaz, çözer.')}
            {PROBLEMS.map(p => optRow(p.val, p.icon, p.title, p.desc, 'problem'))}
          </div>
        )}

        {step===3 && (
          <div style={sStyle}>
            {hdr(4,'Çalışma tarzın.','Koçun sana uygun zamanlarda devreye girsin.')}
            <div style={{fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,.2)', marginBottom:12}}>Ne zaman daha verimlisin?</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:24}}>
              {TIMES.map(t => (
                <div key={t.val} onClick={()=>set('time',t.val)}
                  style={{background:data.time===t.val?'rgba(255,255,255,.12)':'rgba(255,255,255,.05)', border:`1px solid ${data.time===t.val?'rgba(255,255,255,.3)':'rgba(255,255,255,.08)'}`, borderRadius:16, padding:'14px 12px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6, transition:'all .15s', WebkitTapHighlightColor:'transparent'}}>
                  <span style={{fontSize:22}}>{t.icon}</span>
                  <span style={{fontSize:13, fontWeight:600, color:data.time===t.val?'#fff':'rgba(255,255,255,.5)'}}>{t.title}</span>
                </div>
              ))}
            </div>
            <div style={{fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,.2)', marginBottom:12}}>Günlük kaç saat verimli çalışabilirsin?</div>
            <div style={{display:'flex', alignItems:'center', gap:14, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:16, padding:'16px 20px'}}>
              <button onClick={()=>set('hours',Math.max(0,data.hours-1))} style={{background:'rgba(255,255,255,.1)', border:'none', borderRadius:10, width:32, height:32, color:'#fff', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>−</button>
              <div style={{flex:1, textAlign:'center'}}>
                <span style={{fontSize:24, fontWeight:800, color:'#fff', letterSpacing:'-.03em'}}>{data.hours===0?"1'den az":data.hours}</span>
                {data.hours>0 && <span style={{fontSize:14, color:'rgba(255,255,255,.4)', marginLeft:6}}>saat</span>}
              </div>
              <button onClick={()=>set('hours',Math.min(12,data.hours+1))} style={{background:'rgba(255,255,255,.1)', border:'none', borderRadius:10, width:32, height:32, color:'#fff', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>+</button>
            </div>
          </div>
        )}

        {step===4 && (
          <div style={sStyle}>
            {hdr(5,'Ne üzerine çalışacaksın?','Birden fazla seçebilirsin.')}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8}}>
              {FOCUS_OPTS.map(f => {
                const sel = data.focus.includes(f.val)
                return (
                  <div key={f.val} onClick={()=>toggleFocus(f.val)}
                    style={{background:sel?'rgba(255,255,255,.12)':'rgba(255,255,255,.05)', border:`1px solid ${sel?'rgba(255,255,255,.3)':'rgba(255,255,255,.08)'}`, borderRadius:16, padding:'14px 10px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6, transition:'all .15s', WebkitTapHighlightColor:'transparent'}}>
                    <span style={{fontSize:22}}>{f.icon}</span>
                    <span style={{fontSize:12, fontWeight:600, color:sel?'#fff':'rgba(255,255,255,.45)', textAlign:'center'}}>{f.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {step===5 && (
          <div style={sStyle}>
            {hdr(6,'Profilini tamamla.','Fotoğraf yükle ya da bir emoji seç.')}
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:'none'}}/>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
              <div onClick={()=>fileRef.current?.click()}
                style={{aspectRatio:'1', borderRadius:18, background:data.photo?'transparent':'rgba(255,255,255,.06)', border:`1.5px solid ${data.photo?'rgba(255,255,255,.3)':'rgba(255,255,255,.1)'}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', gap:4}}>
                {data.photo
                  ? <img src={data.photo} style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                  : <><span style={{fontSize:22}}>📷</span><span style={{fontSize:9, fontWeight:600, color:'rgba(255,255,255,.3)', letterSpacing:'.04em', textTransform:'uppercase'}}>Foto</span></>
                }
              </div>
              {AVATARS.map(av => (
                <div key={av} onClick={()=>{set('avatar',av);set('photo',null)}}
                  style={{aspectRatio:'1', borderRadius:18, background:data.avatar===av&&!data.photo?'rgba(255,255,255,.12)':'rgba(255,255,255,.05)', border:`1.5px solid ${data.avatar===av&&!data.photo?'rgba(255,255,255,.3)':'rgba(255,255,255,.08)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, cursor:'pointer', transition:'all .15s', WebkitTapHighlightColor:'transparent'}}>
                  {av}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom */}
      <div style={{padding:'12px 24px', paddingBottom:'calc(12px + env(safe-area-inset-bottom,16px))', display:'flex', flexDirection:'column', gap:8, flexShrink:0, position:'relative', zIndex:1}}>
        <button onClick={next}
          style={{background:'#fff', border:'none', borderRadius:18, padding:17, color:'#000', fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'inherit', letterSpacing:'-.02em', width:'100%', WebkitTapHighlightColor:'transparent'}}
          onTouchStart={e=>e.currentTarget.style.opacity='.8'}
          onTouchEnd={e=>e.currentTarget.style.opacity='1'}>
          {step<5 ? 'Devam →' : 'Başlayalım →'}
        </button>
        {step<5 && (
          <button onClick={next} style={{background:'transparent', border:'none', padding:'10px', color:'rgba(255,255,255,.25)', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit', WebkitTapHighlightColor:'transparent'}}>
            Şimdilik geç
          </button>
        )}
      </div>
    </div>
  )
}