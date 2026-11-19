// Eldoria website. No libraries; the only request to another host is the contact form's message, and only when the
// visitor sends it (and a link the visitor opens). Text from events.json is inserted as text, never as HTML.
//  1. Gallery: the screenshots sit in a row; arrow buttons step through them, so there is no scroll bar.
//     Swiping and the arrow keys still work. Without JavaScript the row scrolls sideways as before.
//  2. Folding sections: <details data-resp> are open on a wide screen and folded on a phone (a long page there).
//  3. Navigation: the link of the section being read is marked and kept in view in the scrolling menu strip.
//  4. Events (events.json, the same file the app reads): the soonest few on the home page; on the events page all
//     of them, grouped by month, with a type filter, a search field, "show more" and the yearly events whose dates
//     are not announced yet. Each event can be added to a calendar (an .ics file made here) or opened on a map.
//  5. Contact form: sends the message through the form service when the page has an access key, otherwise it opens
//     the visitor's email app with the message prepared.
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

// Folding sections: open on a wide screen (where the summaries are plain headings), folded on a phone.
(function () {
  var items = document.querySelectorAll('details[data-resp]');
  if (!items.length || !window.matchMedia) return;
  var wide = window.matchMedia('(min-width: 760px)');
  function sync() {
    Array.prototype.forEach.call(items, function (d) { d.open = wide.matches; });
  }
  sync();
  if (wide.addEventListener) wide.addEventListener('change', sync);
  else if (wide.addListener) wide.addListener(sync);
  Array.prototype.forEach.call(items, function (d) {
    var summary = d.querySelector('summary');
    if (summary) summary.addEventListener('click', function (e) { if (wide.matches) e.preventDefault(); });
  });

  // A link (or an address) that points into a folded section opens it.
  function reveal(id) {
    var target = id && document.getElementById(id);
    var fold = target && (target.matches('details[data-resp]') ? target : target.querySelector('details[data-resp]'));
    if (fold) fold.open = true;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (a) reveal(a.getAttribute('href').slice(1));
  });
  window.addEventListener('hashchange', function () { reveal(location.hash.slice(1)); });
  if (location.hash) reveal(location.hash.slice(1));
})();

// Navigation: mark the section being read and keep its link in view in the scrolling strip (phones).
(function () {
  var nav = document.querySelector('.site-nav');
  if (!nav || !('IntersectionObserver' in window)) return;
  var links = {};
  Array.prototype.forEach.call(nav.querySelectorAll('a[href^="#"]'), function (a) {
    var id = a.getAttribute('href').slice(1);
    if (document.getElementById(id)) links[id] = a;
  });
  var ids = Object.keys(links);
  if (!ids.length) return;
  var current = '';
  function mark(id) {
    if (id === current) return;
    current = id;
    ids.forEach(function (k) {
      if (k === id) links[k].setAttribute('aria-current', 'location');
      else links[k].removeAttribute('aria-current');
    });
    var a = links[id];
    if (nav.scrollWidth > nav.clientWidth + 1) {
      nav.scrollTo({ left: a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2, behavior: 'smooth' });
    }
  }
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) mark(e.target.id); });
    },
    { rootMargin: '-35% 0px -60% 0px' }
  );
  ids.forEach(function (id) { observer.observe(document.getElementById(id)); });
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
  var PAGE_NARROW = 12; // cards on the events page before "show more", on a phone and on a wide screen
  var PAGE_WIDE = 24;

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

  function capital(s) {
    return s.charAt(0).toLocaleUpperCase(lang) + s.slice(1);
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

  function link(label, href) {
    var a = text('a', '', label);
    a.href = href;
    a.rel = 'noopener noreferrer';
    return a;
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

  // ---- calendar file (RFC 5545), made here so that no request is needed

  function icsText(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }
  function utf8Length(cp) { return cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4; }
  /** Lines are at most 75 octets; a longer one continues on the next line after a space. */
  function fold(line) {
    var out = '';
    var size = 0;
    for (var i = 0; i < line.length; ) {
      var cp = line.codePointAt(i);
      var ch = String.fromCodePoint(cp);
      var n = utf8Length(cp);
      if (size + n > 75) { out += '\r\n '; size = 1; }
      out += ch;
      size += n;
      i += ch.length;
    }
    return out;
  }
  function compact(s) { return String(s).replace(/-/g, ''); }
  function dayAfter(s) {
    var p = parseDay(s);
    p.setDate(p.getDate() + 1);
    return String(p.getFullYear()) + pad(p.getMonth() + 1) + pad(p.getDate());
  }
  function calendarFile(e, title, desc, place) {
    var id = (e.id || (e.start + '-' + title)).replace(/[^A-Za-z0-9._-]+/g, '-');
    var lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Eldoria//Events//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      'UID:' + id + '@eldoria',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''),
      'DTSTART;VALUE=DATE:' + compact(e.start),
      'DTEND;VALUE=DATE:' + dayAfter(e.end), // an all-day event ends the day after its last day
      'SUMMARY:' + icsText(title),
    ];
    if (place) lines.push('LOCATION:' + icsText(place));
    var url = typeof e.url === 'string' && e.url.indexOf('https://') === 0 ? e.url : '';
    var details = [desc, url].filter(Boolean).join('\n');
    if (details) lines.push('DESCRIPTION:' + icsText(details));
    if (url) lines.push('URL:' + url);
    lines.push('END:VEVENT', 'END:VCALENDAR');
    return { name: id + '.ics', body: lines.map(fold).join('\r\n') + '\r\n' };
  }
  function download(file) {
    var blob = new Blob([file.body], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  // ---- one card

  var longTexts = []; // the descriptions of the cards on the page, to see which ones are cut short

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
    if (typeof desc === 'string' && desc) {
      var p = text('p', 'desc', desc);
      li.appendChild(p);
      // "Read more" appears only where the text is cut short (decided after the cards are on the page).
      var more = text('button', 'toggle', d.readMore);
      more.type = 'button';
      more.hidden = true;
      more.setAttribute('aria-expanded', 'false');
      more.addEventListener('click', function () {
        var open = p.classList.toggle('open');
        more.textContent = open ? d.readLess : d.readMore;
        more.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      li.appendChild(more);
      longTexts.push({ p: p, button: more });
    }
    var actions = document.createElement('p');
    actions.className = 'actions';
    if (typeof e.url === 'string' && e.url.indexOf('https://') === 0) actions.appendChild(link(d.more, e.url));
    if (typeof e.lat === 'number' && typeof e.lng === 'number') {
      actions.appendChild(link(d.map, 'https://www.google.com/maps/search/?api=1&query=' + e.lat + ',' + e.lng));
    }
    var cal = text('button', '', d.calendar);
    cal.type = 'button';
    cal.addEventListener('click', function () { download(calendarFile(e, title, desc, place)); });
    actions.appendChild(cal);
    li.appendChild(actions);
    return li;
  }

  /** Shows "Read more" on the descriptions that are cut short, and hides it where the whole text fits. */
  var fitting = false;
  function fit() {
    if (fitting) return;
    fitting = true;
    // A timer, not requestAnimationFrame: reading the sizes forces the layout, and a timer also runs in a tab that is not shown.
    setTimeout(function () {
      fitting = false;
      longTexts = longTexts.filter(function (x) { return document.body.contains(x.p); });
      longTexts.forEach(function (x) {
        x.button.hidden = !(x.p.classList.contains('open') || x.p.scrollHeight > x.p.clientHeight + 1);
      });
    }, 0);
  }
  window.addEventListener('resize', fit);

  var tools = null;
  var expectedBox = null;
  var expectedOpen = false;
  var moreButton = null;
  var chosen = '';
  var chosenCountry = '';
  var query = '';
  var shown = 0; // how many cards the events page shows now

  function pageSize() {
    return window.matchMedia && window.matchMedia('(min-width: 760px)').matches ? PAGE_WIDE : PAGE_NARROW;
  }

  function render(events, expected) {
    // A one-day event may leave out "end" (the app reads it as the same day); without this it would never be listed.
    events = events.map(function (e) {
      if (!e || e.end !== undefined || typeof e.start !== 'string') return e;
      var copy = {};
      for (var k in e) if (Object.prototype.hasOwnProperty.call(e, k)) copy[k] = e[k];
      copy.end = e.start;
      return copy;
    });
    var upcoming = events
      .filter(function (e) {
        return e && typeof e.title === 'string' && parseDay(e.start) && parseDay(e.end) && String(e.end) >= today;
      })
      .sort(function (a, b) { return String(a.start).localeCompare(String(b.start)) || a.title.localeCompare(b.title); });

    longTexts = [];
    if (!full) {
      // Home page: the few soonest events, nothing else.
      if (!upcoming.length) return note(d.empty);
      list.textContent = '';
      upcoming.slice(0, limit).forEach(function (e) { list.appendChild(card(e, dates(parseDay(e.start), parseDay(e.end)))); });
      fit();
      return;
    }

    var thisMonth = now.getFullYear() + '-' + pad(now.getMonth() + 1);
    var later = expected
      .filter(function (e) {
        return e && typeof e.title === 'string' && typeof e.year === 'number' && typeof e.month === 'number' &&
          e.month >= 1 && e.month <= 12 && (e.year + '-' + pad(e.month)) >= thisMonth;
      })
      .sort(function (a, b) { return (a.year - b.year) || (a.month - b.month) || a.title.localeCompare(b.title); });

    function again() { shown = pageSize(); render(events, expected); }

    // Search field and one button per type that occurs, plus "all", built once.
    if (!tools) {
      shown = pageSize();
      tools = document.createElement('div');
      tools.className = 'event-tools';
      var input = document.createElement('input');
      input.type = 'search';
      input.placeholder = d.search;
      input.setAttribute('aria-label', d.search);
      input.autocomplete = 'off';
      input.addEventListener('input', function () { query = input.value.trim().toLowerCase(); again(); });
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
        select.addEventListener('change', function () { chosenCountry = select.value; again(); });
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
            again();
          });
          bar.appendChild(b);
        });
        tools.appendChild(bar);
      }
      list.parentNode.insertBefore(tools, list);

      moreButton = document.createElement('button');
      moreButton.type = 'button';
      moreButton.className = 'btn primary show-more';
      moreButton.hidden = true;
      moreButton.addEventListener('click', function () { shown += pageSize(); render(events, expected); });
      list.parentNode.insertBefore(moreButton, list.nextSibling);
    }

    function matches(e) {
      return (!chosen || categoryOf(e) === chosen) && (!chosenCountry || e.country === chosenCountry) &&
        (!query || haystack(e).indexOf(query) >= 0);
    }
    var found = upcoming.filter(matches);
    var shownLater = later.filter(matches);

    if (!found.length) note(upcoming.length || later.length ? d.noResults : d.empty);
    else {
      list.textContent = '';
      var month = '';
      found.slice(0, shown).forEach(function (e) {
        var key = String(e.start).slice(0, 7);
        if (key !== month) {
          month = key;
          var head = document.createElement('li');
          head.className = 'month';
          head.appendChild(text('h3', '', capital(monthYear(Number(key.slice(0, 4)), Number(key.slice(5, 7))))));
          list.appendChild(head);
        }
        list.appendChild(card(e, dates(parseDay(e.start), parseDay(e.end))));
      });
    }
    var rest = found.length - shown;
    moreButton.hidden = rest <= 0;
    moreButton.textContent = String(d.showMore).replace('{n}', String(Math.max(rest, 0)));

    if (expectedBox) { expectedBox.remove(); expectedBox = null; }
    if (shownLater.length) {
      // The yearly events without dates stay folded: they are a second list, below the one that matters.
      expectedBox = document.createElement('details');
      expectedBox.className = 'expected';
      expectedBox.open = expectedOpen;
      expectedBox.addEventListener('toggle', function () { expectedOpen = expectedBox.open; fit(); });
      var summary = document.createElement('summary');
      summary.appendChild(text('h3', '', d.expectedH + ' (' + shownLater.length + ')'));
      expectedBox.appendChild(summary);
      expectedBox.appendChild(text('p', 'status', d.expectedNote));
      var ul = document.createElement('ul');
      ul.className = 'events';
      shownLater.forEach(function (e) {
        ul.appendChild(card(e, String(d.expectedWhen).replace('{month}', monthYear(e.year, e.month))));
      });
      expectedBox.appendChild(ul);
      moreButton.parentNode.insertBefore(expectedBox, moreButton.nextSibling);
    }
    fit();
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

// Contact form.
(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;
  form.hidden = false;
  var d = form.dataset;
  var status = form.querySelector('.form-status');
  var topic = form.elements.topic;
  var message = form.elements.message;
  var submit = form.querySelector('button[type="submit"]');

  function say(kind, value) {
    status.className = 'form-status ' + kind;
    status.textContent = '';
    if (kind === 'error') {
      // "{email}" in the text becomes a link to the address, so a failed send leaves another way.
      var parts = String(value).split('{email}');
      status.appendChild(document.createTextNode(parts[0]));
      if (parts.length > 1) {
        var a = document.createElement('a');
        a.href = 'mailto:' + d.to;
        a.textContent = d.to;
        status.appendChild(a);
        status.appendChild(document.createTextNode(parts.slice(1).join('{email}')));
      }
    } else {
      status.textContent = value;
    }
  }

  // The hint in the message box fits the topic (an event needs a name, a place, dates and a link).
  function hint() {
    var option = topic.options[topic.selectedIndex];
    message.placeholder = option && option.dataset.key === 'event' ? d.eventPlaceholder : d.placeholder;
  }
  topic.addEventListener('change', hint);
  hint();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.elements.botcheck && form.elements.botcheck.checked) return; // a robot filled the hidden field
    var fields = {
      topic: topic.value,
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      message: message.value.trim(),
    };
    var subject = 'Eldoria website: ' + fields.topic;

    if (d.mode === 'mail') {
      var lines = [fields.message, '', '--'];
      if (fields.name) lines.push(fields.name);
      if (fields.email) lines.push(fields.email);
      lines.push('Eldoria website (' + d.lang + ')');
      window.location.href = 'mailto:' + d.to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
      return;
    }

    var payload = { access_key: d.key, subject: subject, from_name: 'Eldoria website', topic: fields.topic, message: fields.message, language: d.lang };
    if (fields.name) payload.name = fields.name;
    if (fields.email) payload.email = fields.email; // the service uses it as the reply address
    submit.disabled = true;
    say('', d.sending);
    fetch(d.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        return r.json().then(function (body) { return r.ok && body && body.success === true; }, function () { return false; });
      })
      .catch(function () { return false; })
      .then(function (ok) {
        submit.disabled = false;
        if (ok) {
          form.reset();
          hint();
          say('ok', d.sent);
        } else {
          say('error', d.error);
        }
      });
  });
})();
