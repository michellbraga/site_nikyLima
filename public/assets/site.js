(function () {
  function init() {
    var root = document.querySelector('.nk');
    if (!root) return;
    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    /* vídeos: mudos, em loop, tocam só quando visíveis */
    var vids = root.querySelectorAll('video.nk-vid');
    var playV = function (v) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); };
    for (var i = 0; i < vids.length; i++) { vids[i].muted = true; vids[i].loop = true; vids[i].playsInline = true; }
    if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { e.target.preload = 'auto'; playV(e.target); } else { e.target.pause(); }
        });
      }, { threshold: 0.25 });
      for (var j = 0; j < vids.length; j++) { vio.observe(vids[j]); }
    } else {
      for (var k = 0; k < vids.length; k++) { playV(vids[k]); }
    }
    if (reduce) return;

    /* geometria de fundo: progresso de cada seção na tela */
    var ticking = false;
    var geos = root.querySelectorAll('.nk-geo');
    var update = function () {
      ticking = false;
      var vh = window.innerHeight || 800;
      for (var a = 0; a < geos.length; a++) {
        var r = geos[a].getBoundingClientRect();
        var p = (vh - r.top) / (vh + r.height);
        if (p < -0.2) { p = -0.2; }
        if (p > 1.2) { p = 1.2; }
        geos[a].style.setProperty('--p', p.toFixed(4));
      }
    };
    var onScroll = function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();

    /* entrada suave dos blocos ao rolar */
    if ('IntersectionObserver' in window) {
      root.classList.add('nk-js');
      var rio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('nk-in'); rio.unobserve(e.target); }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
      var rv = root.querySelectorAll('.nk-rv');
      for (var b = 0; b < rv.length; b++) { rio.observe(rv[b]); }
    }
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
