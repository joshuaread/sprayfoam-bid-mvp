/*! Spray Foam Bid Builder (working name) - homeowner instant-quote widget loader (demo) */
(function () {
  var script = document.currentScript;
  if (!script) {
    var all = document.getElementsByTagName('script');
    for (var i = all.length - 1; i >= 0; i--) {
      if (/widget\.js(\?|$)/.test(all[i].src)) { script = all[i]; break; }
    }
  }
  if (!script) return;
  var base = script.src.replace(/widget\.js(?:\?.*)?$/, '');
  var key = script.getAttribute('data-widget-key') || '';
  var sel = script.getAttribute('data-target');
  var host = sel ? document.querySelector(sel) : null;
  if (!host) {
    host = document.createElement('div');
    script.parentNode.insertBefore(host, script.nextSibling);
  }
  // Shadow DOM + iframe: host page CSS cannot reach the widget.
  var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
  var style = document.createElement('style');
  style.textContent = ':host{all:initial;display:block;width:100%}iframe{border:0;width:100%;height:460px;display:block;background:transparent;color-scheme:light}';
  var iframe = document.createElement('iframe');
  iframe.src = base + 'embed/?key=' + encodeURIComponent(key) + '&host=' + encodeURIComponent(location.hostname);
  iframe.title = 'Spray foam instant quote';
  iframe.setAttribute('scrolling', 'no');
  root.appendChild(style);
  root.appendChild(iframe);
  window.addEventListener('message', function (e) {
    if (e.source !== iframe.contentWindow) return;
    var d = e.data;
    if (d && d.type === 'sfbb:height' && typeof d.height === 'number') {
      iframe.style.height = Math.max(200, Math.ceil(d.height)) + 'px';
    }
  });
})();
