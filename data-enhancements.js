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
    mueang: { label: 'เมืองพัทลุง', labelEn: 'Mueang Phatthalung', theme: 'วัฒนธรรมเมืองเก่า', themeEn: 'Old town culture', lat: 7.616, lng: 100.074 },
    'khuan-khanun': { label: 'ควนขนุน', labelEn: 'Khuan Khanun', theme: 'ทะเลน้อยและงานกระจูด', themeEn: 'Thale Noi and krajood craft', lat: 7.735, lng: 100.126 },
    'khao-chaison': { label: 'เขาชัยสน', labelEn: 'Khao Chaison', theme: 'น้ำพุร้อนและวิถีชุมชน', themeEn: 'Hot springs and community life', lat: 7.462, lng: 100.129 },
    'kong-ra': { label: 'กงหรา', labelEn: 'Kong Ra', theme: 'ป่าเขาและน้ำตก', themeEn: 'Forests and waterfalls', lat: 7.417, lng: 99.949 },
    'pak-phayun': { label: 'ปากพะยูน', labelEn: 'Pak Phayun', theme: 'ทะเลสาบและประมงพื้นบ้าน', themeEn: 'Lake and local fishing', lat: 7.342, lng: 100.315 },
    'bang-kaeo': { label: 'บางแก้ว', labelEn: 'Bang Kaeo', theme: 'ชุมชนริมทะเลสาบ', themeEn: 'Lakeside community', lat: 7.425, lng: 100.178 },
    tamot: { label: 'ตะโหมด', labelEn: 'Tamot', theme: 'เกษตรและชุมชนใต้', themeEn: 'Farming and southern community', lat: 7.345, lng: 99.959 },
    'pa-bon': { label: 'ป่าบอน', labelEn: 'Pa Bon', theme: 'ป่าเขาและสวนยาง', themeEn: 'Forests and rubber groves', lat: 7.265, lng: 100.171 },
    srinagarindra: { label: 'ศรีนครินทร์', labelEn: 'Srinagarindra', theme: 'เส้นทางธรรมชาติ', themeEn: 'Nature trails', lat: 7.569, lng: 99.965 },
    'si-banphot': { label: 'ศรีบรรพต', labelEn: 'Si Banphot', theme: 'ภูเขาและงานชุมชน', themeEn: 'Mountains and community craft', lat: 7.697, lng: 99.872 },
    'pa-phayom': { label: 'ป่าพะยอม', labelEn: 'Pa Phayom', theme: 'ตลาดท้องถิ่นและอาหารใต้', themeEn: 'Local markets and southern food', lat: 7.840, lng: 99.921 }
  };

  function money(level) {
    return level === 'free' ? 'ฟรี' : level === 'low' ? '฿' : level === 'high' ? '฿฿฿' : '฿฿';
  }

  function makePlace(id, districtId, categoryId, base) {
    const profile = districtProfiles[districtId] || { label: districtId, labelEn: districtId, theme: 'พัทลุง', themeEn: 'Phatthalung', lat: 7.616, lng: 100.074 };
    return {
      id,
      name: base.name,
      nameEn: base.nameEn,
      rating: base.rating || 4.6,
      price: money(base.budgetLevel || 'medium'),
      tag: base.tag || profile.theme,
      tagEn: base.tagEn || profile.themeEn,
      description: base.description,
      descriptionEn: base.descriptionEn,
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
      description: 'กิจกรรมลงมือทำ งานคราฟต์ อาหารพื้นบ้าน และประสบการณ์ชุมชนพัทลุง',
      descriptionEn: 'Hands-on craft, southern cooking, and community experiences in Phatthalung.'
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
            nameEn: `Viewpoint in ${profile.labelEn}`,
            tag: 'วิวธรรมชาติ',
            tagEn: 'Natural views',
            description: `จุดแวะชมบรรยากาศของ${profile.label} เหมาะกับการถ่ายภาพ พักสายตา และเริ่มต้นทำความรู้จักพื้นที่`,
            descriptionEn: `A scenic stop to take in ${profile.labelEn}. Great for photos, a short break, and getting to know the area.`,
            image: images.attraction[di % images.attraction.length],
            budgetLevel: 'free',
            tags: ['nature', 'photography', 'family'],
            duration: 1
          }),
          makePlace(nextId('attractions', 2), id, 'attractions', {
            name: `เส้นทางชุมชน${profile.label}`,
            nameEn: `Community trail in ${profile.labelEn}`,
            tag: 'วัฒนธรรมท้องถิ่น',
            tagEn: 'Local culture',
            description: `เดินเล่นในย่านชุมชน เรียนรู้เรื่องเล่าท้องถิ่น อาหาร และวิถีชีวิตของคน${profile.label}`,
            descriptionEn: `Walk through the community, learn local stories, taste local food, and see everyday life in ${profile.labelEn}.`,
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
            nameEn: `Home kitchen in ${profile.labelEn}`,
            tag: 'อาหารใต้',
            tagEn: 'Southern food',
            description: `ร้านอาหารท้องถิ่นรสจัดจ้าน ใช้วัตถุดิบในพื้นที่ เหมาะกับมื้อกลางวันและมื้อเย็น`,
            descriptionEn: `A local kitchen with bold southern flavours and ingredients from the area. Good for lunch or dinner.`,
            image: images.food[di % images.food.length],
            budgetLevel: 'medium',
            tags: ['food', 'family'],
            duration: 1.2,
            hours: '10:00 - 20:30'
          }),
          makePlace(nextId('restaurants', 2), id, 'restaurants', {
            name: `คาเฟ่ชุมชน${profile.label}`,
            nameEn: `Community cafe in ${profile.labelEn}`,
            tag: 'คาเฟ่',
            tagEn: 'Cafe',
            description: `คาเฟ่บรรยากาศสว่าง เหมาะกับพักระหว่างเส้นทาง มีเครื่องดื่ม ขนม และมุมถ่ายรูป`,
            descriptionEn: `A bright little cafe for a break along the route, with drinks, snacks, and photo corners.`,
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
            nameEn: `Homestay in ${profile.labelEn}`,
            tag: 'โฮมสเตย์',
            tagEn: 'Homestay',
            description: `ที่พักเรียบง่ายใกล้ชุมชน เหมาะกับนักเดินทางที่อยากสัมผัสวิถีท้องถิ่นและตื่นเช้าเดินเล่น`,
            descriptionEn: `A simple stay close to the community, ideal if you want local life and an early morning walk.`,
            image: images.hotel[di % images.hotel.length],
            budgetLevel: 'low',
            tags: ['family', 'culture'],
            duration: 8,
            hours: 'Check-in 14:00'
          }),
          makePlace(nextId('accommodations', 2), id, 'accommodations', {
            name: `รีสอร์ท${profile.label}`,
            nameEn: `Resort in ${profile.labelEn}`,
            tag: 'รีสอร์ท',
            tagEn: 'Resort',
            description: `ที่พักสบายสำหรับคู่รักและครอบครัว มีพื้นที่พักผ่อน เงียบ และเดินทางต่อไปจุดเที่ยวสำคัญได้ง่าย`,
            descriptionEn: `A comfortable stay for couples and families: quiet, roomy, and close to the main sights.`,
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
            nameEn: `Craft workshop in ${profile.labelEn}`,
            tag: 'งานทำมือ',
            tagEn: 'Handmade craft',
            description: `กิจกรรมทำของที่ระลึกจากวัสดุท้องถิ่น ได้เรียนรู้ขั้นตอนจากคนในชุมชนและนำชิ้นงานกลับบ้าน`,
            descriptionEn: `Make a souvenir from local materials, learn the steps from local makers, and take your piece home.`,
            image: images.workshop[di % images.workshop.length],
            budgetLevel: 'medium',
            tags: ['culture', 'family', 'workshop'],
            duration: 2,
            hours: '09:30 - 15:30'
          }),
          makePlace(nextId('workshops', 2), id, 'workshops', {
            name: `คลาสอาหารใต้${profile.label}`,
            nameEn: `Southern cooking class in ${profile.labelEn}`,
            tag: 'ทำอาหาร',
            tagEn: 'Cooking class',
            description: `เรียนทำเมนูพื้นบ้านพัทลุง ตั้งแต่เลือกวัตถุดิบ ปรุงรส ไปจนถึงจัดสำรับแบบคนใต้`,
            descriptionEn: `Cook a Phatthalung home-style menu: pick the ingredients, balance the flavours, and plate it the southern way.`,
            image: images.workshop[(di + 1) % images.workshop.length],
            budgetLevel: 'medium',
            tags: ['food', 'culture', 'workshop'],
            duration: 2.5,
            hours: '10:00 - 14:00'
          }),
          makePlace(nextId('workshops', 3), id, 'workshops', {
            name: `กิจกรรมชุมชน${profile.label}`,
            nameEn: `Community activity in ${profile.labelEn}`,
            tag: 'ประสบการณ์ท้องถิ่น',
            tagEn: 'Local experience',
            description: `กิจกรรมเบา ๆ สำหรับครอบครัวและนักเดินทางที่อยากรู้จักชุมชนผ่านการลงมือทำจริง`,
            descriptionEn: `A gentle hands-on activity for families and travellers who want to meet the community by doing.`,
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
