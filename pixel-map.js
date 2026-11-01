/**
 * pixel-map.js — Pixel-art district map for Nolatalung
 * ====================================================
 * Replaces the Three.js 3D map with 11 hand-composed pixel scenes (inline SVG,
 * 64x48 logical grid). Exposes the same `window.Map3D` facade the planner
 * already calls, so smart-tourism.js needs no changes.
 *
 * API kept for compatibility:
 *   init() destroy() focusDistrict(id, open) setDistrictHighlights(ids, primary)
 *   clearDistrictHighlights() resetZoom() animateRoutePath(ids)
 */
(function () {
  'use strict';

  /* ── Palette (16 shared colours + per-district accent) ─────────────── */
  var C = {
    sky: '#d9effb', skyDeep: '#bfe3f6', cloud: '#ffffff',
    hillFar: '#c3dcc6', hillMid: '#94c39c', hillNear: '#5f9068', forest: '#3f6b4e',
    grass: '#8fbf6a', grassDark: '#6a9a4a', soil: '#c9a86b', soilDark: '#a8874f',
    water: '#7cc3e0', waterDeep: '#4a9cc4', waterLight: '#c6ecf7',
    rock: '#a49a90', rockDark: '#786e64', rockLight: '#cbc2b7',
    wood: '#8a5a3b', woodDark: '#6b4229', roof: '#b5483a', wall: '#efe3c8',
    rice: '#e3c95c', riceDark: '#bda63f',
    lotus: '#e86f9e', lotusPale: '#f7a8c4', leaf: '#4f9a5f',
    ink: '#20242c', white: '#ffffff', gold: '#e0b24a', firefly: '#f8e97a',
    sand: '#e6d3a3', night: '#10243a',
    skyTop: '#cfeafd', sun: '#f6d06a', sunCore: '#ffe9a8', cloudShadow: '#e8f5fd',
    trunk: '#6b4229', canopy1: '#2f6b44', canopy2: '#3f7a4e', canopy3: '#5fa96b',
    rock1: '#8f857a', rock2: '#a89e93', rock3: '#c2b8ac',
    foam: '#eaf8ff', glass: '#bfe3f6'
  };

  /* ── Primitive helpers ─────────────────────────────────────────────── */
  function R(x, y, w, h, fill, cls) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
      '" fill="' + fill + '"' + (cls ? ' class="' + cls + '"' : '') + '/>';
  }
  function block(x, y, w, h, fill, step, cls) {
    var out = '';
    var s = (typeof step === 'number' && step > 0) ? step : 1;
    for (var i = 0; i < h; i += s) {
      out += R(x, y + i, w, Math.min(s, h - i), fill, cls);
    }
    return out;
  }

  /* ── Shared scenery pieces ─────────────────────────────────────────── */
  function skyBase(h) {
    return R(0, 0, 64, h || 22, C.sky) +
      R(0, 0, 64, 6, C.skyTop) +
      R(0, 6, 64, 3, C.skyDeep);
  }
  function sun(x, y) {
    return R(x + 1, y, 5, 7, C.sun) + R(x, y + 1, 7, 5, C.sun) +
      R(x + 2, y + 2, 3, 3, C.sunCore);
  }
  function cloudCluster(x, y) {
    return R(x, y + 2, 12, 3, C.cloud) + R(x + 2, y, 6, 2, C.cloud) +
      R(x + 9, y + 1, 5, 2, C.cloud);
  }
  function clouds() {
    return '<g class="clouds">' + cloudCluster(2, 2) + cloudCluster(46, 4) + '</g>';
  }
  /* continuous stepped ridge — overlapping blocks so it never reads as floating boxes */
  function farHills(y, fill) {
    var f = fill || C.hillFar;
    return R(0, y + 4, 64, 5, f) +
      R(0, y + 2, 22, 3, f) +
      R(12, y, 12, 4, f) +
      R(22, y + 2, 14, 2, f) +
      R(34, y, 14, 4, f) +
      R(44, y + 2, 20, 3, f);
  }
  /* soft shadow under a focal subject */
  function groundShadow(x, y, w) {
    return R(x, y, w, 1, 'rgba(20,28,24,0.18)');
  }
  /* five-pixel lotus bloom (reads as a flower, not a flag) */
  function lotusBloom(x, y, tone) {
    return R(x + 1, y, 3, 1, tone) +
      R(x, y + 1, 5, 2, tone) +
      R(x + 1, y + 3, 3, 1, tone) +
      R(x + 2, y + 1, 1, 2, C.lotusPale);
  }

  function waterBand(y, h) {
    return R(0, y, 64, h, C.water) +
      R(0, y, 64, 2, C.waterLight) +
      R(0, y + h - 3, 64, 3, C.waterDeep) +
      '<g class="shimmer">' + R(5, y + 5, 9, 1, C.foam) + R(22, y + 9, 11, 1, C.foam) +
      R(43, y + 5, 10, 1, C.foam) + R(13, y + 13, 8, 1, C.foam) + '</g>';
  }
  /* outlined tree: dark ink silhouette + lit canopy */
  function tree(x, y, s) {
    s = s || 1;
    var w = Math.round(10 * s), h = Math.round(8 * s);
    return R(x + 3 * s, y + h - 1, Math.round(3 * s), Math.round(5 * s), C.ink) +
      R(x + 3 * s, y + h - 1, Math.round(2 * s), Math.round(4 * s), C.trunk) +
      R(x, y + 2 * s, w, h - 2 * s, C.ink) +
      R(x + 1 * s, y + 3 * s, w - 2 * s, h - 4 * s, C.canopy1) +
      R(x + 2 * s, y + 2 * s, w - 5 * s, Math.round(3 * s), C.canopy3);
  }
  function palm(x, y) {
    return R(x + 2, y - 10, 2, 10, C.ink) + R(x + 2, y - 10, 1, 9, C.trunk) +
      R(x - 4, y - 12, 10, 2, C.ink) + R(x - 3, y - 12, 8, 1, C.canopy3) +
      R(x - 2, y - 10, 6, 1, C.canopy2);
  }
  function houseWide(x, y) {
    return R(x, y + 3, 16, 8, C.ink) + R(x + 1, y + 4, 14, 6, C.wall) +
      R(x - 1, y, 18, 3, C.ink) + R(x, y + 1, 16, 2, C.roof) +
      R(x + 2, y - 2, 12, 2, C.roof) +
      R(x + 2, y + 7, 4, 4, C.woodDark) + R(x + 10, y + 6, 3, 3, C.glass);
  }
  function bird(x, y, cls) {
    return R(x, y + 1, 1, 1, C.ink, cls) + R(x + 1, y, 1, 1, C.ink, cls) +
      R(x + 2, y + 1, 1, 1, C.ink, cls);
  }
  function tuft(x, y) {
    return R(x, y, 1, 2, C.grassDark) + R(x + 2, y, 1, 2, C.grassDark) +
      R(x + 1, y + 1, 1, 1, C.grassDark);
  }
  function stone(x, y) {
    return R(x, y, 4, 3, C.ink) + R(x + 1, y, 2, 2, C.rock3);
  }
  function forestWall(y) {
    return R(0, y, 64, 48 - y, C.forest) + R(0, y, 64, 2, C.canopy1);
  }

  /* ── 11 district scenes (64x48, outlined focal subjects) ───────────── */
  var SCENES = {
    /* เมืองพัทลุง — เขาอกทะลุ + ถ้ำ + หนังตะลุง */
    mueang: function () {
      /* two-pass silhouette: draw every ink edge first, then all fills on top,
         so the mountain gets ONE outer outline instead of stacked boxes */
      var steps = [
        [30, 12, 5, 4], [27, 15, 10, 5], [23, 19, 16, 5],
        [19, 23, 20, 6], [15, 27, 26, 6], [12, 31, 33, 11],
        [42, 34, 8, 8]
      ];
      var i, inks = '', fills = '';
      for (i = 0; i < steps.length; i++) {
        var q = steps[i];
        inks += R(q[0] - 1, q[1] - 1, q[2] + 2, q[3] + 2, C.ink);
      }
      for (i = 0; i < steps.length; i++) {
        var r = steps[i];
        var tone = r[1] <= 15 ? C.rock3 : (r[1] <= 23 ? C.rock2 : C.rock1);
        fills += R(r[0], r[1], r[2], r[3], tone);
      }
      /* rock texture + moss at the foot */
      var texture =
        R(20, 33, 5, 3, C.rock2) + R(34, 30, 4, 4, C.rock2) +
        R(17, 37, 7, 3, C.rock2) + R(38, 38, 5, 3, C.rock2) +
        R(24, 28, 3, 2, C.rock3) + R(44, 36, 3, 2, C.rock2) +
        R(14, 40, 4, 2, C.canopy1) + R(30, 41, 3, 2, C.canopy1) +
        R(47, 41, 3, 2, C.canopy1);

      return skyBase(18) + sun(52, 2) + clouds() + farHills(12) +
        groundShadow(12, 44, 42) +
        inks + fills + texture +
        /* the hole: sky through the rock, with a shadowed rim */
        R(28, 21, 10, 8, C.ink) +
        R(29, 22, 8, 6, C.sky) +
        R(29, 22, 8, 1, C.skyTop) +
        R(34, 25, 3, 2, C.skyDeep) +
        /* tapered, translucent beam through the hole */
        '<g class="beam">' +
          R(31, 29, 4, 4, C.sun) +
          R(30, 33, 6, 5, C.sun) +
          R(28, 38, 10, 6, C.sunCore) +
        '</g>' +
        /* ground */
        R(0, 44, 64, 4, C.ink) + R(0, 45, 64, 3, C.grass) +
        R(26, 44, 10, 4, C.sand) +
        /* cave temple, left */
        R(1, 35, 14, 9, C.ink) + R(2, 36, 12, 8, C.rock2) +
        R(0, 32, 16, 4, C.ink) + R(1, 33, 14, 2, C.roof) +
        R(4, 38, 6, 6, C.ink) + R(5, 39, 4, 5, C.night) +
        R(1, 35, 14, 1, C.gold) +
        /* shadow-puppet figure, right */
        R(51, 30, 7, 2, C.ink) + R(52, 30, 5, 1, C.gold) +
        R(51, 32, 7, 6, C.ink) + R(52, 33, 5, 4, C.gold) +
        R(48, 33, 4, 2, C.ink) + R(49, 33, 3, 1, C.gold) +
        R(57, 33, 4, 2, C.ink) + R(58, 33, 3, 1, C.gold) +
        R(50, 38, 9, 2, C.ink) + R(51, 38, 7, 1, C.roof) +
        R(52, 40, 2, 5, C.ink) + R(56, 40, 2, 5, C.ink) +
        /* foreground framing: rocks + grass */
        R(0, 45, 8, 3, C.rock2) + R(58, 45, 6, 3, C.rock2) +
        tuft(16, 45) + tuft(44, 46) + stone(9, 46) + stone(60, 45);
    },

    'kong-ra': function () {
      return skyBase(18) + clouds() + farHills(10, C.hillMid) +
        R(0, 16, 64, 10, C.ink) + R(0, 17, 64, 8, C.hillNear) +
        R(0, 24, 64, 6, C.ink) + R(0, 25, 64, 4, C.forest) +
        /* rock face with the fall cut into it */
        R(24, 10, 22, 28, C.ink) +
        R(25, 11, 20, 26, C.rock2) +
        R(27, 9, 16, 3, C.rock3) +
        R(31, 12, 8, 4, C.rock1) +
        /* the fall itself: bright water + streaks + dark banks */
        R(29, 16, 2, 20, C.ink) + R(37, 16, 2, 20, C.ink) +
        R(31, 15, 6, 21, C.waterLight, 'waterfall') +
        R(32, 17, 2, 17, C.foam, 'fall') +
        R(36, 19, 1, 14, C.foam, 'fall') +
        /* plunge pool */
        R(22, 36, 26, 6, C.ink) + R(23, 37, 24, 4, C.water) +
        R(27, 38, 7, 2, C.foam, 'splash') + R(38, 37, 5, 2, C.foam, 'splash') +
        tree(2, 26) + tree(12, 31, 0.9) + tree(48, 26, 1.1) + tree(57, 31) +
        palm(18, 45) + palm(60, 43) +
        bird(8, 5, 'bird') + bird(13, 7, 'bird') + bird(18, 4, 'bird') +
        tuft(4, 45) + tuft(52, 46) + stone(40, 45);
    },

    /* เขาชัยสน — ประตูสู่ทะเลน้อย บัวแดง นกน้ำ */
    'khao-chaison': function () {
      return skyBase(18) + sun(48, 2) + clouds() +
        R(0, 14, 64, 5, C.ink) + R(0, 15, 64, 4, C.hillFar) +
        R(18, 12, 10, 3, C.hillMid) + R(40, 11, 12, 4, C.hillMid) +
        tree(2, 9, 0.7) + tree(54, 8, 0.7) +
        waterBand(19, 29) +
        /* pads */
        R(4, 30, 12, 2, C.leaf) + R(18, 34, 12, 2, C.leaf) +
        R(33, 29, 11, 2, C.leaf) + R(45, 33, 11, 2, C.leaf) +
        R(10, 40, 12, 2, C.leaf) + R(38, 41, 11, 2, C.leaf) +
        /* blooms: five-pixel flowers with a pale centre */
        lotusBloom(7, 26, C.lotus) +
        lotusBloom(21, 30, C.lotusPale) +
        lotusBloom(35, 25, C.lotus) +
        lotusBloom(48, 29, C.lotusPale) +
        lotusBloom(13, 36, C.lotus) +
        lotusBloom(41, 37, C.lotusPale) +
        /* stems + reeds */
        R(9, 31, 1, 3, C.grassDark) + R(37, 30, 1, 3, C.grassDark) +
        R(1, 21, 1, 8, C.grassDark) + R(3, 20, 1, 9, C.grassDark) +
        R(60, 21, 1, 8, C.grassDark) + R(58, 20, 1, 9, C.grassDark) +
        bird(13, 7, 'bird') + bird(17, 5, 'bird') + bird(21, 8, 'bird') +
        bird(26, 4, 'bird') + bird(31, 7, 'bird') +
        R(0, 47, 64, 1, C.waterDeep);
    },

    /* ตะโหมด — เกษตรกรรม ยางพารา */
    tamot: function () {
      var out = skyBase(20) + sun(6, 2) + clouds() + farHills(12) +
        R(0, 20, 64, 28, C.ink) +
        R(0, 21, 64, 26, C.soil) +
        R(0, 24, 64, 3, C.riceDark) +
        R(0, 31, 64, 3, C.grass) +
        R(0, 38, 64, 3, C.riceDark) +
        R(0, 45, 64, 3, C.soilDark);
      /* rubber trees */
      [6, 19, 32, 45, 57].forEach(function (x, i) {
        out += R(x, 12, 4, 16, C.ink) + R(x + 1, 13, 2, 14, C.trunk) +
          R(x - 4, 8, 12, 6, C.ink) + R(x - 3, 9, 10, 4, C.canopy1) +
          R(x - 2, 9, 7, 2, C.canopy3) +
          R(x + 4, 24, 4, 3, C.ink) + R(x + 5, 24, 2, 2, C.sand);
        if (i % 2 === 0) out += R(x + 2, 20, 1, 4, C.white, 'drop');
      });
      /* tractor */
      out += R(22, 31, 14, 6, C.ink) + R(23, 32, 12, 4, C.roof, 'tractor') +
        R(24, 28, 6, 4, C.ink) + R(25, 29, 4, 2, C.glass) +
        R(22, 36, 4, 4, C.ink) + R(23, 37, 2, 2, C.rock3) +
        R(31, 36, 4, 4, C.ink) + R(32, 37, 2, 2, C.rock3) +
        tuft(4, 46) + tuft(40, 46) + tuft(54, 46) + stone(48, 46);
      return out;
    },

    /* ควนขนุน — อู่ข้าวอู่น้ำ ข้าวสังข์หยด */
    'khuan-khanun': function () {
      var out = skyBase(20) + clouds() + farHills(12, C.hillMid) +
        R(0, 19, 64, 4, C.ink) + R(0, 20, 64, 3, C.hillMid) +
        R(0, 23, 64, 6, C.ink) + R(0, 24, 64, 5, C.riceDark) +
        R(0, 29, 64, 7, C.ink) + R(0, 30, 64, 6, C.rice) +
        R(0, 36, 64, 7, C.ink) + R(0, 37, 64, 6, C.riceDark) +
        R(0, 43, 64, 5, C.ink) + R(0, 44, 64, 4, C.rice) +
        R(0, 47, 64, 1, C.grassDark);
      out += R(0, 29, 64, 1, C.waterLight) + R(0, 36, 64, 1, C.waterLight) +
        R(0, 43, 64, 1, C.waterLight);
      for (var x = 2; x < 64; x += 6) {
        out += R(x, 26, 1, 4, C.grassDark, 'stalk') +
          R(x + 2, 33, 1, 5, C.grassDark, 'stalk') +
          R(x + 4, 39, 1, 5, C.grassDark, 'stalk') +
          R(x + 1, 45, 1, 3, C.grassDark, 'stalk');
      }
      out += houseWide(44, 12) + palm(4, 22) + palm(10, 20) + palm(58, 20) +
        R(14, 15, 4, 8, C.ink) + R(15, 16, 2, 7, C.trunk) +
        R(11, 12, 10, 4, C.ink) + R(12, 13, 8, 2, C.canopy1);
      return out;
    },

    /* ปากพะยูน — เขาอกทะลุกลางน้ำ + พะยูน */
    'pak-phayun': function () {
      return skyBase(18) + sun(4, 5) + clouds() +
        R(0, 13, 28, 7, C.ink) + R(0, 14, 28, 5, C.hillFar) +
        R(38, 13, 26, 7, C.ink) + R(38, 14, 26, 5, C.hillFar) +
        /* water: three depth bands + sparkle */
        R(0, 20, 64, 28, C.ink) +
        R(0, 20, 64, 28, C.water) +
        R(0, 21, 64, 3, C.waterLight) +
        R(0, 30, 64, 5, C.water) +
        R(0, 35, 64, 8, C.waterDeep) +
        R(0, 43, 64, 5, C.waterDeep) +
        '<g class="shimmer">' +
          R(4, 24, 9, 1, C.foam) + R(20, 27, 11, 1, C.foam) +
          R(44, 24, 9, 1, C.foam) + R(12, 38, 8, 1, C.foam) +
          R(38, 40, 9, 1, C.foam) + R(28, 33, 7, 1, C.foam) +
        '</g>' +
        /* rock arch: thick legs standing in the water, chunky cap, sky gap */
        R(19, 11, 26, 5, C.ink) +
        R(20, 11, 24, 3, C.rock2) +
        R(22, 9, 9, 2, C.ink) + R(23, 9, 7, 1, C.rock3) +
        R(34, 9, 7, 2, C.ink) + R(35, 9, 5, 1, C.rock3) +
        R(21, 16, 8, 14, C.ink) + R(22, 16, 6, 14, C.rock1) +
        R(36, 16, 8, 14, C.ink) + R(37, 16, 6, 14, C.rock1) +
        R(29, 16, 6, 9, C.sky) +
        R(29, 16, 6, 1, C.skyDeep) +
        R(23, 19, 4, 3, C.rock2) + R(38, 22, 3, 4, C.rock2) +
        R(20, 29, 26, 2, C.rock3) +
        /* reflection under the arch */
        R(22, 31, 20, 1, C.rock2) + R(25, 33, 14, 1, C.rock1) +
        /* dugong: head, eye, back, tail fluke, flipper */
        R(8, 36, 22, 6, C.ink) +
        R(9, 37, 20, 4, C.rock3) +
        R(9, 36, 17, 1, C.rock2) +
        R(29, 37, 4, 3, C.ink) + R(30, 37, 2, 2, C.rock3) +
        R(31, 37, 1, 1, C.ink) +
        R(4, 34, 5, 2, C.ink) + R(2, 33, 3, 2, C.ink) +
        R(14, 40, 5, 2, C.ink) + R(15, 40, 3, 1, C.rock2) +
        R(11, 34, 2, 1, C.foam, 'bubble') +
        R(16, 32, 2, 1, C.foam, 'bubble') +
        R(21, 31, 1, 1, C.foam, 'bubble') +
        /* long-tail boat, far right */
        R(48, 32, 13, 3, C.ink) + R(49, 32, 11, 2, C.wood) +
        R(52, 29, 3, 3, C.ink) + R(53, 30, 1, 2, C.wall) +
        R(58, 29, 2, 3, C.ink) +
        R(0, 47, 64, 1, C.waterDeep);
    },

    /* บางแก้ว — ชุมชนประมงริมทะเลสาบ */
    'bang-kaeo': function () {
      return skyBase(20) + sun(52, 2) + clouds() + farHills(13) +
        R(0, 18, 64, 3, C.hillMid) +
        waterBand(21, 27) +
        /* stilt houses sitting in the water */
        houseWide(2, 12) +
        R(3, 23, 1, 6, C.ink) + R(16, 23, 1, 6, C.ink) +
        houseWide(24, 15) +
        R(25, 26, 1, 5, C.ink) + R(38, 26, 1, 5, C.ink) +
        R(0, 23, 64, 1, C.woodDark) +
        R(3, 25, 12, 1, C.waterLight) + R(25, 28, 12, 1, C.waterLight) +
        R(5, 27, 8, 1, C.waterLight) +
        /* drying net + fish */
        R(5, 29, 14, 1, C.ink) + R(5, 29, 1, 7, C.wood) + R(18, 29, 1, 7, C.wood) +
        R(6, 30, 12, 4, C.waterLight, 'net') +
        R(8, 31, 2, 1, C.ink, 'fish') + R(12, 32, 2, 1, C.ink, 'fish') +
        /* longtail boat */
        R(42, 33, 16, 4, C.ink) + R(43, 33, 14, 2, C.wood, 'boat') +
        R(45, 30, 4, 4, C.ink) + R(46, 31, 2, 3, C.wall) +
        R(55, 30, 2, 3, C.ink) +
        palm(58, 30) + palm(61, 38) +
        R(30, 27, 1, 6, C.grassDark) + R(32, 26, 1, 7, C.grassDark) +
        R(0, 46, 64, 2, C.waterDeep);
    },

    /* ป่าบอน — ป่าเขาธรรมชาติ */
    'pa-bon': function () {
      var out = skyBase(18) + clouds() + farHills(9) +
        R(0, 15, 64, 7, C.ink) + R(0, 16, 64, 5, C.hillNear) +
        forestWall(21) + R(0, 21, 64, 3, C.canopy1);
      out += tree(0, 24, 1.4) + tree(13, 22, 1.2) + tree(26, 25, 1.5) +
        tree(39, 22, 1.3) + tree(51, 25, 1.4) +
        tree(7, 34, 1) + tree(33, 35, 1) + tree(57, 34, 1.1) +
        R(0, 44, 64, 4, C.grassDark) +
        R(18, 41, 7, 7, C.ink) + R(19, 42, 5, 6, C.trunk) +
        R(15, 38, 13, 4, C.ink) + R(16, 39, 11, 2, C.canopy1);
      for (var i = 0; i < 9; i++) {
        out += R(6 + i * 6, 27 + (i % 3) * 6, 2, 2, C.firefly, 'fly');
      }
      return out + tuft(4, 45) + tuft(46, 46) + stone(28, 45);
    },

    /* ศรีนครินทร์ — ถ้ำงามและน้ำตกสวย */
    srinagarindra: function () {
      return skyBase(18) + clouds() + farHills(10) +
        R(0, 14, 64, 34, C.ink) +
        R(0, 15, 64, 32, C.rock1) +
        R(0, 15, 64, 4, C.rock3) +
        R(0, 28, 64, 3, C.rock2) +
        /* cave mouth with arch + stalactites */
        R(6, 22, 26, 26, C.rock2) +
        R(8, 24, 22, 24, C.ink) +
        R(10, 26, 18, 20, C.night) +
        R(12, 24, 2, 4, C.rock3) + R(17, 24, 2, 5, C.rock3) +
        R(22, 24, 2, 4, C.rock3) +
        R(8, 22, 22, 2, C.rock3) +
        /* waterfall */
        R(42, 16, 12, 24, C.rock2) +
        R(44, 18, 8, 22, C.waterLight, 'waterfall') +
        R(45, 22, 2, 16, C.foam, 'fall') + R(49, 24, 2, 14, C.foam, 'fall') +
        R(36, 40, 26, 4, C.ink) + R(37, 40, 24, 2, C.water) +
        R(39, 39, 6, 2, C.foam, 'splash') +
        /* lamp with warm glow */
        R(2, 36, 4, 7, C.ink) + R(3, 37, 2, 3, C.sunCore, 'lamp') +
        R(2, 42, 6, 2, C.rockDark) +
        /* bats leaving */
        R(14, 19, 3, 1, C.ink, 'bat') + R(20, 16, 3, 1, C.ink, 'bat') +
        R(27, 20, 3, 1, C.ink, 'bat') + R(33, 17, 3, 1, C.ink, 'bat') +
        stone(34, 45) + stone(54, 46);
    },

    /* ศรีบรรพต — น้ำตกและธรรมชาติ */
    'si-banphot': function () {
      return skyBase(18) + sun(52, 2) + clouds() + farHills(10) +
        R(0, 16, 64, 6, C.ink) + R(0, 17, 64, 4, C.hillNear) +
        R(0, 22, 16, 26, C.ink) + R(1, 23, 14, 24, C.rock1) +
        R(0, 22, 16, 3, C.rock3) +
        R(48, 22, 16, 26, C.ink) + R(49, 23, 14, 24, C.rock1) +
        R(48, 22, 16, 3, C.rock3) +
        /* tall waterfall */
        R(16, 18, 32, 24, C.ink) +
        R(17, 19, 30, 22, C.rock2) +
        R(20, 20, 24, 21, C.waterLight, 'waterfall') +
        R(22, 22, 2, 18, C.foam, 'fall') + R(27, 24, 2, 16, C.foam, 'fall') +
        R(32, 22, 2, 18, C.foam, 'fall') + R(37, 24, 2, 16, C.foam, 'fall') +
        R(10, 40, 44, 5, C.ink) + R(11, 41, 42, 3, C.water) +
        R(14, 40, 8, 2, C.foam, 'splash') + R(34, 39, 7, 2, C.foam, 'splash') +
        R(0, 45, 64, 3, C.grassDark) +
        /* rainbow */
        R(24, 10, 18, 2, '#f07a7a', 'rainbow') +
        R(22, 12, 22, 2, '#f3c04a', 'rainbow') +
        R(20, 14, 26, 2, '#8fd07a', 'rainbow') +
        tree(2, 30) + tree(56, 30) + tuft(8, 45) + tuft(50, 45);
    },

    /* ป่าพะยอม — ล่องแก่งและธรรมชาติ */
    'pa-phayom': function () {
      return skyBase(18) + clouds() + farHills(9) +
        R(0, 15, 64, 7, C.ink) + R(0, 16, 64, 5, C.hillNear) +
        forestWall(21) +
        /* gorge river */
        R(8, 22, 48, 26, C.ink) +
        R(9, 23, 46, 24, C.waterDeep) +
        R(10, 24, 44, 5, C.water) + R(11, 31, 42, 5, C.water) +
        R(12, 38, 40, 5, C.water) + R(13, 44, 38, 2, C.water) +
        /* rapids */
        R(14, 27, 5, 2, C.foam, 'splash') + R(28, 34, 5, 2, C.foam, 'splash') +
        R(44, 29, 5, 2, C.foam, 'splash') + R(20, 41, 5, 2, C.foam, 'splash') +
        R(36, 45, 5, 2, C.foam, 'splash') +
        /* raft + paddlers */
        R(23, 32, 18, 6, C.ink) +
        R(24, 32, 16, 4, C.wood, 'raft') +
        R(26, 32, 2, 4, C.woodDark) + R(32, 32, 2, 4, C.woodDark) +
        R(37, 32, 2, 4, C.woodDark) +
        R(26, 28, 4, 5, C.ink) + R(27, 29, 2, 3, C.wall) +
        R(34, 28, 4, 5, C.ink) + R(35, 29, 2, 3, C.wall) +
        R(29, 25, 3, 2, C.ink) + R(38, 25, 3, 2, C.ink) +
        /* rocks + trees */
        stone(6, 25) + stone(56, 27) + stone(4, 39) + stone(58, 37) +
        tree(0, 26, 1.1) + tree(54, 20, 1.2) +
        R(0, 46, 64, 2, C.grassDark);
    }
  };

  /* ── State ─────────────────────────────────────────────────────────── */
  var state = {
    built: false,
    activeId: null,
    playTimer: null,
    io: null,
    routeIds: []
  };

  function districts() {
    var d = (typeof window !== 'undefined' && window.PHATTHALUNG_DATA) || null;
    if (!d && typeof PHATTHALUNG_DATA !== 'undefined') d = PHATTHALUNG_DATA;
    return (d && d.districts) || [];
  }

  function labelFor(d, isEn) {
    return isEn && d.nameEn ? d.nameEn : d.name;
  }

  /* ── Build the map ─────────────────────────────────────────────────── */
  function build(host) {
    var isEn = document.documentElement.lang === 'en';
    var list = districts();
    if (!list.length) return false;

    var pins = '';
    list.forEach(function (d) {
      var p = DISTRICT_PINS[d.id] || { x: 50, y: 50 };
      var name = labelFor(d, isEn);
      var other = isEn ? d.name : (d.nameEn || '');
      var tagline = (isEn && d.taglineEn) ? d.taglineEn : (d.tagline || '');
      var meta = PIN_META[d.id] || { cat: 'nature', icon: 'mountain' };
      pins +=
        '<button type="button" class="px-pin" data-px-district="' + d.id + '"' +
        ' data-cat="' + meta.cat + '"' + (p.x > 68 ? ' data-side="left"' : '') +
        ' style="left:' + p.x + '%;top:' + p.y + '%;--px-accent:' + (d.color || '#0ea5e9') + '"' +
        ' aria-label="' + name + (tagline ? ' — ' + tagline : '') + '">' +
        '<span class="px-pin__dot" aria-hidden="true"></span>' +
        '<span class="px-pin__label">' +
          pinIcon(meta.icon) +
          '<span class="px-pin__text">' +
            '<span class="px-pin__name">' + name + '</span>' +
            (other ? '<span class="px-pin__en">' + other + '</span>' : '') +
          '</span>' +
        '</span>' +
        '</button>';
    });

    var svgMarkup = hdProvince();
    host.innerHTML =
      '<div class="px-province-scroll"><div class="px-province">' +
        '<svg class="px-province__art px-province__art--vector" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">' +
          svgMarkup +
        '</svg>' +
        '<div class="px-pins">' + pins + '</div>' +
        '<svg class="px-route-layer" aria-hidden="true"></svg>' +
      '</div></div>';

    /* upgrade to a high-resolution raster once the vector has painted */
    var self = this;
    rasterizeProvince(svgMarkup, function (canvas) {
      if (!canvas) return;
      var cur = host.querySelector('.px-province__art');
      if (!cur || !cur.parentNode) return;
      canvas.className = 'px-province__art px-province__art--raster';
      canvas.setAttribute('aria-hidden', 'true');
      canvas.setAttribute('role', 'presentation');
      cur.parentNode.replaceChild(canvas, cur);
    });
    return true;
  }

  function tiles() {
    return Array.prototype.slice.call(document.querySelectorAll('#pixelMap .px-pin'));
  }

  function tileById(id) {
    return document.querySelector('#pixelMap .px-pin[data-px-district="' + id + '"]');
  }

  /* ── Interactions ──────────────────────────────────────────────────── */
  function playScene(tile) {
    if (!tile) return;
    tile.classList.remove('is-play');
    // force reflow so the animation can restart
    void tile.offsetWidth;
    tile.classList.add('is-play');
    clearTimeout(state.playTimer);
    state.playTimer = setTimeout(function () {
      tile.classList.remove('is-play');
    }, 1500);
  }

  function setActive(id) {
    state.activeId = id;
    tiles().forEach(function (t) {
      var on = t.getAttribute('data-px-district') === id;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function playDistrictSound(id) {
    var bg = document.getElementById('bgMusic');
    if (!bg || bg.paused) return;            // respect the music toggle
    if (typeof window.updateMusicForDistrict === 'function') {
      window.updateMusicForDistrict(id);
    }
  }

  function openPanel(id) {
    if (window.SmartTourism && window.SmartTourism.MapDistrictPanel) {
      window.SmartTourism.MapDistrictPanel.open(id);
    }
  }

  function onClick(e) {
    var tile = e.target.closest ? e.target.closest('.px-pin') : null;
    if (!tile) return;
    var id = tile.getAttribute('data-px-district');
    if (!id) return;
    setActive(id);
    playDistrictSound(id);
    openFocus(id);
  }

  function onKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var tile = e.target.closest ? e.target.closest('.px-pin') : null;
    if (!tile) return;
    e.preventDefault();
    tile.click();
  }

  /* ── Route ribbon (planner integration) ────────────────────────────── */
  function clearRoute() {
    var layer = document.querySelector('#pixelMap .px-route-layer');
    if (layer) layer.innerHTML = '';
    state.routeIds = [];
  }

  function drawRoute(ids) {
    var layer = document.querySelector('#pixelMap .px-route-layer');
    var host = document.getElementById('pixelMap');
    if (!layer || !host || !ids || !ids.length) return;
    var base = host.getBoundingClientRect();
    var pts = [];
    ids.forEach(function (id) {
      var t = tileById(id);
      if (!t) return;
      var r = t.getBoundingClientRect();
      pts.push([Math.round(r.left - base.left + r.width / 2),
                Math.round(r.top - base.top + r.height / 2)]);
    });
    if (pts.length < 2) { layer.innerHTML = ''; return; }
    var path = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join(' ');
    layer.setAttribute('viewBox', '0 0 ' + Math.round(base.width) + ' ' + Math.round(base.height));
    layer.innerHTML =
      '<path class="px-route-path" d="' + path + '"/>';
    state.routeIds = ids.slice();
  }

  /* ── Focus / expand mode ───────────────────────────────────────────── */
  var focus = {
    id: null,
    el: null,
    originTile: null,
    keyBound: false,
    touch: null,
    langObserver: null
  };

  function tFocus(key) {
    var en = document.documentElement.lang === 'en';
    var T = {
      close:    en ? 'Close' : 'ปิด',
      explore:  en ? 'Explore places' : 'สำรวจสถานที่',
      prev:     en ? 'Previous district' : 'อำเภอก่อนหน้า',
      next:     en ? 'Next district' : 'อำเภอถัดไป',
      prevShort: en ? 'Previous' : 'ก่อนหน้า',
      nextShort: en ? 'Next' : 'ถัดไป',
      dialog:   en ? 'District detail' : 'รายละเอียดอำเภอ'
    };
    return T[key] || key;
  }

  function reduceMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function districtById(id) {
    var list = districts();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function focusables(root) {
    return Array.prototype.slice
      .call(root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
  }

  function trapInside(e, root) {
    var items = focusables(root);
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  /* ── focus HUD + hotspots ────────────────────────────────────────── */
  function hdSceneFor(id) {
    return SCENES_HD[id] ? SCENES_HD[id]() : '';
  }

  function hotspotList(id) {
    return HOTSPOTS[id] || [];
  }

  function foundCount(id) {
    return districtProgress(id).found.length;
  }

  function updateHud() {
    if (!focus.el || !focus.id) return;
    var id = focus.id;
    var list = hotspotList(id);
    var found = districtProgress(id);
    var en = document.documentElement.lang === 'en';
    var count = focus.el.querySelector('.px-hud__count');
    if (count) {
      count.textContent = (en ? 'Found ' : 'พบ ') + found.found.length + '/' + list.length +
        (en ? ' highlights' : ' จุดเด่น');
    }
    var stamp = focus.el.querySelector('.px-hud__stamp');
    if (stamp) {
      stamp.hidden = !found.stamp;
      stamp.textContent = found.stamp ? (en ? '★ Stamp earned' : '★ ได้ตราประทับ') : '';
    }
    var gameBtn = focus.el.querySelector('[data-px-game]');
    if (gameBtn) {
      gameBtn.textContent = found.stamp
        ? (en ? 'Play again' : 'เล่นอีกครั้ง')
        : (en ? 'Play mini-game' : 'เล่นมินิเกม');
    }
  }

  function renderHotspots() {
    if (!focus.el || !focus.id) return;
    var wrap = focus.el.querySelector('.px-hotspots');
    if (!wrap) return;
    var en = document.documentElement.lang === 'en';
    var found = districtProgress(focus.id).found;
    var list = hotspotList(focus.id);
    wrap.innerHTML = list.map(function (h) {
      var isFound = found.indexOf(h.id) >= 0;
      var label = en ? h.en : h.th;
      var note = en ? h.noteEn : h.noteTh;
      var hidden = h.kind === 'egg' && !isFound;
      return '<button type="button" class="px-hotspot' + (isFound ? ' is-found' : '') +
        (hidden ? ' is-egg' : '') + '"' +
        ' data-px-hotspot="' + h.id + '"' +
        ' style="left:' + (h.x / 160 * 100) + '%;top:' + (h.y / 120 * 100) + '%;' +
        'width:' + Math.max(32 / 160 * 100, h.w / 160 * 100).toFixed(2) + '%;' +
        'height:' + Math.max(32 / 120 * 100, h.h / 120 * 100).toFixed(2) + '%"' +
        ' aria-label="' + (hidden ? (en ? 'Hidden highlight' : 'จุดเด่นที่ซ่อนอยู่') : label + '. ' + note) + '">' +
        '<span class="px-hotspot__dot" aria-hidden="true"></span>' +
        '</button>';
    }).join('');
  }

  function openHotspotCard(hotspotId) {
    if (!focus.el || !focus.id) return;
    var h = hotspotList(focus.id).filter(function (x) { return x.id === hotspotId; })[0];
    if (!h) return;
    markFound(focus.id, hotspotId);
    var en = document.documentElement.lang === 'en';
    var card = focus.el.querySelector('.px-hotspot-card');
    if (!card) return;
    card.hidden = false;
    card.innerHTML =
      '<h4 class="px-hotspot-card__title">' + (en ? h.en : h.th) + '</h4>' +
      '<p class="px-hotspot-card__note">' + (en ? h.noteEn : h.noteTh) + '</p>' +
      '<button type="button" class="btn-ghost px-hotspot-card__close" data-px-hotcard-close="1">' +
      (en ? 'Close' : 'ปิด') + '</button>';
    renderHotspots();
    updateHud();
    var c = card.querySelector('[data-px-hotcard-close]');
    if (c) c.focus({ preventScroll: true });
  }

  function buildFocusMarkup(d) {
    var isEn = document.documentElement.lang === 'en';
    var name = labelFor(d, isEn);
    var other = isEn ? d.name : (d.nameEn || '');
    var tagline = (isEn && d.taglineEn) ? d.taglineEn : (d.tagline || '');
    var sceneText = (isEn ? 'Pixel illustration of ' : 'ภาพ pixel ของอำเภอ') + name +
      (tagline ? (isEn ? ': ' : ' — ') + tagline : '');

    return '' +
      '<div class="px-focus__scrim" data-px-close="1"></div>' +
      '<div class="px-focus__panel" role="document" style="--px-accent:' + (d.color || '#0ea5e9') + '">' +
        '<div class="px-focus__stage">' +
          '<svg class="px-focus__art" viewBox="0 0 160 120" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" data-scene="' + d.id + '">' +
            hdSceneFor(d.id) +
          '</svg>' +
          '<div class="px-hotspots"></div>' +
          '<div class="px-hud">' +
            '<div class="px-hud__top">' +
              '<div class="px-hud__title">' +
                '<h3 class="px-focus__name" id="pxFocusTitle">' + name + '</h3>' +
                (other ? '<p class="px-focus__name-en">' + other + '</p>' : '') +
              '</div>' +
              '<button type="button" class="px-focus__close" data-px-close="1" aria-label="' + tFocus('close') + '"><span aria-hidden="true">&times;</span></button>' +
            '</div>' +
            '<button type="button" class="px-hud__nav px-hud__nav--prev" data-px-prev="1" aria-label="' + tFocus('prev') + '"><span aria-hidden="true">&lsaquo;</span></button>' +
            '<button type="button" class="px-hud__nav px-hud__nav--next" data-px-next="1" aria-label="' + tFocus('next') + '"><span aria-hidden="true">&rsaquo;</span></button>' +
            '<div class="px-hud__bottom">' +
              '<div class="px-hud__status">' +
                '<span class="px-hud__count" aria-live="polite"></span>' +
                '<span class="px-hud__stamp" hidden></span>' +
              '</div>' +
              '<div class="px-hud__actions">' +
                '<button type="button" class="btn-ghost" data-px-game="1">' + (isEn ? 'Play mini-game' : 'เล่นมินิเกม') + '</button>' +
                '<button type="button" class="btn-primary px-focus__explore" data-px-explore="1">' + tFocus('explore') + '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<p class="sr-only">' + sceneText + '</p>' +
        '</div>' +
        '<div class="px-hotspot-card" hidden></div>' +
      '</div>';
  }

  function paintFocus() {
    if (!focus.el || !focus.id) return;
    var d = districtById(focus.id);
    if (!d) return;
    var isEn = document.documentElement.lang === 'en';
    var panel = focus.el.querySelector('.px-focus__panel');
    if (panel) panel.style.setProperty('--px-accent', d.color || '#0ea5e9');
    var art = focus.el.querySelector('.px-focus__art');
    if (art) {
      art.innerHTML = hdSceneFor(d.id);
      art.setAttribute('viewBox', '0 0 160 120');
      art.setAttribute('data-scene', d.id);
    }
    var title = focus.el.querySelector('.px-focus__name');
    if (title) title.textContent = labelFor(d, isEn);
    var en = focus.el.querySelector('.px-focus__name-en');
    if (en) en.textContent = isEn ? d.name : (d.nameEn || '');
    var card = focus.el.querySelector('.px-hotspot-card');
    if (card) { card.hidden = true; card.innerHTML = ''; }
    renderHotspots();
    updateHud();
  }

  function animateIn(el, fromRect) {
    if (reduceMotion() || !fromRect) return;
    var to = el.getBoundingClientRect();
    if (!to.width || !to.height) return;
    var sx = fromRect.width / to.width;
    var sy = fromRect.height / to.height;
    var dx = (fromRect.left + fromRect.width / 2) - (to.left + to.width / 2);
    var dy = (fromRect.top + fromRect.height / 2) - (to.top + to.height / 2);
    el.animate(
      [
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')', opacity: 0.45 },
        { transform: 'translate(0,0) scale(1,1)', opacity: 1 }
      ],
      { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' }
    );
  }

  function openFocus(id) {
    var d = districtById(id);
    if (!d) return;
    if (focus.el) { closeFocus(true); }

    var originTile = tileById(id);
    var fromRect = originTile ? originTile.getBoundingClientRect() : null;

    var el = document.createElement('div');
    el.className = 'px-focus';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'pxFocusTitle');
    el.setAttribute('aria-label', tFocus('dialog'));
    el.innerHTML = buildFocusMarkup(d);

    document.body.appendChild(el);
    focus.el = el;
    focus.id = id;
    focus.originTile = originTile;

    var app = document.getElementById('app');
    if (app) app.setAttribute('aria-hidden', 'true');
    var map = document.getElementById('pixelMap');
    if (map) map.classList.add('is-dimmed');
    document.body.style.overflow = 'hidden';

    setActive(id);
    renderHotspots();
    updateHud();
    animateIn(el.querySelector('.px-focus__panel'), fromRect);

    var first = el.querySelector('.px-focus__close');
    if (first) first.focus({ preventScroll: true });

    // language switches while open must not close the dialog
    if (!focus.langObserver && window.MutationObserver) {
      focus.langObserver = new MutationObserver(function () { paintFocus(); });
      focus.langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }
  }

  function closeFocus(instant) {
    if (!focus.el) return;
    exitGame();
    var el = focus.el;
    var restore = focus.originTile;
    var panel = el.querySelector('.px-focus__panel');

    function cleanup() {
      if (el.parentNode) el.parentNode.removeChild(el);
      var app = document.getElementById('app');
      if (app) app.removeAttribute('aria-hidden');
      var map = document.getElementById('pixelMap');
      if (map) map.classList.remove('is-dimmed');
      document.body.style.overflow = '';
      focus.el = null;
      focus.id = null;
      focus.originTile = null;
      if (restore && restore.focus) restore.focus({ preventScroll: true });
    }

    if (instant || reduceMotion() || !panel) { cleanup(); return; }

    // Guarantee removal even if the animation never finishes (throttled tab)
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      cleanup();
    }
    var anim = panel.animate(
      [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0.92)', opacity: 0 }],
      { duration: 170, easing: 'ease-in' }
    );
    anim.onfinish = finish;
    anim.oncancel = finish;
    setTimeout(finish, 260);
  }

  function stepFocus(dir) {
    var list = districts();
    if (!list.length) return;
    var i = 0;
    for (var k = 0; k < list.length; k++) if (list[k].id === focus.id) { i = k; break; }
    var next = list[(i + dir + list.length) % list.length];
    var tile = tileById(focus.id);
    focus.originTile = tileById(next.id) || tile;
    focus.id = next.id;
    paintFocus();
    setActive(next.id);
    var title = focus.el && focus.el.querySelector('.px-focus__name');
    if (title) {
      title.setAttribute('tabindex', '-1');
      title.focus({ preventScroll: true });
    }
  }

  function onDocKey(e) {
    if (!focus.el) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();          // don't let the app close other panels too
      if (game.id) { exitGame(); return; }
      closeFocus();
      return;
    }
    if (game.id) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); stepFocus(1); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); stepFocus(-1); return; }
    if (e.key === 'Tab') trapInside(e, focus.el);
  }

  function onFocusClick(e) {
    if (!focus.el) return;
    if (e.target.closest('[data-px-close]')) { closeFocus(); return; }
    if (e.target.closest('[data-px-prev]')) { stepFocus(-1); return; }
    if (e.target.closest('[data-px-next]')) { stepFocus(1); return; }
    if (e.target.closest('[data-px-hotcard-close]')) {
      var card = focus.el.querySelector('.px-hotspot-card');
      if (card) { card.hidden = true; card.innerHTML = ''; }
      return;
    }
    var hot = e.target.closest('[data-px-hotspot]');
    if (hot) { openHotspotCard(hot.getAttribute('data-px-hotspot')); return; }
    if (e.target.closest('[data-px-game]')) { startGame(focus.id); return; }
    if (e.target.closest('[data-px-explore]')) {
      var id = focus.id;
      closeFocus(true);
      openPanel(id);
    }
  }

  function onFocusTouchStart(e) {
    var t = e.changedTouches && e.changedTouches[0];
    if (!t) return;
    focus.touch = { x: t.clientX, y: t.clientY };
  }

  function onFocusTouchEnd(e) {
    if (!focus.touch) return;
    var t = e.changedTouches && e.changedTouches[0];
    if (!t) { focus.touch = null; return; }
    var dx = t.clientX - focus.touch.x;
    var dy = t.clientY - focus.touch.y;
    focus.touch = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      stepFocus(dx < 0 ? 1 : -1);
    } else if (dy > 70 && Math.abs(dy) > Math.abs(dx)) {
      closeFocus();
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     HD FOCUS SCENES (160x120) + HOTSPOTS + MINI-GAMES + PROGRESS
     Tile art (64x48) stays untouched; this layer is only built on open.
     ═══════════════════════════════════════════════════════════════════ */

  /* ── COZY palette: pastel, warm light, soft contrast (style C) ───── */
  var HC = {};
  (function () {
    var k;
    for (k in C) if (Object.prototype.hasOwnProperty.call(C, k)) HC[k] = C[k];
    var over = {
      skyTop: '#cfe6f2', sky: '#e9f2f7', skyDeep: '#f9e2cd',
      cloud: '#fffdf9', cloudShadow: '#e8dde2',
      hillFar: '#dcebdd', hillMid: '#a9c9ab', hillNear: '#6da277', forest: '#5b8f6a',
      grass: '#9ecb85', grassDark: '#6ca463', soil: '#dcc79b', soilDark: '#c2a97c',
      water: '#a8d8e8', waterDeep: '#7cc0d8', waterLight: '#dcf1f7', foam: '#ffffff',
      rock: '#c3b7a8', rockDark: '#a99b8a', rockLight: '#e2d8c9',
      rock1: '#b0a18c', rock2: '#c9bcaa', rock3: '#e8dfce',
      trunk: '#a97c5b', canopy1: '#4e8b62', canopy2: '#68a878', canopy3: '#8cc78f',
      gold: '#f2c37a', ink: '#3f4048', night: '#3b4a63', sand: '#f0e0bf',
      roof: '#d98a72', wall: '#f6ead6', glass: '#cfdfe8', leaf: '#7cb87a',
      lotus: '#f08fb0', lotusPale: '#fbc4d4', rice: '#f0d98a', riceDark: '#d6bf6d',
      firefly: '#ffe89a', sun: '#ffd9a0', sunCore: '#fff0cc', white: '#ffffff',
      ricelDark: '#d6bf6d'
    };
    for (k in over) if (Object.prototype.hasOwnProperty.call(over, k)) HC[k] = over[k];
  })();

  /* ── deterministic noise (stable art across reloads) ─────────────── */
  function hdRnd(seed) {
    var s = seed || 7;
    return function () {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  }

  /* ── sky: soft gradient, dithered seams, warm horizon ────────────── */
  function hdSky(h) {
    var out = '', y, x;
    for (y = 0; y < h; y += 6) {
      var t = y / h;
      out += R(0, y, 160, 6, t < 0.36 ? HC.skyTop : (t < 0.72 ? HC.sky : HC.skyDeep));
    }
    /* dither the two seams */
    for (x = 0; x < 160; x += 4) {
      if (x % 8 === 0) out += R(x, 12, 2, 1, HC.sky);
      else out += R(x, 13, 2, 1, HC.skyTop);
      if (x % 8 === 0) out += R(x, 24, 2, 1, HC.skyDeep);
      else out += R(x, 25, 2, 1, HC.sky);
    }
    return out;
  }

  /* ── atmospheric haze band over the ridge line ───────────────────── */
  function hdHaze(y, h) {
    var out = '', i;
    out += R(0, y, 160, h, 'rgba(249,226,205,0.35)');
    for (i = 0; i < 40; i += 2) {
      out += R(i * 4, y + (i % 3), 2, 1, 'rgba(255,255,255,0.28)');
    }
    return out;
  }

  /* ── cloud: soft pastel puff, drifts slowly ──────────────────────── */
  function hdCloud(x, y, s, seed) {
    var rnd = hdRnd(seed || 9);
    var w = Math.round(26 * s), h = Math.round(9 * s);
    var out = '<g class="hd-cloud">' +
      R(x, y + 3, w, h - 3, HC.cloud) +
      R(x + 4 * s, y, w * 0.55, 4, HC.cloud) +
      R(x + w * 0.62, y + 2, w * 0.3, 4, HC.cloud) +
      R(x + 2, y + h - 1, w - 4, 2, HC.cloudShadow);
    for (var i = 0; i < 3; i++) {
      out += R(x + Math.round(rnd() * (w - 6)), y + 2 + Math.round(rnd() * 4), 3, 2, '#ffffff');
    }
    return out + '</g>';
  }

  /* ── ridgeline: 2px columns, warm lit crest, hazy foot ───────────── */
  function hdRidge(baseY, amp, tone, shade, seed, phase) {
    var rnd = hdRnd(seed || 3);
    var out = '', x;
    for (x = 0; x < 160; x += 2) {
      var wobble = Math.sin((x / 160) * Math.PI * (2.4 + (phase || 0)) + (seed || 0)) * 0.5 + 0.5;
      var h = Math.round(amp * (wobble * 0.75 + rnd() * 0.45));
      if (h < 2) h = 2;
      out += R(x, baseY - h, 2, h + 40, tone);
      out += R(x, baseY - h, 2, 2, shade);
      if (rnd() > 0.7) out += R(x, baseY - h + 3, 1, 3, shade);
    }
    return out;
  }

  /* ── mountain: horizontal slices give a clean pixel silhouette ───── */
  /* ── tree: trunk, three canopy tiers, lit left edge, shadow right ── */
  /* ── mountain: horizontal slices give a clean pixel silhouette ───── */
  function hdMountain(cx, topY, baseY, halfW, seed) {
    var rnd = hdRnd(seed || 23), out = '', y;
    var span = baseY - topY;
    for (y = topY; y < baseY; y += 2) {
      var t = (y - topY) / span;
      var w = Math.round(halfW * 2 * Math.pow(t, 0.72));
      if (w < 4) w = 4;
      var x = Math.round(cx - w / 2 + (rnd() - 0.5) * 2);
      out += R(x, y, w, 2, t < 0.28 ? HC.rock3 : (t < 0.62 ? HC.rock2 : HC.rock1));
      out += R(x + w - 3, y, 3, 2, HC.rock1);          // shadow side (right)
      out += R(x, y, 2, 2, HC.rock3);                  // lit side (left)
      if (t > 0.55 && rnd() > 0.6) out += R(x + 3, y, 2, 2, HC.rock2);
    }
    out += R(cx - 3, topY - 2, 6, 2, HC.rock3);
    return out;
  }

  /* ── tree: trunk, three canopy tiers, lit left edge, shadow right ── */
  function hdTree(x, y, s, seed) {
    var rnd = hdRnd(seed || 5);
    var w = Math.round(20 * s), h = Math.round(24 * s);
    var trunkW = Math.max(3, Math.round(3 * s));
    var out = R(x + Math.round(w / 2 - trunkW / 2), y - Math.round(h * 0.3),
      trunkW, Math.round(h * 0.38), HC.trunk);
    /* canopy: octagonal stack — wide middle, narrow crown, tapered base */
    var rows = [[0.42, 0.30], [0.72, 0.26], [1.00, 0.24], [0.86, 0.20], [0.58, 0.16]];
    var top = y - h * 0.58;
    var rh = Math.max(2, Math.round(h * 0.115));
    for (var i = 0; i < rows.length; i++) {
      var rw = Math.round(w * rows[i][0]);
      var rx = x + Math.round((w - rw) / 2);
      var ry = Math.round(top + i * rh);
      out += R(rx, ry, rw, rh + 1, HC.ink);
      out += R(rx + 1, ry, rw - 2, rh - 1, i >= 3 ? HC.canopy1 : HC.canopy2);
      out += R(rx + 2, ry, Math.max(2, Math.round(rw * 0.32)), Math.max(1, rh - 2), HC.canopy3);
      out += R(rx + rw - 3, ry + 1, 2, Math.max(1, rh - 2), HC.forest);
    }
    for (var k = 0; k < 3; k++) {
      out += R(x + rnd() * w, top + rnd() * h * 0.5, 2, 2, HC.canopy3);
    }
    return out;
  }
  /* ── water: soft bands, drifting wave marks, glints ──────────────── */
  function hdWater(y0, y1, seed) {
    var rnd = hdRnd(seed || 11), out = '', y, i;
    for (y = y0; y < y1; y += 8) {
      var t = (y - y0) / (y1 - y0);
      out += R(0, y, 160, 8, t < 0.35 ? HC.waterLight : (t < 0.7 ? HC.water : HC.waterDeep));
    }
    out += '<g class="hd-wave">';
    for (i = 0; i < 24; i++) {
      out += R(Math.round(rnd() * 150), y0 + 6 + Math.round(rnd() * (y1 - y0 - 10)),
        4 + Math.round(rnd() * 8), 1, HC.foam);
    }
    out += '</g>';
    for (i = 0; i < 12; i++) {
      out += R(Math.round(rnd() * 158), y0 + 2 + Math.round(rnd() * (y1 - y0 - 4)), 1, 1, '#ffffff');
    }
    return out;
  }

  /* ── ground: three soft bands + a worn path + clover patches ─────── */
  function hdGround(y0, seed) {
    var rnd = hdRnd(seed || 19), out = '', x, i;
    out += R(0, y0, 160, 120 - y0, HC.grass);
    out += R(0, y0, 160, 3, HC.grassDark);
    out += R(0, y0 + 16, 160, 7, HC.grassDark);
    out += R(0, y0 + 36, 160, 5, HC.grassDark);
    for (x = 0; x < 160; x += 4) {
      out += R(x + (x % 8 ? 1 : 0), y0 + 2, 2, 2, HC.grassDark);
      if (x % 12 === 0) out += R(x, y0 + 20, 3, 2, HC.canopy3);
    }
    /* narrow worn trail, offset right of centre */
    for (i = 0; i < 26; i++) {
      out += R(104 + Math.round(Math.sin(i / 5) * 3), y0 + 10 + i * 1.6, 7, 2, HC.sand);
    }
    /* dirt patches */
    for (i = 0; i < 5; i++) {
      out += R(10 + Math.round(rnd() * 130), y0 + 20 + Math.round(rnd() * 26),
        6 + Math.round(rnd() * 8), 3, HC.soil);
    }
    return out;
  }

  /* ── clustered texture: grass clumps, pebble lines, flower dots ──── */
  function hdClusters(y0, y1, seed) {
    var rnd = hdRnd(seed || 13), out = '', i, j;
    for (i = 0; i < 16; i++) {
      var cx = Math.round(rnd() * 150), cy = y0 + Math.round(rnd() * Math.max(1, y1 - y0));
      for (j = 0; j < 3 + Math.round(rnd() * 3); j++) {
        out += R(cx + j * 2, cy + (j % 2), 2, 3, HC.grassDark);
      }
    }
    for (i = 0; i < 7; i++) {
      var px = Math.round(rnd() * 150), py = y0 + 4 + Math.round(rnd() * (y1 - y0 - 6));
      out += R(px, py, 4, 2, HC.rock3) + R(px + 1, py + 1, 3, 1, HC.rock2);
      if (rnd() > 0.6) out += R(px + 5, py, 3, 2, HC.rock2);
    }
    for (i = 0; i < 10; i++) {
      out += R(Math.round(rnd() * 156), y0 + Math.round(rnd() * (y1 - y0)), 2, 2,
        rnd() > 0.5 ? HC.lotusPale : HC.gold);
    }
    return out;
  }

  /* ── foreground frame: dark leafy silhouettes in both bottom corners */
  function hdFrame(seed) {
    var rnd = hdRnd(seed || 17), out = '', i, j;
    /* bottom-left clump */
    for (i = 0; i < 4; i++) {
      for (j = 0; j < 3; j++) {
        out += R(2 + j * 5 + Math.round(rnd() * 2), 108 + i * 3, 6, 4,
          j === 0 ? HC.forest : HC.canopy1);
      }
    }
    /* bottom-right clump */
    for (i = 0; i < 4; i++) {
      for (j = 0; j < 3; j++) {
        out += R(138 + j * 5 + Math.round(rnd() * 2), 110 + i * 3, 6, 4,
          j === 2 ? HC.forest : HC.canopy1);
      }
    }
    /* a single overhanging leaf, top-left */
    out += R(0, 0, 14, 3, HC.forest) + R(0, 3, 8, 3, HC.canopy1) +
      R(6, 6, 5, 2, HC.forest);
    return out;
  }

  /* ── vignette: stepped soft corners (cozy, not black) ────────────── */
  function hdVignette() {
    var out = '', i, a;
    for (i = 0; i < 10; i++) {
      a = (0.028 * (10 - i)).toFixed(3);
      out += R(i, 0, 1, 120, 'rgba(74,74,82,' + a + ')');
      out += R(159 - i, 0, 1, 120, 'rgba(74,74,82,' + a + ')');
      out += R(0, i, 160, 1, 'rgba(74,74,82,' + a + ')');
      out += R(0, 119 - i, 160, 1, 'rgba(74,74,82,' + a + ')');
    }
    return out;
  }

  /* ── soft contact shadow under a subject ─────────────────────────── */
  function hdShadow(cx, y, w) {
    return R(cx - w / 2, y, w, 2, 'rgba(74,74,82,0.18)') +
      R(cx - w / 2 + 4, y + 2, w - 8, 1, 'rgba(74,74,82,0.10)');
  }

  /* ── tiny actors that give the scene scale and life ──────────────── */
  function hdActor(kind, x, y) {
    switch (kind) {
      case 'person':
        return R(x - 1, y - 2, 7, 1, HC.sand) +
          R(x, y - 1, 5, 3, HC.ink) + R(x + 1, y - 1, 3, 2, HC.wall) +
          R(x, y + 2, 5, 6, HC.ink) + R(x + 1, y + 2, 3, 5, HC.roof) +
          R(x + 1, y + 8, 1, 4, HC.ink) + R(x + 3, y + 8, 1, 4, HC.ink);
      case 'boat':
        return R(x, y, 12, 2, HC.wood || HC.trunk) + R(x + 2, y - 1, 8, 1, HC.ink) +
          R(x + 5, y - 5, 2, 4, HC.wall) + R(x + 6, y - 6, 1, 1, HC.ink);
      case 'buffalo':
        return R(x, y, 10, 5, HC.ink) + R(x + 1, y, 8, 4, HC.night) +
          R(x + 2, y - 2, 5, 2, HC.night) + R(x + 9, y + 1, 2, 1, HC.ink) +
          R(x + 1, y + 4, 2, 3, HC.ink) + R(x + 7, y + 4, 2, 3, HC.ink);
      case 'bird':
        return '<g class="hd-bird">' + R(x, y + 1, 1, 1, HC.ink) +
          R(x + 1, y, 1, 1, HC.ink) + R(x + 2, y + 1, 1, 1, HC.ink) + '</g>';
      case 'smoke':
        return '<g class="hd-smoke">' + R(x, y, 3, 2, 'rgba(255,255,255,0.7)') +
          R(x + 1, y - 3, 4, 3, 'rgba(255,255,255,0.55)') +
          R(x + 2, y - 7, 5, 4, 'rgba(255,255,255,0.35)') + '</g>';
      case 'firefly':
        return '<g class="hd-fly">' + R(x, y, 2, 2, HC.firefly) +
          R(x - 1, y + 1, 1, 1, 'rgba(255,232,154,0.5)') + '</g>';
      default:
        return '';
    }
  }

  /* ── per-district mid-ground subjects (160x120 coords) ───────────── */
  var HD_SUBJECTS = {
    mueang: function () {
      return hdMountain(78, 22, 88, 34, 31) +
        /* the hole, punched through the peak */
        R(72, 50, 16, 15, HC.ink) +
        R(73, 51, 14, 13, HC.sky) +
        R(73, 51, 14, 2, HC.skyTop) +
        R(81, 57, 6, 7, HC.skyDeep) +
        R(70, 48, 20, 3, HC.rock3) +
        /* rock texture on the flanks */
        R(52, 66, 8, 4, HC.rock2) + R(64, 78, 10, 4, HC.rock2) +
        R(88, 70, 7, 5, HC.rock2) + R(78, 84, 12, 3, HC.rock2) +
        R(46, 84, 7, 3, HC.canopy1) + R(98, 86, 8, 3, HC.canopy1) +
        /* cave temple, left foreground */
        R(4, 80, 36, 24, HC.ink) + R(5, 81, 34, 23, HC.rock2) +
        R(2, 72, 40, 8, HC.ink) + R(3, 73, 38, 5, HC.roof) +
        R(3, 80, 38, 2, HC.gold) +
        R(17, 87, 11, 17, HC.ink) + R(18, 88, 9, 16, HC.night) +
        R(6, 73, 36, 1, HC.sunCore) +
        /* shadow-puppet figure, right foreground */
        R(110, 74, 16, 6, HC.ink) + R(111, 74, 14, 3, HC.gold) +
        R(110, 80, 16, 14, HC.ink) + R(111, 81, 14, 12, HC.gold) +
        R(102, 80, 8, 4, HC.ink) + R(103, 80, 7, 2, HC.gold) +
        R(126, 80, 8, 4, HC.ink) + R(127, 80, 7, 2, HC.gold) +
        R(108, 94, 20, 4, HC.ink) + R(109, 94, 18, 2, HC.roof) +
        R(111, 98, 4, 14, HC.ink) + R(122, 98, 4, 14, HC.ink) +
        /* foreground framing */
        R(0, 104, 60, 16, HC.forest) + R(0, 100, 34, 8, HC.canopy1) +
        R(120, 106, 40, 14, HC.forest) + R(132, 102, 28, 8, HC.canopy1);
    },
    'kong-ra': function () {
      var s = '', i;
      for (i = 0; i < 5; i++) s += hdTree(6 + i * 26, 92, 1.15, 30 + i);
      s += R(64, 30, 40, 58, HC.rock2) + R(62, 26, 44, 8, HC.rock3);
      s += R(72, 34, 22, 50, HC.waterLight) + R(76, 40, 6, 40, HC.foam) + R(86, 44, 4, 34, HC.foam);
      s += R(56, 88, 58, 8, HC.water) + R(64, 86, 12, 4, HC.foam) + R(92, 85, 10, 4, HC.foam);
      return s;
    },
    'khao-chaison': function () {
      var s = '', i;
      s += hdWater(64, 108, 41);
      for (i = 0; i < 7; i++) {
        var lx = 8 + i * 21, ly = 74 + (i % 3) * 9;
        s += R(lx, ly, 20, 5, HC.leaf);
        s += R(lx + 6, ly - 8, 8, 8, HC.lotus) + R(lx + 8, ly - 10, 4, 4, HC.lotusPale);
      }
      s += R(6, 60, 26, 6, HC.canopy1) + R(128, 58, 28, 8, HC.canopy1);
      for (i = 0; i < 5; i++) s += R(40 + i * 18, 34 + (i % 2) * 7, 3, 2, HC.ink);
      return s;
    },
    tamot: function () {
      var s = '', i;
      for (i = 0; i < 6; i++) {
        var x = 8 + i * 26;
        s += R(x, 40, 6, 48, HC.trunk) + R(x - 8, 30, 22, 12, HC.canopy1) + R(x - 5, 28, 16, 6, HC.canopy3);
        s += R(x + 7, 72, 7, 6, HC.rock3);
      }
      s += R(56, 96, 40, 10, HC.roof) + R(58, 88, 14, 8, HC.ink) + R(84, 92, 10, 8, HC.ink);
      s += R(0, 88, 160, 4, HC.ricelDark || HC.riceDark);
      return s;
    },
    'khuan-khanun': function () {
      var s = '', i, y;
      for (y = 62; y < 112; y += 12) {
        s += R(0, y, 160, 12, (y / 12) % 2 ? HC.rice : HC.riceDark);
        s += R(0, y, 160, 1, HC.waterLight);
      }
      for (i = 0; i < 22; i++) s += R(4 + i * 7, 66 + (i % 5) * 9, 2, 6, HC.grassDark);
      s += R(108, 52, 34, 18, HC.wall) + R(104, 44, 42, 8, HC.roof) + R(118, 60, 8, 10, HC.woodDark);
      s += hdTree(16, 62, 0.8, 61);
      return s;
    },
    'pak-phayun': function () {
      var s = '';
      s += hdWater(66, 112, 71);
      s += R(56, 30, 48, 12, HC.rock2) + R(54, 26, 52, 6, HC.rock3);
      s += R(58, 42, 12, 30, HC.rock1) + R(88, 42, 12, 30, HC.rock1);
      s += R(70, 42, 18, 26, HC.sky) + R(70, 42, 18, 2, HC.skyTop);
      s += R(24, 88, 44, 12, HC.rock3) + R(24, 88, 44, 3, HC.rock2) + R(66, 92, 8, 6, HC.rock3);
      s += R(20, 80, 8, 4, HC.ink) + R(14, 78, 8, 4, HC.ink);
      s += R(120, 84, 22, 6, HC.wood) + R(126, 76, 6, 8, HC.wall);
      for (var i = 0; i < 8; i++) s += R(30 + i * 7, 100 + (i % 3) * 4, 6, 2, HC.foam);
      return s;
    },
    'bang-kaeo': function () {
      var s = '', i;
      s += hdWater(70, 112, 81);
      for (i = 0; i < 3; i++) {
        var x = 10 + i * 48;
        s += R(x, 52, 38, 22, HC.wall) + R(x - 4, 44, 46, 8, HC.roof) + R(x + 4, 74, 4, 14, HC.ink) + R(x + 30, 74, 4, 14, HC.ink);
        s += R(x + 6, 58, 10, 8, HC.glass);
      }
      s += R(0, 76, 160, 3, HC.woodDark);
      s += R(112, 92, 40, 6, HC.wood) + R(120, 84, 10, 8, HC.wall);
      s += R(20, 86, 34, 14, HC.waterLight) + R(24, 90, 8, 2, HC.ink) + R(38, 92, 8, 2, HC.ink);
      return s;
    },
    'pa-bon': function () {
      var s = '', i;
      for (i = 0; i < 7; i++) s += hdTree(2 + i * 24, 100, 1.35, 90 + i);
      for (i = 0; i < 6; i++) s += hdTree(12 + i * 26, 74, 0.9, 120 + i);
      s += R(0, 106, 160, 14, HC.grassDark);
      for (i = 0; i < 10; i++) s += R(10 + i * 15, 62 + (i % 4) * 8, 2, 2, HC.firefly);
      return s;
    },
    srinagarindra: function () {
      var s = '';
      s += R(0, 26, 160, 86, HC.rock1) + R(0, 26, 160, 8, HC.rock3);
      s += R(18, 46, 66, 70, HC.rock2);
      s += R(24, 54, 54, 62, HC.night) + R(24, 54, 54, 6, HC.ink);
      s += R(30, 60, 6, 10, HC.rock3) + R(42, 60, 6, 12, HC.rock3) + R(54, 60, 6, 9, HC.rock3);
      s += R(104, 34, 34, 72, HC.rock2) + R(110, 40, 20, 62, HC.waterLight);
      s += R(114, 46, 5, 50, HC.foam) + R(122, 50, 4, 44, HC.foam);
      s += R(96, 96, 44, 8, HC.water);
      s += R(6, 92, 10, 14, HC.gold) + R(4, 104, 14, 4, HC.rockDark);
      for (var i = 0; i < 6; i++) s += R(28 + i * 9, 32 + (i % 3) * 5, 4, 2, HC.ink);
      return s;
    },
    'si-banphot': function () {
      var s = '';
      s += R(0, 24, 34, 88, HC.rock1) + R(126, 24, 34, 88, HC.rock1);
      s += R(0, 24, 34, 8, HC.rock3) + R(126, 24, 34, 8, HC.rock3);
      s += R(30, 30, 100, 74, HC.rock2);
      s += R(46, 36, 68, 68, HC.waterLight);
      s += R(56, 44, 8, 58, HC.foam) + R(72, 48, 7, 54, HC.foam) + R(90, 44, 8, 58, HC.foam) + R(104, 50, 6, 50, HC.foam);
      s += R(24, 98, 112, 10, HC.water) + R(36, 96, 16, 5, HC.foam) + R(96, 95, 14, 5, HC.foam);
      s += R(44, 16, 72, 3, '#f07a7a') + R(40, 21, 80, 3, '#f3c04a') + R(36, 26, 88, 3, '#8fd07a');
      return s;
    },
    'pa-phayom': function () {
      var s = '', i;
      s += R(20, 60, 120, 52, HC.waterDeep);
      s += R(24, 64, 112, 8, HC.water) + R(28, 76, 104, 8, HC.water) + R(32, 88, 96, 8, HC.water);
      for (i = 0; i < 10; i++) s += R(28 + i * 11, 68 + (i % 4) * 10, 6, 3, HC.foam);
      s += R(58, 82, 44, 10, HC.wood) + R(62, 74, 6, 8, HC.wall) + R(88, 74, 6, 8, HC.wall);
      s += R(0, 52, 34, 6, HC.forest) + R(126, 52, 34, 6, HC.forest);
      s += hdTree(0, 62, 1.1, 141) + hdTree(142, 60, 1.0, 142);
      return s;
    }
  };

    /* ── composed HD scenes (cozy indie: soft light, pastel, alive) ──── */
  var HD_ACTORS = {
    mueang: [['person', 124, 92], ['bird', 26, 12], ['bird', 34, 9]],
    'kong-ra': [['bird', 40, 10], ['bird', 48, 13], ['smoke', 22, 58]],
    'khao-chaison': [['boat', 118, 86], ['bird', 44, 10], ['bird', 52, 13]],
    tamot: [['person', 96, 88], ['smoke', 30, 62]],
    'khuan-khanun': [['buffalo', 40, 96], ['bird', 60, 14]],
    'pak-phayun': [['boat', 118, 92], ['bird', 30, 12]],
    'bang-kaeo': [['boat', 116, 94], ['person', 30, 84]],
    'pa-bon': [['firefly', 36, 66], ['firefly', 74, 58], ['firefly', 112, 72], ['bird', 60, 10]],
    srinagarindra: [['smoke', 20, 60], ['person', 96, 90]],
    'si-banphot': [['person', 66, 92], ['bird', 40, 12]],
    'pa-phayom': [['boat', 62, 84], ['bird', 30, 10]]
  };

  var SCENES_HD = {};
  (function () {
    var list = ['mueang', 'kong-ra', 'khao-chaison', 'tamot', 'khuan-khanun',
      'pak-phayun', 'bang-kaeo', 'pa-bon', 'srinagarindra', 'si-banphot', 'pa-phayom'];

    list.forEach(function (id, idx) {
      SCENES_HD[id] = function () {
        var rnd = hdRnd(100 + idx * 37);
        var subject = HD_SUBJECTS[id] ? HD_SUBJECTS[id]() : '';
        var actors = (HD_ACTORS[id] || []).map(function (a) {
          return hdActor(a[0], a[1], a[2]);
        }).join('');

        var out = hdSky(34) +
          hdCloud(8 + idx * 4, 6, 1.15, 9 + idx) +
          hdCloud(94 - idx * 3, 14, 0.95, 19 + idx) +
          hdCloud(52, 3, 0.7, 29 + idx) +
          hdRidge(40, 9, HC.hillFar, HC.hillMid, 20 + idx, 0.4) +
          hdHaze(32, 10) +
          hdRidge(52, 8, HC.hillNear, HC.hillMid, 40 + idx, 0.8) +
          hdGround(58, 60 + idx) +
          subject +
          hdShadow(78, 100, 56) +
          hdClusters(64, 112, 300 + idx) +
          actors +
          hdFrame(700 + idx) +
          hdVignette();
        return out;
      };
    });
  })();

  /* ═══════════════════════════════════════════════════════════════════
     PROVINCE PANORAMA (320x120) — one map, districts as geographic pins
     The list-style picker stays in the section below; this is the map.
     ═══════════════════════════════════════════════════════════════════ */
  /* ═══════════════════════════════════════════════════════════════════
     PROVINCE MAP — isometric premium pixel art (400x160)
     One continuous landscape: Banthad range (west) → rice plain (centre)
     → Thale Noi wetland (east). Light comes from the top-left.
     ═══════════════════════════════════════════════════════════════════ */
  var PIN_META = {
    mueang:         { cat: 'city',    icon: 'temple' },
    'khuan-khanun': { cat: 'rice',    icon: 'rice' },
    'khao-chaison': { cat: 'wetland', icon: 'lotus' },
    'bang-kaeo':    { cat: 'water',   icon: 'boat' },
    'pak-phayun':   { cat: 'water',   icon: 'dugong' },
    'kong-ra':      { cat: 'nature',  icon: 'mountain' },
    'pa-bon':       { cat: 'nature',  icon: 'tree' },
    srinagarindra:  { cat: 'nature',  icon: 'cave' },
    'si-banphot':   { cat: 'nature',  icon: 'fall' },
    'pa-phayom':    { cat: 'nature',  icon: 'raft' },
    tamot:          { cat: 'farm',    icon: 'rubber' }
  };

  var DISTRICT_PINS = {
    'pa-phayom':    { x: 17, y: 15 },
    'si-banphot':   { x: 8,  y: 41 },
    'kong-ra':      { x: 18, y: 56 },
    'khuan-khanun': { x: 42, y: 17 },
    'khao-chaison': { x: 66, y: 12 },
    'bang-kaeo':    { x: 87, y: 29 },
    mueang:         { x: 55, y: 44 },
    'pak-phayun':   { x: 80, y: 61 },
    'pa-bon':       { x: 26, y: 77 },
    srinagarindra:  { x: 44, y: 73 },
    tamot:          { x: 63, y: 83 }
  };

  /* ── 10x10 pixel icons for the marker chips ──────────────────────── */
  var PIN_ICONS = {
    temple:   [[4,0,2,1],[3,1,4,1],[2,2,6,1],[3,3,4,3],[2,6,6,1],[1,7,8,3]],
    rice:     [[4,0,2,4],[2,2,2,2],[6,2,2,2],[3,5,4,2],[2,7,6,3]],
    lotus:    [[3,0,4,2],[2,2,6,2],[3,4,4,2],[4,6,2,4]],
    boat:     [[0,5,10,2],[2,4,6,1],[6,1,1,3]],
    dugong:   [[0,4,8,3],[8,4,2,2],[2,2,3,2],[1,3,2,1]],
    mountain: [[4,0,2,2],[3,2,4,2],[2,4,6,2],[1,6,8,4]],
    tree:     [[4,0,2,3],[2,2,6,3],[3,5,4,2],[4,7,2,3]],
    cave:     [[0,1,10,9],[3,4,4,6]],
    fall:     [[4,0,2,6],[2,6,6,2],[3,8,4,2]],
    raft:     [[1,5,8,2],[0,7,10,2],[4,1,1,4]],
    rubber:   [[4,0,2,6],[2,1,2,3],[6,1,2,3],[4,7,2,2],[1,9,3,1]]
  };


  /* ── high-resolution rasteriser ─────────────────────────────────────
     The map is authored in a 400x160 grid. To display it large without
     chunky pixels we (a) subdivide every rect 2x2 with a deterministic
     tone jitter, then (b) rasterise once into a canvas at 2x device pixels.
     Shapes, colours and composition are preserved exactly. */
  function hexJitter(hex, k) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    var f = [0.94, 0.985, 1.02, 1.06][k % 4];
    function cl(v) { return Math.max(0, Math.min(255, Math.round(v * f))); }
    return '#' + ((1 << 24) + (cl(r) << 16) + (cl(g) << 8) + cl(b)).toString(16).slice(1);
  }

  function refineRects(svg) {
    var i = 0;
    return svg.replace(
      /<rect x="([0-9.]+)" y="([0-9.]+)" width="([0-9.]+)" height="([0-9.]+)" fill="([^"]+)"( class="[^"]*")?\/>/g,
      function (m, xs, ys, ws, hs, fill, cls) {
        var x = +xs, y = +ys, w = +ws, h = +hs;
        if (w < 2 || h < 2) return m;                 // too small to split
        var w1 = Math.round(w / 2), h1 = Math.round(h / 2);
        var w2 = w - w1, h2 = h - h1;
        var out = '';
        var cells = [
          [x, y, w1, h1], [x + w1, y, w2, h1],
          [x, y + h1, w1, h2], [x + w1, y + h1, w2, h2]
        ];
        for (var k = 0; k < 4; k++) {
          var c = cells[k];
          if (c[2] <= 0 || c[3] <= 0) continue;
          out += '<rect x="' + c[0] + '" y="' + c[1] + '" width="' + c[2] +
            '" height="' + c[3] + '" fill="' + hexJitter(fill, i + k) + '"' +
            (cls || '') + '/>';
        }
        i++;
        return out;
      });
  }

  function rasterizeProvince(svgMarkup, done) {
    var full = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 320">' +
      '<g transform="scale(2)">' + svgMarkup + '</g></svg>';
    var url;
    try {
      url = URL.createObjectURL(new Blob([full], { type: 'image/svg+xml;charset=utf-8' }));
    } catch (e) { return done(null); }
    var img = new Image();
    img.onload = function () {
      try {
        var c = document.createElement('canvas');
        c.width = 1600;
        c.height = 640;
        var ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        done(c);
      } catch (e) { URL.revokeObjectURL(url); done(null); }
    };
    img.onerror = function () { URL.revokeObjectURL(url); done(null); };
    img.src = url;
  }

  function pinIcon(name) {
    var rects = PIN_ICONS[name] || PIN_ICONS.mountain;
    return '<svg class="px-pin__icon" viewBox="0 0 10 10" aria-hidden="true" focusable="false">' +
      rects.map(function (r) {
        return '<rect x="' + r[0] + '" y="' + r[1] + '" width="' + r[2] + '" height="' + r[3] + '" fill="currentColor"/>';
      }).join('') + '</svg>';
  }

  function hdScatterGround() {
    var rnd = hdRnd(555), out = '', i;
    for (i = 0; i < 240; i++) {
      var x = Math.round(rnd() * 398), y = 46 + Math.round(rnd() * 112);
      out += R(x, y, 1, 1 + (rnd() > 0.6 ? 1 : 0),
        rnd() > 0.5 ? HC.grassDark : (rnd() > 0.5 ? HC.canopy3 : HC.grass));
    }
    return out;
  }

  /* ── isometric building blocks ───────────────────────────────────── */
  /* mountain: sliced cone, lit left face, shadowed right face, cast shadow */
  function isoMountain(cx, topY, baseY, halfW, seed, snow) {
    var rnd = hdRnd(seed || 23), out = '', y;
    var span = baseY - topY;
    for (y = topY; y < baseY; y += 1) {
      var t = (y - topY) / span;
      var w = Math.max(4, Math.round(halfW * 2 * Math.pow(t, 0.7)));
      var x = Math.round(cx - w / 2 + (rnd() - 0.5) * 1.2);
      out += R(x, y, w, 1, HC.rock2);
      out += R(x, y, Math.round(w * 0.55), 1, HC.rock3);        // lit face
      out += R(x + Math.round(w * 0.72), y, Math.round(w * 0.28), 1, HC.rock1);
      if (rnd() > 0.86) out += R(x + 2, y, 2, 1, HC.rock1);      // crag
      if (snow && t < 0.18) out += R(x + 2, y, Math.max(2, w - 6), 1, '#ffffff');
    }
    out += R(cx - halfW * 0.9, baseY, halfW * 1.8, 2, 'rgba(74,74,82,0.16)');
    return out;
  }

  /* tree: trunk, tiered canopy, cast shadow */
  function isoTree(x, y, s, seed) {
    var rnd = hdRnd(seed || 5);
    var w = Math.round(14 * s), h = Math.round(18 * s);
    var out = R(x + Math.round(w / 2) - 1, y - Math.round(h * 0.26), Math.max(2, Math.round(2 * s)),
      Math.round(h * 0.3), HC.trunk);
    out += R(x + Math.round(w * 0.2), y, Math.round(w * 0.7), 2, 'rgba(74,74,82,0.18)');
    var rows = [[0.5, 0.34], [0.85, 0.3], [1.0, 0.26], [0.75, 0.2]];
    var top = y - h * 0.52;
    var rh = Math.max(2, Math.round(h * 0.12));
    for (var i = 0; i < rows.length; i++) {
      var rw = Math.max(3, Math.round(w * rows[i][0]));
      var rx = x + Math.round((w - rw) / 2);
      var ry = Math.round(top + i * rh);
      out += R(rx, ry, rw, rh, HC.canopy1);
      out += R(rx + 1, ry, Math.max(2, Math.round(rw * 0.45)), rh - 1, HC.canopy3);
      out += R(rx + rw - 2, ry, 2, rh, HC.forest);
    }
    for (var k = 0; k < 2; k++) {
      out += R(x + rnd() * w, top + rnd() * h * 0.4, 1, 1, HC.canopy3);
    }
    return out;
  }

  /* stilt house with a shadow */
  function isoHouse(x, y, w, h) {
    return R(x + 3, y + h, w - 2, 2, 'rgba(74,74,82,0.20)') +
      R(x, y + Math.round(h * 0.42), w, Math.round(h * 0.58), HC.wall) +
      R(x, y + Math.round(h * 0.42), 2, Math.round(h * 0.58), '#fffaf0') +
      R(x + w - 3, y + Math.round(h * 0.42), 3, Math.round(h * 0.58), HC.soil) +
      R(x - 2, y + Math.round(h * 0.3), w + 4, 3, HC.roof) +
      R(x, y + Math.round(h * 0.18), w, 3, HC.roof) +
      R(x + 3, y + Math.round(h * 0.6), 3, 4, HC.trunk) +
      R(x + w - 7, y + Math.round(h * 0.6), 3, 4, HC.trunk);
  }

  /* golden chedi — the province landmark */
  function isoChedi(x, y) {
    return R(x + 4, y + 22, 14, 2, 'rgba(74,74,82,0.20)') +
      R(x, y + 14, 22, 8, HC.rock3) +
      R(x, y + 14, 22, 1, '#fff6e2') +
      R(x + 4, y + 10, 14, 5, HC.gold) +
      R(x + 6, y + 5, 10, 6, HC.gold) +
      R(x + 8, y, 6, 6, HC.sunCore) +
      R(x + 9, y - 4, 4, 5, HC.gold) +
      R(x + 10, y - 7, 2, 4, '#fff3cf');
  }

  /* water buffalo, side view */
  function isoBuffalo(x, y) {
    return R(x + 2, y + 6, 12, 2, 'rgba(74,74,82,0.18)') +
      R(x, y + 1, 14, 5, HC.night) +
      R(x + 1, y + 1, 12, 2, '#5c6a80') +
      R(x - 2, y + 2, 4, 3, HC.night) +
      R(x - 3, y + 1, 2, 1, HC.wall) + R(x - 3, y + 3, 2, 1, HC.wall) +
      R(x + 2, y + 6, 2, 3, HC.night) + R(x + 10, y + 6, 2, 3, HC.night) +
      R(x + 13, y, 2, 1, HC.night);
  }

  function isoBoat(x, y) {
    return R(x + 1, y + 4, 14, 1, 'rgba(74,74,82,0.16)') +
      R(x, y + 2, 16, 2, HC.trunk) +
      R(x + 2, y + 1, 12, 1, HC.trunk) +
      R(x + 6, y - 4, 1, 6, HC.ink) +
      R(x + 7, y - 4, 5, 3, HC.wall);
  }

  function isoBird(x, y) {
    return R(x, y + 1, 1, 1, HC.ink) + R(x + 1, y, 1, 1, HC.ink) + R(x + 2, y + 1, 1, 1, HC.ink);
  }

  function reeds(x, y, n) {
    var out = '', i;
    for (i = 0; i < n; i++) {
      out += R(x + i * 2, y - 6 - (i % 3) * 2, 1, 7 + (i % 3) * 2, HC.grassDark);
      if (i % 2 === 0) out += R(x + i * 2 - 1, y - 9 - (i % 3) * 2, 3, 2, HC.trunk);
    }
    return out;
  }

  /* rice paddy: terraces with bunds and water shimmer */
  function paddy(x, y, w, h, seed) {
    var rnd = hdRnd(seed || 33), out = '', i, j;
    for (i = 0; i < h; i += 5) {
      out += R(x, y + i, w, 5, (i % 20 < 10) ? HC.rice : HC.riceDark);
      out += R(x, y + i, w, 1, HC.soilDark);
      if (i % 20 === 15) out += R(x, y + i + 3, w, 1, HC.grassDark);
    }
    for (j = 0; j < 48; j++) {
      out += R(x + Math.round(rnd() * w), y + Math.round(rnd() * h), 1, 2, HC.grassDark);
    }
    for (j = 0; j < 22; j++) {
      out += R(x + Math.round(rnd() * w), y + Math.round(rnd() * h), 3, 1, HC.waterLight);
    }
    return out;
  }

  function hdProvince() {
    var rnd = hdRnd(20261101), out = '', i, x, y;

    /* ── 1. sky + light ─────────────────────────────────────────────── */
    out += hdSky(46);
    out += '<g opacity="0.55">' +
      R(304, 6, 26, 3, HC.sunCore) + R(300, 9, 34, 3, HC.sun) +
      R(296, 12, 42, 3, 'rgba(255,217,160,0.45)') + '</g>';
    out += hdCloud(30, 6, 1.25, 3) + hdCloud(170, 12, 1.05, 5) + hdCloud(272, 4, 0.9, 7);

    /* ── 2. distant ranges + haze ───────────────────────────────────── */
    out += hdRidge(62, 22, '#e3ece7', '#d3e0d9', 3, 0.3);
    out += hdHaze(48, 14);
    out += hdRidge(72, 17, HC.hillFar, HC.hillMid, 8, 0.6);

    /* ── 3. continuous ground base (no floating patches) ────────────── */
    out += R(0, 44, 400, 116, HC.grass);
    out += R(0, 44, 400, 2, HC.grassDark);
    for (i = 0; i < 60; i++) {
      out += R(Math.round(rnd() * 396), 46 + Math.round(rnd() * 112),
        6 + Math.round(rnd() * 10), 2, HC.grassDark);
    }
    out += hdScatterGround();

    /* ── 4. western mountain wall + forest foot ─────────────────────── */
    out += isoMountain(34, 22, 92, 30, 31);
    out += isoMountain(74, 30, 96, 34, 32);
    out += isoMountain(112, 40, 100, 26, 33);
    out += hdRidge(92, 9, HC.hillNear, HC.hillMid, 11, 0.9);
    for (i = 0; i < 16; i++) {
      out += isoTree(2 + i * 7, 98 + (i % 3) * 5, 0.7 + (i % 4) * 0.07, 400 + i);
    }

    /* ── 5. rice plain (left + bottom), terraced ────────────────────── */
    out += paddy(24, 104, 130, 54, 71);
    out += paddy(96, 116, 120, 42, 73);

    /* ── 6. town: chedi, houses, palms, road ────────────────────────── */
    for (i = 0; i < 46; i++) {
      out += R(120 + i * 2, 104 + Math.round(Math.sin(i / 8) * 4), 3, 2, HC.sand);
    }
    out += isoChedi(196, 46);
    out += isoHouse(172, 66, 18, 14);
    out += isoHouse(196, 70, 15, 13);
    out += isoHouse(214, 60, 19, 15);
    out += isoHouse(186, 82, 16, 13);
    out += isoHouse(210, 86, 15, 12);
    out += isoTree(160, 84, 0.85, 71) + isoTree(232, 78, 0.9, 72) +
      isoTree(240, 92, 0.8, 73);

    /* ── 7. Thale Noi wetland (reaches the frame edge) ──────────────── */
    /* sand shoreline first, then stepped water on top */
    /* shoreline: ever-wider sand rims, then the water body on top */
    out += R(254, 54, 146, 106, HC.sand);
    out += R(249, 62, 151, 96, HC.sand);
    out += R(257, 58, 143, 102, HC.waterDeep);
    out += R(254, 66, 146, 92, HC.waterDeep);
    out += R(262, 54, 132, 12, HC.waterDeep);
    out += R(270, 48, 116, 8, HC.water);
    out += R(258, 62, 140, 3, HC.waterLight);
    out += R(260, 70, 138, 38, HC.water);
    out += R(263, 100, 135, 32, HC.water);
    out += R(266, 118, 130, 22, HC.waterDeep);
    /* shore reeds */
    out += reeds(244, 82, 10) + reeds(246, 132, 12) + reeds(376, 104, 8) + reeds(366, 148, 7);
    /* lotus beds */
    for (i = 0; i < 30; i++) {
      var lx = 268 + Math.round(rnd() * 118), ly = 62 + Math.round(rnd() * 72);
      out += R(lx, ly, 5, 2, HC.leaf);
      if (i % 3 === 0) out += R(lx + 1, ly - 2, 3, 2, HC.lotus);
    }
    /* shimmer + reflections */
    for (i = 0; i < 70; i++) {
      out += R(256 + Math.round(rnd() * 138), 60 + Math.round(rnd() * 88),
        2 + Math.round(rnd() * 4), 1, HC.foam);
    }
    /* buffalo in the shallows, boats, birds */
    out += isoBuffalo(282, 96);
    out += isoBuffalo(304, 108);
    out += isoBuffalo(338, 128);
    out += isoBoat(330, 70);
    out += isoBoat(352, 104);
    out += isoBird(312, 24) + isoBird(320, 28) + isoBird(328, 23) +
      isoBird(342, 27) + isoBird(354, 22) + isoBird(362, 26);

    /* ── 8. river linking the plain to the lake ─────────────────────── */
    for (i = 0; i < 42; i++) {
      out += R(232 + Math.round(i * 0.55), 100 + Math.round(Math.sin(i / 6) * 3) - Math.round(i * 0.2),
        4, 2, HC.water);
    }

    /* ── 9. foreground: reeds + wooden signpost ─────────────────────── */
    out += reeds(0, 158, 16) + reeds(390, 156, 8);
    out += R(236, 132, 3, 22, HC.trunk) + R(228, 128, 19, 7, HC.trunk) +
      R(230, 130, 15, 3, HC.sand);
    out += isoTree(6, 150, 1.05, 91) + isoTree(20, 156, 0.9, 93);

    out += hdVignette();
    return out;
  }


/* ── hotspots: real highlights, scene coords 160x120 ─────────────── */
  var HOTSPOTS = {
    mueang: [
      { id: 'ok-thalu', x: 48, y: 40, w: 28, h: 34, kind: 'poi', th: 'เขาอกทะลุ', en: 'Khao Ok Thalu', noteTh: 'ภูเขาสัญลักษณ์ที่มีรูทะลุกลางเขา', noteEn: 'The landmark hill with a hole through it' },
      { id: 'cave', x: 12, y: 78, w: 32, h: 26, kind: 'poi', th: 'ถ้ำคูหาสวรรค์', en: 'Khuha Sawan Cave', noteTh: 'ถ้ำและวัดบนเขาที่อยู่คู่เมืองพัทลุง', noteEn: 'Hill cave and temple beside the town' },
      { id: 'puppet', x: 108, y: 60, w: 30, h: 32, kind: 'poi', th: 'หนังตะลุง', en: 'Shadow puppet', noteTh: 'ศิลปะการแสดงพื้นบ้านขึ้นชื่อของพัทลุง', noteEn: "Phatthalung's famous shadow-puppet art" },
      { id: 'egg-bird', x: 128, y: 14, w: 20, h: 16, kind: 'egg', th: 'นกที่ซ่อนอยู่', en: 'Hidden bird', noteTh: 'เจอนกตัวเล็กซ่อนอยู่บนฟ้า', noteEn: 'You found a tiny bird in the sky' }
    ],
    'kong-ra': [
      { id: 'fall', x: 66, y: 30, w: 34, h: 62, kind: 'poi', th: 'น้ำตกในป่ากงหรา', en: 'Kong Ra waterfall', noteTh: 'น้ำตกกลางป่าเขาลำเนาไพรของกงหรา', noteEn: 'A waterfall deep in Kong Ra forest' },
      { id: 'forest', x: 4, y: 56, w: 52, h: 50, kind: 'poi', th: 'ป่าเขาลำเนาไพร', en: 'Forest hills', noteTh: 'พื้นที่ป่าต้นน้ำของอำเภอ', noteEn: 'The district headwater forest' },
      { id: 'egg-leaf', x: 118, y: 24, w: 22, h: 18, kind: 'egg', th: 'ใบไม้ร่วง', en: 'Falling leaf', noteTh: 'ใบไม้ร่วงลงกลางอากาศ', noteEn: 'A leaf caught mid-fall' }
    ],
    'khao-chaison': [
      { id: 'lotus', x: 12, y: 66, w: 44, h: 30, kind: 'poi', th: 'ทะเลน้อย', en: 'Thale Noi', noteTh: 'ทะเลสาบน้ำจืดที่มีบัวแดงบานสะพรั่ง', noteEn: 'Freshwater lake famed for its red lotus' },
      { id: 'birds', x: 34, y: 26, w: 60, h: 20, kind: 'poi', th: 'ฝูงนกน้ำ', en: 'Water birds', noteTh: 'นกน้ำจำนวนมากอาศัยอยู่ที่ทะเลน้อย', noteEn: 'Thale Noi hosts huge flocks of water birds' },
      { id: 'egg-boat', x: 120, y: 78, w: 30, h: 22, kind: 'egg', th: 'เรือเล็ก', en: 'Little boat', noteTh: 'เรือพายเล็ก ๆ ริมขอบภาพ', noteEn: 'A small rowboat at the edge' }
    ],
    tamot: [
      { id: 'rubber', x: 6, y: 30, w: 62, h: 62, kind: 'poi', th: 'สวนยางพารา', en: 'Rubber plantation', noteTh: 'ยางพาราเป็นพืชเศรษฐกิจหลักของตะโหมด', noteEn: 'Rubber is Tamot main cash crop' },
      { id: 'tractor', x: 54, y: 88, w: 44, h: 22, kind: 'poi', th: 'รถไถนา', en: 'Tractor', noteTh: 'เครื่องจักรในแปลงเกษตร', noteEn: 'Farm machinery in the fields' },
      { id: 'egg-cup', x: 112, y: 66, w: 22, h: 18, kind: 'egg', th: 'ถ้วยน้ำยาง', en: 'Latex cup', noteTh: 'ถ้วยรองน้ำยางใต้ต้น', noteEn: 'A latex cup under a tree' }
    ],
    'khuan-khanun': [
      { id: 'rice', x: 4, y: 62, w: 84, h: 50, kind: 'poi', th: 'ทุ่งข้าวสังข์หยด', en: 'Sangyod rice fields', noteTh: 'ข้าวสังข์หยดเป็นข้าว GI ของพัทลุง', noteEn: 'Sangyod is Phatthalung protected GI rice' },
      { id: 'barn', x: 100, y: 44, w: 52, h: 40, kind: 'poi', th: 'ยุ้งฉาง', en: 'Rice barn', noteTh: 'ยุ้งเก็บข้าวของชุมชน', noteEn: 'The community rice barn' },
      { id: 'egg-palm', x: 10, y: 44, w: 22, h: 24, kind: 'egg', th: 'มะพร้าว', en: 'Coconut palm', noteTh: 'มะพร้าวต้นสูงริมทุ่ง', noteEn: 'A tall palm by the field' }
    ],
    'pak-phayun': [
      { id: 'arch', x: 52, y: 24, w: 56, h: 54, kind: 'poi', th: 'เขาอกทะลุกลางน้ำ', en: 'Rock arch in the lake', noteTh: 'โขดหินรูทะลุกลางทะเลสาบ', noteEn: 'A holed rock standing in the lake' },
      { id: 'dugong', x: 16, y: 78, w: 58, h: 30, kind: 'poi', th: 'พะยูน', en: 'Dugong', noteTh: 'พะยูนเป็นสัตว์ทะเลหายากของปากพะยูน', noteEn: 'The dugong is Pak Phayun rare marine animal' },
      { id: 'egg-sun', x: 2, y: 6, w: 24, h: 22, kind: 'egg', th: 'พระอาทิตย์', en: 'The sun', noteTh: 'แสงเช้าตกกระทบผิวน้ำ', noteEn: 'Morning light on the water' }
    ],
    'bang-kaeo': [
      { id: 'houses', x: 6, y: 40, w: 96, h: 48, kind: 'poi', th: 'บ้านริมทะเลสาบ', en: 'Lakeside houses', noteTh: 'ชุมชนประมงที่ปลูกบ้านริมน้ำ', noteEn: 'Fishing families living over the water' },
      { id: 'net', x: 16, y: 80, w: 44, h: 24, kind: 'poi', th: 'อวนตากปลา', en: 'Drying net', noteTh: 'อวนและปลาที่ตากไว้ริมบ้าน', noteEn: 'Nets and fish drying by the houses' },
      { id: 'egg-boat', x: 108, y: 76, w: 46, h: 26, kind: 'egg', th: 'เรือหางยาว', en: 'Long-tail boat', noteTh: 'เรือหางยาวจอดริมสะพาน', noteEn: 'A long-tail boat moored at the pier' }
    ],
    'pa-bon': [
      { id: 'forest', x: 0, y: 40, w: 160, h: 66, kind: 'poi', th: 'ป่าบอน', en: 'Pa Bon forest', noteTh: 'ป่าเขาธรรมชาติที่อุดมสมบูรณ์', noteEn: 'Rich natural hill forest' },
      { id: 'flies', x: 30, y: 46, w: 80, h: 40, kind: 'poi', th: 'หิ่งห้อย', en: 'Fireflies', noteTh: 'หิ่งห้อยในป่ายามค่ำ', noteEn: 'Fireflies in the forest at dusk' },
      { id: 'egg-moon', x: 120, y: 4, w: 26, h: 22, kind: 'egg', th: 'พระจันทร์', en: 'The moon', noteTh: 'ดวงจันทร์ลอยเหนือยอดไม้', noteEn: 'The moon above the canopy' }
    ],
    srinagarindra: [
      { id: 'cave', x: 16, y: 48, w: 70, h: 66, kind: 'poi', th: 'ถ้ำงาม', en: 'The beautiful cave', noteTh: 'ถ้ำหินงอกหินย้อยของศรีนครินทร์', noteEn: 'Limestone cave with stalactites' },
      { id: 'fall', x: 100, y: 32, w: 44, h: 70, kind: 'poi', th: 'น้ำตก', en: 'Waterfall', noteTh: 'น้ำตกในพื้นที่อำเภอศรีนครินทร์', noteEn: 'A waterfall in Srinagarindra' },
      { id: 'egg-bat', x: 20, y: 22, w: 40, h: 18, kind: 'egg', th: 'ค้างคาว', en: 'Bats', noteTh: 'ค้างคาวออกจากถ้ำยามเย็น', noteEn: 'Bats leaving the cave at dusk' }
    ],
    'si-banphot': [
      { id: 'fall', x: 34, y: 28, w: 84, h: 76, kind: 'poi', th: 'น้ำตกศรีบรรพต', en: 'Si Banphot waterfall', noteTh: 'น้ำตกใหญ่กลางหุบเขา', noteEn: 'A big waterfall in the valley' },
      { id: 'rainbow', x: 32, y: 12, w: 96, h: 20, kind: 'poi', th: 'สายรุ้ง', en: 'Rainbow', noteTh: 'ละอองน้ำทำให้เกิดสายรุ้ง', noteEn: 'Spray creates a rainbow' },
      { id: 'egg-moss', x: 2, y: 78, w: 24, h: 22, kind: 'egg', th: 'มอส', en: 'Moss', noteTh: 'มอสรูปหัวใจบนโขดหิน', noteEn: 'Moss on the rocks' }
    ],
    'pa-phayom': [
      { id: 'raft', x: 54, y: 70, w: 52, h: 26, kind: 'poi', th: 'ล่องแก่ง', en: 'Rafting', noteTh: 'กิจกรรมล่องแก่งของป่าพะยอม', noteEn: 'White-water rafting at Pa Phayom' },
      { id: 'rapids', x: 24, y: 58, w: 108, h: 50, kind: 'poi', th: 'แก่งน้ำ', en: 'Rapids', noteTh: 'แก่งและโขดหินกลางลำน้ำ', noteEn: 'Rapids and boulders in the river' },
      { id: 'egg-rock', x: 130, y: 52, w: 28, h: 22, kind: 'egg', th: 'โขดหิน', en: 'Boulder', noteTh: 'หินใหญ่ริมตลิ่ง', noteEn: 'A big boulder on the bank' }
    ]
  };

  /* ── progress store ──────────────────────────────────────────────── */
  var PROGRESS_KEY = 'nola_px_progress';
  function loadProgress() {
    try {
      var raw = window.localStorage.getItem(PROGRESS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  function saveProgress(p) {
    try { window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (e) {}
  }
  function districtProgress(id) {
    var p = loadProgress();
    return p[id] || { found: [], stamp: false };
  }
  function markFound(id, hotspotId) {
    var p = loadProgress();
    var d = p[id] || { found: [], stamp: false };
    if (d.found.indexOf(hotspotId) < 0) d.found.push(hotspotId);
    p[id] = d;
    saveProgress(p);
    return d;
  }
  function grantStamp(id) {
    var p = loadProgress();
    var d = p[id] || { found: [], stamp: false };
    d.stamp = true;
    p[id] = d;
    saveProgress(p);
    return d;
  }

  /* ── mini-games ──────────────────────────────────────────────────── */
  var GAMES = {
    mueang: { kind: 'find', count: 3, th: 'หาตัวหนังตะลุงที่ซ่อนในฉาก 3 ตัว', en: 'Find the 3 hidden shadow puppets', targets: [[118, 66], [30, 84], [78, 46]] },
    'kong-ra': { kind: 'timing', th: 'แตะให้ตรงจังหวะน้ำตกกระเซ็น 3 ครั้ง', en: 'Tap in time with the splash 3 times', count: 3 },
    'khao-chaison': { kind: 'find', count: 3, th: 'หาดอกบัวแดงที่ซ่อนอยู่ 3 ดอก', en: 'Find 3 hidden red lotuses', targets: [[18, 72], [62, 84], [118, 66]] },
    tamot: { kind: 'find', count: 3, th: 'หาถ้วยน้ำยางที่ซ่อนอยู่ 3 ใบ', en: 'Find 3 hidden latex cups', targets: [[118, 70], [30, 70], [74, 70]] },
    'khuan-khanun': { kind: 'find', count: 4, th: 'เก็บรวงข้าวที่ซ่อนอยู่ 4 รวง', en: 'Collect 4 hidden rice stalks', targets: [[16, 70], [50, 82], [92, 66], [130, 92]] },
    'pak-phayun': { kind: 'timing', th: 'แตะตอนพะยูนโผล่พ้นน้ำ 3 ครั้ง', en: 'Tap when the dugong surfaces, 3 times', count: 3 },
    'bang-kaeo': { kind: 'find', count: 3, th: 'หาปลาที่ซ่อนในอวน 3 ตัว', en: 'Find 3 fish hidden in the net', targets: [[26, 88], [40, 92], [132, 82]] },
    'pa-bon': { kind: 'find', count: 4, th: 'หาหิ่งห้อยที่ซ่อนในความมืด 4 ตัว', en: 'Find 4 fireflies in the dark', targets: [[24, 62], [58, 54], [96, 68], [128, 58]] },
    srinagarindra: { kind: 'find', count: 3, th: 'หาค้างคาวที่ซ่อนในถ้ำ 3 ตัว', en: 'Find 3 bats hidden in the cave', targets: [[30, 34], [46, 30], [62, 36]] },
    'si-banphot': { kind: 'sequence', th: 'แตะสีตามลำดับที่กำหนด 3 สี', en: 'Tap the colours in the shown order', seq: [0, 2, 1] },
    'pa-phayom': { kind: 'timing', th: 'แตะพายให้ตรงจังหวะผ่านแก่ง 3 ครั้ง', en: 'Tap to paddle through the rapids 3 times', count: 3 }
  };

  var game = { id: null, state: null, timer: null, layer: null };

  function gameInstruction(g) {
    return document.documentElement.lang === 'en' ? g.en : g.th;
  }

  function startGame(id) {
    var g = GAMES[id];
    if (!g || !focus.el) return false;
    exitGame();
    game.id = id;
    game.state = { hits: 0, found: [], phase: 0 };
    var layer = document.createElement('div');
    layer.className = 'px-game';
    layer.setAttribute('data-kind', g.kind);
    var stage = focus.el.querySelector('.px-focus__stage');
    if (!stage) return false;
    stage.appendChild(layer);
    game.layer = layer;
    focus.el.classList.add('is-playing');

    var art = focus.el.querySelector('.px-focus__art');
    if (art) art.classList.add('is-dim');

    layer.innerHTML =
      '<div class="px-game__bar">' +
        '<p class="px-game__hint">' + gameInstruction(g) + '</p>' +
        '<p class="px-game__score" aria-live="polite">0 / ' + (g.kind === 'sequence' ? g.seq.length : g.count) + '</p>' +
        '<button type="button" class="px-game__skip" data-px-game-skip="1">' + (document.documentElement.lang === 'en' ? 'Skip' : 'ข้าม') + '</button>' +
      '</div>' +
      '<div class="px-game__board"></div>';

    var board = layer.querySelector('.px-game__board');
    if (g.kind === 'find') {
      g.targets.forEach(function (t, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'px-game__target';
        b.style.left = (t[0] / 160 * 100) + '%';
        b.style.top = (t[1] / 120 * 100) + '%';
        b.setAttribute('aria-label', (document.documentElement.lang === 'en' ? 'Hidden item ' : 'จุดซ่อนที่ ') + (i + 1));
        b.dataset.pxGameHit = String(i);
        board.appendChild(b);
      });
    } else if (g.kind === 'timing') {
      var track = document.createElement('div');
      track.className = 'px-game__track';
      track.innerHTML = '<span class="px-game__zone"></span><span class="px-game__marker"></span>';
      board.appendChild(track);
      var marker = track.querySelector('.px-game__marker');
      var zone = track.querySelector('.px-game__zone');
      var pos = 0, dir = 1, zpos = 40;
      game.timer = setInterval(function () {
        pos += dir * 2;
        if (pos > 100 || pos < 0) { dir *= -1; pos = Math.max(0, Math.min(100, pos)); }
        marker.style.left = pos + '%';
      }, 16);
      game.state.zoneHit = function () {
        var inZone = Math.abs(pos - zpos) < 12;
        if (inZone) {
          game.state.hits += 1;
          zpos = 20 + Math.random() * 60;
          zone.style.left = zpos + '%';
          updateGameScore();
          if (game.state.hits >= g.count) winGame();
        } else {
          game.state.hits = Math.max(0, game.state.hits);
          updateGameScore();
        }
      };
      board.innerHTML = '';
      board.appendChild(track);
      var tap = document.createElement('button');
      tap.type = 'button';
      tap.className = 'px-game__tap';
      tap.textContent = document.documentElement.lang === 'en' ? 'TAP' : 'แตะ';
      tap.setAttribute('data-px-game-tap', '1');
      board.appendChild(tap);
      board.querySelector('.px-game__zone').style.left = zpos + '%';
    } else if (g.kind === 'sequence') {
      var seqWrap = document.createElement('div');
      seqWrap.className = 'px-game__seq';
      var tones = ['#e86f9e', '#8fd07a', '#f3c04a'];
      g.seq.forEach(function (n) {
        var c = document.createElement('button');
        c.type = 'button';
        c.className = 'px-game__chip';
        c.style.background = tones[n];
        c.dataset.pxGameChip = String(n);
        c.setAttribute('aria-label', 'colour ' + (n + 1));
        seqWrap.appendChild(c);
      });
      board.appendChild(seqWrap);
      game.state.seq = g.seq.slice();
    }

    layer.addEventListener('click', onGameClick);
    return true;
  }

  function updateGameScore() {
    if (!game.layer || !game.id) return;
    var g = GAMES[game.id];
    var el = game.layer.querySelector('.px-game__score');
    if (el) el.textContent = game.state.hits + ' / ' + (g.kind === 'sequence' ? g.seq.length : g.count);
  }

  function onGameClick(e) {
    if (!game.id) return;
    var g = GAMES[game.id];
    if (e.target.closest('[data-px-game-skip]')) { exitGame(); return; }
    if (g.kind === 'find') {
      var hit = e.target.closest('[data-px-game-hit]');
      if (hit && !hit.classList.contains('is-found')) {
        hit.classList.add('is-found');
        game.state.hits += 1;
        updateGameScore();
        if (game.state.hits >= g.count) winGame();
      }
    } else if (g.kind === 'timing') {
      if (e.target.closest('[data-px-game-tap]') && game.state.zoneHit) game.state.zoneHit();
    } else if (g.kind === 'sequence') {
      var chip = e.target.closest('[data-px-game-chip]');
      if (!chip) return;
      var val = Number(chip.dataset.pxGameChip);
      if (val === game.state.seq[game.state.phase]) {
        game.state.phase += 1;
        game.state.hits = game.state.phase;
        updateGameScore();
        if (game.state.phase >= game.state.seq.length) winGame();
      } else {
        game.state.phase = 0;
        game.state.hits = 0;
        updateGameScore();
      }
    }
  }

  function winGame() {
    var id = game.id;
    if (game.timer) { clearInterval(game.timer); game.timer = null; }
    grantStamp(id);
    if (game.layer) {
      var banner = document.createElement('div');
      banner.className = 'px-game__win';
      banner.setAttribute('role', 'status');
      banner.innerHTML =
        '<p>' + (document.documentElement.lang === 'en' ? 'You earned a stamp!' : 'ได้ตราประทับแล้ว!') + '</p>' +
        '<button type="button" class="btn-primary" data-px-game-skip="1">' +
        (document.documentElement.lang === 'en' ? 'Back to scene' : 'กลับไปที่ภาพ') + '</button>';
      game.layer.appendChild(banner);
    }
    updateHud();
  }

  function exitGame() {
    if (game.timer) { clearInterval(game.timer); game.timer = null; }
    if (game.layer) {
      game.layer.removeEventListener('click', onGameClick);
      if (game.layer.parentNode) game.layer.parentNode.removeChild(game.layer);
    }
    game.layer = null;
    game.id = null;
    game.state = null;
    if (focus.el) {
      focus.el.classList.remove('is-playing');
      var art = focus.el.querySelector('.px-focus__art');
      if (art) art.classList.remove('is-dim');
    }
  }

  /* ── Map3D-compatible facade ───────────────────────────────────────── */
  var PixelMap = {
    init: function () {
      var host = document.getElementById('pixelMap');
      if (!host) return;
      if (state.built && host.children.length) return;

      if (!build(host)) return;
      state.built = true;

      host.addEventListener('click', onClick);
      host.addEventListener('keydown', onKey);

      if (!focus.keyBound) {
        document.addEventListener('keydown', onDocKey, true);
        document.addEventListener('click', onFocusClick);
        document.addEventListener('touchstart', onFocusTouchStart, { passive: true });
        document.addEventListener('touchend', onFocusTouchEnd, { passive: true });
        focus.keyBound = true;
      }

      // Pause idle animation while the map is off-screen (battery friendly)
      if ('IntersectionObserver' in window) {
        state.io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            en.target.classList.toggle('is-visible', en.isIntersecting);
          });
        }, { threshold: 0.05 });
        state.io.observe(host);
      } else {
        host.classList.add('is-visible');
      }

      // Re-measure the route ribbon when the layout changes
      window.addEventListener('resize', function () {
        if (state.routeIds.length) drawRoute(state.routeIds);
      }, { passive: true });
    },

    destroy: function () {
      closeFocus(true);
      clearTimeout(state.playTimer);
      if (state.io) { state.io.disconnect(); state.io = null; }
      var host = document.getElementById('pixelMap');
      if (host) {
        host.removeEventListener('click', onClick);
        host.removeEventListener('keydown', onKey);
      }
      clearRoute();
      state.built = false;
      state.activeId = null;
    },

    focusDistrict: function (id, shouldOpen) {
      var t = tileById(id);
      if (!t) return;
      tiles().forEach(function (x) { x.classList.remove('is-primary'); });
      t.classList.add('is-primary');
      if (t.scrollIntoView) {
        t.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setActive(id);
      playScene(t);
      if (shouldOpen) openPanel(id);
    },

    setDistrictHighlights: function (ids, primaryId) {
      var set = {};
      (ids || []).forEach(function (i) { set[i] = true; });
      tiles().forEach(function (t) {
        var id = t.getAttribute('data-px-district');
        t.classList.toggle('is-route', !!set[id]);
        t.classList.toggle('is-primary', id === primaryId);
      });
    },

    clearDistrictHighlights: function () {
      tiles().forEach(function (t) {
        t.classList.remove('is-route', 'is-primary');
      });
      clearRoute();
    },

    resetZoom: function () {
      tiles().forEach(function (t) { t.classList.remove('is-primary'); });
    },

    animateRoutePath: function (ids) {
      drawRoute(ids || []);
    },

    /* focus / expand mode */
    openFocus: openFocus,
    closeFocus: closeFocus,
    stepFocus: stepFocus,
    getFocusId: function () { return focus.id; },

    /* mini-games + progress */
    startGame: startGame,
    exitGame: exitGame,
    getProgress: function () { return JSON.parse(JSON.stringify(loadProgress())); },
    resetProgress: function () { saveProgress({}); updateHud(); return true; },

    /* utility for other modules / debugging */
    scenes: SCENES,
    getActive: function () { return state.activeId; }
  };

  window.PixelMap = PixelMap;
  window.Map3D = PixelMap; // backward-compatible name used by smart-tourism.js
})();
