(function(root){
  // Ordered so the first ~9-12 entries are maximally distinct hues (not
  // shade-variants of a color already used earlier) — with only 6 saturated
  // hue families in this palette, a naive family-then-shade order repeats a
  // hue every 6 slots, which reads as "duplicate colors" once there are more
  // than 6 categories. Earthy neutrals are interleaved early to stand in as
  // extra distinct anchors before any hue has to repeat at a new shade.
  const P=[
    "#5F6F8F","#A96318","#568044","#3478C8","#087F72","#7B4BC4",
    "#C47F00","#2F8B83","#3F7664",
    "#2F69B3","#C65318","#B33370","#405FB2","#5353D9","#7D4AB4",
    "#B54272","#8C527A","#28788E","#66717E","#AED7FF","#CDB6FF",
    "#EDE7CE","#C99C7D","#7F4D41"
  ];
  const MONTH_NAMES=["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];

  function nextColor(existingCategories){
    const used = (existingCategories||[]).map(c=>c.col).filter(Boolean);
    for(const c of P){ if(!used.includes(c)) return c; }
    return P[(existingCategories||[]).length % P.length];
  }

  function monthKey(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }

  function defaultCalendarLabel(key){
    const parts = key.split('-');
    if(parts.length===2 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])){
      const y = +parts[0], m = +parts[1];
      return MONTH_NAMES[m-1]+' '+y;
    }
    return '';
  }

  function defaultMonthData(){
    return {
      B:0,
      C:[
        {n:"Дом",a:0,h:[],col:P[0]},
        {n:"Продукты и хозтовары",a:0,h:[],col:P[1]},
        {n:"Транспорт",a:0,h:[],col:P[2]},
        {n:"Связь и подписки",a:0,h:[],col:P[3]},
        {n:"Одежда",a:0,h:[],col:P[4]},
        {n:"Развлечения",a:0,h:[],col:P[5]},
        {n:"Кафе и рестораны",a:0,h:[],col:P[6]},
        {n:"Здоровье",a:0,h:[],col:P[7]},
        {n:"Кредиты",a:0,h:[],col:P[8]}
      ],
      hiddenC:[],
      EV:[],
      IN:[]
    };
  }

  const ICON_PATHS={
    home:'<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    basket:'<path d="m15 11-1 9"/><path d="m19 11-4-7"/><path d="M2 11h20"/><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4"/><path d="M4.5 15.5h15"/><path d="m5 11 4-7"/><path d="m9 11 1 9"/>',
    car:'<path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8"/><path d="M7 14h.01"/><path d="M17 14h.01"/><rect width="18" height="8" x="3" y="10" rx="2"/><path d="M5 18v2"/><path d="M19 18v2"/>',
    wifi:'<path d="M2 8.82a15 15 0 0 1 20 0" stroke-width="3.4"/><path d="M6.65 14.02a8.025 8.025 0 0 1 10.7 0" stroke-width="3.4"/><path d="M12 20h.01" stroke-width="5.5"/>',
    shirt:'<path d="M15 4l6 2v5h-3v8a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1v-8h-3v-5l6 -2a3 3 0 0 0 6 0"/>',
    clapper:'<path d="m12.296 3.464 3.02 3.956"/><path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="m6.18 5.276 3.1 3.899"/>',
    utensils:'<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    heartpulse:'<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/><path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
    card:'<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    plane:'<path d="M10.5 4.5V9.16745C10.5 9.37433 10.3934 9.56661 10.218 9.67625L2.782 14.3237C2.60657 14.4334 2.5 14.6257 2.5 14.8325V15.7315C2.5 16.1219 2.86683 16.4083 3.24552 16.3136L9.75448 14.6864C10.1332 14.5917 10.5 14.8781 10.5 15.2685V18.2277C10.5 18.4008 10.4253 18.5654 10.2951 18.6793L8.13481 20.5695C7.6765 20.9706 8.03808 21.7204 8.63724 21.6114L11.8927 21.0195C11.9636 21.0066 12.0364 21.0066 12.1073 21.0195L15.3628 21.6114C15.9619 21.7204 16.3235 20.9706 15.8652 20.5695L13.7049 18.6793C13.5747 18.5654 13.5 18.4008 13.5 18.2277V15.2685C13.5 14.8781 13.8668 14.5917 14.2455 14.6864L20.7545 16.3136C21.1332 16.4083 21.5 16.1219 21.5 15.7315V14.8325C21.5 14.6257 21.3934 14.4334 21.218 14.3237L13.782 9.67625C13.6066 9.56661 13.5 9.37433 13.5 9.16745V4.5C13.5 3.67157 12.8284 3 12 3C11.1716 3 10.5 3.67157 10.5 4.5Z"/>',
    dumbbell:'<path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z"/><path d="m2.5 21.5 1.4-1.4"/><path d="m20.1 3.9 1.4-1.4"/><path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z"/><path d="m9.6 14.4 4.8-4.8"/>',
    sparkle:'<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/>',
    cap:'<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    gift:'<path d="M12 7v14"/><path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5"/><rect x="3" y="7" width="18" height="4" rx="1"/>',
    pacifier:'<path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M15 12h.01"/><path d="M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/><path d="M9 12h.01"/>',
    paw:'<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
    palette:'<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="17.5" cy="10.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="6.5" cy="12.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="8.5" cy="7.5" r="1.1" fill="currentColor" stroke="none"/>',
    dots:'<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    piggybank:'<path d="M11 17h3v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a3.16 3.16 0 0 0 2-2h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1a5 5 0 0 0-2-4V3a4 4 0 0 0-3.2 1.6l-.3.4H11a6 6 0 0 0-6 6v1a5 5 0 0 0 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z"/><path d="M16 10h.01"/><path d="M2 8v1a2 2 0 0 0 2 2h1"/>',
    tag:'<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>'
  };
  const CATEGORY_ICONS={
    'дом':'home','продукты и хозтовары':'basket','транспорт':'car','связь и подписки':'wifi',
    'одежда':'shirt','развлечения':'clapper','кафе и рестораны':'utensils','здоровье':'heartpulse','кредиты':'card',
    'путешествия':'plane','спорт':'dumbbell','красота и уход':'sparkle','образование':'cap','подарки':'gift',
    'дети':'pacifier','животные':'paw','хобби':'palette','подушка':'piggybank','другое':'dots'
  };
  function iconKeyFor(name){
    return CATEGORY_ICONS[(name||'').trim().toLowerCase()] || 'tag';
  }
  function categoryIconSvg(name,size){
    size = size||18;
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[iconKeyFor(name)]}</svg>`;
  }

  function fmt(n){return new Intl.NumberFormat('ru-RU').format(Math.round(n||0))}
  function strip(v){return v.replace(/[^0-9.]/g,'').replace(/^0+(?=\d)/,'')}
  function numVal(v){ return parseFloat(String(v).replace(/[ \s%]/g,''))||0; }

  function pol(cx,cy,r,a){const x=a*Math.PI/180;return{x:cx+r*Math.cos(x),y:cy+r*Math.sin(x)}}
  function arc(cx,cy,r,s,e){
    if(e-s>=359.999) e=s+359.999;
    const S=pol(cx,cy,r,s),E=pol(cx,cy,r,e),L=e-s<=180?0:1;
    return`M ${S.x} ${S.y} A ${r} ${r} 0 ${L} 1 ${E.x} ${E.y}`;
  }

  function contrastTextColor(color){
    let r=0,g=0,b=0;
    const value=(color||'').trim();
    if(value.startsWith('#')){
      const h=value.slice(1);
      const full=h.length===3?h.split('').map(c=>c+c).join(''):h;
      const n=parseInt(full,16);
      if(!isNaN(n)){ r=(n>>16)&255; g=(n>>8)&255; b=n&255; }
    } else {
      const parts=value.match(/[\d.]+/g);
      if(parts && parts.length>=3){ r=+parts[0]; g=+parts[1]; b=+parts[2]; }
    }
    return (r*299+g*587+b*114)/1000>155 ? '#170B33' : '#FFFFFF';
  }

  // now defaults to the real clock but accepts an override so tests can pin the date.
  // from: optional explicit start of the window (used for a user-picked custom range)
  // instead of the usual "6 days before now".
  function getWeekBounds(now, from){
    now = now || new Date();
    if(!from){
      from = new Date(now.getTime()-6*24*60*60*1000);
      from.setHours(0,0,0,0);
    }
    return {from, now};
  }

  // Sums history entries across every stored month whose date falls in
  // [from, to] — the generic building block behind "Неделя" and any other
  // arbitrary user-picked date range.
  function getRangeCats(store, otherColor, from, to){
    const map={};
    Object.values(store.months).forEach(mo=>{
      (mo.C||[]).forEach(c=>{
        (c.h||[]).forEach(item=>{
          const d=new Date(item.d);
          if(d>=from && d<=to){
            if(!map[c.n]) map[c.n]={name:c.n, col:c.col, amount:0};
            map[c.n].amount += parseFloat(item.a)||0;
          }
        });
      });
    });
    return Object.values(map).filter(x=>x.amount>0);
  }

  // Prorates each stored month's budget by how many days of [from, to] fall
  // inside it — the generic building block behind "Неделя" and any other
  // arbitrary user-picked date range.
  function getRangeBudget(store, from, to){
    let budget=0;
    for(let d=new Date(from); d<=to; d.setDate(d.getDate()+1)){
      const mo = store.months[monthKey(d)];
      if(mo){
        const daysInMonth = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
        budget += (parseFloat(mo.B)||0)/daysInMonth;
      }
    }
    return budget;
  }

  // store: the full STORE object ({months, current, ...}). now: optional Date override for tests.
  // weekFrom: optional explicit range start, see getWeekBounds.
  function getPeriodCats(period, store, otherColor, now, weekFrom){
    const currentMonth = store.months[store.current] || {C:[]};
    if(period==='week'){
      const {from, now:nowD} = getWeekBounds(now, weekFrom);
      return getRangeCats(store, otherColor, from, nowD);
    }
    if(period==='year'){
      const year=now ? String(now.getFullYear()) : (store.current||'').split('-')[0];
      const map={};
      Object.keys(store.months).forEach(mk=>{
        if(!mk.startsWith(year+'-')) return;
        (store.months[mk].C||[]).forEach(c=>{
          const amt=parseFloat(c.a)||0; if(amt<=0) return;
          if(!map[c.n]) map[c.n]={name:c.n, col:c.col, amount:0};
          map[c.n].amount += amt;
        });
      });
      return Object.values(map).filter(x=>x.amount>0);
    }
    return (currentMonth.C||[]).map(c=>({name:c.n, col:c.col, amount:parseFloat(c.a)||0})).filter(x=>x.amount>0);
  }

  function getPeriodBudget(period, store, now, weekFrom){
    const currentMonth = store.months[store.current] || {B:0};
    if(period==='year'){
      const year=now ? String(now.getFullYear()) : (store.current||'').split('-')[0];
      let budget=0;
      Object.keys(store.months).forEach(mk=>{
        if(mk.startsWith(year+'-')) budget += parseFloat(store.months[mk].B)||0;
      });
      return budget;
    }
    if(period==='week'){
      const {from, now:nowD} = getWeekBounds(now, weekFrom);
      return getRangeBudget(store, from, nowD);
    }
    return parseFloat(currentMonth.B)||0;
  }

  // keeps the ring/tiles to at most 6 slices: top 5 by amount + everything else
  // lumped into a single "Остальные" slice, so the tile grid always fits 2×3
  function reduceToTopWithRest(items, limit, otherColor){
    if(items.length<=limit+1) return items.slice();
    const sorted = items.slice().sort((a,b)=>b.amount-a.amount);
    const top = sorted.slice(0,limit);
    const rest = sorted.slice(limit);
    const restSum = rest.reduce((s,c)=>s+c.amount,0);
    if(restSum>0) top.push({name:'Остальные', col: otherColor, amount: restSum, isOther:true, restItems: rest});
    return top;
  }

  const api = {
    P, MONTH_NAMES,
    nextColor, monthKey, defaultCalendarLabel, defaultMonthData,
    fmt, strip, numVal,
    pol, arc, contrastTextColor,
    getWeekBounds, getPeriodCats, getPeriodBudget, getRangeCats, getRangeBudget, reduceToTopWithRest,
    categoryIconSvg, iconKeyFor
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Logic = api;
})(typeof window !== 'undefined' ? window : globalThis);
