// Eldoria website: fills the list of upcoming medieval events from events.json (the same file the app reads).
// No libraries, no third-party requests. Text from the file is inserted as text, never as HTML.
(function () {
  var list = document.getElementById('events-list');
  if (!list) return;
  var lang = document.documentElement.lang || 'en';
  var d = list.dataset;

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

  function render(events) {
    var upcoming = events
      .filter(function (e) {
        return e && typeof e.title === 'string' && parseDay(e.start) && parseDay(e.end) && String(e.end) >= today;
      })
      .sort(function (a, b) { return String(a.start).localeCompare(String(b.start)) || a.title.localeCompare(b.title); });

    if (!upcoming.length) return note(d.empty);
    list.textContent = '';
    upcoming.forEach(function (e) {
      var li = document.createElement('li');
      li.className = 'card';
      var title = (e.titles && e.titles[lang]) || e.title;
      var desc = (e.descriptions && e.descriptions[lang]) || e.description;
      li.appendChild(text('p', 'when', dates(parseDay(e.start), parseDay(e.end))));
      li.appendChild(text('h3', '', title));
      var place = [e.city, typeof e.country === 'string' ? country(e.country) : ''].filter(Boolean).join(', ');
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
      list.appendChild(li);
    });
  }

  fetch(d.src, { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      if (!data || !Array.isArray(data.events)) throw new Error('not an events file');
      render(data.events);
    })
    .catch(function () { note(d.error); });
})();
