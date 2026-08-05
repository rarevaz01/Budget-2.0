(function(root){
  const P=["#2E9BFF","#FF9500","#22C55E","#1E5FE0","#FFC400","#00C896","#34D399","#60A5FA","#F59E0B","#14B8A6","#0EA5E9","#F97316"];
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
        {n:"Еда вне дома",a:0,h:[],col:P[6]},
        {n:"Путешествия",a:0,h:[],col:P[7]},
        {n:"Здоровье",a:0,h:[],col:P[8]},
        {n:"Кредиты",a:0,h:[],col:P[9]}
      ],
      hiddenC:[],
      EV:[],
      IN:[]
    };
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

  // now defaults to the real clock but accepts an override so tests can pin the date
  function getWeekBounds(now){
    now = now || new Date();
    const from=new Date(now.getTime()-6*24*60*60*1000);
    from.setHours(0,0,0,0);
    return {from, now};
  }

  // store: the full STORE object ({months, current, ...}). now: optional Date override for tests.
  function getPeriodCats(period, store, otherColor, now){
    const currentMonth = store.months[store.current] || {C:[]};
    if(period==='week'){
      const {from, now:nowD} = getWeekBounds(now);
      const map={};
      Object.values(store.months).forEach(mo=>{
        (mo.C||[]).forEach(c=>{
          (c.h||[]).forEach(item=>{
            const d=new Date(item.d);
            if(d>=from && d<=nowD){
              if(!map[c.n]) map[c.n]={name:c.n, col:c.col, amount:0};
              map[c.n].amount += parseFloat(item.a)||0;
            }
          });
        });
      });
      return Object.values(map).filter(x=>x.amount>0);
    }
    if(period==='year'){
      const year=(store.current||'').split('-')[0];
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

  function getPeriodBudget(period, store, now){
    const currentMonth = store.months[store.current] || {B:0};
    if(period==='year'){
      const year=(store.current||'').split('-')[0];
      let budget=0;
      Object.keys(store.months).forEach(mk=>{
        if(mk.startsWith(year+'-')) budget += parseFloat(store.months[mk].B)||0;
      });
      return budget;
    }
    if(period==='week'){
      const {from, now:nowD} = getWeekBounds(now);
      let budget=0;
      for(let d=new Date(from); d<=nowD; d.setDate(d.getDate()+1)){
        const mo = store.months[monthKey(d)];
        if(mo){
          const daysInMonth = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
          budget += (parseFloat(mo.B)||0)/daysInMonth;
        }
      }
      return budget;
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
    getWeekBounds, getPeriodCats, getPeriodBudget, reduceToTopWithRest
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Logic = api;
})(typeof window !== 'undefined' ? window : globalThis);
