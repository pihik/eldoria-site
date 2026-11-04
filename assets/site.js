// Eldoria website: fills the list of upcoming medieval events from events.json (the same file the app reads).
// No libraries, no third-party requests. Text from the file is inserted as text, never as HTML.
(function () {
  var list = document.getElementById('events-list');
  if (!list) return;
  var lang = document.documentElement.lang || 'en';
  var d = list.dataset;
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

  var LIMIT = 18;
  var expanded = false;
  var filterBar = null;
  var expectedBox = null;
  var chosen = '';

  function render(events, expected) {
    var upcoming = events
      .filter(function (e) {
        return e && typeof e.title === 'string' && parseDay(e.start) && parseDay(e.end) && String(e.end) >= today;
      })
      .sort(function (a, b) { return String(a.start).localeCompare(String(b.start)) || a.title.localeCompare(b.title); });
    var thisMonth = now.getFullYear() + '-' + pad(now.getMonth() + 1);
    var later = expected
      .filter(function (e) {
        return e && typeof e.title === 'string' && typeof e.year === 'number' && typeof e.month === 'number' &&
          e.month >= 1 && e.month <= 12 && (e.year + '-' + pad(e.month)) >= thisMonth;
      })
      .sort(function (a, b) { return (a.year - b.year) || (a.month - b.month) || a.title.localeCompare(b.title); });

    // One button per category that occurs, plus "all".
    if (!filterBar) {
      var present = ORDER.filter(function (c) {
        return upcoming.concat(later).some(function (e) { return categoryOf(e) === c; });
      });
      if (present.length > 1) {
        filterBar = document.createElement('div');
        filterBar.className = 'chips';
        filterBar.setAttribute('role', 'group');
        [''].concat(present).forEach(function (c) {
          var b = document.createElement('button');
          b.type = 'button';
          b.textContent = c ? categories[c] : d.all;
          b.setAttribute('aria-pressed', c === chosen ? 'true' : 'false');
          b.addEventListener('click', function () {
            chosen = c;
            expanded = false;
            Array.prototype.forEach.call(filterBar.children, function (x, i) {
              x.setAttribute('aria-pressed', ([''].concat(present)[i] === chosen) ? 'true' : 'false');
            });
            render(events, expected);
          });
          filterBar.appendChild(b);
        });
        list.parentNode.insertBefore(filterBar, list);
      }
    }

    var shown = chosen ? upcoming.filter(function (e) { return categoryOf(e) === chosen; }) : upcoming;
    var shownLater = chosen ? later.filter(function (e) { return categoryOf(e) === chosen; }) : later;

    if (!shown.length) note(d.empty);
    else {
      list.textContent = '';
      var visible = expanded ? shown : shown.slice(0, LIMIT);
      visible.forEach(function (e) { list.appendChild(card(e, dates(parseDay(e.start), parseDay(e.end)))); });
      if (visible.length < shown.length) {
        var li = document.createElement('li');
        li.className = 'more';
        var button = text('button', '', String(d.showAll).replace('{n}', shown.length));
        button.type = 'button';
        button.addEventListener('click', function () { expanded = true; render(events, expected); });
        li.appendChild(button);
        list.appendChild(li);
      }
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
