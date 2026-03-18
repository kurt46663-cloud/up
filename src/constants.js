export const SK = {
  tasks: "up_tasks_v2",
  jrnl:  "up_jrnl_v2",
  prof:  "up_prof_v2",
  brd:   "up_brd_v2",
  ci:    "up_ci_v2",
  arc:   "up_arc_v2",
  theme: "up_theme_v2",
  tpls:  "up_tpls_v2",
  recur: "up_recur_v2",
};

export const PRI = {
  high: { label:"Yüksek", dot:"#A51C30", bg:"rgba(165,28,48,.1)" },
  med:  { label:"Orta",   dot:"#1B4D3E", bg:"rgba(27,77,62,.12)" },
  low:  { label:"Düşük",  dot:"#2C3E6B", bg:"rgba(44,62,107,.12)" },
};

export const CAT = {
  is:       { label:"İş",       color:"#0a84ff" },
  kisisel:  { label:"Kişisel",  color:"#bf5af2" },
  saglik:   { label:"Sağlık",   color:"#30d158" },
  egitim:   { label:"Eğitim",   color:"#ff9f0a" },
  diger:    { label:"Diğer",    color:"#8e8e93" },
};

export const DAYS_L = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
export const DAYS_S = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];
export const MONS   = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
export const MOOD_E = {1:"😞",2:"😕",3:"😐",4:"🙂",5:"😄"};
export const MOOD_L = {1:"Kötü",2:"Düşük",3:"Orta",4:"İyi",5:"Harika"};

export const BADGES = [
  {m:100,e:"🏆",l:"Efsane"},
  {m:50, e:"💎",l:"Kristal"},
  {m:30, e:"🥇",l:"Altın"},
  {m:14, e:"🥈",l:"Gümüş"},
  {m:7,  e:"🥉",l:"Bronz"},
  {m:3,  e:"⭐",l:"Yıldız"},
  {m:1,  e:"🌱",l:"Başlangıç"},
];

export const DEFAULT_TEMPLATES = [
  {id:"t1", name:"Sabah Rutini",   priority:"high", cat:"saglik", dur:30,  noTimer:false, subtasks:[{text:"Su iç",done:false},{text:"Egzersiz",done:false},{text:"Kahvaltı",done:false}]},
  {id:"t2", name:"Derin Çalışma",  priority:"high", cat:"is",     dur:90,  noTimer:false, subtasks:[]},
  {id:"t3", name:"Kitap Oku",      priority:"med",  cat:"egitim", dur:30,  noTimer:false, subtasks:[]},
  {id:"t4", name:"Yürüyüş",        priority:"med",  cat:"saglik", dur:20,  noTimer:false, subtasks:[]},
  {id:"t5", name:"Günlük Yaz",     priority:"low",  cat:"kisisel",dur:0,   noTimer:true,  subtasks:[]},
];