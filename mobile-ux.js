/* Accessible discovery and mobile navigation for the existing static views. */
(() => {
  const en = () => document.documentElement.lang === 'en';
  const word = (th, english) => en() ? english : th;
  const savedKey = 'nolatalung_saved_places_v1';
  const discoveryState = { query: '', category: '', district: '' };
  const themes = [
    ['nature','ธรรมชาติ','Nature','attractions',/nature|ธรรมชาติ/iu],
    ['mountain','ภูเขา','Mountains','attractions',/mountain|ภูเขา/iu],
    ['lake','ทะเลสาบ','Lakes','attractions',/lake|wetland|ทะเลน้อย|ทะเลสาบ|พื้นที่ชุ่มน้ำ/iu],
    ['cafe','คาเฟ่','Cafés','restaurants',/caf[eé]|คาเฟ่/iu],
    ['food','ร้านอาหาร','Restaurants','restaurants'],
    ['culture','วัฒนธรรม','Culture','attractions',/culture|museum|temple|วัฒนธรรม|พิพิธภัณฑ์|วัด/iu],
    ['stay','ที่พัก','Stays','accommodations'],
  ];
  function savedPlaces() {
    try { const value = JSON.parse(localStorage.getItem(savedKey) || '[]'); return Array.isArray(value) ? value.filter(v => typeof v === 'string').slice(0,200) : []; } catch { return []; }
  }
  function button(text, action) {
    const el = document.createElement('button');
    el.type = 'button'; el.textContent = text; el.addEventListener('click', action);
    return el;
  }
  function enhance() {
    const root = document.getElementById('app');
    if (!root) return;
    const menu = root.querySelector('.primary-menu');
    if (menu && !menu.dataset.ready) {
      menu.dataset.ready = 'true';
      menu.open = window.matchMedia('(min-width:1100px)').matches;
    }
    const intro = root.querySelector('#introPosters');
    const catalog = root.querySelector('#catalog-page');
    const route = window.Router.state;
    if (catalog && route.view === 'map') window.TourismMap?.mount(catalog);
    const plannerIntro = catalog?.querySelector('.planner-intro');
    if (plannerIntro && !plannerIntro.querySelector('.planner-restore')) {
      const status = document.createElement('p'); status.setAttribute('role','status');
      const restore = button(word('เปิดแผนที่บันทึกไว้','Open saved itinerary'), () => {
        if (!window.TripPlanner.restoreSaved()) status.textContent = word('ยังไม่มีแผนที่เปิดได้ในเบราว์เซอร์นี้','No saved itinerary is available in this browser.');
      });
      restore.className = 'btn-ghost planner-restore'; plannerIntro.append(restore,status);
    }
    const explorer = catalog && route.view === 'explore';
    if ((intro || explorer) && !root.querySelector('#place-search')) {
      const section = document.createElement('section');
      section.className = 'discovery';
      const heading = document.createElement('h2');
      heading.textContent = word('วันนี้อยากเที่ยวที่ไหน?', 'Where would you like to go?');
      const label = document.createElement('label');
      label.htmlFor = 'place-search'; label.textContent = word('ค้นหาสถานที่หรืออำเภอ', 'Search places or districts');
      const input = document.createElement('input');
      input.id = 'place-search'; input.type = 'search'; input.autocomplete = 'off';
      input.value = discoveryState.query;
      const choices = document.createElement('div'); choices.className = 'discovery__choices';
      const status = document.createElement('p'); status.setAttribute('role', 'status');
      const results = document.createElement('ul'); results.className = 'discovery__results';
      const more = button(word('แสดงเพิ่มเติม', 'Show more'), () => { limit += 20; show(); });
      more.className = 'btn-ghost discovery__more';
      let limit = 20;
      let category = explorer && route.categoryId ? route.categoryId : discoveryState.category;
      let theme = explorer ? themes.find(entry => entry[0] === route.placeId) : undefined;
      const data = window.PHATTHALUNG_DATA;
      const districtFilter = document.createElement('select');
      districtFilter.className = 'discovery__district';
      districtFilter.setAttribute('aria-label', word('กรองตามอำเภอ','Filter by district'));
      districtFilter.add(new Option(word('ทุกอำเภอ','All districts'), ''));
      data.districts.forEach(d => districtFilter.add(new Option(en() ? d.nameEn || d.name : d.name, d.id)));
      districtFilter.value = discoveryState.district;
      if (explorer && data.getDistrict(route.districtId)) districtFilter.value = route.districtId;
      const entries = Object.entries(data.places).flatMap(([districtId, cats]) => Object.entries(cats).flatMap(([categoryId, places]) => places.map(place => ({place, districtId, categoryId}))));
      if (intro) {
        const featured = document.createElement('section'); featured.className = 'featured-destinations';
        const title = document.createElement('h2'); title.textContent = word('จุดหมายที่ไม่ควรพลาด','Places worth discovering');
        const cards = document.createElement('div'); cards.className = 'featured-destinations__grid';
        for (const [id, placeId] of [['khuan-khanun',1],['mueang',1],['mueang',3]]) {
          const place = data.getPlaces(id,'attractions').find(p => p.id === placeId);
          if (!place) continue;
          const card = document.createElement('a'); card.href = `#place/${id}/attractions/${placeId}`;
          if (place.image) {
            const image = document.createElement('img'); image.src = place.image; image.alt = ''; image.loading = 'lazy'; image.width = 400; image.height = 250; card.append(image);
          }
          const copy = document.createElement('div');
          const district = data.getDistrict(id);
          const meta = document.createElement('small'); meta.textContent = word(district.name,district.nameEn || district.name);
          const heading = document.createElement('h3'); heading.textContent = word(place.name,place.nameEn || place.name);
          const summary = document.createElement('p'); summary.textContent = word(place.description,place.descriptionEn || place.description);
          copy.append(meta,heading,summary); card.append(copy); cards.append(card);
        }
        featured.append(title,cards);
        const categoryNav = document.createElement('nav'); categoryNav.className = 'category-tiles'; categoryNav.setAttribute('aria-label',word('สำรวจตามประเภท','Explore by category'));
        themes.forEach(([key,th,english,categoryId]) => {
          const link = document.createElement('a'); link.href = `#explore/all/${categoryId}/${key}`; link.textContent = word(th,english); categoryNav.append(link);
        });
        featured.append(categoryNav);
        intro.after(featured);
        const heroSearch = document.createElement('form'); heroSearch.className = 'hero-search'; heroSearch.setAttribute('role','search');
        const keyword = document.createElement('input'); keyword.type = 'search'; keyword.placeholder = word('ลองค้นหา “ทะเลน้อย”','Try “Thale Noi”'); keyword.setAttribute('aria-label', word('ค้นหาจุดหมาย','Search destinations'));
        const submit = document.createElement('button'); submit.type = 'submit'; submit.textContent = word('ค้นหา','Search');
        heroSearch.append(keyword,submit);
        heroSearch.addEventListener('submit', event => {
          event.preventDefault();
          discoveryState.query = keyword.value; discoveryState.category = ''; discoveryState.district = '';
          window.Router.navigate('explore');
          requestAnimationFrame(() => document.getElementById('place-search')?.focus({preventScroll:true}));
        });
        intro.querySelector('.intro-hero__body')?.append(heroSearch);
      }
      const sort = document.createElement('select');
      sort.setAttribute('aria-label', word('เรียงผลค้นหา','Sort results'));
      sort.add(new Option(word('ตามลำดับในคู่มือ','Guide order'), 'guide'));
      sort.add(new Option(word('ตามชื่อสถานที่','Place name'), 'name'));
      const normalize = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
      function show() {
        const query = normalize(input.value);
        discoveryState.query = input.value; discoveryState.category = category;
        discoveryState.district = districtFilter.value;
        results.replaceChildren();
        const found = entries.filter(({place, districtId, categoryId}) => {
          const district = data.getDistrict(districtId);
          const matches = category === 'saved' ? savedPlaces().includes(`#place/${districtId}/${categoryId}/${place.id}`) : (!category || categoryId === category);
          if (theme?.[4] && !theme[4].test([place.name,place.nameEn,place.tag,place.tagEn,...(place.tags || [])].join(' '))) return false;
          return matches && (!districtFilter.value || districtId === districtFilter.value) && query.split(' ').every(term => normalize([place.name, place.nameEn, district?.name, district?.nameEn, place.tag, place.tagEn].join(' ')).includes(term));
        });
        if (sort.value === 'name') found.sort((a,b) => (en() ? a.place.nameEn || a.place.name : a.place.name).localeCompare(en() ? b.place.nameEn || b.place.name : b.place.name, en() ? 'en' : 'th'));
        const prefix = theme ? `${word(theme[1],theme[2])} · ` : '';
        status.textContent = prefix + word(`พบ ${found.length} แห่ง แสดง ${Math.min(limit, found.length)} แห่ง`, `${found.length} places found; showing ${Math.min(limit, found.length)}`);
        more.hidden = found.length <= limit;
        if (!found.length) status.textContent = word('ไม่พบสถานที่ ลองเปลี่ยนคำค้นหรือเลือกทุกประเภท', 'No matches. Try another name or select all categories.');
        found.slice(0, limit).forEach(({place, districtId, categoryId}) => {
          const item = document.createElement('li');
          const link = document.createElement('a');
          link.href = `#place/${districtId}/${categoryId}/${place.id}`;
          const categoryName = data.categories[categoryId];
          const name = document.createElement('strong');
          name.textContent = en() ? place.nameEn || place.name : place.name;
          const meta = document.createElement('small');
          meta.textContent = `${en() ? data.getDistrict(districtId).nameEn : data.getDistrict(districtId).name} · ${en() ? categoryName?.nameEn || categoryId : categoryName?.name || categoryId}`;
          if (explorer && place.image) {
            const image = document.createElement('img'); image.src = place.image; image.alt = ''; image.loading = 'lazy'; image.width = 400; image.height = 240;
            image.addEventListener('error', () => image.remove()); link.append(image);
          }
          link.append(name,meta);
          if (explorer && place.description) {
            const desc = document.createElement('span'); desc.textContent = en() ? place.descriptionEn || place.description : place.description;
            link.append(desc);
          }
          item.append(link); results.append(item);
        });
      }
      [['', word('ทั้งหมด', 'All')], ['attractions',word('ที่เที่ยว','Attractions')],['restaurants',word('อาหาร','Food')],['accommodations',word('ที่พัก','Stays')],['saved',word('ที่บันทึกไว้','Saved')]].forEach(([id, text]) => {
        const control = button(text, () => { category = id; theme = undefined; limit = 20; choices.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === control))); show(); });
        control.setAttribute('aria-pressed', String(id === category)); choices.append(control);
      });
      input.addEventListener('input', () => { limit = 20; show(); });
      districtFilter.addEventListener('change', () => { limit = 20; show(); });
      sort.addEventListener('change', () => { limit = 20; show(); });
      const reset = button(word('ล้างตัวกรอง','Reset filters'), () => {
        input.value = ''; districtFilter.value = ''; choices.firstElementChild.click(); input.focus();
      });
      reset.className = 'btn-ghost';
      const filters = document.createElement('div'); filters.className = 'discovery__filters'; filters.append(districtFilter, sort, reset);
      const controls = document.createElement('div'); controls.className = 'discovery__controls'; controls.append(heading,label,input,choices,filters);
      const listing = document.createElement('div'); listing.className = 'discovery__listing'; listing.append(status,results,more);
      section.append(controls,listing);
      if (explorer) { section.classList.add('discovery--catalog'); catalog.append(section); }
      else intro.after(section);
      const grid = root.querySelector('#districtGrid');
      if (grid) (root.querySelector('.featured-destinations') || section).after(grid);
      const story = root.querySelector('#introTransition');
      const map = root.querySelector('#districts');
      if (story && map) map.after(story);
      if (map) {
        const link = document.createElement('a'); link.className = 'btn-primary geographic-map-link'; link.href = '#map'; link.textContent = word('เปิดแผนที่ภูมิศาสตร์','Open geographic map');
        map.querySelector('.map-pixel-section__inner')?.append(link);
      }
      show();
    }
    const districtHistory = root.querySelector('.district-history');
    const districtCategories = root.querySelector('.categories__grid')?.closest('section');
    if (districtHistory && districtCategories && !districtCategories.dataset.uxReady) {
      districtCategories.dataset.uxReady = 'true';
      districtHistory.before(districtCategories);
      const districtId = location.hash.split('/')[1];
      const plan = button(word('วางแผนเที่ยวอำเภอนี้','Plan a trip in this district'), () => window.SmartTourism.TripPlanner.open(districtId));
      plan.className = 'btn-primary district-plan';
      districtCategories.querySelector('.categories__grid').before(plan);
    }
    const detail = root.querySelector('.place-detail__grid');
    if (detail && !detail.dataset.uxReady) {
      detail.dataset.uxReady = 'true';
      const aside = detail.querySelector('aside');
      if (aside) detail.prepend(aside);
      const actions = detail.querySelector('.place-detail__actions');
      if (aside && actions) aside.append(actions);
      const {districtId,categoryId,placeId} = route;
      const data = window.PHATTHALUNG_DATA;
      const reference = window.TourismMap?.reference({districtId,categoryId,id:placeId});
      if (reference && aside) {
        const mapLink = document.createElement('a'); mapLink.href = `#map/${districtId}`;
        mapLink.textContent = word('ดูหมุดในแผนที่พัทลุง','See point on tourism map'); mapLink.className = 'geographic-map-link';
        aside.append(mapLink);
      }
      const related = data.getPlaces(districtId,categoryId).filter(p => String(p.id) !== String(placeId)).slice(0,3);
      if (related.length) {
        const section = document.createElement('section'); section.className = 'featured-destinations';
        const heading = document.createElement('h2'); heading.textContent = word('สำรวจต่อในอำเภอนี้','Explore more in this district');
        const list = document.createElement('ul'); list.className = 'discovery__results';
        related.forEach(place => {
          const item = document.createElement('li'); const link = document.createElement('a');
          link.href = `#place/${districtId}/${categoryId}/${place.id}`; link.textContent = word(place.name,place.nameEn || place.name);
          item.append(link); list.append(item);
        });
        section.append(heading,list); detail.closest('section')?.after(section);
      }
      const key = location.hash;
      const notice = document.createElement('p'); notice.setAttribute('role','status');
      const save = button('', () => {
        const previous = savedPlaces();
        const next = previous.includes(key) ? previous.filter(v => v !== key) : [...previous,key];
        try {
          localStorage.setItem(savedKey, JSON.stringify(next));
          refresh();
          notice.textContent = word('อัปเดตรายการแล้ว ดูได้จาก “ที่บันทึกไว้” บนหน้าแรก ข้อมูลเก็บเฉพาะเบราว์เซอร์นี้', 'Updated. Open Saved on the home page. Saved only in this browser.');
        } catch { notice.textContent = word('บันทึกไม่ได้ เบราว์เซอร์ไม่อนุญาตให้เก็บข้อมูล', 'Unable to save: browser storage is unavailable.'); }
      });
      function refresh() {
        const selected = savedPlaces().includes(key);
        save.textContent = selected ? word('บันทึกไว้แล้ว', 'Saved') : word('บันทึกสถานที่', 'Save place');
        save.setAttribute('aria-pressed', String(selected));
      }
      save.className = 'btn-ghost save-place'; refresh();
      actions?.append(save); actions?.after(notice);
      if (!key.includes('/accommodations/')) {
        const add = button(word('เพิ่มเข้าแผนเที่ยว','Add to itinerary'), () => {
          const result = window.TripPlanner.addRequestedStop(key);
          if (result === 'full') notice.textContent = word('เลือกจุดแวะล่วงหน้าได้สูงสุด 3 แห่ง','You can preselect up to three stops.');
          if (result === 'unavailable') notice.textContent = word('เพิ่มจุดแวะไม่ได้ กรุณาลองใหม่','Unable to add this stop. Please try again.');
        });
        add.className = 'btn-primary add-plan-stop'; actions?.append(add);
      }
    }
    const wizard = document.getElementById('tripWizard');
    if (wizard && !wizard.querySelector('.wizard-progress')) {
      const blocks = [...wizard.querySelectorAll(':scope > .planner-block')];
      if (blocks.length === 4) {
        const dateInput = wizard.querySelector('input[type=date]');
        if (dateInput) dateInput.required = true;
        let step = 0;
        const progress = document.createElement('h3'); progress.className = 'wizard-progress'; progress.tabIndex = -1;
        const controls = document.createElement('div'); controls.className = 'wizard-navigation';
        const back = button(word('ย้อนกลับ','Back'), () => { step--; draw(true); });
        const next = button(word('ถัดไป','Next'), () => {
          const date = wizard.querySelector('input[type=date]');
          if (step === 0 && date && !date.reportValidity()) return;
          step++; draw(true);
        });
        back.className = 'btn-ghost'; next.className = 'btn-primary';
        controls.append(back,next); wizard.prepend(progress); wizard.append(controls);
        function draw(focus) {
          const titles = [word('วันเดินทาง','Travel dates'),word('สไตล์การเที่ยว','Travel interests'),word('งบและผู้ร่วมเดินทาง','Budget and companions')];
          progress.textContent = `${step+1} / 3 · ${titles[step]}`;
          blocks.forEach((block,i) => { block.hidden = (i < 2 ? 0 : i-1) !== step; });
          back.hidden = step === 0; next.hidden = step === 2;
          const generate = document.getElementById('tripGenerate');
          if (generate) generate.hidden = step !== 2;
          if (focus) progress.focus();
        }
        draw(false);
      }
    }
    document.querySelectorAll('.planner-day-btn, .planner-theme, .planner-opt').forEach(el => {
      const selected = String(el.classList.contains('is-active'));
      if (el.getAttribute('aria-pressed') !== selected) el.setAttribute('aria-pressed', selected);
    });
    document.querySelectorAll('.map-district-gallery__item').forEach(el => {
      if (!el.hasAttribute('aria-label')) {
        const place = window.PHATTHALUNG_DATA?.getPlaces(el.dataset.districtId, el.dataset.categoryId).find(p => String(p.id) === el.dataset.placeId);
        el.setAttribute('aria-label', word('ดูรายละเอียด ', 'View details: ') + (en() && place?.nameEn ? place.nameEn : place?.name || ''));
      }
    });
    document.querySelectorAll('.map-district-mini').forEach(el => {
      if (el.dataset.keyboardReady) return;
      el.dataset.keyboardReady = 'true'; el.setAttribute('role','button'); el.tabIndex = 0;
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
    });
  }
  document.addEventListener('DOMContentLoaded', () => {
    enhance();
    window.matchMedia('(min-width:1100px)').addEventListener('change', event => {
      const menu = document.querySelector('.primary-menu');
      if (menu) menu.open = event.matches;
    });
    new MutationObserver(enhance).observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class']});
  });
})();
