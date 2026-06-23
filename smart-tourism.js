/**
 * Smart Tourism - mock AI engine, route planner, map district panel
 */
(function () {
  'use strict';

  const DATA = () => window.PHATTHALUNG_DATA;

  /* â”€â”€â”€ Data helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function normalizeData() {
    const data = DATA();
    if (!data || data._normalized) return;
    Object.keys(data.places || {}).forEach(districtId => {
      Object.keys(data.places[districtId]).forEach(catId => {
        data.places[districtId][catId].forEach(p => {
          if (!p.id) p.id = Math.random().toString(36).substring(7);
          if (!p.name) p.name = "Untitled place";
          if (!p.duration) p.duration = 1.5;
          if (!p.price) p.price = p.budgetLevel === 'free' ? 'Free' : '?';
          if (!p.budgetLevel) {
            const priceBaht = parseInt((p.price || '0').replace(/,/g, '').replace(/\u0E3F/g, '00'), 10) || 0;
            p.budgetLevel = priceBaht === 0 ? 'free' : priceBaht > 500 ? 'high' : priceBaht < 150 ? 'low' : 'medium';
          }
          if (!p.coordinates) p.coordinates = { lat: 7.616, lng: 100.074 };
          if (!p.tags) p.tags = [];
        });
      });
    });
    data._normalized = true;
  }

  function getAllPlaces(categoryId) {
    normalizeData();
    const data = DATA();
    if (!data) return [];
    const out = [];
    data.districts.forEach((d) => {
      (data.getPlaces(d.id, categoryId) || []).forEach((p) => {
        out.push({
          ...p,
          districtId: d.id,
          districtName: d.name,
          categoryId,
        });
      });
    });
    return out;
  }

  function getDistrict(id) {
    return DATA()?.getDistrict(id) || null;
  }

  const BUDGET_LEVEL_COST = { free: 0, low: 80, medium: 200, high: 450 };
  const HOTEL_PER_NIGHT = { low: 650, medium: 1200, high: 2800 };
  const TRANSPORT_PER_DAY = { low: 250, medium: 400, high: 650 };

  const DISTRICT_ATMOSPHERE = {
    mueang: ['culture', 'food', 'photography'],
    'khuan-khanun': ['nature', 'food', 'family'],
    'khao-chaison': ['nature', 'romantic', 'photography'],
    'kong-ra': ['nature', 'adventure', 'photography'],
    'pak-phayun': ['nature', 'family'],
    'bang-kaeo': ['nature', 'adventure'],
    tamot: ['culture', 'family'],
    'pa-bon': ['nature', 'family'],
    'srinagarindra': ['adventure', 'nature'],
    'si-banphot': ['nature', 'culture'],
    'pa-phayom': ['culture', 'food'],
  };

  const DISTRICT_BADGES = {
    mueang: 'Old town - culture and local food',
    'khuan-khanun': 'Thale Noi - nature and family travel',
    'khao-chaison': 'Sunset viewpoints - romantic route',
    'kong-ra': 'Mountains - adventure and photo spots',
    'pak-phayun': 'Relaxed lake nature - family friendly',
    'bang-kaeo': 'Forest and waterfall - adventure route',
    tamot: 'Local culture - community travel',
    'pa-bon': 'Quiet nature - slow travel',
    'srinagarindra': 'Reservoir and outdoor activities',
    'si-banphot': 'Mountain views - local culture',
    'pa-phayom': 'Local food - community markets',
  };

  const PLANNER_THEMES = [
    { id: 'nature', label: 'Nature' },
    { id: 'romantic', label: 'Romantic' },
    { id: 'food', label: 'Local Food' },
    { id: 'culture', label: 'Culture' },
    { id: 'photography', label: 'Photo Spots' },
    { id: 'family', label: 'Family' },
    { id: 'adventure', label: 'Adventure' },
  ];

  const ATMOSPHERE_LABELS = {
    nature: 'Nature and Thale Noi',
    romantic: 'Romantic and couples',
    photography: 'Photo spots and views',
    family: 'Family and easy travel',
    adventure: 'Adventure and outdoors',
    culture: 'Local culture',
    food: 'Food and markets',
  };

  function districtAtmosphereTags(districtId) {
    return (DISTRICT_ATMOSPHERE[districtId] || ['culture']).map((k) => ATMOSPHERE_LABELS[k] || k);
  }

  function prefsFromWizard(opts) {
    const q = [
      opts.atmosphere,
      opts.travelType,
      opts.budgetRange === 'low' ? 'budget cheap' : opts.budgetRange === 'high' ? 'luxury premium' : 'standard budget',
      `${opts.days} days`,
    ].join(' ');
    const prefs = parsePrefs(q);
    prefs.atmosphere = opts.atmosphere || 'nature';
    prefs.budgetRange = opts.budgetRange || 'medium';
    prefs.travelType = opts.travelType || 'solo';
    prefs.days = opts.days || 1;
    if (opts.travelType === 'couple') prefs.couple = true;
    if (opts.travelType === 'family') prefs.family = true;
    if (opts.travelType === 'solo') prefs.solo = true;
    const atm = opts.atmosphere || 'nature';
    if (atm === 'nature') prefs.nature = true;
    if (atm === 'romantic') { prefs.couple = true; prefs.photo = true; }
    if (atm === 'photography') prefs.photo = true;
    if (atm === 'family') prefs.family = true;
    if (atm === 'adventure') prefs.adventure = true;
    if (atm === 'culture') prefs.culture = true;
    if (atm === 'food') prefs.food = true;
    return prefs;
  }

  function priceToBaht(price) {
    if (!price) return 150;
    const n = (price.match(/\u0E3F/g) || []).length;
    return n <= 1 ? 120 : n === 2 ? 280 : 450;
  }

  function parseBudget(text) {
    const m = text.match(/(\d[\d,]*)\s*(?:baht)?/i);
    if (m) return parseInt(m[1].replace(/,/g, ''), 10);
    if (/ประหยัด|ถูก|cheap|budget/i.test(text)) return 800;
    if (/แพง|หรู|premium|luxury/i.test(text)) return 5000;
    return null;
  }

  function parsePrefs(text) {
    const q = text.toLowerCase();
    return {
      nature: /ธรรมชาติ|ป่า|เขา|nature|eco|lake|bird/i.test(q),
      couple: /แฟน|คนรัก|girlfriend|couple|romantic/i.test(q),
      solo: /คนเดียว|เดี่ยว|solo|alone/i.test(q),
      cafe: /คาเฟ่|cafe|coffee|กาแฟ/i.test(q),
      photo: /ถ่ายรูป|photo|view|sunset|sunrise/i.test(q),
      family: /ครอบครัว|family|เด็ก|kid/i.test(q),
      adventure: /ผจญภัย|adventure|เดินป่า|trek|kayak|active/i.test(q),
      food: /อาหาร|food|eat|restaurant|local|ตลาด|market/i.test(q),
      culture: /วัฒนธรรม|culture|history|heritage|พิพิธภัณฑ์|museum/i.test(q),
      budget: parseBudget(q),
      raw: text,
    };
  }

  function scorePlace(place, prefs) {
    let score = (place.rating || 4) * 10;
    const tags = place.tags || [];
    const suitable = place.suitableFor || [];

    // Score based on new structured tags
    if (prefs.nature && tags.includes('nature')) score += 30;
    if (prefs.couple && (suitable.includes('couple') || tags.includes('romantic'))) score += 25;
    if (prefs.solo && suitable.includes('solo')) score += 20;
    if (prefs.family && suitable.includes('family')) score += 25;
    if (prefs.cafe && tags.includes('cafe')) score += 30;
    if (prefs.photo && tags.includes('photography')) score += 28;
    if (prefs.adventure && tags.includes('adventure')) score += 30;
    if (prefs.food && (tags.includes('food') || place.categoryId === 'restaurants')) score += 35;
    if (prefs.culture && tags.includes('culture')) score += 25;
    if ((prefs.culture || prefs.family) && (tags.includes('workshop') || place.categoryId === 'workshops')) score += 32;

    // Fallback string matching for extra context
    const blob = `${tags.join(' ')} ${(place.description || '').toLowerCase()} ${(place.name || '').toLowerCase()}`;
    if (prefs.nature && /ธรรมชาติ|ป่า|ทะเล|lake|waterfall/i.test(blob)) score += 10;
    if (prefs.photo && /view|sunset|landmark|ถ่ายรูป/i.test(blob)) score += 10;

    // Budget check using new budgetLevel
    if (prefs.budget) {
      if (place.budgetLevel === 'low' || place.budgetLevel === 'free') score += 15;
      if (place.budgetLevel === 'high' && prefs.budget < 1500) score -= 25;
    }

    return score;
  }

  function pickPlaces(prefs, count, districtFilter) {
    const attractions = getAllPlaces('attractions');
    const restaurants = getAllPlaces('restaurants');
    const workshops = getAllPlaces('workshops');
    
    // Group attractions by district so we can ensure the route stays within proximity
    let pool = [...attractions, ...restaurants, ...workshops];
    if (districtFilter) {
      pool = pool.filter((p) => p.districtId === districtFilter);
    } else if (prefs.food && !prefs.nature) {
      pool = [...restaurants, ...workshops.filter((w) => (w.tags || []).includes('food')), ...attractions.filter((a) => /view|market/i.test(a.name))];
    }

    const scored = pool
      .map((p) => ({ place: p, score: scorePlace(p, prefs) }))
      .sort((a, b) => b.score - a.score);

    const seen = new Set();
    const picked = [];
    
    // Attempt to pick top places, but prioritize those near the already picked ones if dayCount is small
    for (const { place } of scored) {
      if (seen.has(place.id)) continue;
      seen.add(place.id);
      picked.push(place);
      if (picked.length >= count) break;
    }

    if (picked.length < count) {
      [...attractions, ...workshops].slice(0, count - picked.length).forEach((p) => {
        if (!seen.has(p.id)) picked.push(p);
      });
    }

    return picked;
  }

  function pickAccommodation(prefs, districtId) {
    const hotels = getAllPlaces('accommodations');
    let pool = districtId ? hotels.filter((h) => h.districtId === districtId) : hotels;
    const scored = pool
      .map((p) => ({ place: p, score: scorePlace(p, prefs) }))
      .sort((a, b) => b.score - a.score);
    return scored[0]?.place || hotels[0] || null;
  }

  function dayTheme(stops, prefs) {
    const tags = stops.flatMap((s) => s.place.tags || []);
    if (tags.includes('nature') || prefs.nature) return 'Nature viewpoints';
    if (prefs.adventure) return 'Outdoor adventure';
    if (prefs.food) return 'Food trip and local markets';
    if (prefs.couple) return 'Romantic slow route';
    if (prefs.family) return 'Easy family trip';
    if (prefs.photo) return 'Photo spots and golden hour';
    return 'Area highlights';
  }

  const TIME_SLOTS = ['08:30', '10:30', '12:30', '14:30', '16:30', '18:00'];

  function getDistance(p1, p2) {
    if (!p1.coordinates || !p2.coordinates) return 999;
    return Math.hypot(p1.coordinates.lat - p2.coordinates.lat, p1.coordinates.lng - p2.coordinates.lng);
  }

  function formatTime(hoursFrom0830) {
    const h = Math.floor(8.5 + hoursFrom0830);
    const m = Math.floor(((8.5 + hoursFrom0830) % 1) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  function buildDays(places, dayCount, prefs = {}) {
    const days = [];
    let unassigned = [...places];

    for (let d = 0; d < dayCount; d++) {
      const dayStops = [];
      let currentHours = 0;

      // Ensure we have at least one place for this day, even if we reuse
      let currentPlace = unassigned.shift() || places[Math.floor(Math.random() * places.length)];
      if (!currentPlace) break; // Should not happen if places has items

      dayStops.push({
        place: currentPlace,
        time: formatTime(currentHours),
        transport: 'Start from accommodation - travel ~20 min',
      });
      currentHours += (currentPlace.duration || 1.5) + 0.5;

      // Try to add up to 2-3 more places to the day
      while (unassigned.length > 0 && currentHours < 8.5) {
        // Find closest place
        unassigned.sort((a, b) => getDistance(currentPlace, a) - getDistance(currentPlace, b));

        const nextPlace = unassigned[0];
        const dist = getDistance(currentPlace, nextPlace);
        
        // If it's too far and we have more days left, save it for tomorrow
        if (dist > 0.08 && dayCount > d + 1 && currentHours >= 4) break;

        currentPlace = unassigned.shift();
        dayStops.push({
          place: currentPlace,
          time: formatTime(currentHours),
          transport: dist < 0.02 ? 'Next stop ~5 min nearby' : 'Next stop ~20 min',
        });
        currentHours += (currentPlace.duration || 1.5) + 0.5;
        
        // Ensure minimum 2 stops, max 4 per day
        if (dayStops.length >= 4) break;
      }

      days.push({ day: d + 1, theme: dayTheme(dayStops, prefs), stops: dayStops });
    }
    return days;
  }

  function pickHiddenGems(districtId, excludeIds, limit = 2) {
    const pool = [...getAllPlaces('attractions'), ...getAllPlaces('restaurants'), ...getAllPlaces('workshops')].filter(
      (p) => p.districtId === districtId && !excludeIds.includes(p.id)
    );
    const tagged = pool.filter((p) => (p.tags || []).some((t) => /hidden|local|secret/i.test(t)));
    const quiet = pool
      .filter((p) => (p.rating || 5) <= 4.65)
      .sort((a, b) => (a.rating || 0) - (b.rating || 0));
    const merged = [...tagged, ...quiet];
    const seen = new Set();
    const out = [];
    for (const p of merged) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
      if (out.length >= limit) break;
    }
    return out;
  }

  function readWizardState(root) {
    const daysBtn = root.querySelector('.planner-day-btn.is-active');
    const themeBtn = root.querySelector('.planner-theme.is-active');
    const budgetBtn = root.querySelector('[data-budget].is-active');
    const travelBtn = root.querySelector('[data-travel].is-active');
    const dateInp = root.querySelector('.planner-start-date');
    const startDate = dateInp?.value ? new Date(dateInp.value + 'T00:00:00') : new Date();
    return {
      days: parseInt(daysBtn?.dataset.days || '1', 10),
      atmosphere: themeBtn?.dataset.theme || 'nature',
      budgetRange: budgetBtn?.dataset.budget || 'medium',
      travelType: travelBtn?.dataset.travel || 'solo',
      startDate,
    };
  }

  function bindWizardControls(root) {
    if (!root || root.dataset.wizardBound) return;
    root.dataset.wizardBound = '1';

    root.querySelectorAll('.planner-day-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        root.querySelectorAll('.planner-day-btn').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
    });
    root.querySelectorAll('.planner-theme').forEach((btn) => {
      btn.addEventListener('click', () => {
        root.querySelectorAll('.planner-theme').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
    });
    root.querySelectorAll('[data-budget]').forEach((btn) => {
      btn.addEventListener('click', () => {
        root.querySelectorAll('[data-budget]').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
    });
    root.querySelectorAll('[data-travel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        root.querySelectorAll('[data-travel]').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
    });
  }

  // â”€â”€â”€ Date helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const THAI_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const THAI_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function formatThaiDate(date) {
    const d = THAI_DAYS[date.getDay()];
    const dd = date.getDate();
    const mm = THAI_MONTHS[date.getMonth()];
    const yy = date.getFullYear() + 543;
    return `${d} ${dd} ${mm} ${yy}`;
  }

  function todayInputValue() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function getStartDateFromWizard(root) {
    const inp = root.querySelector('.planner-start-date');
    if (inp && inp.value) return new Date(inp.value + 'T00:00:00');
    return new Date();
  }

  function wizardControlsHTML(compact) {
    const cls = compact ? ' planner-block--compact' : '';
    const todayVal = todayInputValue();
    return `
      <div class="planner-block${cls}">
        <p class="planner-block__label">Start date</p>
        <input type="date" class="planner-start-date" value="${todayVal}" min="${todayVal}" style="width:100%;padding:0.55rem 0.75rem;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.07);color:var(--t-primary,#fff);font-family:var(--font-thai,sans-serif);font-size:0.95rem;cursor:pointer;box-sizing:border-box;" />
      </div>
      <div class="planner-block${cls}">
        <p class="planner-block__label">Trip length</p>
        <div class="planner-days">
          <button type="button" class="planner-day-btn is-active" data-days="1"><span>1</span>day</button>
          <button type="button" class="planner-day-btn" data-days="2"><span>2</span>days</button>
          <button type="button" class="planner-day-btn" data-days="3"><span>3</span>days</button>
        </div>
      </div>
      <div class="planner-block${cls}">
        <p class="planner-block__label">Travel mood</p>
        <div class="planner-theme-grid">
          ${PLANNER_THEMES.map(
            (t, i) =>
              `<button type="button" class="planner-theme${i === 0 ? ' is-active' : ''}" data-theme="${t.id}">${t.label}</button>`
          ).join('')}
        </div>
      </div>
      <div class="planner-block planner-block--row${cls}">
        <div>
          <p class="planner-block__label">Budget</p>
          <div class="planner-opts">
            <button type="button" class="planner-opt" data-budget="low">Budget</button>
            <button type="button" class="planner-opt is-active" data-budget="medium">Standard</button>
            <button type="button" class="planner-opt" data-budget="high">Premium</button>
          </div>
        </div>
        <div>
          <p class="planner-block__label">Travel type</p>
          <div class="planner-opts">
            <button type="button" class="planner-opt is-active" data-travel="solo">Solo</button>
            <button type="button" class="planner-opt" data-travel="couple">Couple</button>
            <button type="button" class="planner-opt" data-travel="family">Family</button>
          </div>
        </div>
      </div>`;
  }

  function runWizardGenerate(root, options = {}) {
    const { targetEl, districtFilter, delay = 900, onComplete } = options;
    const state = readWizardState(root);
    const loading = `<div class="ai-thinking"><span>Building your route</span><div class="ai-thinking__dots"><span></span><span></span><span></span></div></div>`;
    if (targetEl) targetEl.innerHTML = loading;

    setTimeout(() => {
      const route = TravelBrain.generate(state, state.days, districtFilter || null);
      route.startDate = state.startDate || new Date();
      if (targetEl) {
        targetEl.innerHTML = renderRouteResult(route);
        bindRouteActions(targetEl, route);
      }
      if (options.openDashboard !== false) TravelDashboard.open(route);
      onComplete?.(route);
    }, delay);
  }

  function estimateBudgetDetailed(places, days, prefs) {
    let food = 0;
    let attractions = 0;
    places.forEach((p) => {
      const cost = BUDGET_LEVEL_COST[p.budgetLevel] ?? priceToBaht(p.price);
      if (p.categoryId === 'restaurants') food += cost;
      else if (p.categoryId === 'accommodations') return;
      else if (p.categoryId === 'workshops') attractions += cost || 220;
      else attractions += p.entranceFee ?? (p.budgetLevel === 'free' ? 0 : Math.max(30, cost * 0.4));
    });
    const tier = prefs.budgetRange || 'medium';
    const hotelNights = Math.max(0, days - 1);
    const hotel = hotelNights * (HOTEL_PER_NIGHT[tier] || 1200);
    const districts = new Set(places.map((p) => p.districtId)).size;
    const transport = days * (TRANSPORT_PER_DAY[tier] || 400) + districts * 120;
    const buffer = Math.round((food + attractions + hotel + transport) * 0.12);
    const total = food + attractions + hotel + transport + buffer;
    const daily = Math.round(total / days);
    return {
      food: food || 0,
      attractions: Math.round(attractions) || 0,
      hotel: hotel || 0,
      transport: transport || 0,
      buffer: buffer || 0,
      total: total || 0,
      daily: daily || 0,
      min: Math.round(total * 0.9) || 0,
      max: Math.round(total * 1.25) || 0,
    };
  }

  function estimateBudget(places, days, prefs) {
    return estimateBudgetDetailed(places, days, prefs || {}).total;
  }

  function routeTitle(prefs, days) {
    if (prefs.couple) return `Romantic Phatthalung Trip - ${days} day${days > 1 ? 's' : ''}`;
    if (prefs.family) return `Family Phatthalung Trip - ${days} day${days > 1 ? 's' : ''}`;
    if (prefs.solo) return `Solo Slow Travel - ${days} day${days > 1 ? 's' : ''}`;
    if (prefs.cafe) return `Cafe and Chill Route - ${days} day${days > 1 ? 's' : ''}`;
    if (prefs.photo) return `Photo Spot Route - ${days} day${days > 1 ? 's' : ''}`;
    if (prefs.adventure) return `Adventure Trip - ${days} day${days > 1 ? 's' : ''}`;
    if (prefs.nature) return `Nature Trip - Thale Noi and Mountains - ${days} day${days > 1 ? 's' : ''}`;
    if (prefs.food) return `Local Food Trip - ${days} day${days > 1 ? 's' : ''}`;
    return `Recommended Phatthalung Route - ${days} day${days > 1 ? 's' : ''}`;
  }

  function transportHint(days) {
    if (days === 1) return 'Private car or rental car - start early for best timing';
    return 'Private car - stay overnight in Mueang Phatthalung or near Thale Noi';
  }

  const TravelBrain = {
    generate(query, dayCount = 1, districtFilter = null) {
      const prefs =
        typeof query === 'object' && query !== null
          ? { ...prefsFromWizard(query), raw: '' }
          : parsePrefs(query || '');
          
      // Make SURE days is an integer
      const days = parseInt(typeof query === 'object' ? (query.days || dayCount) : dayCount, 10) || 1;
      
      const allAttractionsAndFood = [...getAllPlaces('attractions'), ...getAllPlaces('restaurants'), ...getAllPlaces('workshops'), ...getAllPlaces('accommodations')];
      
      // Use dynamic picking based on user preferences
      const totalStops = Math.max(days * 3, 5); // Pick enough places for all days
      let places = pickPlaces(prefs, totalStops, districtFilter);
      
      // Failsafe: guarantee at least one place
      if (places.length === 0 && allAttractionsAndFood.length > 0) {
        places.push(allAttractionsAndFood[0]);
      }
      
      if (days > 1) {
        const hotel = pickAccommodation(prefs, districtFilter || places[0]?.districtId);
        if (hotel && !places.find((p) => p.id === hotel.id)) {
          places = [...places, { ...hotel, categoryId: 'accommodations' }];
        }
      }

      const visitPlaces = places.filter((p) => p.categoryId !== 'accommodations');
      const routeDays = buildDays(visitPlaces, days, prefs);

      const budgetDetail = estimateBudgetDetailed(places, days, prefs);
      const districtIds = [...new Set(routeDays.flatMap(d => d.stops.map(s => s.place.districtId)))];

      return {
        title: routeTitle(prefs, days),
        prefs,
        days: routeDays,
        budget: budgetDetail.total || 0,
        budgetDetail,
        transport: transportHint(days),
        districtIds,
        places: visitPlaces,
        accommodation: places.find((p) => p.categoryId === 'accommodations') || null,
        summary: this._summary(prefs, days, budgetDetail),
      };
    },

    _summary(prefs, days, budgetDetail) {
      const total = typeof budgetDetail === 'number' ? budgetDetail : budgetDetail.total;
      const parts = [`Planned for ${days} day${days > 1 ? 's' : ''}`, `Estimated budget ~${total.toLocaleString()} baht/person`];
      if (prefs.nature) parts.push('nature and viewpoints');
      if (prefs.food) parts.push('local food included');
      if (prefs.couple) parts.push('romantic stops');
      if (budgetDetail.daily) parts.push(`~${budgetDetail.daily.toLocaleString()} baht/day`);
      return parts.join(' - ');
    },
  };

  /* â”€â”€â”€ Route HTML renderer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function renderRouteResult(route, options = {}) {
    const { showActions = true } = options;

    // Build a pool of alternative places for each stop (same category)
    const allAttractions = getAllPlaces('attractions');
    const allRestaurants = getAllPlaces('restaurants');
    const allAccommodations = getAllPlaces('accommodations');

    function getAlternatives(stop, count = 3) {
      const cat = stop.place.categoryId;
      const pool = cat === 'restaurants' ? allRestaurants
        : cat === 'accommodations' ? allAccommodations
        : allAttractions;
      // Same district preferred, exclude self
      const sameDistrict = pool.filter(p => p.districtId === stop.place.districtId && p.id !== stop.place.id);
      const others = pool.filter(p => p.districtId !== stop.place.districtId && p.id !== stop.place.id);
      const candidates = [...sameDistrict, ...others].slice(0, count);
      return candidates;
    }

    const startDate = route.startDate ? new Date(route.startDate) : new Date();

    const daysHtml = route.days
      .map((day, di) => {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + di);
        const dateLabel = formatThaiDate(dayDate);

        const stopsHtml = day.stops.map((stop, i) => {
          const alts = getAlternatives(stop, 3);
          const catIcon = stop.place.categoryId === 'restaurants' ? 'Food' : stop.place.categoryId === 'accommodations' ? 'Stay' : stop.place.categoryId === 'workshops' ? 'Workshop' : 'Place';
          const catLabel = stop.place.categoryId === 'restaurants' ? 'Food' : stop.place.categoryId === 'accommodations' ? 'Stay' : stop.place.categoryId === 'workshops' ? 'Workshop' : 'Place';

          const altsHtml = alts.length ? `
            <div class="route-stop__alts">
              <div class="route-stop__alts-label">Alternatives:</div>
              <div class="route-stop__alts-list">
                ${alts.map(a => `
                  <button type="button" class="route-alt-chip" 
                    data-place-id="${a.id}" 
                    data-district-id="${a.districtId}" 
                    data-category-id="${a.categoryId || 'attractions'}"
                    title="${a.districtName}">
                    ${a.name}
                    ${a.rating ? `<span class="route-alt-rating">Rating ${a.rating}</span>` : ''}
                  </button>`).join('')}
              </div>
            </div>` : '';

          return `
          <div class="route-stop" data-place-id="${stop.place.id}" data-district-id="${stop.place.districtId}" data-category-id="${stop.place.categoryId}" style="animation-delay:${i * 0.08}s">
            <img class="route-stop__img" src="${stop.place.image || ''}" alt="" loading="lazy" onerror="this.style.display='none'">
            <div class="route-stop__info">
              <div class="route-stop__time">${stop.time}</div>
              <div class="route-stop__name">${stop.place.name}</div>
              <div class="route-stop__district">${stop.place.districtName}</div>
              <div class="route-stop__type">${catLabel} - ${stop.transport}</div>
              ${stop.place.rating ? `<div class="route-stop__rating">Rating ${stop.place.rating}</div>` : ''}
              ${altsHtml}
            </div>
          </div>`;
        }).join('');

        return `
      <div class="route-day">
        <div class="route-day__dot"></div>
        <div class="route-day__header">
          <span class="route-day__title">Day ${day.day}</span>
          <span class="route-day__date">${dateLabel}</span>
          ${day.theme ? `<span class="route-day__theme">${day.theme}</span>` : ''}
        </div>
        ${stopsHtml}
      </div>`;
      })
      .join('');

    const tags = [];
    if (route.prefs.nature) tags.push('Nature');
    if (route.prefs.couple) tags.push('Couple');
    if (route.prefs.family) tags.push('Family');
    if (route.prefs.cafe) tags.push('Cafe');
    if (route.prefs.photo) tags.push('Photo');

    const bd = route.budgetDetail;
    const budgetBlock = bd
      ? `<div class="route-budget-grid">
          <div class="route-budget-item"><span>Food</span><strong>${bd.food.toLocaleString()}</strong></div>
          <div class="route-budget-item"><span>Activities</span><strong>${bd.attractions.toLocaleString()}</strong></div>
          <div class="route-budget-item"><span>Stay</span><strong>${bd.hotel.toLocaleString()}</strong></div>
          <div class="route-budget-item"><span>Transport</span><strong>${bd.transport.toLocaleString()}</strong></div>
        </div>
        <p class="route-budget-range">Estimated range ${bd.min.toLocaleString()} - ${bd.max.toLocaleString()} baht</p>`
      : '';

    return `
      <div class="route-result">
        <div class="route-summary">
          <div class="route-summary__title">${route.title}</div>
          <p style="font-family:var(--font-thai);font-size:0.88rem;color:var(--t-secondary);line-height:1.7">${route.summary}</p>
          <div class="route-summary__budget">
            <span class="route-summary__budget-value">${route.budget.toLocaleString()}</span>
            <span class="route-summary__budget-label">baht / person (estimate)</span>
          </div>
          ${budgetBlock}
          <div class="route-summary__meta">
            ${tags.map((t) => `<span class="route-tag">${t}</span>`).join('')}
            <span class="route-tag">${route.transport}</span>
          </div>
        </div>
        ${daysHtml}
        ${
          showActions
            ? `<div class="route-actions">
            <button type="button" class="btn-primary smart-route-dashboard">Open Travel Dashboard</button>
            <button type="button" class="btn-primary smart-route-map">Show on Map</button>
            <button type="button" class="btn-ghost smart-route-save">Save Route</button>
          </div>`
            : ''
        }
      </div>`;
  }

  function bindRouteActions(container, route) {
    bindRouteStops(container);
    container.querySelectorAll('.route-alt-chip').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const { placeId, districtId, categoryId } = btn.dataset;
        if (window.Router && placeId && districtId) {
          closeAllPanels();
          TravelDashboard.close();
          Router.navigate('place', districtId, categoryId || 'attractions', placeId);
        }
      });
    });
    container.querySelector('.smart-route-map')?.addEventListener('click', () => syncRouteToMap(route));
    container.querySelector('.smart-route-dashboard')?.addEventListener('click', () => TravelDashboard.open(route));
    container.querySelector('.smart-route-save')?.addEventListener('click', () => {
      try {
        localStorage.setItem('phatthalung_saved_route', JSON.stringify(route));
        alert('Route saved');
      } catch (_) {
        alert('Could not save route');
      }
    });
  }
  function renderTravelDashboard(route) {
    const bd = route.budgetDetail || {};
    const stopsCount = route.days.reduce((n, d) => n + d.stops.length, 0);
    const atmosTags = [];
    if (route.prefs.nature) atmosTags.push('ธรรมชาติ');
    if (route.prefs.couple) atmosTags.push('โรแมนติก');
    if (route.prefs.family) atmosTags.push('ครอบครัว');
    if (route.prefs.photo) atmosTags.push('ถ่ายรูป');
    if (route.prefs.adventure) atmosTags.push('Adventure');
    if (route.prefs.food) atmosTags.push('Food');
    if (route.prefs.culture) atmosTags.push('Culture');
    if (route.prefs.budgetRange === 'low') atmosTags.push('Budget');
    if (route.prefs.budgetRange === 'high') atmosTags.push('Premium');

    const highlights = route.places.slice(0, 4);
    const highlightsHtml = highlights
      .map(
        (p) => `
      <article class="dash-highlight" data-place-id="${p.id}" data-district-id="${p.districtId}" data-category-id="${p.categoryId || 'attractions'}">
        <img src="${p.image || ''}" alt="" loading="lazy" onerror="this.style.display='none'">
        <div>
          <div class="dash-highlight__name">${p.name}</div>
          <div class="dash-highlight__meta">${p.districtName} - Rating ${p.rating || '4.5'}</div>
        </div>
      </article>`
      )
      .join('');

    const startDate = route.startDate ? new Date(route.startDate) : new Date();
    const daysHtml = route.days
      .map(
        (day, di) => {
          const dayDate = new Date(startDate);
          dayDate.setDate(startDate.getDate() + di);
          const dateLabel = formatThaiDate(dayDate);
          return `
      <div class="dash-day">
        <div class="dash-day__head">
          <span class="dash-day__num">DAY ${day.day}</span>
          <span class="dash-day__date-label" style="font-size:0.78rem;color:var(--t-secondary,#aaa);font-family:var(--font-thai,sans-serif);margin-left:0.4rem;">${dateLabel}</span>
          <span class="dash-day__theme">${day.theme || ''}</span>
        </div>
        <div class="dash-day__stops">
          ${day.stops
            .map(
              (s) => `
            <div class="dash-stop">
              <span class="dash-stop__time">${s.time}</span>
              <img src="${s.place.image || ''}" alt="" onerror="this.style.display='none'">
              <div>
                <div class="dash-stop__name">${s.place.name}</div>
                <div class="dash-stop__meta">${s.place.districtName}</div>
              </div>
            </div>`
            )
            .join('')}
        </div>
      </div>`;
        }
      )
      .join('');

    return `
      <div class="travel-dashboard__inner">
        <header class="travel-dashboard__hero">
          <span class="travel-dashboard__eyebrow">SMART TOURISM OS</span>
          <h2 class="travel-dashboard__title">${route.title}</h2>
          <p class="travel-dashboard__summary">${route.summary}</p>
          <div class="travel-dashboard__stats">
            <div class="dash-stat"><span>${route.days.length}</span><label>days</label></div>
            <div class="dash-stat"><span>${stopsCount}</span><label>stops</label></div>
            <div class="dash-stat"><span>${route.districtIds.length}</span><label>districts</label></div>
            <div class="dash-stat dash-stat--gold"><span>${route.budget.toLocaleString()}</span><label>baht/person</label></div>
          </div>
          ${atmosTags.length ? `<div class="dash-atmosphere">${atmosTags.map((t) => `<span>${t}</span>`).join('')}</div>` : ''}
          <p class="dash-transport">ðŸš— ${route.transport}</p>
          ${bd.min ? `<p class="dash-range">Estimated range ${bd.min.toLocaleString()} - ${bd.max.toLocaleString()} baht - ~${(bd.daily || 0).toLocaleString()} baht/day</p>` : ''}
        </header>
        ${
          highlights.length
            ? `<section class="dash-panel dash-panel--highlights">
            <h3 class="dash-panel__title">ไฮไลท์แนะนำ</h3>
            <div class="dash-highlights">${highlightsHtml}</div>
          </section>`
            : ''
        }
        <div class="travel-dashboard__grid">
          <section class="dash-panel">
            <h3 class="dash-panel__title">งบประมาณ</h3>
            <div class="dash-budget-bars">
              <div class="dash-bar"><label>Food</label><div class="dash-bar__track"><div class="dash-bar__fill" style="width:${Math.min(100, (bd.food / route.budget) * 100)}%"></div></div><span>${(bd.food || 0).toLocaleString()}</span></div>
              <div class="dash-bar"><label>Activities</label><div class="dash-bar__track"><div class="dash-bar__fill" style="width:${Math.min(100, (bd.attractions / route.budget) * 100)}%"></div></div><span>${(bd.attractions || 0).toLocaleString()}</span></div>
              <div class="dash-bar"><label>Stay</label><div class="dash-bar__track"><div class="dash-bar__fill" style="width:${Math.min(100, (bd.hotel / route.budget) * 100)}%"></div></div><span>${(bd.hotel || 0).toLocaleString()}</span></div>
              <div class="dash-bar"><label>Transport</label><div class="dash-bar__track"><div class="dash-bar__fill" style="width:${Math.min(100, (bd.transport / route.budget) * 100)}%"></div></div><span>${(bd.transport || 0).toLocaleString()}</span></div>
            </div>
            ${route.accommodation ? `<p class="dash-hotel">Recommended stay: <strong>${route.accommodation.name}</strong> - ${route.accommodation.districtName}</p>` : ''}
          </section>
          <section class="dash-panel dash-panel--wide">
            <h3 class="dash-panel__title">แผนการเดินทาง</h3>
            ${daysHtml}
          </section>
        </div>
        <div class="travel-dashboard__actions">
          <button type="button" class="btn-primary dash-sync-map">Sync with 3D Map</button>
          <button type="button" class="btn-ghost dash-close">Close Dashboard</button>
        </div>
      </div>`;
  }

  const TravelDashboard = {
    el: null,
    currentRoute: null,

    init() {
      this.el = document.getElementById('travelDashboard');
      if (!this.el) return;
      this.el.querySelector('.travel-dashboard__backdrop')?.addEventListener('click', () => this.close());
    },

    open(route) {
      if (!this.el || !route) return;
      this.currentRoute = route;
      const body = this.el.querySelector('.travel-dashboard__body');
      body.innerHTML = renderTravelDashboard(route);
      body.querySelector('.dash-close')?.addEventListener('click', () => this.close());
      body.querySelector('.dash-sync-map')?.addEventListener('click', () => syncRouteToMap(route));
      body.querySelectorAll('.dash-highlight').forEach((el) => {
        el.addEventListener('click', () => {
          if (window.Router) {
            this.close();
            Router.navigate('place', el.dataset.districtId, el.dataset.categoryId, el.dataset.placeId);
          }
        });
      });
      bindRouteStops(body);
      this.el.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      syncRouteToMap(route);
    },
    close() {
      this.el?.classList.remove('is-open');
      if (!document.querySelector('.smart-panel.is-open')) {
        document.body.style.overflow = '';
      }
    },
  };

  function syncRouteToMap(route) {
    if (!route?.districtIds?.length) return;
    if (window.Map3D) {
      if (typeof Map3D.setDistrictHighlights === 'function') {
        Map3D.setDistrictHighlights(route.districtIds, route.districtIds[0]);
      } else {
        Map3D.focusDistrict(route.districtIds[0], false);
      }
      if (typeof Map3D.animateRoutePath === 'function') {
        Map3D.animateRoutePath(route.districtIds);
      }
      const mapSection = document.getElementById('districts');
      if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    TravelDashboard.close();
    closePanel(document.getElementById('aiAssistantPanel'));
    closePanel(document.getElementById('routePlannerPanel'));
  }

  function highlightMapDistricts(ids) {
    if (window.Map3D?.setDistrictHighlights) {
      Map3D.setDistrictHighlights(ids, ids[0]);
      const mapSection = document.getElementById('districts');
      if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function bindRouteStops(container) {
    container.querySelectorAll('.route-stop').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.placeId;
        const districtId = el.dataset.districtId;
        if (window.Router && id && districtId) {
          closeAllPanels();
          TravelDashboard.close();
          const cat = el.dataset.categoryId || 'attractions';
          Router.navigate('place', districtId, cat, id);
        }
      });
    });
  }

  /* â”€â”€â”€ Panel utilities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  let backdropEl = null;

  function ensureBackdrop() {
    if (backdropEl) return backdropEl;
    backdropEl = document.createElement('div');
    backdropEl.className = 'smart-panel-backdrop';
    backdropEl.addEventListener('click', closeAllPanels);
    document.body.appendChild(backdropEl);
    return backdropEl;
  }

  function openPanel(panel) {
    ensureBackdrop().classList.add('is-open');
    panel.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closePanel(panel) {
    panel.classList.remove('is-open');
    if (!document.querySelector('.smart-panel.is-open')) {
      backdropEl?.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  }

  function closeAllPanels() {
    document.querySelectorAll('.smart-panel.is-open').forEach((p) => p.classList.remove('is-open'));
    document.getElementById('mapDistrictPanel')?.classList.remove('is-open');
    TravelDashboard.close();
    backdropEl?.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  /* â”€â”€â”€ AI Assistant â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const SUGGESTION_CHIPS = [
    'Nature trip under 1500 baht',
    'Couple trip for 1 day',
    'Photo spots half-day',
    'Family trip for 1 day',
    'Cafe hopping',
    'Solo slow travel',
  ];
  const TravelAssistant = {
    panel: null,
    messagesContainer: null,
    thinkingEl: null,
    inputEl: null,
    thinking: false,
    chatState: 0,
    chatParams: {},

    init() {
      this.panel = document.getElementById('aiAssistantPanel');
      if (!this.panel) return;

      this.messagesContainer = document.getElementById('aiChatMessages');
      this.thinkingEl = document.getElementById('aiChatThinking');
      this.inputEl = this.panel.querySelector('.ai-chat__input');

      this.panel.querySelector('.smart-panel__close')?.addEventListener('click', () => closePanel(this.panel));
    },

    open() {
      openPanel(this.panel);
      if (this.chatState === 0 && (!this.messagesContainer.innerHTML.trim() || this.messagesContainer.children.length === 0)) {
        this.startConversation();
      }
    },

    startConversation() {
      this.chatState = 0;
      this.chatParams = {};
      this.messagesContainer.innerHTML = '';
      this.addBotMessage("สวัสดีครับ! ยินดีต้อนรับสู่ระบบแนะนำการท่องเที่ยวอัจฉริยะ (AI Travel Planner)<br>ให้ผมช่วยจัดทริปแบบ Exclusive สำหรับคุณไหมครับ?<br>ก่อนอื่น... คุณมีเวลาเที่ยวที่พัทลุงกี่วันครับ?", [
        { label: "ครึ่งวัน (Half-Day)", value: "0.5" },
        { label: "1 วัน (One-Day)", value: "1" },
        { label: "2 วัน 1 คืน", value: "2" },
        { label: "3 วัน 2 คืน", value: "3" }
      ]);
    },

    addBotMessage(text, options) {
      const msg = document.createElement('div');
      msg.className = 'ai-chat__msg ai-chat__msg--bot';
      msg.innerHTML = `<div class="ai-chat__bubble">${text}</div>`;
      
      if (options && options.length > 0) {
        const optsDiv = document.createElement('div');
        optsDiv.className = 'ai-chat__options';
        options.forEach(opt => {
          const btn = document.createElement('button');
          btn.className = 'ai-chat__option-btn';
          btn.innerHTML = opt.label;
          btn.onclick = () => {
            optsDiv.style.pointerEvents = 'none';
            optsDiv.style.opacity = '0.5';
            this.handleUserOption(opt.value, opt.label);
          };
          optsDiv.appendChild(btn);
        });
        msg.appendChild(optsDiv);
      }
      this.messagesContainer.appendChild(msg);
      this.scrollToBottom();
    },

    addUserMessage(text) {
      const msg = document.createElement('div');
      msg.className = 'ai-chat__msg ai-chat__msg--user';
      msg.innerHTML = `<div class="ai-chat__bubble">${text}</div>`;
      this.messagesContainer.appendChild(msg);
      this.scrollToBottom();
    },

    setThinking(isThinking) {
      if (!this.thinkingEl) return;
      if (isThinking) {
        this.thinkingEl.classList.add('is-active');
        this.scrollToBottom();
      } else {
        this.thinkingEl.classList.remove('is-active');
      }
    },

    scrollToBottom() {
      setTimeout(() => {
        if (this.messagesContainer) {
          this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
      }, 50);
    },

    handleUserOption(value, label) {
      this.addUserMessage(label);
      this.setThinking(true);
      
      setTimeout(() => {
        this.setThinking(false);
        
        switch (this.chatState) {
          case 0:
            this.chatParams.days = parseFloat(value);
            this.chatState = 1;
            this.addBotMessage("โอเคครับ รับทราบ! 🗓️<br>เพื่อให้ทริปนี้ตรงใจคุณที่สุด คุณชอบการท่องเที่ยวสไตล์ไหนครับ?", [
              { label: "🌿 ธรรมชาติ & พื้นที่สีเขียว", value: "nature" },
              { label: "☕ คาเฟ่ & ชิลเอาท์", value: "cafe" },
              { label: "📸 ถ่ายรูป & จุดชมวิว", value: "photo" },
              { label: "🏛️ ศิลปะวัฒนธรรม & ประวัติศาสตร์", value: "culture" },
              { label: "🛶 ผจญภัย & กิจกรรม", value: "adventure" }
            ]);
            break;
          case 1:
            this.chatParams[value] = true;
            this.chatState = 2;
            this.addBotMessage("เยี่ยมเลยครับ!<br>เพื่อให้แนะนำสถานที่ได้ถูกใจที่สุด... ปกติเวลาเที่ยวคุณมักจะไปกับใครครับ?", [
              { label: "👫 แฟน / คนรัก", value: "couple" },
              { label: "👨‍👩‍👧 ครอบครัว / เด็ก", value: "family" },
              { label: "👯 แก๊งเพื่อน", value: "friends" },
              { label: "🎒 ลุยเดี่ยว", value: "solo" },
              { label: "💼 คุยงาน / ธุรกิจ", value: "work" }
            ]);
            break;
          case 2:
            this.chatParams[value] = true;
            this.chatState = 3;
            this.addBotMessage("เข้าใจแล้วครับ 👍<br>สุดท้ายนี้... คุณตั้งงบประมาณไว้ประมาณเท่าไหร่สำหรับทริปนี้ครับ?", [
              { label: "💰 ประหยัด (Low)", value: "low" },
              { label: "💵 ปานกลาง (Medium)", value: "medium" },
              { label: "💎 จัดเต็ม (High)", value: "high" }
            ]);
            break;
          case 3:
            this.chatParams.budgetLevel = value;
            this.addBotMessage("ขอบคุณสำหรับข้อมูลครับ! ตอนนี้ผมกำลังประมวลผลข้อมูล... ⏳", []);
            this.setThinking(true);
            setTimeout(() => {
              this.setThinking(false);
              this.generateAndShowDashboard();
            }, 1500);
            break;
        }
      }, 600);
    },

    generateAndShowDashboard() {
        if (this.inputEl) this.inputEl.value = 'กำลังจัดเส้นทางให้คุณ กรุณารอสักครู่...';
        const route = TravelBrain.generate(this.chatParams, this.chatParams.days);
        if (route) {
            TravelDashboard.open(route);
            closePanel(this.panel);
            this.chatState = 0;
            this.messagesContainer.innerHTML = '';
        }
    }
  };

  /* â”€â”€â”€ Route Planner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const RoutePlanner = {
    panel: null,
    districtFilter: null,
    resultEl: null,

    init() {
      this.panel = document.getElementById('routePlannerPanel');
      if (!this.panel) return;
      this.resultEl = this.panel.querySelector('.planner-result');
      const wizard = this.panel.querySelector('.route-wizard');
      if (wizard) bindWizardControls(wizard);

      this.panel.querySelector('.smart-panel__close')?.addEventListener('click', () => closePanel(this.panel));
      this.panel.querySelector('.planner-generate')?.addEventListener('click', () => this.generate());
    },

    open(districtId) {
      this.districtFilter = districtId || null;
      openPanel(this.panel);
    },

    generate() {
      const wizard = this.panel.querySelector('.route-wizard');
      runWizardGenerate(wizard || this.panel, {
        targetEl: this.resultEl,
        districtFilter: this.districtFilter,
        delay: 900,
      });
    },
  };

  /* â”€â”€â”€ Map District Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const MapDistrictPanel = {
    el: null,
    currentId: null,

    init() {
      this.el = document.getElementById('mapDistrictPanel');
      if (!this.el) return;
      this.el.addEventListener('click', (e) => e.stopPropagation());
    },

    open(districtId) {
      const d = getDistrict(districtId);
      if (!d || !this.el) return;
      this.currentId = districtId;

      if (window.Map3D?.setDistrictHighlights) {
        Map3D.setDistrictHighlights([districtId], districtId);
      }

      const attractions = DATA().getPlaces(districtId, 'attractions').slice(0, 4);
      const restaurants = DATA().getPlaces(districtId, 'restaurants').slice(0, 3);
      const accommodations = DATA().getPlaces(districtId, 'accommodations').slice(0, 2);
      const workshops = DATA().getPlaces(districtId, 'workshops').slice(0, 3);
      const atmosphere = districtAtmosphereTags(districtId);
      const topRated = [...attractions, ...restaurants, ...workshops]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 2);
      const excludeIds = [...attractions, ...restaurants, ...accommodations, ...workshops].map((p) => p.id);
      const hiddenGems = pickHiddenGems(districtId, excludeIds, 2);
      const gallery = [
        ...attractions.slice(0, 3).map((p) => ({ ...p, categoryId: 'attractions' })),
        ...restaurants.slice(0, 2).map((p) => ({ ...p, categoryId: 'restaurants' })),
        ...workshops.slice(0, 2).map((p) => ({ ...p, categoryId: 'workshops' })),
      ];
      const badge = DISTRICT_BADGES[districtId] || atmosphere[0] || '';

      const galleryHtml = gallery.length
        ? `<div class="map-district-gallery">${gallery
            .map(
              (p) =>
                `<button type="button" class="map-district-gallery__item" data-place-id="${p.id}" data-district-id="${districtId}" data-category-id="${p.categoryId || 'attractions'}"><img src="${p.image || ''}" alt="" loading="lazy"></button>`
            )
            .join('')}</div>`
        : '';

      const mini = (list, type, cat) =>
        list
          .map(
            (p) => `
        <div class="map-district-mini" data-place-id="${p.id}" data-district-id="${districtId}" data-category-id="${cat}">
          <img src="${p.image || ''}" alt="" loading="lazy" onerror="this.style.background='var(--c-surface-2)'">
          <div>
            <div class="map-district-mini__name">${p.name}</div>
            <div class="map-district-mini__rating">Rating ${p.rating || '4.5'} - ${type}</div>
          </div>
        </div>`
          )
          .join('');

      this.el.innerHTML = `
        <div class="map-district-panel__eyebrow">EXPLORE - SMART MAP</div>
        <h3 class="map-district-panel__name">${d.name}</h3>
        <p class="map-district-panel__tagline">${d.tagline || ''}</p>
        ${badge ? `<div class="map-district-badge">${badge}</div>` : ''}
        <div class="map-atmosphere-tags">
          ${atmosphere.map((t) => `<span class="map-atmosphere-tag">${t}</span>`).join('')}
        </div>
        ${galleryHtml}
        <p class="map-district-panel__history">${(d.history || '').slice(0, 200)}${(d.history || '').length > 200 ? '...' : ''}</p>
        <div class="map-district-panel__section-title">Recommended</div>
        <div class="map-district-mini-grid">${mini(topRated, 'Recommended', topRated[0]?.categoryId || 'attractions')}</div>
        ${
          hiddenGems.length
            ? `<div class="map-district-panel__section-title">Recommended</div>`
            : ''
        }
        <div class="map-district-panel__section-title">Recommended</div>
        <div class="map-district-mini-grid">${mini(attractions, 'Place', 'attractions') || '<p style="color:var(--t-muted);font-size:0.85rem">Adding more data soon</p>'}</div>
        <div class="map-district-panel__section-title">Recommended</div>
        <div class="map-district-mini-grid">${mini(restaurants, 'Food', 'restaurants') || ''}</div>
        ${accommodations.length ? `<div class="map-district-panel__section-title">Recommended</div>` : ''}
        <div class="map-district-panel__actions">
          <button type="button" class="btn-primary map-panel-explore">Explore District</button>
          <button type="button" class="btn-ghost map-panel-plan">Plan This Area</button>
          <button type="button" class="btn-ghost map-panel-close">Close</button>
        </div>`;

      this.el.classList.add('is-open');

      this.el.querySelector('.map-panel-explore')?.addEventListener('click', () => {
        this.close();
        if (window.Router) Router.navigate('district', districtId);
      });
      this.el.querySelector('.map-panel-plan')?.addEventListener('click', () => {
        this.close();
        RoutePlanner.open(districtId);
        RoutePlanner.generate();
      });
      this.el.querySelector('.map-panel-close')?.addEventListener('click', () => this.close());

      this.el.querySelectorAll('.map-district-mini').forEach((row) => {
        row.addEventListener('click', () => {
          const cat = row.dataset.categoryId || 'attractions';
          if (window.Router) Router.navigate('place', row.dataset.districtId, cat, row.dataset.placeId);
        });
      });
      this.el.querySelectorAll('.map-district-gallery__item').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (window.Router) Router.navigate('place', btn.dataset.districtId, btn.dataset.categoryId, btn.dataset.placeId);
        });
      });
    },

    close() {
      this.el?.classList.remove('is-open');
      this.currentId = null;
      if (window.Map3D?.clearDistrictHighlights) Map3D.clearDistrictHighlights();
      if (window.Map3D?.resetZoom) Map3D.resetZoom();
    },
  };

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function injectShell() {
    if (document.getElementById('smartTourismRoot')) return;

    const root = document.createElement('div');
    root.id = 'smartTourismRoot';
    root.innerHTML = `
      <div class="smart-fab-group">
        <button type="button" class="smart-fab smart-fab--primary" id="fabAi" aria-label="AI Travel Assistant">
          <span class="smart-fab__icon">AI</span>
          <span class="smart-fab__label">AI Planner</span>
        </button>
        <button type="button" class="smart-fab" id="fabRoute" aria-label="Route Planner">
          <span class="smart-fab__icon">3D</span>
          <span class="smart-fab__label">Route</span>
        </button>
      </div>

      <aside class="smart-panel" id="aiAssistantPanel" aria-hidden="true">
        <header class="smart-panel__header">
          <div>
            <div class="smart-panel__title">AI Travel Planner</div>
            <div class="smart-panel__subtitle">Smart Tourism - Phatthalung</div>
          </div>
          <button type="button" class="smart-panel__close" aria-label="Close">x</button>
        </header>
        <div class="smart-panel__body" style="display:flex; flex-direction:column; padding: var(--sp-md) var(--sp-lg); overflow:hidden;">
          <div class="ai-chat" id="aiChatWrapper" style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
            <div class="ai-chat__messages" id="aiChatMessages" style="flex:1; overflow-y:auto; padding-right:8px;">
            </div>
            <div class="ai-thinking" id="aiChatThinking" style="display:none; padding-bottom:1rem;">
              Typing <div class="ai-thinking__dots"><span></span><span></span><span></span></div>
            </div>
          </div>
            <input type="text" class="ai-chat__input" placeholder="Type or choose an option above..." disabled />
            <input type="text" class="ai-chat__input" placeholder="Type or choose an option above..." disabled />
          </div>
        </div>
      </aside>

      <aside class="smart-panel" id="routePlannerPanel" aria-hidden="true">
        <header class="smart-panel__header">
          <div>
            <div class="smart-panel__title">Route Planner</div>
            <div class="smart-panel__subtitle">Auto Schedule</div>
          </div>
          <button type="button" class="smart-panel__close" aria-label="Close">x</button>
        </header>
        <div class="smart-panel__body">
          <div class="route-wizard">
            ${wizardControlsHTML(false)}
          </div>
          <button type="button" class="btn-primary planner-generate" style="width:100%;margin:0 0 1.5rem">Generate Route</button>
          <div class="planner-result"></div>
        </div>
      </aside>

      <div class="travel-dashboard" id="travelDashboard" aria-hidden="true">
        <div class="travel-dashboard__backdrop"></div>
        <div class="travel-dashboard__body"></div>
      </div>
    `;
    document.body.appendChild(root);

    document.getElementById('fabAi')?.addEventListener('click', () => TravelAssistant.open());
    document.getElementById('fabRoute')?.addEventListener('click', () => RoutePlanner.open());
  }

  function injectMapPanel() {
    const mapWrap = document.querySelector('.map-hero-fullscreen') || document.getElementById('districts');
    if (!mapWrap || document.getElementById('mapDistrictPanel')) return;
    const panel = document.createElement('div');
    panel.id = 'mapDistrictPanel';
    panel.className = 'map-district-panel glass-strong';
    if (!mapWrap.style.position || mapWrap.style.position === 'static') {
      mapWrap.style.position = 'relative';
    }
    mapWrap.appendChild(panel);
    MapDistrictPanel.el = panel;
  }

  function initHomeSmartSection() {
    const section = document.getElementById('smartOsSection');
    if (!section || section.dataset.bound) return;
    section.dataset.bound = '1';
    const wizard = section.querySelector('.home-wizard');
    if (wizard && !wizard.innerHTML.trim()) {
      wizard.innerHTML = wizardControlsHTML(true);
    }
    if (wizard) bindWizardControls(wizard);

    section.querySelector('.smart-os__cta-primary')?.addEventListener('click', () => {
      if (wizard) {
        runWizardGenerate(wizard, { targetEl: null, delay: 800 });
      }
    });
    section.querySelector('.smart-os__cta-ai')?.addEventListener('click', () => TravelAssistant.open());
    section.querySelector('.smart-os__cta-map')?.addEventListener('click', () => {
      document.getElementById('districts')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  const SmartTourism = {
    init() {
      injectShell();
      injectMapPanel();
      TravelAssistant.init();
      RoutePlanner.init();
      MapDistrictPanel.init();
      TravelDashboard.init();
      initHomeSmartSection();

      const observer = new MutationObserver(() => {
        injectMapPanel();
        initHomeSmartSection();
      });
      const app = document.getElementById('app');
      if (app) observer.observe(app, { childList: true, subtree: true });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllPanels();
      });
    },

    TravelBrain,
    TravelAssistant,
    RoutePlanner,
    MapDistrictPanel,
    TravelDashboard,
    highlightMapDistricts,
    syncRouteToMap,
    closeAllPanels,
  };

  window.SmartTourism = SmartTourism;
  window.MapDistrictPanel = MapDistrictPanel;
  window.TravelBrain = TravelBrain;
  window.TravelDashboard = TravelDashboard;
})();

