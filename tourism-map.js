/* Geographic points are maintained separately from the legacy catalog coordinates. */
(() => {
  const locations = [
    { district: 'mueang', id: 1, point: [7.625, 100.091667], source: 'https://www.wikidata.org/wiki/Q6400447' },
    { district: 'khuan-khanun', id: 1, point: [7.78323, 100.15299], source: 'https://mapcarta.com/15562332' },
  ];
  const word = (th, en) => document.documentElement.lang === 'en' ? en : th;
  const name = entry => word(entry.place.name, entry.place.nameEn || entry.place.name);
  let instance;
  let library;
  let itinerary = null;

  function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (library) return library;
    const base = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet';
    library = Promise.all(['css', 'js'].map(extension => new Promise((resolve, reject) => {
      const asset = document.createElement(extension === 'css' ? 'link' : 'script');
      asset.crossOrigin = 'anonymous';
      if (extension === 'css') {
        asset.rel = 'stylesheet'; asset.href = `${base}.css`;
        asset.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      } else {
        asset.src = `${base}.js`;
        asset.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      }
      asset.onload = resolve;
      asset.onerror = () => { asset.remove(); reject(new Error('Map library unavailable')); };
      document.head.append(asset);
    }))).then(() => window.L).catch(error => { library = null; throw error; });
    return library;
  }

  function mount(root) {
    if (root.querySelector('.tourism-map-layout')) return;
    const data = window.PHATTHALUNG_DATA;
    const all = locations.map(entry => ({ ...entry, place: data.getPlaces(entry.district, 'attractions').find(p => p.id === entry.id) })).filter(entry => entry.place);
    const trip = window.Router.state.districtId === 'itinerary' ? itinerary : null;
    const entries = trip ? all.filter(entry => trip.places.some(p => p.categoryId === 'attractions' && p.districtId === entry.district && String(p.id) === String(entry.id))) : all;
    const layout = document.createElement('div'); layout.className = 'tourism-map-layout';
    const panel = document.createElement('aside'); panel.className = 'tourism-map-panel';
    const search = document.createElement('input'); search.type = 'search'; search.placeholder = word('ค้นหาหมุดตามชื่อ','Search map points'); search.setAttribute('aria-label', search.placeholder);
    const district = document.createElement('select'); district.setAttribute('aria-label', word('กรองอำเภอ','Filter district'));
    district.add(new Option(word('ทุกอำเภอ','All districts'), ''));
    for (const id of new Set(entries.map(entry => entry.district))) {
      const d = data.getDistrict(id); district.add(new Option(word(d.name,d.nameEn || d.name), id));
    }
    if (entries.some(entry => entry.district === window.Router.state.districtId)) district.value = window.Router.state.districtId;
    const status = document.createElement('p'); status.setAttribute('role','status');
    const coverage = document.createElement('p'); coverage.textContent = word('หมุดแสดงเฉพาะจุดอ้างอิงที่ตรวจสอบได้ ตำแหน่งบนแผนที่อาจอยู่กลางแหล่งธรรมชาติ','Pins show sourced reference points and may sit inside a natural feature.');
    if (trip) coverage.textContent = word(`แสดง ${entries.length} จาก ${trip.places.length} จุดแวะที่มีพิกัดอ้างอิง`, `Showing ${entries.length} of ${trip.places.length} stops with sourced coordinates.`);
    const list = document.createElement('ul'); list.className = 'tourism-map-results';
    const mapNode = document.createElement('div'); mapNode.className = 'tourism-map-canvas'; mapNode.setAttribute('aria-label', word('แผนที่พัทลุง','Phatthalung map'));
    const mapStatus = document.createElement('p'); mapStatus.setAttribute('role','status');
    mapStatus.textContent = word('กำลังโหลดแผนที่…','Loading map…');
    const mapColumn = document.createElement('div'); mapColumn.append(mapStatus,mapNode);
    panel.append(search,district,status,coverage,list); layout.append(panel,mapColumn); root.append(layout);
    let layer;
    let map;
    let current;
    const markers = new Map();
    let cluster;

    function refreshCluster() {
      if (cluster) { cluster.remove(); cluster = null; }
      const points = [...markers.keys()];
      if (points.length < 2 || map.getZoom() >= 10) {
        markers.forEach(marker => marker.addTo(layer));
        return;
      }
      markers.forEach(marker => layer.removeLayer(marker));
      const bounds = window.L.latLngBounds(points.map(entry => entry.point));
      const icon = window.L.divIcon({className:'tourism-marker tourism-marker--cluster',iconSize:[32,32],html:String(points.length)});
      cluster = window.L.marker(bounds.getCenter(), {icon,title:word(`${points.length} จุด · ซูมเพื่อดูหมุด`,`${points.length} places · zoom to expand`)}).addTo(map);
      cluster.on('click', () => { map.setView(bounds.getCenter(),10,{animate:false}); });
    }

    function select(entry) {
      current = entry;
      list.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.key === entry.district)));
      if (map) { map.setView(entry.point, Math.max(map.getZoom(), 12),{animate:false}); markers.get(entry)?.openPopup(); }
    }

    function render() {
      const query = search.value.normalize('NFKC').toLocaleLowerCase().trim();
      const found = entries.filter(entry => (!district.value || district.value === entry.district) && [entry.place.name,entry.place.nameEn].join(' ').toLocaleLowerCase().includes(query));
      if (!found.includes(current)) current = null;
      status.textContent = found.length ? word(`พบ ${found.length} จุดบนแผนที่`, `${found.length} map points`) : word('ไม่พบหมุด ลองเปลี่ยนคำค้นหรือตัวกรอง','No map points match these filters.');
      list.replaceChildren(); layer?.clearLayers(); markers.clear();
      found.forEach(entry => {
        const item = document.createElement('li');
        const button = document.createElement('button'); button.type = 'button'; button.textContent = name(entry); button.dataset.key = entry.district; button.setAttribute('aria-pressed', String(current === entry));
        button.addEventListener('click', () => select(entry));
        const details = document.createElement('a'); details.href = `#place/${entry.district}/attractions/${entry.id}`; details.textContent = word('ดูรายละเอียด','View details');
        const source = document.createElement('a'); source.href = entry.source; source.textContent = word('ที่มาพิกัด','Coordinate source');
        item.append(button,details,source); list.append(item);
        if (layer) {
          const popup = document.createElement('div'); popup.className = 'tourism-map-popup';
          const heading = document.createElement('strong'); heading.textContent = name(entry);
          const plan = document.createElement('button'); plan.type = 'button'; plan.textContent = word('เพิ่มเข้าแผนเที่ยว','Add to itinerary');
          const feedback = document.createElement('p'); feedback.setAttribute('role','status');
          plan.addEventListener('click', () => {
            const result = window.TripPlanner.addRequestedStop(details.hash);
            if (result === 'full') feedback.textContent = word('เลือกจุดแวะล่วงหน้าได้สูงสุด 3 แห่ง','You can preselect up to three stops.');
            if (result === 'unavailable') feedback.textContent = word('เพิ่มจุดแวะไม่ได้','Unable to add this stop.');
          });
          popup.append(heading,details.cloneNode(true),plan,feedback);
          const icon = window.L.divIcon({ className:'tourism-marker', iconSize:[24,24] });
          const marker = window.L.marker(entry.point, { title:name(entry), icon }).addTo(layer).bindPopup(popup,{autoPan:false});
          marker.on('click', () => select(entry)); markers.set(entry,marker);
        }
      });
      if (map && found.length) map.fitBounds(found.map(entry => entry.point), { padding:[36,36], maxZoom:12, animate:false });
      if (map) refreshCluster();
    }

    search.addEventListener('input',render); district.addEventListener('change',render); render();
    loadLeaflet().then(L => {
      if (!mapNode.isConnected) return;
      map = instance = L.map(mapNode, { scrollWheelZoom:false, zoomAnimation:false, fadeAnimation:false, markerZoomAnimation:false, inertia:false }).setView([7.65,100.04], 10);
      const tiles = L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', { maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' });
      tiles.on('tileerror', () => { mapStatus.textContent = word('ภาพพื้นแผนที่โหลดไม่สำเร็จ รายการและหมุดยังใช้ได้','Map tiles are unavailable. The list and markers are still available.'); });
      tiles.on('tileload', () => { mapStatus.textContent = ''; });
      tiles.addTo(map); layer = L.layerGroup().addTo(map); map.on('zoomend',refreshCluster); render();
    }).catch(() => {
      mapStatus.textContent = word('โหลดแผนที่ไม่ได้ เปิดรายละเอียดได้จากรายการ','Map unavailable. Open a destination from the list.');
      mapNode.hidden = true;
    });
  }

  window.TourismMap = {
    mount,
    openItinerary(route) { itinerary = route; window.Router.navigate('map','itinerary'); },
    reference(place) {
      if (place.categoryId !== 'attractions') return undefined;
      return locations.find(entry => entry.district === place.districtId && String(entry.id) === String(place.id));
    },
    unmount() { instance?.remove(); instance = null; },
  };
})();
