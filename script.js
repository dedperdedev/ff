(() => {
  const $ = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => [...el.querySelectorAll(s)];

  // Helper functions for chart data generation (moved before state to fix initialization order)
  function mulberry32(a){
    return function(){
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function genKlineSeries(startValue, candles, seed){
    const rnd = mulberry32(seed >>> 0);
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    const base = Math.max(1e-9, startValue);
    let p = 0; // percent from base, bounded in [-5; 5]
    const out = [];
    let t = Date.now() - 12*60*60*1000;

    for(let i=0;i<candles;i++){
      const oPct = p;

      // More volatility, but with mean reversion so we don't slam into +/-5% constantly.
      const meanRevert = -p * (0.12 + rnd()*0.06);
      const impulse = (rnd() - 0.5) * 3.80;
      p = clamp(p + meanRevert + impulse, -4.7, 4.7);

      const cPct = p;
      const body = Math.abs(cPct - oPct);

      // Taller wicks (still bounded by the +/-5% axis).
      const wickUp = 0.15 + rnd()*1.05;
      const wickDn = 0.15 + rnd()*1.05;
      const hPct = clamp(Math.max(oPct, cPct) + wickUp, -5, 5);
      const lPct = clamp(Math.min(oPct, cPct) - wickDn, -5, 5);

      const o = base * (1 + oPct/100);
      const c = base * (1 + cPct/100);
      const h = base * (1 + hPct/100);
      const l = base * (1 + lPct/100);

      const v = (40 + rnd()*260) * (0.70 + Math.min(3.5, body)*0.75);
      out.push({ o, h, l, c, v, t });
      t += 15*60*1000;
    }
    return out;
  }

  function genMonthlyPerf(seed){
    // fixed-ish demo like Binance monthly bars
    const base = [
      {m:"Jan", v:-3.1},
      {m:"Feb", v:49.0},
      {m:"Mar", v:-22.3},
      {m:"Apr", v:-1.6},
      {m:"May", v:3.5},
      {m:"Jun", v:-42.9},
      {m:"Jul", v:10.0},
      {m:"Aug", v:82.0},
      {m:"Sep", v:-15.9},
      {m:"Oct", v:87.5},
      {m:"Nov", v:39.2},
      {m:"Dec", v:0.0},
    ];
    // tiny deterministic jitter so it feels "alive" but stable
    const rnd = mulberry32((seed ^ 0xA5A5A5A5) >>> 0);
    return base.map(x => ({
      m: x.m,
      v: Math.max(-88, Math.min(88, x.v + (rnd()-0.5)*1.2))
    }));
  }

  const state = {
    tab: "positions",
    balanceUsd: 0.0,
    uf: 9500,
    hideBalance: false,
    // demo data
    profit: 0.0,
    activePositions: [],
    positionsAlt: true,
    chart: [12, 14, 13, 18, 22, 25, 28, 33, 41, 46, 52, 61, 72, 80],
        virtualDeposit: 0.0,
    createDepositAmt: null,
    kline: genKlineSeries(0.0, 48, 1337),
    tf: "12h",
    monthPerf: genMonthlyPerf(1337),
    deals: [
      {sym: "Uniswap (UNI)", dir: "Long (x5)", pct: 3.15, when: "10 авг 2025, 03:45"},
      {sym: "Ethereum (ETH)", dir: "Long (x5)", pct: 5.05, when: "09 авг 2025, 17:06"},
    ],
        user: {
      name: "username",
      id: "75950229",
      wallet: "UQB7kYHhF1gY8q3xj7cVJr2yQvCq1eQ9k2XJcZr7V1z0pW8s",
      lang: "ru",
      vibration: true
    },

    team: {
      totalRewards: 0,
      sessionSize: 725,
      frozen: 9.394,
      pending: 2.5294,
      total: 54,
      active: 54,
      inactive: 0,
      lvl1: { people: 51, pct: 5.00, reward: "+2 PLS / за друга" },
      lvl2: { people: 3, pct: 3.00, reward: "*рефы твоего друга" },
      lvl3: { people: 13, pct: 2.00, reward: "*рефы 2-го уровня" },
      referrals: {
        lvl1: [
          { name: "SpeedDial189", earned: 0.62, avatar: "S" },
          { name: "TheDarknessG", earned: 0.57, avatar: "T" },
          { name: "Serg197205m", earned: 0.48, avatar: "S" },
          { name: "Mtprup", earned: 0.28, avatar: "M" }
        ],
        lvl2: [
          { name: "User1", earned: 0.15, avatar: "U" },
          { name: "User2", earned: 0.12, avatar: "U" }
        ],
        lvl3: [
          { name: "User3", earned: 0.08, avatar: "U" }
        ]
      },
      selectedLevel: 1
    },
    refLink: "t.me/bot?startapp=referr_demo",
    deposit: {
  coin: null,
  tonAddr: "UQB7kYHhF1gY8q3xj7cVJr2yQvCq1eQ9k2XJcZr7V1z0pW8s",
  starsToTonRate: 0.001 // 1 Star = 0.001 TON (примерный курс)
}
  };

  function tonLogoSVG(size = 24){
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="#FFFFFF" d="M19.011 9.201L12.66 19.316a.857.857 0 0 1-1.453-.005L4.98 9.197a1.8 1.8 0 0 1-.266-.943a1.856 1.856 0 0 1 1.881-1.826h10.817c1.033 0 1.873.815 1.873 1.822c0 .334-.094.664-.274.951M6.51 8.863l4.632 7.144V8.143H6.994c-.48 0-.694.317-.484.72m6.347 7.144l4.633-7.144c.214-.403-.005-.72-.485-.72h-4.148z"/></svg>`;
  }

  const icons = {
    coins: {
      USDT: coinSVG("T"),
      BNB: coinSVG("B"),
      BTC: coinSVG("₿"),
      ETH: coinSVG("◇"),
      TON: coinSVG("V"),
      LTC: coinSVG("Ł"),
      USDC: coinSVG("$"),
    }
  };

  function coinSVG(letter){



    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4a8 8 0 1 0 0 16a8 8 0 0 0 0-16Z"/>
        <path d="M12 8v8"/>
        <path d="M9 10h6"/>
      </svg>
    `;
  }

  function fmtMoney(v){
    const num = Number(v);
    if (num === 0) {
      return "0.0";
    }
    // Убираем лишние нули после запятой
    const s = num.toString();
    // Если число целое, показываем без точки
    if (num % 1 === 0) {
      return num.toString();
    }
    // Убираем лишние нули в конце
    return num.toString().replace(/\.?0+$/, '');
  }
  function fmtInt(v){
    const n = Math.round(Number(v) || 0);
    return n.toLocaleString("ru-RU");
  }
  function fmtPct(p){
    const sign = p > 0 ? "+" : "";
    return sign + p.toFixed(2) + "%";
  }


  function fmtRuSmart(v){
    const abs = Math.abs(v);
    const dp = abs < 0.01 ? 6 : (abs < 1 ? 4 : 2);
    return abs.toLocaleString("ru-RU", {minimumFractionDigits: dp, maximumFractionDigits: dp});
  }

  
  function shortAddr(addr){
    if(!addr) return "";
    const s = String(addr);
    if(s.length <= 14) return s;
    return s.slice(0,6) + "…" + s.slice(-4);
  }

function calcPnlToday(){
    if(!state.activePositions || state.activePositions.length === 0){
      return { usd: "0,00 TON", pct: "0,00 %", cls: "muted" };
    }

    const d = state.kline;
    if(!d || d.length < 2){
      return { usd: "0,00 TON", pct: "0,00 %", cls: "muted" };
    }
    const start = d[0].o;
    const end = d[d.length-1].c;
    const usd = end - start;
    const pct = (usd / start) * 100;

    const sUsd = (usd > 0 ? "+" : (usd < 0 ? "-" : "")) + fmtRuSmart(usd) + " TON";
    const sPct = (pct > 0 ? "+" : (pct < 0 ? "-" : "")) + fmtRuSmart(pct) + " %";
    return { usd: sUsd, pct: sPct, cls: usd >= 0 ? "good" : "bad" };
  }

  function updatePnlDom(){
    const row = $("#pnlTodayRow");
    if(!row) return;
    const val = row.querySelector(".pnl-val");
    if(!val) return;
    const pnl = calcPnlToday();
    val.classList.remove("good","bad","muted");
    val.classList.add(pnl.cls);
    val.innerHTML = `${pnl.usd} <span class="pnl-pct">(${pnl.pct})</span>`;
  }

  const content = $("#content");
  const overlay = $("#overlay");
  const sheetEl = overlay ? $(".sheet", overlay) : null;
  const sheetHeaderEl = overlay ? $(".sheetHeader", overlay) : null;
  const sheetTitle = $("#sheetTitle");
  const sheetBody = $("#sheetBody");
  const sheetClose = $("#sheetClose");
  const toast = $("#toast");

  let klineTimer = null;
  let positionTimer = null;

  function showToast(msg){
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 1400);
  }

  function setTab(tab){
    state.tab = tab;
    if(tab === "positions"){
      ensureKlineTimer();
      ensurePositionTimer();
    } else {
      stopKlineTimer();
      stopPositionTimer();
    }
    render();
  }

  function ensurePositionTimer(){
    if(positionTimer) return;
    positionTimer = setInterval(() => {
      if(state.tab === "positions" && state.activePositions.length > 0){
        render();
      }
    }, 1000);
  }

  function stopPositionTimer(){
    if(!positionTimer) return;
    clearInterval(positionTimer);
    positionTimer = null;
  }


  function updateRefLevelIndicator(){
    const activeCard = $(`.refLevelCard.active`);
    const grid = $(".refLevelGrid");
    let indicator = $("#refLevelIndicator");
    
    if(!activeCard || !grid) return;
    
    if(!indicator){
      indicator = document.createElement("div");
      indicator.id = "refLevelIndicator";
      indicator.className = "refLevelIndicator";
      grid.appendChild(indicator);
      // Wait for next frame to ensure layout is ready
      requestAnimationFrame(() => updateRefLevelIndicator());
      return;
    }
    
    const gridRect = grid.getBoundingClientRect();
    const cardRect = activeCard.getBoundingClientRect();
    
    indicator.style.left = (cardRect.left - gridRect.left) + "px";
    indicator.style.width = cardRect.width + "px";
  }

  function updateNavIndicator(){
    const activeTab = $(`.tab.active`);
    const navrow = $(".navrow");
    let indicator = $("#navIndicator");
    
    if(!activeTab || !navrow) return;
    
    if(!indicator){
      indicator = document.createElement("div");
      indicator.id = "navIndicator";
      indicator.className = "navIndicator";
      navrow.appendChild(indicator);
      // Wait for next frame to ensure layout is ready
      requestAnimationFrame(() => updateNavIndicator());
      return;
    }
    
    const navrowRect = navrow.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    
    indicator.style.left = (tabRect.left - navrowRect.left) + "px";
    indicator.style.width = tabRect.width + "px";
  }

  function renderTopCard(){
    const pnl = calcPnlToday();
    const hidden = !!state.hideBalance;
    const balText = hidden ? "••••••" : fmtMoney(state.balanceUsd);
    const fxdText = hidden ? "••••• FXD" : `${state.uf.toLocaleString("ru-RU")} FXD`;

    const eyeSvg = hidden
      ? `<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><path d="M4 4l16 16"/></svg>`
      : `<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>`;

    return `
      <div class="topcard">
        <div class="tophead">
          <div class="topheadL">
            <div class="topTitle">Мой баланс</div>
            <button type="button" class="eyeBtn" id="btnEye" title="${hidden ? "Показать" : "Скрыть"}">
              <span class="ico" aria-hidden="true">${eyeSvg}</span>
            </button>
          </div>

          <div class="row" style="gap:8px;">
            <div class="iconbtn" id="btnSupport" title="Поддержка">
              <span class="ico" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 16 0"/><path d="M4 12v6a2 2 0 0 0 2 2h1v-8H6a2 2 0 0 0-2 2Z"/><path d="M20 12v6a2 2 0 0 1-2 2h-1v-8h1a2 2 0 0 1 2 2Z"/><path d="M18 19a3 3 0 0 1-3 3h-3"/><path d="M12 22h-2"/></svg>
              </span>
            </div>

            <div class="iconbtn" id="btnSettings" title="Настройки">
              <span class="ico" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.73l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/></svg>
              </span>
            </div>
          </div>
        </div>

        <div class="balance" style="display:flex; align-items:center; gap:8px;">${balText}${hidden ? "" : tonLogoSVG(44)}</div>
        <div class="subBalance">${fxdText}</div>
<div class="pnlrow" id="pnlTodayRow" title="PnL за сегодня">
          <div class="pnl-label">PnL за сегодня</div>
          <div class="pnl-val ${pnl.cls}">${pnl.usd} <span class="pnl-pct">(${pnl.pct})</span></div>
        </div>

        <div class="btnrow">
          <div class="btn primary" id="btnDeposit">
            <span class="ico" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/></svg>
            </span>
            Пополнить
          </div>
          <div class="btn ghost" id="btnWithdraw">
            <span class="ico" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 21V9"/><path d="M7 14l5-5 5 5"/><path d="M4 3h16"/></svg>
            </span>
            Вывести
          </div>
        </div>
      </div>
    `;
  }

  
  
function renderCreateHero(){
    if(state.activePositions.length !== 0) return "";
    return `
      <div class="section">
        <div class="createHero">
          <div class="createHeroTitle">Открой свою позицию и зарабатывай до 30% прибыли.</div>
          <div class="createHeroArrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <button class="createHeroBtn" type="button" id="btnCreatePosHero">
            <span>Открыть позицию</span>
            <span class="bubble" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 6v12"/><path d="M6 12h12"/></svg>
            </span>
          </button>
        </div>
      </div>
    `;
  }

function renderPositions(){
    const items = state.activePositions.map((p, idx) => {
    const cls = p.pct >= 0 ? "good" : "bad";
    const remaining = p.createdAt ? getTimeRemaining(p.createdAt) : 0;
    const isExpired = remaining <= 0;
    const timerText = isExpired ? "00:00:00" : formatCountdown(remaining);
    
    return `
      <div class="posRow" data-pos-id="${p.id}">
        <div class="posLeft">
          <div class="posCoin" aria-hidden="true">${tonLogoSVG(20)}</div>
          <div class="posAmt">${fmtMoney(p.amount)}</div>
        </div>
        <div class="posRight">
          <div class="posPill posPct ${cls}">${fmtPct(p.pct)}</div>
          ${isExpired && !p.claimed ? `
            <button class="posPill posClaim" data-pos-idx="${idx}">Клейм прибыли</button>
          ` : `
            <div class="posPill posTime" data-timer="${p.id}">${timerText}</div>
          `}
        </div>
      </div>
    `;
  }).join("");

    const makeAlt = (state.positionsAlt && state.activePositions.length > 0) ? `
      <div class="bigAction" id="btnCreatePos">
        Создать новую позицию
      </div>
    ` : "";

    return `
      ${renderTopCard()}

      <div class="section">
        <div class="grid2">
          <div class="statcard">
            <div class="k">Текущая прибыль</div>
            <div class="v">${state.profit.toFixed(2)} <span class="usdIcon">${tonLogoSVG(26)}</span></div>
          </div>
          <div class="statcard">
            <div class="k">Активные позиции</div>
            <div class="v">
              <span class="mini">#</span> ${state.activePositions.length}
            </div>
          </div>
        </div>
      </div>

      ${renderCreateHero()}

      <div class="section ${state.activePositions.length ? "" : "hidden"}">
        <div class="klineCard">
          <div class="klineHead">
            <div class="klineTitle">Движение виртуального депозита</div>
            <div class="seg" role="tablist" aria-label="Период">
              <button class="segBtn" type="button" data-tf="12h">12h</button>
              <button class="segBtn" type="button" data-tf="1m">1m</button>
            </div>
          </div>
          <div class="klineWrap compact" id="kWrap12">
            <canvas id="kline" height="190"></canvas>
          </div>
          <div class="klineWrap compact hidden" id="kWrap1m">
            <canvas id="mbar" height="190"></canvas>
          </div>
        </div>
      </div>

<div class="section ${state.activePositions.length ? "" : "hidden"}">
        <div class="h2">Активные позиции</div>
        <div class="posList">
          ${items}
        </div>
        ${makeAlt}
      </div>
    `;
  }

  function renderTasks(){
    const tasks = [
      {t:"Ежедневный чек-ин", r:"+50 FXD", icon: `<svg viewBox="0 0 24 24"><path d="M12 17l-5 3 1.5-5.5L4 10l5.7-.3L12 4l2.3 5.7L20 10l-4.5 4.5L17 20z"/></svg>`, completed: false},
      {t:"Пригласи 1 друга", r:"+10 FXD", icon: `<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`, completed: false},
      {t:"Открой позицию", r:"+0.001 TON", icon: `<svg viewBox="0 0 24 24"><path d="M6 6v12"/><path d="M6 9h4"/><path d="M10 9v10"/><path d="M14 5v14"/><path d="M14 11h4"/><path d="M18 11v7"/></svg>`, completed: false},
    ];

    // Проверяем состояние заданий из state, если есть
    if(!state.tasksCompleted) state.tasksCompleted = {};
    tasks.forEach((task, i) => {
      if(state.tasksCompleted[i]) task.completed = true;
    });

    return `
      ${renderTopCard()}
      <div class="section">
        ${tasks.map((x,i)=>`
          <div class="taskCard ${x.completed ? 'completed' : ''}">
            <div class="taskHeader">
              <div class="taskIcon" aria-hidden="true">
                ${x.icon}
              </div>
              <div class="taskTitle">${x.t}</div>
              <div class="taskReward">
                <span>${x.r}</span>
                ${x.completed 
                  ? `<svg class="taskStatus taskStatusCheck" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`
                  : ''
                }
              </div>
            </div>
            <button class="taskBtn" type="button" data-task="${i}">Выполнить</button>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderTeam(){
    const t = state.team;
    const selectedLevel = t.selectedLevel || 1;
    const currentReferrals = t.referrals[`lvl${selectedLevel}`] || [];

    return `
      ${renderTopCard()}

      <div class="section">
        <div class="refBox">
          <div class="k">Реферальная ссылка</div>
          <div class="refRow">
            <input id="refInput" value="${state.refLink}" readonly />
            <div class="copybtn" id="btnCopyRef" title="Копировать">
              <span class="ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </span>
            </div>
          </div>
          <div class="invite" id="btnInvite">Пригласить друзей</div>
        </div>

        <div class="refLevelGrid">
          <div class="refLevelCard ${selectedLevel === 1 ? 'active' : ''}" data-level="1">
            <div class="refLevelBadge">1 уровень</div>
            <div class="refLevelContent">
              <div class="refLevelNumber">${t.lvl1.people}</div>
              <div class="refLevelPct">${t.lvl1.pct.toFixed(2)}%</div>
            </div>
          </div>

          <div class="refLevelCard ${selectedLevel === 2 ? 'active' : ''}" data-level="2">
            <div class="refLevelBadge">2 уровень</div>
            <div class="refLevelContent">
              <div class="refLevelNumber">${t.lvl2.people}</div>
              <div class="refLevelPct">${t.lvl2.pct.toFixed(2)}%</div>
            </div>
          </div>

          <div class="refLevelCard ${selectedLevel === 3 ? 'active' : ''}" data-level="3">
            <div class="refLevelBadge">3 уровень</div>
            <div class="refLevelContent">
              <div class="refLevelNumber">${t.lvl3.people}</div>
              <div class="refLevelPct">${t.lvl3.pct.toFixed(2)}%</div>
            </div>
          </div>
        </div>

        <div class="refList">
          ${currentReferrals.length > 0 ? currentReferrals.map(ref => `
            <div class="refItem">
              <div class="refAvatar">${ref.avatar}</div>
              <div class="refName">${ref.name}</div>
            </div>
          `).join("") : `
            <div class="refEmpty">Нет рефералов на этом уровне</div>
          `}
        </div>
      </div>
    `;
  }


  function formatCountdown(ms){
    if(ms <= 0) return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
  }

  function getTimeRemaining(createdAt){
    const now = Date.now();
    const elapsed = now - createdAt;
    const duration = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
    const remaining = duration - elapsed;
    return remaining;
  }

  function addDemoPosition(amount){
    const amt = Math.max(0, Number(amount) || 0);

    const now = new Date();
    const hh = String(now.getHours()).padStart(2,"0");
    const mm = String(now.getMinutes()).padStart(2,"0");

    const pct = (Math.random() * 10) - 5; // -5..+5

    state.activePositions.unshift({
      id: Math.random(),
      amount: amt,
      pct: pct,
      createdAt: Date.now(),
      time: `${hh}:${mm}`,
      status: pct < 0 ? "bolt" : "ok",
      claimed: false
    });

    // totals
    state.profit = state.activePositions.length > 0 ? state.activePositions.reduce((acc, p) => acc + (p.amount * (p.pct/100)), 0) : 0.0;
    state.balanceUsd = state.activePositions.length > 0 ? state.activePositions.reduce((acc, p) => acc + p.amount, 0) : 0.0;
    state.virtualDeposit = state.balanceUsd;

    // regenerate kline so PnL feels tied to deposit size
    state.kline = genKlineSeries(Math.max(1, state.virtualDeposit), 48, (Date.now() >>> 0));

    showToast("Позиция открыта (демо)");
    render();
  }

  function openCreateDepositSheet(prefillAmt=null){
    state.createDepositAmt = null;
    const MIN = 0.5;
    const MAX = 5000;

    const clamp = (v) => Math.max(MIN, Math.min(MAX, v));

    openModal("Открытие позиции", `
      <div class="depAmtWrap">
        <div class="depAmtInputRow">
          <input class="depAmtInput" id="depAmtInput" inputmode="decimal" placeholder="Введите сумму депозита" autocomplete="off">
          <div class="cur">${tonLogoSVG(20)}</div>
        </div>

        <button class="depCreateBtn" type="button" id="depCreateOk">Открыть позицию</button>
      </div>
    `);

    const input = $("#depAmtInput", sheetBody);

    if(input && prefillAmt !== null && prefillAmt !== undefined){
      const pv = Number(prefillAmt);
      if(Number.isFinite(pv) && pv > 0){
        state.createDepositAmt = pv;
        input.value = String(pv);
      }
    }

    const parseAmt = () => {
      const raw = (input?.value || "").trim().replace(",", ".");
      // allow digits + dot only
      const cleaned = raw.replace(/[^\d.]/g,"");
      const num = Number(cleaned);
      return Number.isFinite(num) ? num : NaN;
    };

    if(input){
      // keep it sane while typing, but don't fight the user too hard
      input.oninput = () => {
        input.value = input.value.replace(/[^\d.,]/g,"");
      };
      input.onblur = () => {
        const n = parseAmt();
        if(Number.isFinite(n)){
          const v = clamp(n);
          state.createDepositAmt = v;
          input.value = String(v);
        }
      };
      setTimeout(() => { try{ input.focus(); }catch(e){} }, 50);
    }

    const ok = $("#depCreateOk", sheetBody);

    if(ok) ok.onclick = () => {
      const n = parseAmt();
      if(!Number.isFinite(n)){
        showToast("Введите сумму");
        return;
      }
      const v = clamp(n);
      state.createDepositAmt = v;
      addDemoPosition(v);
      closeModal();
      setTab("positions");
    };
  }



  function render(){
    // tabs
    $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === state.tab));
    
    // Update nav indicator position
    updateNavIndicator();

    // page
    let html = "";
    if(state.tab === "positions") html = renderPositions();
if(state.tab === "team") html = renderTeam();
if(state.tab === "tasks") html = renderTasks();
    content.innerHTML = html;

    // wire header buttons
    const btnDeposit = $("#btnDeposit");
    const btnWithdraw = $("#btnWithdraw");
    if(btnDeposit) btnDeposit.onclick = () => openDepositSheet();
    if(btnWithdraw) btnWithdraw.onclick = () => openWithdrawSheet();

    const btnSupport = $("#btnSupport");
const btnSettings = $("#btnSettings");
    const btnEye = $("#btnEye");
    if(btnSupport) btnSupport.onclick = () => showToast("Поддержка: демо");
if(btnSettings) btnSettings.onclick = () => openSettingsSheet();
    if(btnEye) btnEye.onclick = () => {
      state.hideBalance = !state.hideBalance;
      render();
    };

    const pnlRow = $("#pnlTodayRow");
    if(pnlRow) pnlRow.onclick = () => {
      const p = calcPnlToday();
      showToast(`PnL: ${p.usd} (${p.pct})`);
    };

    const btnCreate = $("#btnCreatePos");
    const btnCreateHero = $("#btnCreatePosHero");

    if(btnCreate) btnCreate.onclick = openCreateDepositSheet;
    if(btnCreateHero) btnCreateHero.onclick = openCreateDepositSheet;

    // Handle claim profit buttons
    $$(".posClaim").forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.posIdx);
        const pos = state.activePositions[idx];
        if(pos && !pos.claimed){
          // Claim profit
          pos.claimed = true;
          const profit = pos.amount * (pos.pct/100);
          showToast(`Прибыль ${fmtMoney(profit)} TON получена`);
          
          // Restart position
          pos.createdAt = Date.now();
          pos.claimed = false;
          pos.pct = (Math.random() * 10) - 5;
          
          render();
        }
      };
    });

    // task actions
    $$(".taskCard").forEach(card => {
      card.onclick = (e) => {
        // Не переключать, если клик был на кнопке
        if(e.target.closest('.taskBtn')) return;
        card.classList.toggle('expanded');
      };
    });

    $$(".taskBtn").forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation(); // Предотвратить переключение карточки
        const taskIdx = parseInt(btn.dataset.task);
        // Помечаем задание как выполненное
        if(!state.tasksCompleted) state.tasksCompleted = {};
        state.tasksCompleted[taskIdx] = true;
        showToast("Задание выполнено (демо)");
        // Закрыть карточку после выполнения
        const card = btn.closest('.taskCard');
        if(card) card.classList.remove('expanded');
        // Перерисовываем задания
        render();
      };
    });

    // team actions
    $$(".refLevelCard").forEach(card => {
      card.onclick = () => {
        const level = parseInt(card.dataset.level);
        state.team.selectedLevel = level;
        render();
        // Update indicator position after render
        setTimeout(() => updateRefLevelIndicator(), 50);
      };
    });
    
    // Update ref level indicator
    updateRefLevelIndicator();

    const btnCopyRef = $("#btnCopyRef");
    const refInput = $("#refInput");
    if(btnCopyRef && refInput){
      btnCopyRef.onclick = async () => {
        try{
          await navigator.clipboard.writeText(refInput.value);
          showToast("Ссылка скопирована");
        }catch(e){
          refInput.select();
          document.execCommand("copy");
          showToast("Скопировано (fallback)");
        }
      };
    }
    const btnInvite = $("#btnInvite");
    if(btnInvite) btnInvite.onclick = () => showToast("Инвайт: демо");

    const btnTake = $("#btnTake");
    if(btnTake) btnTake.onclick = () => showToast("Нечего забирать (демо)");

    // chart
    const c = $("#c");
    if(c) drawChart(c, state.chart);

    // timeframe toggle (positions)
    $$(".segBtn").forEach(b => {
      b.classList.toggle("active", b.dataset.tf === state.tf);
      b.onclick = () => {
        state.tf = b.dataset.tf;
        render();
      };
    });

    const w12 = $("#kWrap12");
    const w1m = $("#kWrap1m");
    if(w12 && w1m){
      w12.classList.toggle("hidden", state.tf !== "12h");
      w1m.classList.toggle("hidden", state.tf !== "1m");
    }

    // charts (positions)
    const k = $("#kline");
    const m = $("#mbar");
    if(state.tf === "12h" && k && k.clientWidth > 0){
      drawKline(k, state.kline);
      updatePnlDom();
      ensureKlineTimer();
    }else{
      stopKlineTimer();
      if(m) drawMonthlyBars(m, state.monthPerf);
    }
  }

  function drawChart(canvas, series){
    const ctx = canvas.getContext("2d");
    const W = canvas.width = canvas.clientWidth * devicePixelRatio;
    const H = canvas.height = 120 * devicePixelRatio;

    ctx.clearRect(0,0,W,H);

    // grid
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "rgba(43,49,57,1)";
    ctx.lineWidth = 1 * devicePixelRatio;
    const gridY = 4;
    for(let i=1;i<gridY;i++){
      const y = (H/gridY) * i;
      ctx.beginPath();
      ctx.moveTo(0,y);
      ctx.lineTo(W,y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const min = Math.min(...series);
    const max = Math.max(...series);
    const pad = (max-min) * 0.15 || 1;

    const xStep = W/(series.length-1);
    const mapY = v => {
      const t = (v-(min-pad)) / ((max+pad)-(min-pad));
      return H - t*H;
    };

    // area fill
    ctx.beginPath();
    series.forEach((v,i)=>{
      const x = i*xStep;
      const y = mapY(v);
      if(i===0) ctx.moveTo(x,y);
      else ctx.lineTo(x,y);
    });
    ctx.lineTo(W,H);
    ctx.lineTo(0,H);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0, "rgba(240,185,11,.35)");
    grad.addColorStop(1, "rgba(240,185,11,0)");
    ctx.fillStyle = grad;
    ctx.fill();

    // line
    ctx.beginPath();
    series.forEach((v,i)=>{
      const x = i*xStep;
      const y = mapY(v);
      if(i===0) ctx.moveTo(x,y);
      else ctx.lineTo(x,y);
    });
    ctx.lineWidth = 2.5 * devicePixelRatio;
    ctx.strokeStyle = "rgba(240,185,11,1)";
    ctx.stroke();

    // last dot
    const lx = (series.length-1)*xStep;
    const ly = mapY(series[series.length-1]);
    ctx.beginPath();
    ctx.arc(lx, ly, 4.2*devicePixelRatio, 0, Math.PI*2);
    ctx.fillStyle = "rgba(240,185,11,1)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(lx, ly, 9*devicePixelRatio, 0, Math.PI*2);
    ctx.fillStyle = "rgba(240,185,11,.14)";
    ctx.fill();
  }


  function sma(data, period){
    const res = new Array(data.length).fill(null);
    let sum = 0;
    for(let i=0;i<data.length;i++){
      const v = data[i];
      sum += v;
      if(i >= period) sum -= data[i-period];
      if(i >= period-1) res[i] = sum/period;
    }
    return res;
  }

  function updateKlineLegend(){
    const el = $("#kLegend");
    const maEl = $("#kMA");
    if(!el || !maEl) return;

    const d = state.kline;
    if(!d || !d.length) return;

    const open = d[0].o;
    const close = d[d.length-1].c;
    let high = -Infinity;
    let low = Infinity;
    for(const x of d){
      if(x.h > high) high = x.h;
      if(x.l < low) low = x.l;
    }
    const chgPct = (close/open - 1) * 100;
    const chgCls = chgPct >= 0 ? "tgood" : "tbad";

    const fmt = (n) => {
      const s = n.toFixed(2);
      return s.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };

    el.innerHTML = `
      <span>Открыть <b>${fmt(open)}</b></span>
      <span>Максимум <b>${fmt(high)}</b></span>
      <span>Минимум <b>${fmt(low)}</b></span>
      <span>Закрыть <b>${fmt(close)}</b></span>
      <span class="${chgCls}">ИЗМ <b>${(chgPct>0?"+":"")}${chgPct.toFixed(2)}%</b></span>
    `;

    const closes = d.map(x => x.c);
    const ma7 = sma(closes, 7);
    const ma25 = sma(closes, 25);
    const ma99 = sma(closes, 40); // 99 на 48 свечах не живёт, берём длинную, чтобы выглядело как Binance
    const last = (arr) => {
      for(let i=arr.length-1;i>=0;i--) if(arr[i] != null) return arr[i];
      return null;
    };

    const v7 = last(ma7), v25 = last(ma25), v99 = last(ma99);

    maEl.innerHTML = `
      <span class="ma7">MA(7) <b>${v7?fmt(v7):"—"}</b></span>
      <span class="ma25">MA(25) <b>${v25?fmt(v25):"—"}</b></span>
      <span class="ma99">MA(99) <b>${v99?fmt(v99):"—"}</b></span>
    `;
  }

  function stepKline(){
    const d = state.kline;
    if(!d || d.length < 5) return;

    // update the last candle a bit (fake "live" movement)
    const last = d[d.length-1];
    const o = last.o;
    const base = last.c;

    const jitter = (Math.random() - 0.5) * 0.45; // percent
    const c = base * (1 + jitter/100);

    last.c = c;
    last.h = Math.max(last.h, c, o);
    last.l = Math.min(last.l, c, o);
    last.v = last.v * (0.85 + Math.random()*0.35);

    // occasionally roll in a new candle to keep it "moving"
    if(Math.random() < 0.22){
      const prev = last.c;
      const nO = prev;
      const chg = (Math.random() - 0.48) * 1.10;
      const nC = nO * (1 + chg/100);
      const wickUp = (0.04 + Math.random()*0.28) / 100;
      const wickDn = (0.04 + Math.random()*0.28) / 100;
      const nH = Math.max(nO,nC) * (1 + wickUp);
      const nL = Math.min(nO,nC) * (1 - wickDn);
      const nV = (20 + Math.random()*180) * (0.6 + Math.min(2.5, Math.abs(chg))*0.6);
      const nT = last.t + 15*60*1000;

      d.push({ o:nO, h:nH, l:nL, c:nC, v:nV, t:nT });
      while(d.length > 48) d.shift();
    }
  }

  function ensureKlineTimer(){
    if(klineTimer) return;
    klineTimer = setInterval(() => {
      if(state.tab !== "positions") return;
      if(state.tf !== "12h") return;
      stepKline();
      const k = $("#kline");
      if(k && k.clientWidth > 0){
        drawKline(k, state.kline);
        updatePnlDom();
      }
    }, 1800);
  }

  function stopKlineTimer(){
    if(!klineTimer) return;
    clearInterval(klineTimer);
    klineTimer = null;
  }

  function drawKline(canvas, data){
    const ctx = canvas.getContext("2d");

    const css = getComputedStyle(document.documentElement);
    const UP = (css.getPropertyValue("--candleUp").trim() || "#0ECB81");
    const DN = (css.getPropertyValue("--bad").trim() || "#F6465D");
    const GRID = (css.getPropertyValue("--grid").trim() || "rgba(43,49,57,1)");
    const MA7C = (css.getPropertyValue("--accent2").trim() || "#F8D12F");
    const MA25C = (css.getPropertyValue("--ma25").trim() || "#E13CBB");
    const MA99C = (css.getPropertyValue("--ma99").trim() || "#8B6BFF");
    const MUTED = (css.getPropertyValue("--muted").trim() || "#848E9C");

    const dpr = devicePixelRatio || 1;
    const W = canvas.width = Math.floor(canvas.clientWidth * dpr);
    const H = canvas.height = Math.floor(190 * dpr);

    ctx.clearRect(0,0,W,H);

    const padL = 10 * dpr;
    const padR = 46 * dpr;
    const padT = 8 * dpr;
    const padB = 10 * dpr;

    const priceH = Math.floor(H - padT - padB);
// bounds
    // Volume stays real, but the *price axis* is now percent change of the virtual deposit.
    // Fixed range requested: -5% .. +5%.
    const base = (data && data.length ? (data[0].o || data[0].c || 1) : 1);
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const toPct = (v) => ((v / base) - 1) * 100;
    const min = -5;
    const max =  5;

    const n = data.length;
    const slot = (W - padL - padR) / n;
    const bodyW = Math.max(3*dpr, Math.min(slot*0.85, 14*dpr));

    const yPrice = (raw) => {
      // Map raw value -> percent change, then clamp into [-5; 5] to keep the axis stable.
      const v = clamp(toPct(raw), min, max);
      const t = (v - min) / (max - min);
      return padT + priceH - t * priceH;
    };

    // grid
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1 * dpr;
    ctx.globalAlpha = 0.38;

    const gy = 4;
    for(let i=0;i<=gy;i++){
      const y = padT + (priceH/gy)*i;
      ctx.beginPath();
      ctx.moveTo(0,y);
      ctx.lineTo(W,y);
      ctx.stroke();
    }
    // vertical grid
    const gx = 4;
    for(let i=0;i<=gx;i++){
      const x = padL + ((W - padL - padR)/gx)*i;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, H-padB);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // right axis labels
    ctx.fillStyle = MUTED;
    ctx.font = `${11*dpr}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const fmtPctAxis = (v) => {
      const s = (Math.abs(v) < 1e-9) ? "0" : (v.toFixed(1).replace(/\.0$/, ""));
      return s + "%";
    };
    const labelYs = [padT + 2*dpr, padT + priceH/2, padT + priceH - 2*dpr];
    const labelVals = [max, (max+min)/2, min];
    for(let i=0;i<labelYs.length;i++){
      ctx.fillText(fmtPctAxis(labelVals[i]), W - 6*dpr, labelYs[i]);
    }

    // candles
    for(let i=0;i<n;i++){
      const x = padL + i*slot + slot/2;
      const c = data[i];

      const up = c.c >= c.o;
      const col = up ? UP : DN;

      const yO = yPrice(c.o);
      const yC = yPrice(c.c);
      const yH = yPrice(c.h);
      const yL = yPrice(c.l);

      // wick
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.2*dpr;
      ctx.beginPath();
      ctx.moveTo(x, yH);
      ctx.lineTo(x, yL);
      ctx.stroke();

      // body
      const top = Math.min(yO,yC);
      const bot = Math.max(yO,yC);
      const h = Math.max(1.2*dpr, bot-top);
      ctx.fillStyle = col;
      ctx.fillRect(x - bodyW/2, top, bodyW, h);
}

    // MA lines
    const closes = data.map(x => x.c);
    const ma7 = sma(closes, 7);
    const ma25 = sma(closes, 25);
    const ma99 = sma(closes, 40);

    function drawMA(arr, color){
      ctx.beginPath();
      let started = false;
      for(let i=0;i<n;i++){
        const v = arr[i];
        if(v == null) continue;
        const x = padL + i*slot + slot/2;
        const y = yPrice(v);
        if(!started){ ctx.moveTo(x,y); started = true; }
        else ctx.lineTo(x,y);
      }
      if(!started) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6*dpr;
      ctx.globalAlpha = 0.95;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    drawMA(ma7, MA7C);
    drawMA(ma25, MA25C);
    drawMA(ma99, MA99C);
  }

  function drawMonthlyBars(canvas, items){
    const ctx = canvas.getContext("2d");
    const css = getComputedStyle(document.documentElement);
    const UP = (css.getPropertyValue("--pnlGreen").trim() || "#0ECB81");
    const DN = (css.getPropertyValue("--bad").trim() || "#F6465D");
    const GRID = (css.getPropertyValue("--grid").trim() || "rgba(43,49,57,1)");
    const MUTED = (css.getPropertyValue("--muted").trim() || "#848E9C");

    const dpr = devicePixelRatio || 1;
    const W = canvas.width = Math.floor(canvas.clientWidth * dpr);
    const H = canvas.height = Math.floor(190 * dpr);
    ctx.clearRect(0,0,W,H);

    const padL = 34 * dpr;
    const padR = 10 * dpr;
    const padT = 10 * dpr;
    const padB = 28 * dpr;

    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    // axis range like screenshot
    const yMax = 88;
    const yMin = -88;

    const y = (v) => {
      const t = (v - yMin) / (yMax - yMin);
      return padT + (1 - t) * plotH;
    };

    // grid lines
    ctx.lineWidth = 1 * dpr;
    ctx.strokeStyle = GRID;
    ctx.globalAlpha = 0.55;
    const ticks = [88, 44, 0, -44, -88];
    for(const t of ticks){
      const yy = Math.round(y(t)) + 0.5*dpr;
      ctx.beginPath();
      ctx.moveTo(padL, yy);
      ctx.lineTo(W - padR, yy);
      ctx.stroke();

      ctx.globalAlpha = 0.9;
      ctx.fillStyle = MUTED;
      ctx.font = `${11*dpr}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      const label = (t===0? "0%": `${t.toFixed(0)}%`);
      ctx.fillText(label, padL - 8*dpr, yy);
      ctx.globalAlpha = 0.55;
    }
    ctx.globalAlpha = 1;

    const n = Math.max(1, items?.length || 0);
    const gap = 8 * dpr;
    const bw = Math.max(6*dpr, Math.floor((plotW - gap*(n-1)) / n));
    const baseY = y(0);

    // bars + labels + month text
    ctx.textAlign = "center";
    ctx.font = `${12*dpr}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    for(let i=0;i<n;i++){
      const it = items[i];
      const v = it.v;
      const x = padL + i*(bw+gap) + bw/2;

      const yy = y(v);
      const top = Math.min(yy, baseY);
      const bot = Math.max(yy, baseY);
      const h = Math.max(2*dpr, bot-top);

      const col = v >= 0 ? UP : DN;
      ctx.fillStyle = col;

      // rounded rect
      const r = 6*dpr;
      const left = x - bw/2;
      const right = x + bw/2;
      const tY = top;
      const bY = top + h;

      ctx.beginPath();
      if(v >= 0){
        // round top
        ctx.moveTo(left, bY);
        ctx.lineTo(left, tY + r);
        ctx.quadraticCurveTo(left, tY, left + r, tY);
        ctx.lineTo(right - r, tY);
        ctx.quadraticCurveTo(right, tY, right, tY + r);
        ctx.lineTo(right, bY);
        ctx.closePath();
      }else{
        // round bottom
        ctx.moveTo(left, tY);
        ctx.lineTo(left, bY - r);
        ctx.quadraticCurveTo(left, bY, left + r, bY);
        ctx.lineTo(right - r, bY);
        ctx.quadraticCurveTo(right, bY, right, bY - r);
        ctx.lineTo(right, tY);
        ctx.closePath();
      }
      ctx.fill();

      // value label
      ctx.fillStyle = v >= 0 ? "#EAECEF" : "#EAECEF";
      ctx.textBaseline = v >= 0 ? "bottom" : "top";
      const vy = v >= 0 ? (top - 6*dpr) : (bot + 6*dpr);
      const txt = `${v.toFixed(1)}%`;
      ctx.fillText(txt, x, vy);

      // month label
      ctx.fillStyle = MUTED;
      ctx.textBaseline = "alphabetic";
      ctx.font = `${12*dpr}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      ctx.fillText(it.m, x, H - 8*dpr);
    }
  }


  function openModal(title, bodyHtml, opts={}){
    if(!overlay || !sheetTitle || !sheetBody) return;

    // reset modes
    if(sheetEl) sheetEl.classList.remove("fullscreen");
    if(sheetHeaderEl) sheetHeaderEl.style.display = "";
    overlay.dataset.lock = "0";

    if(opts.fullscreen){
      if(sheetEl) sheetEl.classList.add("fullscreen");
      if(sheetHeaderEl) sheetHeaderEl.style.display = "none";
    }
    if(opts.lock){
      overlay.dataset.lock = "1";
    }

    sheetTitle.textContent = title || "";
    sheetBody.innerHTML = bodyHtml;
    overlay.classList.remove("closing");
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden","false");
  }

  function closeModal(){
    if(!overlay) return;
    overlay.classList.add("closing");
    overlay.setAttribute("aria-hidden","true");
    setTimeout(() => {
      overlay.classList.remove("show","closing");
      overlay.dataset.lock = "0";
      if(sheetEl) sheetEl.classList.remove("fullscreen");
      if(sheetHeaderEl) sheetHeaderEl.style.display = "";
    }, 170);
  }

  if(sheetClose) sheetClose.onclick = closeModal;
  if(overlay){
    overlay.addEventListener("click", (e) => {
      if(e.target === overlay && overlay.dataset.lock !== "1") closeModal();
    });
  }

  function openSettingsSheet(){
    openModal("Настройки", `
      <div class="setSection">
        <div class="setProfile">
          <div class="avatar" aria-hidden="true"></div>
          <div class="setProfileInfo">
            <div class="setName">${state.user.name}</div>
            <div class="setId">
              <span>ID: ${state.user.id}</span>
              <button class="copyIdBtn" type="button" id="copyId" aria-label="Копировать ID">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="setSection">
        <div class="walletBtn">
          <div class="wL">
            <div class="wLbl">Wallet</div>
            <div class="wAddr">${shortAddr(state.user.wallet)}</div>
          </div>
        </div>
      </div>

      <div class="setSection">
        <div class="setRow">
          <div class="setK">Язык</div>
          <div class="pillSeg" role="tablist" aria-label="Язык">
            <button class="pillBtn" type="button" data-lang="ru">RU</button>
            <button class="pillBtn" type="button" data-lang="en">EN</button>
          </div>
        </div>

      </div>

      <div class="setSection">
        <button class="lineBtn" type="button" id="btnGuide">
          <span>Гайд</span>
          <span class="chev" aria-hidden="true">›</span>
        </button>
      </div>

      <div class="setSection">
        <div class="setSocial">
          <button class="socBtn" type="button" id="socTg" aria-label="Telegram">
            <svg viewBox="0 0 24 24"><path d="M21 5 3 12l6 2 2 6 3-4 5 4 2-15Z"/><path d="M9 14 19 7"/></svg>
          </button>
          <button class="socBtn" type="button" id="socSup" aria-label="Поддержка">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/></svg>
          </button>
          <button class="socBtn" type="button" id="socX" aria-label="X">
            <svg viewBox="0 0 24 24"><path d="M4 4l16 16"/><path d="M20 4 4 20"/></svg>
          </button>
        </div>
      </div>
    `);

    // set active pills
    $$(".pillBtn[data-lang]", sheetBody).forEach(b => {
      b.classList.toggle("active", b.dataset.lang === state.user.lang);
      b.onclick = () => { state.user.lang = b.dataset.lang; openSettingsSheet(); };
    });


    const copyId = $("#copyId", sheetBody);
    if(copyId){
      copyId.onclick = async () => {
        try{
          await navigator.clipboard.writeText(state.user.id);
          showToast("ID скопирован");
        }catch(e){
          showToast("Копирование недоступно");
        }
      };
    }

    const g = $("#btnGuide", sheetBody);
    if(g) g.onclick = () => showToast("Гайд: демо");
    const o = $("#btnOnb", sheetBody);
    if(o) o.onclick = () => showToast("Онбординг: демо");

    const tg = $("#socTg", sheetBody);
    if(tg) tg.onclick = () => showToast("Telegram: демо");
    const sup = $("#socSup", sheetBody);
    if(sup) sup.onclick = () => showToast("Поддержка: демо");
    const x = $("#socX", sheetBody);
    if(x) x.onclick = () => showToast("X: демо");
  }

function openDepositSheet(){
    openModal("Выбери валюту для пополнения", `
      <div class="hintCard">
        <div>
          <div class="txt">Подключение кошелька TON</div>
        </div>
        <div class="spark" aria-hidden="true">
          <span class="ico">
            <svg viewBox="0 0 24 24"><path d="M13 2 3 14h8l-1 8 10-12h-8z"/></svg>
          </span>
        </div>
      </div>

      <div class="coinGrid">
        ${coinBtn("TON","Toncoin")}
        ${coinBtn("Stars","Telegram Stars")}
      </div>
    `);

    $$(".coinBtn", sheetBody).forEach(btn => {
      btn.onclick = () => {
        const coin = btn.dataset.coin;
        state.deposit.coin = coin;
        renderDepositScreen(coin);
      };
    });
  }

  function coinBtn(sym, name){
    const logo = sym === "TON" 
      ? tonLogoSVG(34)
      : sym;
    return `
      <div class="coinBtn" data-coin="${sym}">
        <div class="coinBadge">${logo}</div>
        <div style="min-width:0;">
          <div class="nm">${sym}</div>
        </div>
      </div>
    `;
  }

  function renderDepositScreen(coin){
    if(coin === "TON"){
      openModal("", `
        <div class="spacer12"></div>
        <div class="depAmtInputRow">
          <input class="depAmtInput" id="depAmtInput" inputmode="decimal" placeholder="Введите сумму пополнения" autocomplete="off">
          <div class="cur">${tonLogoSVG(20)}</div>
        </div>

        <div class="spacer12"></div>
        <div class="primaryAction" id="depositBtn">Пополнить</div>
      `);

      if(sheetTitle){
        sheetTitle.innerHTML = `<div class="backRow" id="depBack">
          <div class="ico" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </div>
          Назад
        </div>`;
        $("#depBack").onclick = () => openDepositSheet();
      }

      const input = $("#depAmtInput", sheetBody);
      if(input){
        input.oninput = () => {
          input.value = input.value.replace(/[^\d.,]/g,"");
        };
        setTimeout(() => { try{ input.focus(); }catch(e){} }, 50);
      }

      $("#depositBtn").onclick = () => {
        const raw = (input?.value || "").trim().replace(",", ".");
        const cleaned = raw.replace(/[^\d.]/g,"");
        const num = Number(cleaned);
        if(!Number.isFinite(num) || num <= 0){
          showToast("Введите сумму");
          return;
        }
        showToast("Пополнение TON (демо)");
        closeModal();
      };
      return;
    }

    if(coin === "Stars"){
      openModal("", `
        <div class="spacer12"></div>
        <div class="depAmtInputRow">
          <input class="depAmtInput" id="starsAmtInput" inputmode="decimal" placeholder="Введите сумму пополнения" autocomplete="off">
          <div class="coinBadge">Stars</div>
        </div>

        <div class="spacer12"></div>
        <div class="depLine">
          <div class="k">Получите</div>
          <div class="v" id="starsTonAmount">0 TON</div>
        </div>

        <div class="spacer12"></div>
        <div class="primaryAction" id="starsPay">Пополнить</div>
      `);

      if(sheetTitle){
        sheetTitle.innerHTML = `<div class="backRow" id="depBack">
          <div class="ico" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </div>
          Назад
        </div>`;
        $("#depBack").onclick = () => openDepositSheet();
      }

      const input = $("#starsAmtInput", sheetBody);
      const tonAmount = $("#starsTonAmount", sheetBody);
      
      const updateTonAmount = () => {
        if(input && tonAmount){
          const raw = (input.value || "").trim().replace(",", ".");
          const cleaned = raw.replace(/[^\d.]/g,"");
          const num = Number(cleaned);
          if(Number.isFinite(num) && num > 0){
            const ton = (num * state.deposit.starsToTonRate).toFixed(4);
            tonAmount.textContent = `${ton} TON`;
          } else {
            tonAmount.textContent = "0 TON";
          }
        }
      };

      if(input){
        input.oninput = () => {
          input.value = input.value.replace(/[^\d.,]/g,"");
          updateTonAmount();
        };
        setTimeout(() => { try{ input.focus(); }catch(e){} }, 50);
      }

      $("#starsPay").onclick = () => {
        const raw = (input?.value || "").trim().replace(",", ".");
        const cleaned = raw.replace(/[^\d.]/g,"");
        const num = Number(cleaned);
        if(!Number.isFinite(num) || num <= 0){
          showToast("Введите сумму");
          return;
        }
        const ton = num * state.deposit.starsToTonRate;
        showToast(`Пополнение ${num} Stars (${ton.toFixed(4)} TON) - демо`);
        closeModal();
      };
      return;
    }

    // safety fallback
    openDepositSheet();
  }

  function openWithdrawSheet(){
    openModal("Вывод средств", `
      <div class="depLine">
        <div class="k">Доступно</div>
        <div class="v">${fmtMoney(state.balanceUsd)}</div>
      </div>
      <div class="primaryAction" id="wdOk">Вывод</div>
    `);
    $("#wdOk").onclick = closeModal;
  }

  // nav wiring
  $$(".tab").forEach(t => t.onclick = () => setTab(t.dataset.tab));

  // Realistic candle loader animation
  function initCandleLoader(){
    const canvas = document.getElementById('candleLoader');
    if(!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    const width = rect.width;
    const height = rect.height;
    const candleCount = 12;
    const baseY = height / 2;
    
    // Create candles with different sizes and positions
    const candles = [];
    let currentX = 15;
    for(let i = 0; i < candleCount; i++){
      // Разная ширина свечей от 12 до 20 пикселей (меньший разброс)
      const candleWidth = 12 + Math.random() * 8;
      const basePrice = baseY + (Math.random() - 0.5) * 50;
      
      // Разные размеры тел свечей (от 8 до 30 пикселей)
      const bodySize = 8 + Math.random() * 22;
      const isUp = Math.random() > 0.5;
      const open = basePrice + (isUp ? -bodySize/2 : bodySize/2);
      const close = basePrice + (isUp ? bodySize/2 : -bodySize/2);
      
      candles.push({
        x: currentX + candleWidth / 2,
        width: candleWidth,
        basePrice: basePrice,
        open: open,
        close: close,
        high: basePrice - (15 + Math.random() * 25),
        low: basePrice + (15 + Math.random() * 25),
        isUp: isUp,
        speed: 0.2 + Math.random() * 0.2, // Более сбалансированная скорость
        phase: (i * 0.3) + Math.random() * 0.5, // Более упорядоченные фазы
        priceTrend: (Math.random() - 0.5) * 0.15, // Меньший тренд
        volatility: 0.5 + Math.random() * 0.3 // Меньшая волатильность
      });
      
      currentX += candleWidth + (8 + Math.random() * 6);
    }

    let time = 0;
    let progress = 0;
    
    function drawCandle(candle, t){
      // Более сбалансированное движение цены
      const priceMovement = Math.sin(t * candle.speed + candle.phase) * candle.volatility * 15;
      const trend = candle.priceTrend * t * 8;
      
      const currentPrice = candle.basePrice + priceMovement + trend;
      const currentOpen = currentPrice + (candle.open - candle.basePrice);
      const currentClose = currentPrice + (candle.close - candle.basePrice);
      
      // Более стабильные high/low
      const vol = 0.8 + Math.abs(Math.sin(t * candle.speed * 1.2 + candle.phase)) * 0.2;
      const currentHigh = currentPrice - (candle.basePrice - candle.high) * vol;
      const currentLow = currentPrice + (candle.low - candle.basePrice) * vol;
      
      const isUp = currentClose < currentOpen;
      const bodyTop = Math.min(currentOpen, currentClose);
      const bodyBottom = Math.max(currentOpen, currentClose);
      const bodyHeight = Math.max(2, bodyBottom - bodyTop);
      
      // Wick
      ctx.strokeStyle = isUp ? '#0ECB81' : '#F6465D';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(candle.x, currentHigh);
      ctx.lineTo(candle.x, currentLow);
      ctx.stroke();
      
      // Body - используем реальную ширину свечи
      ctx.fillStyle = isUp ? '#0ECB81' : '#F6465D';
      ctx.fillRect(candle.x - candle.width/2, bodyTop, candle.width, bodyHeight);
      
      // Glow
      ctx.shadowBlur = 8;
      ctx.shadowColor = isUp ? 'rgba(14,203,129,.4)' : 'rgba(246,70,93,.4)';
      ctx.fillRect(candle.x - candle.width/2, bodyTop, candle.width, bodyHeight);
      ctx.shadowBlur = 0;
    }
    
    function animate(){
      ctx.clearRect(0, 0, width, height);
      
      time += 0.02;
      progress = Math.min(1, time / 50);
      
      candles.forEach(candle => {
        drawCandle(candle, time);
      });
      
      // Progress bar
      const progressWidth = width * 0.5;
      const progressX = (width - progressWidth) / 2;
      const progressY = height - 15;
      ctx.strokeStyle = 'rgba(43,49,57,.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(progressX, progressY, progressWidth, 3);
      
      ctx.fillStyle = '#F0B90B';
      ctx.fillRect(progressX, progressY, progressWidth * progress, 3);
      
      requestAnimationFrame(animate);
    }
    
    animate();
  }

  // Initialize loader and hide after delay
  initCandleLoader();
  
  setTimeout(() => {
    const loader = document.getElementById('loader');
    const app = document.querySelector('.app');
    if(loader) loader.classList.add('hidden');
    if(app) app.classList.add('loaded');
    
    // first render
    render();
    // Update nav indicator after initial render
    setTimeout(() => updateNavIndicator(), 100);
  }, 2500);
})();

