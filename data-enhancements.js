(function () {
  const images = {
    attraction: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80',
      'https://images.unsplash.com/photo-1518002054494-3a6f94352e9d?w=900&q=80'
    ],
    food: [
      'https://images.unsplash.com/photo-1559847844-5315695dadae?w=900&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=900&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80'
    ],
    hotel: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80'
    ],
    workshop: [
      'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=900&q=80',
      'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=900&q=80',
      'https://images.unsplash.com/photo-1529690840038-f38da8894ff6?w=900&q=80',
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=900&q=80'
    ]
  };

  const districtProfiles = {
    mueang: { label: 'เมืองพัทลุง', theme: 'วัฒนธรรมเมืองเก่า', lat: 7.616, lng: 100.074 },
    'khuan-khanun': { label: 'ควนขนุน', theme: 'ทะเลน้อยและงานกระจูด', lat: 7.735, lng: 100.126 },
    'khao-chaison': { label: 'เขาชัยสน', theme: 'น้ำพุร้อนและวิถีชุมชน', lat: 7.462, lng: 100.129 },
    'kong-ra': { label: 'กงหรา', theme: 'ป่าเขาและน้ำตก', lat: 7.417, lng: 99.949 },
    'pak-phayun': { label: 'ปากพะยูน', theme: 'ทะเลสาบและประมงพื้นบ้าน', lat: 7.342, lng: 100.315 },
    'bang-kaeo': { label: 'บางแก้ว', theme: 'ชุมชนริมทะเลสาบ', lat: 7.425, lng: 100.178 },
    tamot: { label: 'ตะโหมด', theme: 'เกษตรและชุมชนใต้', lat: 7.345, lng: 99.959 },
    'pa-bon': { label: 'ป่าบอน', theme: 'ป่าเขาและสวนยาง', lat: 7.265, lng: 100.171 },
    srinagarindra: { label: 'ศรีนครินทร์', theme: 'เส้นทางธรรมชาติ', lat: 7.569, lng: 99.965 },
    'si-banphot': { label: 'ศรีบรรพต', theme: 'ภูเขาและงานชุมชน', lat: 7.697, lng: 99.872 },
    'pa-phayom': { label: 'ป่าพะยอม', theme: 'ตลาดท้องถิ่นและอาหารใต้', lat: 7.840, lng: 99.921 }
  };

  function money(level) {
    return level === 'free' ? 'ฟรี' : level === 'low' ? '฿' : level === 'high' ? '฿฿฿' : '฿฿';
  }

  function makePlace(id, districtId, categoryId, base) {
    const profile = districtProfiles[districtId] || { label: districtId, theme: 'พัทลุง', lat: 7.616, lng: 100.074 };
    return {
      id,
      name: base.name,
      rating: base.rating || 4.6,
      price: money(base.budgetLevel || 'medium'),
      tag: base.tag || profile.theme,
      description: base.description,
      image: base.image,
      hours: base.hours || '09:00 - 17:00',
      tags: base.tags || [],
      budgetLevel: base.budgetLevel || 'medium',
      suitableFor: base.suitableFor || ['solo', 'couple', 'family'],
      duration: base.duration || 1.5,
      coordinates: {
        lat: profile.lat + (id % 5) * 0.006,
        lng: profile.lng + (id % 4) * 0.006
      },
      categoryId
    };
  }

  function ensureCategory(data) {
    data.categories.workshops = {
      id: 'workshops',
      name: 'เวิร์กช็อป',
      nameEn: 'Workshops',
      image: images.workshop[0],
      description: 'กิจกรรมลงมือทำ งานคราฟต์ อาหารพื้นบ้าน และประสบการณ์ชุมชนพัทลุง'
    };
  }

  function ensurePlaces(data) {
    data.districts.forEach((district, di) => {
      const id = district.id;
      const profile = districtProfiles[id] || { label: district.name, theme: 'พัทลุง' };
      data.places[id] = data.places[id] || {};
      ['attractions', 'restaurants', 'accommodations', 'workshops'].forEach((cat) => {
        data.places[id][cat] = Array.isArray(data.places[id][cat]) ? data.places[id][cat] : [];
      });

      const nextId = (cat, offset) => {
        const max = data.places[id][cat].reduce((n, p) => Math.max(n, Number(p.id) || 0), 0);
        return max + offset;
      };

      if (data.places[id].attractions.length < 3) {
        data.places[id].attractions.push(
          makePlace(nextId('attractions', 1), id, 'attractions', {
            name: `จุดชมวิว${profile.label}`,
            tag: 'วิวธรรมชาติ',
            description: `จุดแวะชมบรรยากาศของ${profile.label} เหมาะกับการถ่ายภาพ พักสายตา และเริ่มต้นทำความรู้จักพื้นที่`,
            image: images.attraction[di % images.attraction.length],
            budgetLevel: 'free',
            tags: ['nature', 'photography', 'family'],
            duration: 1
          }),
          makePlace(nextId('attractions', 2), id, 'attractions', {
            name: `เส้นทางชุมชน${profile.label}`,
            tag: 'วัฒนธรรมท้องถิ่น',
            description: `เดินเล่นในย่านชุมชน เรียนรู้เรื่องเล่าท้องถิ่น อาหาร และวิถีชีวิตของคน${profile.label}`,
            image: images.attraction[(di + 1) % images.attraction.length],
            budgetLevel: 'low',
            tags: ['culture', 'food', 'family'],
            duration: 1.5
          })
        );
      }

      if (data.places[id].restaurants.length < 3) {
        data.places[id].restaurants.push(
          makePlace(nextId('restaurants', 1), id, 'restaurants', {
            name: `ครัวพื้นบ้าน${profile.label}`,
            tag: 'อาหารใต้',
            description: `ร้านอาหารท้องถิ่นรสจัดจ้าน ใช้วัตถุดิบในพื้นที่ เหมาะกับมื้อกลางวันและมื้อเย็น`,
            image: images.food[di % images.food.length],
            budgetLevel: 'medium',
            tags: ['food', 'family'],
            duration: 1.2,
            hours: '10:00 - 20:30'
          }),
          makePlace(nextId('restaurants', 2), id, 'restaurants', {
            name: `คาเฟ่ชุมชน${profile.label}`,
            tag: 'คาเฟ่',
            description: `คาเฟ่บรรยากาศสว่าง เหมาะกับพักระหว่างเส้นทาง มีเครื่องดื่ม ขนม และมุมถ่ายรูป`,
            image: images.food[(di + 1) % images.food.length],
            budgetLevel: 'low',
            tags: ['cafe', 'food', 'photography'],
            duration: 1,
            hours: '08:30 - 18:00'
          })
        );
      }

      if (data.places[id].accommodations.length < 2) {
        data.places[id].accommodations.push(
          makePlace(nextId('accommodations', 1), id, 'accommodations', {
            name: `โฮมสเตย์${profile.label}`,
            tag: 'โฮมสเตย์',
            description: `ที่พักเรียบง่ายใกล้ชุมชน เหมาะกับนักเดินทางที่อยากสัมผัสวิถีท้องถิ่นและตื่นเช้าเดินเล่น`,
            image: images.hotel[di % images.hotel.length],
            budgetLevel: 'low',
            tags: ['family', 'culture'],
            duration: 8,
            hours: 'Check-in 14:00'
          }),
          makePlace(nextId('accommodations', 2), id, 'accommodations', {
            name: `รีสอร์ท${profile.label}`,
            tag: 'รีสอร์ท',
            description: `ที่พักสบายสำหรับคู่รักและครอบครัว มีพื้นที่พักผ่อน เงียบ และเดินทางต่อไปจุดเที่ยวสำคัญได้ง่าย`,
            image: images.hotel[(di + 1) % images.hotel.length],
            budgetLevel: 'medium',
            tags: ['couple', 'family', 'nature'],
            duration: 8,
            hours: 'Check-in 14:00'
          })
        );
      }

      if (data.places[id].workshops.length < 3) {
        data.places[id].workshops.push(
          makePlace(nextId('workshops', 1), id, 'workshops', {
            name: `เวิร์กช็อปงานคราฟต์${profile.label}`,
            tag: 'งานทำมือ',
            description: `กิจกรรมทำของที่ระลึกจากวัสดุท้องถิ่น ได้เรียนรู้ขั้นตอนจากคนในชุมชนและนำชิ้นงานกลับบ้าน`,
            image: images.workshop[di % images.workshop.length],
            budgetLevel: 'medium',
            tags: ['culture', 'family', 'workshop'],
            duration: 2,
            hours: '09:30 - 15:30'
          }),
          makePlace(nextId('workshops', 2), id, 'workshops', {
            name: `คลาสอาหารใต้${profile.label}`,
            tag: 'ทำอาหาร',
            description: `เรียนทำเมนูพื้นบ้านพัทลุง ตั้งแต่เลือกวัตถุดิบ ปรุงรส ไปจนถึงจัดสำรับแบบคนใต้`,
            image: images.workshop[(di + 1) % images.workshop.length],
            budgetLevel: 'medium',
            tags: ['food', 'culture', 'workshop'],
            duration: 2.5,
            hours: '10:00 - 14:00'
          }),
          makePlace(nextId('workshops', 3), id, 'workshops', {
            name: `กิจกรรมชุมชน${profile.label}`,
            tag: 'ประสบการณ์ท้องถิ่น',
            description: `กิจกรรมเบา ๆ สำหรับครอบครัวและนักเดินทางที่อยากรู้จักชุมชนผ่านการลงมือทำจริง`,
            image: images.workshop[(di + 2) % images.workshop.length],
            budgetLevel: 'low',
            tags: ['family', 'culture', 'nature', 'workshop'],
            duration: 1.5,
            hours: '13:00 - 16:00'
          })
        );
      }
    });
  }

  window.applyPhatthalungEnhancements = function applyPhatthalungEnhancements(data) {
    if (!data || data._enhancedForPlanner) return;
    ensureCategory(data);
    ensurePlaces(data);
    data._enhancedForPlanner = true;
  };
})();
