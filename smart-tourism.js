/**
 * Smart Tourism - mock AI engine, route planner, map district panel
 */
(function () {
  'use strict';

  const DATA = () => window.PHATTHALUNG_DATA;

  /* ─── i18n (mirrors Lang in index.html, but self-contained) ───────── */
  const STR = {
    th: {
      plannerTitle: 'วางแผนเที่ยว',
      plannerSubtitle: 'ออกแบบทริปพัทลุงในไม่กี่คลิก',
      fabLabel: 'วางแผนเที่ยว',
      generate: 'สร้างแผนเที่ยว',
      close: 'ปิด',
      startDate: 'วันเริ่มเดินทาง',
      tripLength: 'จำนวนวัน',
      travelMood: 'อารมณ์ทริป',
      budget: 'งบประมาณ',
      travelType: 'ประเภททริป',
      day1: '1 วัน', day2: '2 วัน', day3: '3 วัน',
      budgetLow: 'ประหยัด', budgetMid: 'มาตรฐาน', budgetHigh: 'พรีเมียม',
      solo: 'คนเดียว', couple: 'คู่รัก', family: 'ครอบครัว',
      theme_nature: 'ธรรมชาติ', theme_romantic: 'โรแมนติก', theme_food: 'อาหารท้องถิ่น',
      theme_culture: 'วัฒนธรรม', theme_photography: 'จุดถ่ายรูป', theme_family: 'ครอบครัว',
      theme_adventure: 'ผจญภัย',
      perPersonEstimate: 'บาท / คน (ประมาณการ)',
      budgetFood: 'อาหาร', budgetActivities: 'กิจกรรม', budgetStay: 'ที่พัก', budgetTransport: 'เดินทาง',
      estimatedRange: 'ช่วงงบประมาณ {min} - {max} บาท',
      alternatives: 'ตัวเลือกอื่น:',
      rating: 'คะแนน',
      catFood: 'อาหาร', catStay: 'ที่พัก', catWorkshop: 'เวิร์กช็อป', catPlace: 'สถานที่',
      openDashboard: 'เปิดแดชบอร์ดทริป',
      showOnMap: 'ดูบนแผนที่',
      saveRoute: 'บันทึกเส้นทาง',
      routeSaved: 'บันทึกเส้นทางแล้ว',
      routeSaveFailed: 'บันทึกเส้นทางไม่สำเร็จ',
      startFromAccommodation: 'ออกจากที่พัก - เดินทางประมาณ 20 นาที',
      nextStopNear: 'จุดถัดไปใกล้นี้ ~5 นาที',
      nextStopFar: 'จุดถัดไป ~20 นาที',
      days: 'วัน', stops: 'จุดแวะ', districts: 'อำเภอ', perPerson: 'บาท/คน',
      highlights: 'ไฮไลท์แนะนำ',
      budgetTitle: 'งบประมาณ',
      planTitle: 'แผนการเดินทาง',
      recommendedStay: 'ที่พักแนะนำ:',
      syncMap: 'ซิงก์กับแผนที่ 3D',
      closeDashboard: 'ปิดแดชบอร์ด',
      rangeLabel: 'ช่วงงบประมาณ {min} - {max} บาท · เฉลี่ย ~{daily} บาท/วัน',
      exploreSmartMap: 'สำรวจ - แผนที่อัจฉริยะ',
      recommended: 'แนะนำ',
      hiddenGems: 'หลบมุมน่าไป',
      addingMore: 'กำลังเพิ่มข้อมูลเร็ว ๆ นี้',
      exploreDistrict: 'สำรวจอำเภอ',
      planArea: 'วางแผนย่านนี้',
      closePanel: 'ปิด',
      atmo_nature: 'ธรรมชาติและทะเลน้อย',
      atmo_romantic: 'โรแมนติกและคู่รัก',
      atmo_photography: 'จุดถ่ายรูปและวิว',
      atmo_family: 'ครอบครัวและเดินทางง่าย',
      atmo_adventure: 'ผจญภัยและกลางแจ้ง',
      atmo_culture: 'วัฒนธรรมท้องถิ่น',
      atmo_food: 'อาหารและตลาด',
      daysShort: 'วัน',
      title_romantic: 'ทริปโรแมนติกพัทลุง - {d}',
      title_family: 'ทริปครอบครัวพัทลุง - {d}',
      title_solo: 'เที่ยวคนเดียวแบบช้า ๆ - {d}',
      title_cafe: 'เส้นทางคาเฟ่และพักผ่อน - {d}',
      title_photo: 'เส้นทางจุดถ่ายรูป - {d}',
      title_adventure: 'ทริปผจญภัย - {d}',
      title_nature: 'ทริปธรรมชาติ ทะเลน้อยและภูเขา - {d}',
      title_food: 'ทริปอาหารท้องถิ่น - {d}',
      title_default: 'เส้นทางแนะนำพัทลุง - {d}',
      dayTheme_nature: 'จุดชมวิวธรรมชาติ',
      dayTheme_adventure: 'กิจกรรมกลางแจ้ง',
      dayTheme_food: 'ทริปอาหารและตลาดท้องถิ่น',
      dayTheme_romantic: 'เส้นทางโรแมนติกแบบช้า ๆ',
      dayTheme_family: 'ทริปครอบครัวเดินทางง่าย',
      dayTheme_photo: 'จุดถ่ายรูปและช่วงแสงสวย',
      dayTheme_default: 'ไฮไลท์ในพื้นที่',
      transport1day: 'รถส่วนตัวหรือรถเช่า - ออกเช้าเพื่อจับเวลาให้ดี',
      transportMulti: 'รถส่วนตัว - พักค้างในเมืองพัทลุงหรือใกล้ทะเลน้อย',
      summaryPlanned: 'วางแผน {d}',
      summaryBudget: 'งบประมาณประมาณ ~{total} บาท/คน',
      summaryNature: 'เน้นธรรมชาติและจุดชมวิว',
      summaryFood: 'รวมอาหารท้องถิ่น',
      summaryRomantic: 'มีจุดแวะโรแมนติก',
      summaryDaily: 'เฉลี่ย ~{daily} บาท/วัน',
      untitled: 'สถานที่ไม่มีชื่อ',
      badge_mueang: 'เมืองเก่า - วัฒนธรรมและอาหารท้องถิ่น',
      badge_khuan_khanun: 'ทะเลน้อย - ธรรมชาติและครอบครัว',
      badge_khao_chaison: 'จุดชมพระอาทิตย์ตก - เส้นทางโรแมนติก',
      badge_kong_ra: 'ภูเขา - ผจญภัยและจุดถ่ายรูป',
      badge_pak_phayun: 'ทะเลสาบสบาย ๆ - เหมาะกับครอบครัว',
      badge_bang_kaeo: 'ป่าและน้ำตก - เส้นทางผจญภัย',
      badge_tamot: 'วัฒนธรรมท้องถิ่น - เที่ยวชุมชน',
      badge_pa_bon: 'ธรรมชาติเงียบสงบ - เที่ยวช้า ๆ',
      badge_srinagarindra: 'อ่างเก็บน้ำและกิจกรรมกลางแจ้ง',
      badge_si_banphot: 'วิวภูเขา - วัฒนธรรมท้องถิ่น',
      badge_pa_phayom: 'อาหารท้องถิ่น - ตลาดชุมชน',
      dayLabel: 'วันที่',
    },
    en: {
      plannerTitle: 'Trip Planner',
      plannerSubtitle: 'Plan your Phatthalung trip',
      fabLabel: 'Trip Planner',
      generate: 'Build my route',
      close: 'Close',
      startDate: 'Start date',
      tripLength: 'Trip length',
      travelMood: 'Travel mood',
      budget: 'Budget',
      travelType: 'Travel type',
      day1: '1 day', day2: '2 days', day3: '3 days',
      budgetLow: 'Budget', budgetMid: 'Standard', budgetHigh: 'Premium',
      solo: 'Solo', couple: 'Couple', family: 'Family',
      theme_nature: 'Nature', theme_romantic: 'Romantic', theme_food: 'Local Food',
      theme_culture: 'Culture', theme_photography: 'Photo Spots', theme_family: 'Family',
      theme_adventure: 'Adventure',
      perPersonEstimate: 'baht / person (estimate)',
      budgetFood: 'Food', budgetActivities: 'Activities', budgetStay: 'Stay', budgetTransport: 'Transport',
      estimatedRange: 'Estimated range {min} - {max} baht',
      alternatives: 'Alternatives:',
      rating: 'Rating',
      catFood: 'Food', catStay: 'Stay', catWorkshop: 'Workshop', catPlace: 'Place',
      openDashboard: 'Open Travel Dashboard',
      showOnMap: 'Show on Map',
      saveRoute: 'Save Route',
      routeSaved: 'Route saved',
      routeSaveFailed: 'Could not save route',
      startFromAccommodation: 'Leave the hotel - about 20 min drive',
      nextStopNear: 'Next stop ~5 min away',
      nextStopFar: 'Next stop ~20 min',
      days: 'days', stops: 'stops', districts: 'districts', perPerson: 'baht/person',
      highlights: 'Trip highlights',
      budgetTitle: 'Budget',
      planTitle: 'Day-by-day plan',
      recommendedStay: 'Recommended stay:',
      syncMap: 'Sync with 3D Map',
      closeDashboard: 'Close Dashboard',
      rangeLabel: 'Estimated range {min} - {max} baht · about {daily} baht/day',
      exploreSmartMap: 'EXPLORE - SMART MAP',
      recommended: 'Recommended',
      hiddenGems: 'Hidden gems',
      addingMore: 'Adding more data soon',
      exploreDistrict: 'Explore District',
      planArea: 'Plan This Area',
      closePanel: 'Close',
      atmo_nature: 'Nature and Thale Noi',
      atmo_romantic: 'Romantic and couples',
      atmo_photography: 'Photo spots and views',
      atmo_family: 'Family and easy travel',
      atmo_adventure: 'Adventure and outdoors',
      atmo_culture: 'Local culture',
      atmo_food: 'Food and markets',
      daysShort: 'days',
      title_romantic: 'Romantic Phatthalung Trip - {d}',
      title_family: 'Family Phatthalung Trip - {d}',
      title_solo: 'Solo Slow Travel - {d}',
      title_cafe: 'Cafe and Chill Route - {d}',
      title_photo: 'Photo Spot Route - {d}',
      title_adventure: 'Adventure Trip - {d}',
      title_nature: 'Nature Trip - Thale Noi and Mountains - {d}',
      title_food: 'Local Food Trip - {d}',
      title_default: 'Recommended Phatthalung Route - {d}',
      dayTheme_nature: 'Nature viewpoints',
      dayTheme_adventure: 'Outdoor adventure',
      dayTheme_food: 'Food trip and local markets',
      dayTheme_romantic: 'Romantic slow route',
      dayTheme_family: 'Easy family trip',
      dayTheme_photo: 'Photo spots and golden hour',
      dayTheme_default: 'Area highlights',
      transport1day: 'Private car or rental car - start early for best timing',
      transportMulti: 'Private car - stay overnight in Mueang Phatthalung or near Thale Noi',
      summaryPlanned: 'Planned for {d}',
      summaryBudget: 'Estimated budget ~{total} baht/person',
      summaryNature: 'nature and viewpoints',
      summaryFood: 'local food included',
      summaryRomantic: 'romantic stops',
      summaryDaily: '~{daily} baht/day',
      untitled: 'Untitled place',
      badge_mueang: 'Old town - culture and local food',
      badge_khuan_khanun: 'Thale Noi - nature and family travel',
      badge_khao_chaison: 'Sunset viewpoints - romantic route',
      badge_kong_ra: 'Mountains - adventure and photo spots',
      badge_pak_phayun: 'Relaxed lake nature - family friendly',
      badge_bang_kaeo: 'Forest and waterfall - adventure route',
      badge_tamot: 'Local culture - community travel',
      badge_pa_bon: 'Quiet nature - slow travel',
      badge_srinagarindra: 'Reservoir and outdoor activities',
      badge_si_banphot: 'Mountain views - local culture',
      badge_pa_phayom: 'Local food - community markets',
      dayLabel: 'Day',
    },
  };

  function lang() {
    if (typeof Lang !== 'undefined' && Lang.current) return Lang.current;
    return document.documentElement.lang === 'en' ? 'en' : 'th';
  }

  function tr(key, vars) {
    const dict = STR[lang()] || STR.th;
    let out = dict[key] != null ? dict[key] : (STR.th[key] != null ? STR.th[key] : key);
    if (vars) {
      Object.keys(vars).forEach((k) => {
        out = out.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      });
    }
    return out;
  }

  function daysText(n) {
    const num = Number(n) || 1;
    return lang() === 'th' ? `${num} วัน` : `${num} ${num > 1 ? 'days' : 'day'}`;
  }

  function pname(place) {
    if (!place) return '';
    return lang() === 'en' && place.nameEn ? place.nameEn : (place.name || '');
  }

  function pdesc(place) {
    if (!place) return '';
    return lang() === 'en' && place.descriptionEn ? place.descriptionEn : (place.description || '');
  }

  function dname(district) {
    if (!district) return '';
    return lang() === 'en' && district.nameEn ? district.nameEn : (district.name || '');
  }

  function pcat(place) {
    if (!place) return tr('catPlace');
    if (place.categoryId === 'restaurants') return tr('catFood');
    if (place.categoryId === 'accommodations') return tr('catStay');
    if (place.categoryId === 'workshops') return tr('catWorkshop');
    return tr('catPlace');
  }

  function catName(catId) {
    const data = DATA();
    const cat = data && data.categories && data.categories[catId];
    if (!cat) return catId;
    return lang() === 'en' && cat.nameEn ? cat.nameEn : cat.name;
  }

  /* â”€â”€â”€ Data helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function normalizeData() {
    const data = DATA();
    if (!data || data._normalized) return;
    Object.keys(data.places || {}).forEach(districtId => {
      Object.keys(data.places[districtId]).forEach(catId => {
        data.places[districtId][catId].forEach(p => {
          if (!p.id) p.id = Math.random().toString(36).substring(7);
          if (!p.name) p.name = tr('untitled');
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
          districtNameEn: d.nameEn || d.name,
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

  const PLANNER_THEMES = [
    { id: 'nature', key: 'theme_nature' },
    { id: 'romantic', key: 'theme_romantic' },
    { id: 'food', key: 'theme_food' },
    { id: 'culture', key: 'theme_culture' },
    { id: 'photography', key: 'theme_photography' },
    { id: 'family', key: 'theme_family' },
    { id: 'adventure', key: 'theme_adventure' },
  ];

  function districtAtmosphereTags(districtId) {
    return (DISTRICT_ATMOSPHERE[districtId] || ['culture']).map((k) => tr('atmo_' + k));
  }

  function districtBadge(districtId) {
    return tr('badge_' + districtId.replace(/-/g, '_'));
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
    if (tags.includes('nature') || prefs.nature) return tr('dayTheme_nature');
    if (prefs.adventure) return tr('dayTheme_adventure');
    if (prefs.food) return tr('dayTheme_food');
    if (prefs.couple) return tr('dayTheme_romantic');
    if (prefs.family) return tr('dayTheme_family');
    if (prefs.photo) return tr('dayTheme_photo');
    return tr('dayTheme_default');
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
        transport: tr('startFromAccommodation'),
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
          transport: dist < 0.02 ? tr('nextStopNear') : tr('nextStopFar'),
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
  const EN_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const TH_DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  function formatDate(date) {
    if (lang() === 'th') {
      return `${TH_DAYS[date.getDay()]} ${date.getDate()} ${TH_MONTHS[date.getMonth()]} ${date.getFullYear() + 543}`;
    }
    return `${EN_DAYS[date.getDay()]} ${date.getDate()} ${EN_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
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
        <p class="planner-block__label">${tr('startDate')}</p>
        <input type="date" class="planner-start-date" value="${todayVal}" min="${todayVal}" style="width:100%;padding:0.65rem 0.85rem;border-radius:10px;border:1.5px solid #CBD5E1;background:#FFFFFF;color:#0F172A;font-family:var(--font-thai,sans-serif);font-size:0.95rem;font-weight:600;cursor:pointer;box-sizing:border-box;box-shadow:0 1px 3px rgba(0,0,0,0.05);outline:none;" />
      </div>
      <div class="planner-block${cls}">
        <p class="planner-block__label">${tr('tripLength')}</p>
        <div class="planner-days">
          <button type="button" class="planner-day-btn is-active" data-days="1"><span>1</span>${lang() === 'th' ? 'วัน' : 'day'}</button>
          <button type="button" class="planner-day-btn" data-days="2"><span>2</span>${lang() === 'th' ? 'วัน' : 'days'}</button>
          <button type="button" class="planner-day-btn" data-days="3"><span>3</span>${lang() === 'th' ? 'วัน' : 'days'}</button>
        </div>
      </div>
      <div class="planner-block${cls}">
        <p class="planner-block__label">${tr('travelMood')}</p>
        <div class="planner-theme-grid">
          ${PLANNER_THEMES.map(
            (t, i) =>
              `<button type="button" class="planner-theme${i === 0 ? ' is-active' : ''}" data-theme="${t.id}">${tr(t.key)}</button>`
          ).join('')}
        </div>
      </div>
      <div class="planner-block planner-block--row${cls}">
        <div>
          <p class="planner-block__label">${tr('budget')}</p>
          <div class="planner-opts">
            <button type="button" class="planner-opt" data-budget="low">${tr('budgetLow')}</button>
            <button type="button" class="planner-opt is-active" data-budget="medium">${tr('budgetMid')}</button>
            <button type="button" class="planner-opt" data-budget="high">${tr('budgetHigh')}</button>
          </div>
        </div>
        <div>
          <p class="planner-block__label">${tr('travelType')}</p>
          <div class="planner-opts">
            <button type="button" class="planner-opt is-active" data-travel="solo">${tr('solo')}</button>
            <button type="button" class="planner-opt" data-travel="couple">${tr('couple')}</button>
            <button type="button" class="planner-opt" data-travel="family">${tr('family')}</button>
          </div>
        </div>
      </div>`;
  }

  function runWizardGenerate(root, options = {}) {
    const { targetEl, districtFilter, delay = 900, onComplete } = options;
    const state = readWizardState(root);
    const loading = `<div class="ai-thinking"><span>${lang() === 'th' ? 'กำลังสร้างเส้นทาง' : 'Building your route'}</span><div class="ai-thinking__dots"><span></span><span></span><span></span></div></div>`;
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
    const d = daysText(days);
    if (prefs.couple) return tr('title_romantic', { d });
    if (prefs.family) return tr('title_family', { d });
    if (prefs.solo) return tr('title_solo', { d });
    if (prefs.cafe) return tr('title_cafe', { d });
    if (prefs.photo) return tr('title_photo', { d });
    if (prefs.adventure) return tr('title_adventure', { d });
    if (prefs.nature) return tr('title_nature', { d });
    if (prefs.food) return tr('title_food', { d });
    return tr('title_default', { d });
  }

  function transportHint(days) {
    return days === 1 ? tr('transport1day') : tr('transportMulti');
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
      const parts = [
        tr('summaryPlanned', { d: daysText(days) }),
        tr('summaryBudget', { total: total.toLocaleString() }),
      ];
      if (prefs.nature) parts.push(tr('summaryNature'));
      if (prefs.food) parts.push(tr('summaryFood'));
      if (prefs.couple) parts.push(tr('summaryRomantic'));
      if (budgetDetail.daily) parts.push(tr('summaryDaily', { daily: budgetDetail.daily.toLocaleString() }));
      return parts.join(' - ');
    },
  };

  /* ─── Image helpers ────────────────────────────────────────────────
   * Many places have image:"" — never emit <img src=""> (it re-requests
   * the document). Render a gradient tile instead.
   * ---------------------------------------------------------------- */
  function hasPhoto(place) {
    return !!(place && place.image && String(place.image).trim());
  }

  const THUMB_PLACEHOLDER = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#38bdf8"/><stop offset="1" stop-color="#0284c7"/></linearGradient></defs><rect width="48" height="48" fill="url(#g)"/><path d="M12 32l8-9 5 6 4-4 7 7z" fill="#ffffff" opacity="0.85"/><circle cx="16" cy="15" r="3" fill="#ffffff" opacity="0.85"/></svg>'
  );

  function thumbHTML(place, className = '', opts = {}) {
    const cls = className ? className + ' ' : '';
    const src = hasPhoto(place) ? place.image : THUMB_PLACEHOLDER;
    return `<img class="${cls}thumb-img" src="${src}" alt="" loading="${opts.eager ? 'eager' : 'lazy'}" onerror="this.style.display='none'">`;
  }

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
        const dateLabel = formatDate(dayDate);

        const stopsHtml = day.stops.map((stop, i) => {
          const alts = getAlternatives(stop, 3);
          const catLabel = pcat(stop.place);

          const altsHtml = alts.length ? `
            <div class="route-stop__alts">
              <div class="route-stop__alts-label">${tr('alternatives')}</div>
              <div class="route-stop__alts-list">
                ${alts.map(a => `
                  <button type="button" class="route-alt-chip" 
                    data-place-id="${a.id}" 
                    data-district-id="${a.districtId}" 
                    data-category-id="${a.categoryId || 'attractions'}"
                    title="${dname({ name: a.districtName, nameEn: a.districtNameEn })}">
                    ${pname(a)}
                    ${a.rating ? `<span class="route-alt-rating">${tr('rating')} ${a.rating}</span>` : ''}
                  </button>`).join('')}
              </div>
            </div>` : '';

          return `
          <div class="route-stop" data-place-id="${stop.place.id}" data-district-id="${stop.place.districtId}" data-category-id="${stop.place.categoryId}" style="animation-delay:${i * 0.08}s">
            ${thumbHTML(stop.place, 'route-stop__img')}
            <div class="route-stop__info">
              <div class="route-stop__time">${stop.time}</div>
              <div class="route-stop__name">${pname(stop.place)}</div>
              <div class="route-stop__district">${dname({ name: stop.place.districtName, nameEn: stop.place.districtNameEn })}</div>
              <div class="route-stop__type">${catLabel} - ${stop.transport}</div>
              ${stop.place.rating ? `<div class="route-stop__rating">${tr('rating')} ${stop.place.rating}</div>` : ''}
              ${altsHtml}
            </div>
          </div>`;
        }).join('');

        return `
      <div class="route-day">
        <div class="route-day__dot"></div>
        <div class="route-day__header">
          <span class="route-day__title">${tr('dayLabel')} ${day.day}</span>
          <span class="route-day__date">${dateLabel}</span>
          ${day.theme ? `<span class="route-day__theme">${day.theme}</span>` : ''}
        </div>
        ${stopsHtml}
      </div>`;
      })
      .join('');

    const tags = [];
    if (route.prefs.nature) tags.push(tr('theme_nature'));
    if (route.prefs.couple) tags.push(tr('theme_romantic'));
    if (route.prefs.family) tags.push(tr('theme_family'));
    if (route.prefs.cafe) tags.push(lang() === 'th' ? 'คาเฟ่' : 'Cafe');
    if (route.prefs.photo) tags.push(tr('theme_photography'));

    const bd = route.budgetDetail;
    const budgetBlock = bd
      ? `<div class="route-budget-grid">
          <div class="route-budget-item"><span>${tr('budgetFood')}</span><strong>${bd.food.toLocaleString()}</strong></div>
          <div class="route-budget-item"><span>${tr('budgetActivities')}</span><strong>${bd.attractions.toLocaleString()}</strong></div>
          <div class="route-budget-item"><span>${tr('budgetStay')}</span><strong>${bd.hotel.toLocaleString()}</strong></div>
          <div class="route-budget-item"><span>${tr('budgetTransport')}</span><strong>${bd.transport.toLocaleString()}</strong></div>
        </div>
        <p class="route-budget-range">${tr('estimatedRange', { min: bd.min.toLocaleString(), max: bd.max.toLocaleString() })}</p>`
      : '';

    return `
      <div class="route-result">
        <div class="route-summary">
          <div class="route-summary__title">${route.title}</div>
          <p style="font-family:var(--font-thai);font-size:0.88rem;color:var(--t-secondary);line-height:1.7">${route.summary}</p>
          <div class="route-summary__budget">
            <span class="route-summary__budget-value">${route.budget.toLocaleString()}</span>
            <span class="route-summary__budget-label">${tr('perPersonEstimate')}</span>
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
            <button type="button" class="btn-primary smart-route-dashboard">${tr('openDashboard')}</button>
            <button type="button" class="btn-primary smart-route-map">${tr('showOnMap')}</button>
            <button type="button" class="btn-ghost smart-route-save">${tr('saveRoute')}</button>
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
        alert(tr('routeSaved'));
      } catch (_) {
        alert(tr('routeSaveFailed'));
      }
    });
  }
  function renderTravelDashboard(route) {
    const bd = route.budgetDetail || {};
    const stopsCount = route.days.reduce((n, d) => n + d.stops.length, 0);
    const atmosTags = [];
    if (route.prefs.nature) atmosTags.push(tr('theme_nature'));
    if (route.prefs.couple) atmosTags.push(tr('theme_romantic'));
    if (route.prefs.family) atmosTags.push(tr('theme_family'));
    if (route.prefs.photo) atmosTags.push(tr('theme_photography'));
    if (route.prefs.adventure) atmosTags.push(tr('theme_adventure'));
    if (route.prefs.food) atmosTags.push(tr('theme_food'));
    if (route.prefs.culture) atmosTags.push(tr('theme_culture'));
    if (route.prefs.budgetRange === 'low') atmosTags.push(tr('budgetLow'));
    if (route.prefs.budgetRange === 'high') atmosTags.push(tr('budgetHigh'));

    const highlights = route.places.slice(0, 4);
    const highlightsHtml = highlights
      .map(
        (p) => `
      <article class="dash-highlight" data-place-id="${p.id}" data-district-id="${p.districtId}" data-category-id="${p.categoryId || 'attractions'}">
        ${thumbHTML(p, 'dash-highlight__img')}
        <div>
          <div class="dash-highlight__name">${pname(p)}</div>
          <div class="dash-highlight__meta">${dname({ name: p.districtName, nameEn: p.districtNameEn })} - ${tr('rating')} ${p.rating || '4.5'}</div>
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
          const dateLabel = formatDate(dayDate);
          return `
      <div class="dash-day">
        <div class="dash-day__head">
          <span class="dash-day__num">${tr('dayLabel')} ${day.day}</span>
          <span class="dash-day__date-label" style="font-size:0.78rem;color:var(--t-secondary,#aaa);font-family:var(--font-thai,sans-serif);margin-left:0.4rem;">${dateLabel}</span>
          <span class="dash-day__theme">${day.theme || ''}</span>
        </div>
        <div class="dash-day__stops">
          ${day.stops
            .map(
              (s) => `
            <div class="dash-stop">
              <span class="dash-stop__time">${s.time}</span>
              ${thumbHTML(s.place, 'dash-stop__img')}
              <div>
                <div class="dash-stop__name">${pname(s.place)}</div>
                <div class="dash-stop__meta">${dname({ name: s.place.districtName, nameEn: s.place.districtNameEn })}</div>
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
            <div class="dash-stat"><span>${route.days.length}</span><label>${tr('days')}</label></div>
            <div class="dash-stat"><span>${stopsCount}</span><label>${tr('stops')}</label></div>
            <div class="dash-stat"><span>${route.districtIds.length}</span><label>${tr('districts')}</label></div>
            <div class="dash-stat dash-stat--gold"><span>${route.budget.toLocaleString()}</span><label>${tr('perPerson')}</label></div>
          </div>
          ${atmosTags.length ? `<div class="dash-atmosphere">${atmosTags.map((t) => `<span>${t}</span>`).join('')}</div>` : ''}
          <p class="dash-transport">${route.transport}</p>
          ${bd.min ? `<p class="dash-range">${tr('rangeLabel', { min: bd.min.toLocaleString(), max: bd.max.toLocaleString(), daily: (bd.daily || 0).toLocaleString() })}</p>` : ''}
        </header>
        ${
          highlights.length
            ? `<section class="dash-panel dash-panel--highlights">
            <h3 class="dash-panel__title">${tr('highlights')}</h3>
            <div class="dash-highlights">${highlightsHtml}</div>
          </section>`
            : ''
        }
        <div class="travel-dashboard__grid">
          <section class="dash-panel">
            <h3 class="dash-panel__title">${tr('budgetTitle')}</h3>
            <div class="dash-budget-bars">
              <div class="dash-bar"><label>${tr('budgetFood')}</label><div class="dash-bar__track"><div class="dash-bar__fill" style="width:${Math.min(100, ((bd.food || 0) / (route.budget || 1)) * 100)}%"></div></div><span>${(bd.food || 0).toLocaleString()}</span></div>
              <div class="dash-bar"><label>${tr('budgetActivities')}</label><div class="dash-bar__track"><div class="dash-bar__fill" style="width:${Math.min(100, ((bd.attractions || 0) / (route.budget || 1)) * 100)}%"></div></div><span>${(bd.attractions || 0).toLocaleString()}</span></div>
              <div class="dash-bar"><label>${tr('budgetStay')}</label><div class="dash-bar__track"><div class="dash-bar__fill" style="width:${Math.min(100, ((bd.hotel || 0) / (route.budget || 1)) * 100)}%"></div></div><span>${(bd.hotel || 0).toLocaleString()}</span></div>
              <div class="dash-bar"><label>${tr('budgetTransport')}</label><div class="dash-bar__track"><div class="dash-bar__fill" style="width:${Math.min(100, ((bd.transport || 0) / (route.budget || 1)) * 100)}%"></div></div><span>${(bd.transport || 0).toLocaleString()}</span></div>
            </div>
            ${route.accommodation ? `<p class="dash-hotel">${tr('recommendedStay')} <strong>${pname(route.accommodation)}</strong> - ${dname({ name: route.accommodation.districtName, nameEn: route.accommodation.districtNameEn })}</p>` : ''}
          </section>
          <section class="dash-panel dash-panel--wide">
            <h3 class="dash-panel__title">${tr('planTitle')}</h3>
            ${daysHtml}
          </section>
        </div>
        <div class="travel-dashboard__actions">
          <button type="button" class="btn-primary dash-sync-map">${tr('syncMap')}</button>
          <button type="button" class="btn-ghost dash-close">${tr('closeDashboard')}</button>
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

    _bindBody(body, route) {
      if (!body) return;
      body.querySelector('.dash-close')?.addEventListener('click', () => this.close());
      body.querySelector('.dash-sync-map')?.addEventListener('click', () => {
        syncRouteToMap(route);
        this.close();
      });
      body.querySelectorAll('.dash-highlight').forEach((el) => {
        el.addEventListener('click', () => {
          if (window.Router) {
            this.close();
            Router.navigate('place', el.dataset.districtId, el.dataset.categoryId, el.dataset.placeId);
          }
        });
      });
      bindRouteStops(body);
    },

    open(route) {
      if (!this.el || !route) return;
      this.currentRoute = route;
      const body = this.el.querySelector('.travel-dashboard__body');
      body.innerHTML = renderTravelDashboard(route);
      this._bindBody(body, route);
      rememberFocus();
      this.el.setAttribute('aria-hidden', 'false');
      this.el.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      // Sync highlights but do NOT scroll the page behind the dashboard.
      syncRouteToMap(route, { scroll: false });
      focusFirst(this.el);
    },

    // Re-render after a language switch without losing the route.
    rerender() {
      if (!this.el || !this.currentRoute) return;
      const body = this.el.querySelector('.travel-dashboard__body');
      if (!body) return;
      body.innerHTML = renderTravelDashboard(this.currentRoute);
      this._bindBody(body, this.currentRoute);
    },
    close() {
      this.el?.classList.remove('is-open');
      this.el?.setAttribute('aria-hidden', 'true');
      if (!document.querySelector('.smart-panel.is-open')) {
        document.body.style.overflow = '';
      }
      restoreFocus();
    },
  };

  function syncRouteToMap(route, options = {}) {
    const { scroll = true } = options;
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
      if (scroll && mapSection) mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Closing overlays is the caller's responsibility (explicit buttons or Esc).
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
  let focusBeforeOverlay = null;

  const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function rememberFocus() {
    if (focusBeforeOverlay == null) focusBeforeOverlay = document.activeElement;
  }

  function focusFirst(container) {
    if (!container) return;
    const target = container.querySelector(FOCUSABLE);
    if (target) target.focus({ preventScroll: true });
  }

  function restoreFocus() {
    const anyOpen = document.querySelector(
      '.travel-dashboard.is-open, .smart-panel.is-open, .map-district-panel.is-open'
    );
    if (anyOpen) return;
    const target =
      focusBeforeOverlay && document.body.contains(focusBeforeOverlay)
        ? focusBeforeOverlay
        : document.getElementById('fabPlanner');
    focusBeforeOverlay = null;
    if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
  }

  function topOverlay() {
    const dash = document.getElementById('travelDashboard');
    if (dash && dash.classList.contains('is-open')) return dash;
    const panel = document.querySelector('.smart-panel.is-open');
    if (panel) return panel;
    const mapPanel = document.querySelector('.map-district-panel.is-open');
    return mapPanel || null;
  }

  function trapTab(e) {
    const container = topOverlay();
    if (!container) return;
    const items = [...container.querySelectorAll(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    );
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function ensureBackdrop() {
    if (backdropEl) return backdropEl;
    backdropEl = document.createElement('div');
    backdropEl.className = 'smart-panel-backdrop';
    backdropEl.addEventListener('click', closeAllPanels);
    document.body.appendChild(backdropEl);
    return backdropEl;
  }

  function openPanel(panel) {
    if (!panel) return;
    rememberFocus();
    ensureBackdrop().classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    panel.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    focusFirst(panel);
  }

  function closePanel(panel) {
    if (!panel) return;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.smart-panel.is-open')) {
      backdropEl?.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    restoreFocus();
  }

  function closeAllPanels() {
    document.querySelectorAll('.smart-panel.is-open').forEach((p) => {
      p.classList.remove('is-open');
      p.setAttribute('aria-hidden', 'true');
    });
    document.getElementById('mapDistrictPanel')?.classList.remove('is-open');
    document.getElementById('mapDistrictPanel')?.setAttribute('aria-hidden', 'true');
    TravelDashboard.close();
    backdropEl?.classList.remove('is-open');
    document.body.style.overflow = '';
    // Esc always returns the user to the launcher.
    const fab = document.getElementById('fabPlanner');
    if (fab) fab.focus({ preventScroll: true });
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
  const TripPlanner = {
    panel: null,
    wizardEl: null,
    resultEl: null,
    districtFilter: null,
    lastRoute: null,

    init() {
      this.panel = document.getElementById('tripPlannerPanel');
      if (!this.panel) return;
      this.wizardEl = this.panel.querySelector('.route-wizard');
      this.resultEl = document.getElementById('tripResult');
      if (this.wizardEl) bindWizardControls(this.wizardEl);
      this.panel.querySelector('.smart-panel__close')?.addEventListener('click', () => closePanel(this.panel));
      document.getElementById('tripGenerate')?.addEventListener('click', () => this.generate());
    },

    open(districtId) {
      this.districtFilter = districtId || null;
      openPanel(this.panel);
    },

    generate() {
      runWizardGenerate(this.wizardEl || this.panel, {
        targetEl: this.resultEl,
        districtFilter: this.districtFilter,
        delay: 900,
        onComplete: (route) => {
          this.lastRoute = route;
          this.lastState = readWizardState(this.wizardEl || this.panel);
          this.lastFilter = this.districtFilter;
        },
      });
    },
  };

  // Keep backward compat
  const TravelAssistant = { open() { TripPlanner.open(); }, init() {} };
  const RoutePlanner = { open(d) { TripPlanner.open(d); }, init() {}, generate() { TripPlanner.generate(); } };

  /* â”€â”€â”€ Route Planner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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
      const badge = districtBadge(districtId) || atmosphere[0] || '';

      const galleryHtml = gallery.length
        ? `<div class="map-district-gallery">${gallery
            .map(
              (p) =>
                `<button type="button" class="map-district-gallery__item" data-place-id="${p.id}" data-district-id="${districtId}" data-category-id="${p.categoryId || 'attractions'}">${thumbHTML(p, 'map-gallery__img')}</button>`
            )
            .join('')}</div>`
        : '';

      const mini = (list, type, cat) =>
        list
          .map(
            (p) => `
        <div class="map-district-mini" data-place-id="${p.id}" data-district-id="${districtId}" data-category-id="${cat}">
          ${thumbHTML(p, 'map-mini__img')}
          <div>
            <div class="map-district-mini__name">${pname(p)}</div>
            <div class="map-district-mini__rating">${tr('rating')} ${p.rating || '4.5'} - ${type}</div>
          </div>
        </div>`
          )
          .join('');

      this.el.innerHTML = `
        <div class="map-district-panel__eyebrow">${tr('exploreSmartMap')}</div>
        <h3 class="map-district-panel__name">${dname(d)}</h3>
        <p class="map-district-panel__tagline">${lang() === 'en' && d.taglineEn ? d.taglineEn : (d.tagline || '')}</p>
        ${badge ? `<div class="map-district-badge">${badge}</div>` : ''}
        <div class="map-atmosphere-tags">
          ${atmosphere.map((t) => `<span class="map-atmosphere-tag">${t}</span>`).join('')}
        </div>
        ${galleryHtml}
        <p class="map-district-panel__history">${(() => {
          const h = lang() === 'en' && d.historyEn ? d.historyEn : (d.history || '');
          return h.slice(0, 200) + (h.length > 200 ? '...' : '');
        })()}</p>
        ${topRated.length ? `
          <div class="map-district-panel__section-title">${tr('highlights')}</div>
          <div class="map-district-mini-grid">${mini(topRated, catName(topRated[0].categoryId || 'attractions'), topRated[0].categoryId || 'attractions')}</div>` : ''}
        ${hiddenGems.length ? `
          <div class="map-district-panel__section-title">${tr('hiddenGems')}</div>
          <div class="map-district-mini-grid">${mini(hiddenGems.map((p) => ({ ...p, categoryId: p.categoryId || 'attractions' })), tr('hiddenGems'), 'attractions')}</div>` : ''}
        ${attractions.length ? `
          <div class="map-district-panel__section-title">${catName('attractions')}</div>
          <div class="map-district-mini-grid">${mini(attractions, catName('attractions'), 'attractions')}</div>` : ''}
        ${restaurants.length ? `
          <div class="map-district-panel__section-title">${catName('restaurants')}</div>
          <div class="map-district-mini-grid">${mini(restaurants, catName('restaurants'), 'restaurants')}</div>` : ''}
        ${accommodations.length ? `
          <div class="map-district-panel__section-title">${catName('accommodations')}</div>
          <div class="map-district-mini-grid">${mini(accommodations, catName('accommodations'), 'accommodations')}</div>` : ''}
        ${!attractions.length && !restaurants.length ? `<p style="color:var(--t-muted);font-size:0.85rem">${tr('addingMore')}</p>` : ''}
        <div class="map-district-panel__actions">
          <button type="button" class="btn-primary map-panel-explore">${tr('exploreDistrict')}</button>
          <button type="button" class="btn-ghost map-panel-plan">${tr('planArea')}</button>
          <button type="button" class="btn-ghost map-panel-close">${tr('closePanel')}</button>
        </div>`;

      rememberFocus();
      this.el.classList.add('is-open');
      this.el.setAttribute('aria-hidden', 'false');
      focusFirst(this.el);

      this.el.querySelector('.map-panel-explore')?.addEventListener('click', () => {
        this.close();
        if (window.Router) Router.navigate('district', districtId);
      });
      this.el.querySelector('.map-panel-plan')?.addEventListener('click', () => {
        this.close();
        TripPlanner.open(districtId);
        TripPlanner.generate();
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
      this.el?.setAttribute('aria-hidden', 'true');
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
        <button type="button" class="smart-fab smart-fab--primary" id="fabPlanner" aria-label="${tr('fabLabel')}">
          <span class="smart-fab__icon">✈</span>
          <span class="smart-fab__label">${tr('fabLabel')}</span>
        </button>
      </div>

      <aside class="smart-panel" id="tripPlannerPanel" aria-hidden="true" role="dialog" aria-modal="true" aria-label="${tr('plannerTitle')}">
        <header class="smart-panel__header">
          <div>
            <div class="smart-panel__title">${tr('plannerTitle')}</div>
            <div class="smart-panel__subtitle">${tr('plannerSubtitle')}</div>
          </div>
          <button type="button" class="smart-panel__close" aria-label="${tr('close')}">x</button>
        </header>
        <div class="smart-panel__body">
          <div class="route-wizard" id="tripWizard">
            ${wizardControlsHTML(false)}
          </div>
          <button type="button" class="btn-primary planner-generate" id="tripGenerate" style="width:100%;margin:0 0 1.5rem">${tr('generate')}</button>
          <div class="planner-result" id="tripResult"></div>
        </div>
      </aside>

      <div class="travel-dashboard" id="travelDashboard" aria-hidden="true" role="dialog" aria-modal="true" aria-label="${tr('plannerTitle')}">
        <div class="travel-dashboard__backdrop"></div>
        <div class="travel-dashboard__body"></div>
      </div>
    `;
    document.body.appendChild(root);

    document.getElementById('fabPlanner')?.addEventListener('click', () => TripPlanner.open());
  }

  function injectMapPanel() {
    const mapWrap = document.querySelector('.map-hero-fullscreen') || document.getElementById('districts');
    if (!mapWrap || document.getElementById('mapDistrictPanel')) return;
    const panel = document.createElement('div');
    panel.id = 'mapDistrictPanel';
    panel.className = 'map-district-panel glass-strong';
    panel.setAttribute('aria-hidden', 'true');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'District explorer');
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
    section.querySelector('.smart-os__cta-ai')?.addEventListener('click', () => TripPlanner.open());
    section.querySelector('.smart-os__cta-map')?.addEventListener('click', () => {
      document.getElementById('districts')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  const SmartTourism = {
    init() {
      injectShell();
      injectMapPanel();
      TripPlanner.init();
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
        if (e.key === 'Escape') {
          closeAllPanels();
          return;
        }
        if (e.key === 'Tab') trapTab(e);
      });
    },

    /* Re-render all injected chrome after Lang.toggle() changed the language. */
    onLocaleChange() {
      const fab = document.getElementById('fabPlanner');
      if (fab) {
        fab.setAttribute('aria-label', tr('fabLabel'));
        const label = fab.querySelector('.smart-fab__label');
        if (label) label.textContent = tr('fabLabel');
      }

      const panel = document.getElementById('tripPlannerPanel');
      if (panel) {
        panel.setAttribute('aria-label', tr('plannerTitle'));
        const title = panel.querySelector('.smart-panel__title');
        const subtitle = panel.querySelector('.smart-panel__subtitle');
        const closeBtn = panel.querySelector('.smart-panel__close');
        if (title) title.textContent = tr('plannerTitle');
        if (subtitle) subtitle.textContent = tr('plannerSubtitle');
        if (closeBtn) closeBtn.setAttribute('aria-label', tr('close'));

        const wizard = panel.querySelector('.route-wizard');
        if (wizard) {
          wizard.innerHTML = wizardControlsHTML(false);
          delete wizard.dataset.wizardBound;
          bindWizardControls(wizard);
        }
        const gen = document.getElementById('tripGenerate');
        if (gen) gen.textContent = tr('generate');
      }

      if (TripPlanner.lastRoute) {
        // Route titles/summaries were baked in the old language: rebuild them.
        let route = TripPlanner.lastRoute;
        if (TripPlanner.lastState) {
          const regenerated = TravelBrain.generate(
            TripPlanner.lastState,
            TripPlanner.lastState.days,
            TripPlanner.lastFilter || null
          );
          regenerated.startDate = route.startDate || new Date();
          TripPlanner.lastRoute = regenerated;
          TravelDashboard.currentRoute = regenerated;
          route = regenerated;
        }
        const res = document.getElementById('tripResult');
        if (res && res.innerHTML.trim()) {
          res.innerHTML = renderRouteResult(route);
          bindRouteActions(res, route);
        }
        TravelDashboard.rerender();
      }
    },

    TravelBrain,
    TripPlanner,
    MapDistrictPanel,
    TravelDashboard,
    highlightMapDistricts,
    syncRouteToMap,
    closeAllPanels,
  };

  window.SmartTourism = SmartTourism;
  window.MapDistrictPanel = MapDistrictPanel;
  window.TripPlanner = TripPlanner;
  window.TravelBrain = TravelBrain;
  window.TravelDashboard = TravelDashboard;
})();

