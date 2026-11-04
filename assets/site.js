// Eldoria website: fills the list of upcoming events from events.json (the same file the app reads).
// On the home page it shows the few soonest events; on the events page (data-full) all of them, with a
// type filter, a search field and the yearly events whose dates are not announced yet.
// No libraries, no third-party requests. Text from the file is inserted as text, never as HTML.
// Gallery: the screenshots sit in a row; arrow buttons step through them, so there is no scroll bar.
// Swiping and the arrow keys still work. Without JavaScript the row scrolls sideways as before.
(function () {
  var gallery = document.querySelector('.gallery');
  if (!gallery) return;
  var track = gallery.querySelector('.shots');
  if (!track) return;
  gallery.classList.add('has-arrows');

  function button(cls, label, glyph) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'arrow ' + cls;
    b.setAttribute('aria-label', label);
    b.textContent = glyph;
    return b;
  }
  var prev = button('prev', gallery.dataset.prev, '‹');
  var next = button('next', gallery.dataset.next, '›');
  gallery.appendChild(prev);
  gallery.appendChild(next);

  function step() {
    var first = track.children[0];
    var slide = first ? first.getBoundingClientRect().width : 246;
    var gap = parseFloat(getComputedStyle(track).columnGap) || 18;
    var visible = Math.max(1, Math.floor((track.clientWidth + gap) / (slide + gap)));
    return visible * (slide + gap);
  }
  function update() {
    var max = track.scrollWidth - track.clientWidth;
    prev.disabled = track.scrollLeft <= 8; // the row starts a few pixels in (its padding)
    next.disabled = track.scrollLeft >= max - 8;
  }
  prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
  next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

(function () {
  var list = document.getElementById('events-list');
  if (!list) return;
  var lang = document.documentElement.lang || 'en';
  var d = list.dataset;
  var full = d.full === '1';
  var limit = Number(d.limit) || 6;
  var categories = {};
  try { categories = JSON.parse(d.categories || '{}'); } catch (e) { categories = {}; }
  var ORDER = ['festival', 'market', 'tournament', 'performance', 'tour', 'local'];

  function note(text) {
    list.textContent = '';
    var li = document.createElement('li');
    li.className = 'status';
    li.textContent = text;
    list.appendChild(li);
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var now = new Date();
  var today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());

  function parseDay(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s));
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  }

  function dates(a, b) {
    try {
      var f = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric' });
      if (f.formatRange) return f.formatRange(a, b);
      return a.getTime() === b.getTime() ? f.format(a) : f.format(a) + ' – ' + f.format(b);
    } catch (e) {
      return '';
    }
  }

  function monthYear(year, month) {
    try {
      return new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
    } catch (e) {
      return year + '-' + pad(month);
    }
  }

  function country(code) {
    try {
      return new Intl.DisplayNames([lang], { type: 'region' }).of(code) || code;
    } catch (e) {
      return code;
    }
  }

  function text(tag, cls, value) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    el.textContent = value;
    return el;
  }

  function categoryOf(e) {
    return typeof e.category === 'string' && categories[e.category] ? e.category : 'local';
  }

  /** Everything a reader might type: titles in every language, venue, town, country and description. */
  function haystack(e) {
    var parts = [e.title, e.venue, e.city, e.description, typeof e.country === 'string' ? country(e.country) : '', categories[categoryOf(e)]];
    [e.titles, e.descriptions].forEach(function (map) {
      if (map && typeof map === 'object') Object.keys(map).forEach(function (k) { parts.push(map[k]); });
    });
    return parts.filter(function (p) { return typeof p === 'string'; }).join(' ').toLowerCase();
  }

  function card(e, when) {
    var li = document.createElement('li');
    li.className = 'card';
    var title = (e.titles && e.titles[lang]) || e.title;
    var desc = (e.descriptions && e.descriptions[lang]) || e.description;
    var top = document.createElement('p');
    top.className = 'when';
    top.appendChild(text('span', '', when));
    var cat = categories[categoryOf(e)];
    if (cat) top.appendChild(text('span', 'tag', cat));
    li.appendChild(top);
    li.appendChild(text('h3', '', title));
    var place = [e.venue, e.city, typeof e.country === 'string' ? country(e.country) : ''].filter(Boolean).join(', ');
    if (place) li.appendChild(text('p', 'where', place));
    if (typeof desc === 'string' && desc) li.appendChild(text('p', '', desc));
    if (typeof e.url === 'string' && e.url.indexOf('https://') === 0) {
      var p = document.createElement('p');
      var a = text('a', '', d.more);
      a.href = e.url;
      a.rel = 'noopener noreferrer';
      p.appendChild(a);
      li.appendChild(p);
    }
    return li;
  }

  var tools = null;
  var expectedBox = null;
  var chosen = '';
  var chosenCountry = '';
  var query = '';

  function render(events, expected) {
    var upcoming = events
      .filter(function (e) {
        return e && typeof e.title === 'string' && parseDay(e.start) && parseDay(e.end) && String(e.end) >= today;
      })
      .sort(function (a, b) { return String(a.start).localeCompare(String(b.start)) || a.title.localeCompare(b.title); });

    if (!full) {
      // Home page: the few soonest events, nothing else.
      if (!upcoming.length) return note(d.empty);
      list.textContent = '';
      upcoming.slice(0, limit).forEach(function (e) { list.appendChild(card(e, dates(parseDay(e.start), parseDay(e.end)))); });
      return;
    }

    var thisMonth = now.getFullYear() + '-' + pad(now.getMonth() + 1);
    var later = expected
      .filter(function (e) {
        return e && typeof e.title === 'string' && typeof e.year === 'number' && typeof e.month === 'number' &&
          e.month >= 1 && e.month <= 12 && (e.year + '-' + pad(e.month)) >= thisMonth;
      })
      .sort(function (a, b) { return (a.year - b.year) || (a.month - b.month) || a.title.localeCompare(b.title); });

    // Search field and one button per type that occurs, plus "all", built once.
    if (!tools) {
      tools = document.createElement('div');
      tools.className = 'event-tools';
      var input = document.createElement('input');
      input.type = 'search';
      input.placeholder = d.search;
      input.setAttribute('aria-label', d.search);
      input.autocomplete = 'off';
      input.addEventListener('input', function () { query = input.value.trim().toLowerCase(); render(events, expected); });
      var row = document.createElement('div');
      row.className = 'event-search';
      row.appendChild(input);

      // One entry per country that has events, named in the page's language and sorted by that name.
      var codes = [];
      upcoming.concat(later).forEach(function (e) {
        if (typeof e.country === 'string' && codes.indexOf(e.country) < 0) codes.push(e.country);
      });
      if (codes.length > 1) {
        codes.sort(function (a, b) { return country(a).localeCompare(country(b), lang); });
        var select = document.createElement('select');
        select.setAttribute('aria-label', d.allCountries);
        var first = document.createElement('option');
        first.value = '';
        first.textContent = d.allCountries;
        select.appendChild(first);
        codes.forEach(function (code) {
          var o = document.createElement('option');
          o.value = code;
          o.textContent = country(code);
          select.appendChild(o);
        });
        select.addEventListener('change', function () { chosenCountry = select.value; render(events, expected); });
        row.appendChild(select);
      }
      tools.appendChild(row);
      var present = ORDER.filter(function (c) {
        return upcoming.concat(later).some(function (e) { return categoryOf(e) === c; });
      });
      if (present.length > 1) {
        var bar = document.createElement('div');
        bar.className = 'chips';
        bar.setAttribute('role', 'group');
        var all = [''].concat(present);
        all.forEach(function (c) {
          var b = document.createElement('button');
          b.type = 'button';
          b.textContent = c ? categories[c] : d.all;
          b.setAttribute('aria-pressed', c === chosen ? 'true' : 'false');
          b.addEventListener('click', function () {
            chosen = c;
            Array.prototype.forEach.call(bar.children, function (x, i) {
              x.setAttribute('aria-pressed', all[i] === chosen ? 'true' : 'false');
            });
            render(events, expected);
          });
          bar.appendChild(b);
        });
        tools.appendChild(bar);
      }
      list.parentNode.insertBefore(tools, list);
    }

    function matches(e) {
      return (!chosen || categoryOf(e) === chosen) && (!chosenCountry || e.country === chosenCountry) &&
        (!query || haystack(e).indexOf(query) >= 0);
    }
    var shown = upcoming.filter(matches);
    var shownLater = later.filter(matches);

    if (!shown.length) note(upcoming.length || later.length ? d.noResults : d.empty);
    else {
      list.textContent = '';
      shown.forEach(function (e) { list.appendChild(card(e, dates(parseDay(e.start), parseDay(e.end)))); });
    }

    if (expectedBox) { expectedBox.remove(); expectedBox = null; }
    if (shownLater.length) {
      expectedBox = document.createElement('div');
      expectedBox.className = 'expected';
      expectedBox.appendChild(text('h3', '', d.expectedH));
      expectedBox.appendChild(text('p', 'status', d.expectedNote));
      var ul = document.createElement('ul');
      ul.className = 'events';
      shownLater.forEach(function (e) {
        ul.appendChild(card(e, String(d.expectedWhen).replace('{month}', monthYear(e.year, e.month))));
      });
      expectedBox.appendChild(ul);
      list.parentNode.insertBefore(expectedBox, list.nextSibling);
    }
  }

  fetch(d.src, { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      if (!data || !Array.isArray(data.events)) throw new Error('not an events file');
      render(data.events, Array.isArray(data.expected) ? data.expected : []);
    })
    .catch(function () { note(d.error); });
})();
