// Only published, independently verified place records should be added to the
// source data. Do not generate businesses, reviews, opening hours or locations.
(function () {
  window.applyPhatthalungEnhancements = function (data) {
    if (!data) return;
    Object.values(data.places || {}).forEach(function (district) {
      if (!Array.isArray(district.workshops)) district.workshops = [];
      Object.values(district).forEach(function (places) {
        if (Array.isArray(places)) places.forEach(function (place) { delete place.rating; });
      });
    });
  };
})();
