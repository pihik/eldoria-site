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

// Small, local-only page controls: theme, reading progress, back-to-top and screenshot lightbox.
(function () {
  var words = {
    en: ['Use light theme', 'Use dark theme', 'Back to top', 'Open screenshot', 'Close screenshot', 'Previous screenshot', 'Next screenshot'],
    cs: ['Použít světlý motiv', 'Použít tmavý motiv', 'Zpět nahoru', 'Otevřít snímek obrazovky', 'Zavřít snímek obrazovky', 'Předchozí snímek', 'Další snímek'],
    sk: ['Použiť svetlý motív', 'Použiť tmavý motív', 'Späť nahor', 'Otvoriť snímku obrazovky', 'Zavrieť snímku obrazovky', 'Predchádzajúca snímka', 'Ďalšia snímka'],
    de: ['Helles Design verwenden', 'Dunkles Design verwenden', 'Nach oben', 'Screenshot öffnen', 'Screenshot schließen', 'Vorheriger Screenshot', 'Nächster Screenshot'],
    pl: ['Włącz jasny motyw', 'Włącz ciemny motyw', 'Wróć na górę', 'Otwórz zrzut ekranu', 'Zamknij zrzut ekranu', 'Poprzedni zrzut ekranu', 'Następny zrzut ekranu'],
    ru: ['Включить светлую тему', 'Включить тёмную тему', 'Наверх', 'Открыть снимок экрана', 'Закрыть снимок экрана', 'Предыдущий снимок', 'Следующий снимок'],
    sl: ['Uporabi svetlo temo', 'Uporabi temno temo', 'Na vrh', 'Odpri posnetek zaslona', 'Zapri posnetek zaslona', 'Prejšnji posnetek', 'Naslednji posnetek'],
    hu: ['Világos téma', 'Sötét téma', 'Ugrás az oldal tetejére', 'Képernyőkép megnyitása', 'Képernyőkép bezárása', 'Előző képernyőkép', 'Következő képernyőkép'],
    uk: ['Увімкнути світлу тему', 'Увімкнути темну тему', 'На початок', 'Відкрити знімок екрана', 'Закрити знімок екрана', 'Попередній знімок', 'Наступний знімок'],
    hr: ['Uključi svijetlu temu', 'Uključi tamnu temu', 'Na vrh', 'Otvori snimku zaslona', 'Zatvori snimku zaslona', 'Prethodna snimka', 'Sljedeća snimka'],
    ro: ['Folosește tema deschisă', 'Folosește tema închisă', 'Înapoi sus', 'Deschide captura de ecran', 'Închide captura de ecran', 'Captura anterioară', 'Captura următoare'],
    it: ['Usa il tema chiaro', 'Usa il tema scuro', 'Torna in cima', 'Apri screenshot', 'Chiudi screenshot', 'Screenshot precedente', 'Screenshot successivo'],
    fr: ['Utiliser le thème clair', 'Utiliser le thème sombre', 'Retour en haut', 'Ouvrir la capture d’écran', 'Fermer la capture d’écran', 'Capture précédente', 'Capture suivante'],
    es: ['Usar tema claro', 'Usar tema oscuro', 'Volver arriba', 'Abrir captura de pantalla', 'Cerrar captura de pantalla', 'Captura anterior', 'Captura siguiente'],
  };
  var lang = document.documentElement.lang || 'en';
  var t = words[lang] || words.en;
  var root = document.documentElement;
  var bar = document.querySelector('.bar');
  var languageMenu = document.querySelector('.lang-menu');

  if (bar && languageMenu) {
    var theme = document.createElement('button');
    theme.type = 'button';
    theme.className = 'theme-toggle';
    theme.textContent = '☾';
    bar.insertBefore(theme, languageMenu);
    function updateThemeButton(dark) {
      theme.textContent = dark ? '☼' : '☾';
      theme.setAttribute('aria-label', dark ? t[0] : t[1]);
      theme.setAttribute('title', dark ? t[0] : t[1]);
      theme.setAttribute('aria-pressed', String(dark));
    }
    updateThemeButton(root.dataset.theme ? root.dataset.theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches);
    theme.addEventListener('click', function () {
      var dark = root.dataset.theme ? root.dataset.theme !== 'dark' : !window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = dark ? 'dark' : 'light';
      updateThemeButton(dark);
    });
  }

  var progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);
  var top = document.createElement('button');
  top.type = 'button';
  top.className = 'scroll-top';
  top.textContent = '↑';
  top.setAttribute('aria-label', t[2]);
  top.setAttribute('title', t[2]);
  document.body.appendChild(top);
  top.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  var scheduled = false;
  function updateScroll() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0) + '%';
      top.classList.toggle('visible', window.scrollY > 500);
      scheduled = false;
    });
  }
  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', updateScroll);
  updateScroll();

  var gallery = document.querySelector('.gallery');
  var shots = gallery && Array.prototype.slice.call(gallery.querySelectorAll('.shots figure'));
  if (!shots || !shots.length || !window.HTMLDialogElement || !HTMLDialogElement.prototype.showModal) return;
  var dialog = document.createElement('dialog');
  dialog.className = 'shot-dialog';
  dialog.setAttribute('aria-label', gallery.querySelector('.shots').getAttribute('aria-label') || 'Screenshots');
  var close = document.createElement('button');
  close.type = 'button'; close.className = 'shot-close'; close.textContent = '×';
  close.setAttribute('aria-label', t[4]);
  var prev = document.createElement('button');
  prev.type = 'button'; prev.className = 'shot-prev'; prev.textContent = '‹';
  prev.setAttribute('aria-label', t[5]);
  var next = document.createElement('button');
  next.type = 'button'; next.className = 'shot-next'; next.textContent = '›';
  next.setAttribute('aria-label', t[6]);
  var figure = document.createElement('figure');
  var image = document.createElement('img');
  image.alt = '';
  var caption = document.createElement('figcaption');
  figure.appendChild(image); figure.appendChild(caption);
  dialog.appendChild(close); dialog.appendChild(prev); dialog.appendChild(next); dialog.appendChild(figure);
  document.body.appendChild(dialog);
  var index = 0;
  function show(i) {
    index = (i + shots.length) % shots.length;
    var original = shots[index].querySelector('img');
    var text = shots[index].querySelector('figcaption');
    image.src = original.currentSrc || original.src;
    image.alt = original.alt;
    caption.textContent = text ? text.textContent : original.alt;
    prev.hidden = next.hidden = shots.length < 2;
  }
  shots.forEach(function (item, i) {
    var original = item.querySelector('img');
    if (!original) return;
    var opener = document.createElement('button');
    opener.type = 'button'; opener.className = 'shot-open';
    opener.setAttribute('aria-label', t[3] + ': ' + (original.alt || ''));
    item.insertBefore(opener, original);
    opener.appendChild(original);
    opener.addEventListener('click', function () { show(i); dialog.showModal(); close.focus(); });
  });
  close.addEventListener('click', function () { dialog.close(); });
  prev.addEventListener('click', function () { show(index - 1); });
  next.addEventListener('click', function () { show(index + 1); });
  dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
  });
})();

// Living Atlas: an offline-friendly, searchable canvas atlas built from Eldoria's public place data.
(function () {
  var mount = document.querySelector('.atlas-mount');
  if (!mount) return;
  var copy = {
    en: ['Explore the living atlas', 'A world of history, one place at a time.', 'Search places', 'Search a castle, town or country', 'Place type', 'Country', 'All places', 'Surprise me', 'Reset filters', 'places found', 'Choose a marker or try a surprise discovery.', 'Selected place', 'Type', 'Condition', 'Coordinates', 'Open source', 'Copy coordinates', 'Copied', 'The atlas could not load. Try again when online.', 'Loading the atlas…', 'Zoom in', 'Zoom out', 'Reset view', 'Interactive atlas with historic places', 'Add to journey', 'Your journey', 'Clear journey', 'Open directions', 'Added to journey', 'Maximum 5 stops', 'Choose a place, then add it here.'],
    cs: ['Prozkoumat živý atlas', 'Svět historie, jedno místo po druhém.', 'Hledat místa', 'Hrad, město nebo zemi', 'Typ místa', 'Země', 'Všechna místa', 'Překvap mě', 'Vymazat filtry', 'nalezených míst', 'Vyberte bod na mapě nebo objevte místo náhodně.', 'Vybrané místo', 'Typ', 'Stav', 'Souřadnice', 'Otevřít zdroj', 'Kopírovat souřadnice', 'Zkopírováno', 'Atlas se nepodařilo načíst. Zkuste to znovu online.', 'Načítání atlasu…', 'Přiblížit', 'Oddálit', 'Obnovit pohled', 'Interaktivní atlas historických míst', 'Přidat do cesty', 'Vaše cesta', 'Vymazat cestu', 'Otevřít trasu', 'Přidáno do cesty', 'Nejvýše 5 zastávek', 'Vyberte místo a přidejte ho sem.'],
    sk: ['Preskúmať živý atlas', 'Svet histórie, jedno miesto za druhým.', 'Hľadať miesta', 'Hrad, mesto alebo krajina', 'Typ miesta', 'Krajina', 'Všetky miesta', 'Prekvap ma', 'Vymazať filtre', 'nájdených miest', 'Vyberte bod na mape alebo objavte miesto náhodne.', 'Vybrané miesto', 'Typ', 'Stav', 'Súradnice', 'Otvoriť zdroj', 'Kopírovať súradnice', 'Skopírované', 'Atlas sa nepodarilo načítať. Skúste to znova online.', 'Načítava sa atlas…', 'Priblížiť', 'Oddialiť', 'Obnoviť pohľad', 'Interaktívny atlas historických miest', 'Pridať do cesty', 'Vaša cesta', 'Vymazať cestu', 'Otvoriť trasu', 'Pridané do cesty', 'Najviac 5 zastávok', 'Vyberte miesto a pridajte ho sem.'],
    de: ['Den lebendigen Atlas erkunden', 'Eine Welt voller Geschichte, Ort für Ort.', 'Orte suchen', 'Burg, Stadt oder Land suchen', 'Ortstyp', 'Land', 'Alle Orte', 'Überrasch mich', 'Filter zurücksetzen', 'Orte gefunden', 'Wähle einen Punkt oder entdecke einen zufälligen Ort.', 'Ausgewählter Ort', 'Typ', 'Zustand', 'Koordinaten', 'Quelle öffnen', 'Koordinaten kopieren', 'Kopiert', 'Atlas konnte nicht geladen werden. Bitte später erneut versuchen.', 'Atlas wird geladen…', 'Vergrößern', 'Verkleinern', 'Ansicht zurücksetzen', 'Interaktiver Atlas historischer Orte', 'Zur Route hinzufügen', 'Deine Route', 'Route leeren', 'Route öffnen', 'Zur Route hinzugefügt', 'Maximal 5 Stopps', 'Ort auswählen und hier hinzufügen.'],
    pl: ['Odkryj żywy atlas', 'Świat historii, miejsce po miejscu.', 'Szukaj miejsc', 'Szukaj zamku, miasta lub kraju', 'Rodzaj miejsca', 'Kraj', 'Wszystkie miejsca', 'Zaskocz mnie', 'Wyczyść filtry', 'znalezionych miejsc', 'Wybierz punkt na mapie lub odkryj miejsce losowo.', 'Wybrane miejsce', 'Rodzaj', 'Stan', 'Współrzędne', 'Otwórz źródło', 'Kopiuj współrzędne', 'Skopiowano', 'Nie udało się wczytać atlasu. Spróbuj ponownie online.', 'Wczytywanie atlasu…', 'Powiększ', 'Pomniejsz', 'Resetuj widok', 'Interaktywny atlas miejsc historycznych', 'Dodaj do trasy', 'Twoja trasa', 'Wyczyść trasę', 'Otwórz trasę', 'Dodano do trasy', 'Maksymalnie 5 przystanków', 'Wybierz miejsce i dodaj je tutaj.'],
    ru: ['Открыть живой атлас', 'Мир истории, место за местом.', 'Поиск мест', 'Найти замок, город или страну', 'Тип места', 'Страна', 'Все места', 'Удиви меня', 'Сбросить фильтры', 'мест найдено', 'Выберите точку на карте или откройте случайное место.', 'Выбранное место', 'Тип', 'Состояние', 'Координаты', 'Открыть источник', 'Скопировать координаты', 'Скопировано', 'Не удалось загрузить атлас. Попробуйте позже.', 'Загрузка атласа…', 'Приблизить', 'Отдалить', 'Сбросить вид', 'Интерактивный атлас исторических мест', 'Добавить в маршрут', 'Ваш маршрут', 'Очистить маршрут', 'Открыть маршрут', 'Добавлено в маршрут', 'Не более 5 остановок', 'Выберите место и добавьте его сюда.'],
    sl: ['Razišči živi atlas', 'Svet zgodovine, kraj za krajem.', 'Išči kraje', 'Poišči grad, mesto ali državo', 'Vrsta kraja', 'Država', 'Vsi kraji', 'Preseneti me', 'Počisti filtre', 'najdenih krajev', 'Izberi točko na zemljevidu ali naključno odkrij kraj.', 'Izbrani kraj', 'Vrsta', 'Stanje', 'Koordinate', 'Odpri vir', 'Kopiraj koordinate', 'Kopirano', 'Atlasa ni bilo mogoče naložiti. Poskusi znova pozneje.', 'Nalaganje atlasa…', 'Povečaj', 'Pomanjšaj', 'Ponastavi pogled', 'Interaktivni atlas zgodovinskih krajev', 'Dodaj na pot', 'Tvoja pot', 'Počisti pot', 'Odpri pot', 'Dodano na pot', 'Največ 5 postankov', 'Izberi kraj in ga dodaj sem.'],
    hu: ['Fedezd fel az élő atlaszt', 'A történelem világa, helyről helyre.', 'Helyek keresése', 'Vár, város vagy ország keresése', 'Hely típusa', 'Ország', 'Minden hely', 'Lepj meg', 'Szűrők törlése', 'találat', 'Válassz egy pontot vagy fedezz fel egy véletlen helyet.', 'Kiválasztott hely', 'Típus', 'Állapot', 'Koordináták', 'Forrás megnyitása', 'Koordináták másolása', 'Másolva', 'Az atlasz nem tölthető be. Próbáld újra később.', 'Atlasz betöltése…', 'Nagyítás', 'Kicsinyítés', 'Nézet visszaállítása', 'Történelmi helyek interaktív atlasza', 'Hozzáadás az útvonalhoz', 'Útvonalad', 'Útvonal törlése', 'Útvonal megnyitása', 'Hozzáadva az útvonalhoz', 'Legfeljebb 5 megálló', 'Válassz egy helyet, és add hozzá itt.'],
    uk: ['Дослідити живий атлас', 'Світ історії — місце за місцем.', 'Пошук місць', 'Знайти замок, місто або країну', 'Тип місця', 'Країна', 'Усі місця', 'Здивуй мене', 'Скинути фільтри', 'місць знайдено', 'Оберіть точку на мапі або відкрийте випадкове місце.', 'Обране місце', 'Тип', 'Стан', 'Координати', 'Відкрити джерело', 'Копіювати координати', 'Скопійовано', 'Не вдалося завантажити атлас. Спробуйте пізніше.', 'Завантаження атласу…', 'Збільшити', 'Зменшити', 'Скинути вигляд', 'Інтерактивний атлас історичних місць', 'Додати до маршруту', 'Ваш маршрут', 'Очистити маршрут', 'Відкрити маршрут', 'Додано до маршруту', 'Не більше 5 зупинок', 'Оберіть місце й додайте його сюди.'],
    hr: ['Istraži živi atlas', 'Svijet povijesti, mjesto po mjesto.', 'Pretraži mjesta', 'Traži dvorac, grad ili državu', 'Vrsta mjesta', 'Država', 'Sva mjesta', 'Iznenadi me', 'Poništi filtre', 'pronađenih mjesta', 'Odaberi točku na karti ili otkrij nasumično mjesto.', 'Odabrano mjesto', 'Vrsta', 'Stanje', 'Koordinate', 'Otvori izvor', 'Kopiraj koordinate', 'Kopirano', 'Atlas se nije mogao učitati. Pokušaj ponovno kasnije.', 'Učitavanje atlasa…', 'Povećaj', 'Smanji', 'Poništi prikaz', 'Interaktivni atlas povijesnih mjesta', 'Dodaj na putovanje', 'Tvoje putovanje', 'Izbriši putovanje', 'Otvori rutu', 'Dodano na putovanje', 'Najviše 5 postaja', 'Odaberi mjesto i dodaj ga ovdje.'],
    ro: ['Explorează atlasul viu', 'O lume a istoriei, loc cu loc.', 'Caută locuri', 'Caută un castel, un oraș sau o țară', 'Tipul locului', 'Țara', 'Toate locurile', 'Surprinde-mă', 'Resetează filtrele', 'locuri găsite', 'Alege un punct sau descoperă un loc la întâmplare.', 'Loc selectat', 'Tip', 'Stare', 'Coordonate', 'Deschide sursa', 'Copiază coordonatele', 'Copiat', 'Atlasul nu a putut fi încărcat. Încearcă din nou mai târziu.', 'Se încarcă atlasul…', 'Mărește', 'Micșorează', 'Resetează vederea', 'Atlas interactiv al locurilor istorice', 'Adaugă la traseu', 'Traseul tău', 'Șterge traseul', 'Deschide traseul', 'Adăugat la traseu', 'Maximum 5 opriri', 'Alege un loc și adaugă-l aici.'],
    it: ['Esplora l’atlante vivente', 'Un mondo di storia, un luogo alla volta.', 'Cerca luoghi', 'Cerca un castello, una città o un paese', 'Tipo di luogo', 'Paese', 'Tutti i luoghi', 'Sorprendimi', 'Reimposta filtri', 'luoghi trovati', 'Scegli un punto o scopri un luogo a caso.', 'Luogo selezionato', 'Tipo', 'Stato', 'Coordinate', 'Apri la fonte', 'Copia coordinate', 'Copiato', 'Impossibile caricare l’atlante. Riprova più tardi.', 'Caricamento atlante…', 'Ingrandisci', 'Riduci', 'Reimposta vista', 'Atlante interattivo dei luoghi storici', 'Aggiungi al viaggio', 'Il tuo viaggio', 'Svuota il viaggio', 'Apri percorso', 'Aggiunto al viaggio', 'Massimo 5 tappe', 'Scegli un luogo e aggiungilo qui.'],
    fr: ['Explorer l’atlas vivant', 'Un monde d’histoire, lieu après lieu.', 'Rechercher des lieux', 'Chercher un château, une ville ou un pays', 'Type de lieu', 'Pays', 'Tous les lieux', 'Surprends-moi', 'Effacer les filtres', 'lieux trouvés', 'Choisissez un point ou découvrez un lieu au hasard.', 'Lieu sélectionné', 'Type', 'État', 'Coordonnées', 'Ouvrir la source', 'Copier les coordonnées', 'Copié', 'Impossible de charger l’atlas. Réessayez plus tard.', 'Chargement de l’atlas…', 'Zoom avant', 'Zoom arrière', 'Réinitialiser la vue', 'Atlas interactif des lieux historiques', 'Ajouter au parcours', 'Votre parcours', 'Effacer le parcours', 'Ouvrir l’itinéraire', 'Ajouté au parcours', '5 étapes maximum', 'Choisissez un lieu et ajoutez-le ici.'],
    es: ['Explora el atlas vivo', 'Un mundo de historia, lugar a lugar.', 'Buscar lugares', 'Busca un castillo, ciudad o país', 'Tipo de lugar', 'País', 'Todos los lugares', 'Sorpréndeme', 'Restablecer filtros', 'lugares encontrados', 'Elige un punto o descubre un lugar al azar.', 'Lugar seleccionado', 'Tipo', 'Estado', 'Coordenadas', 'Abrir fuente', 'Copiar coordenadas', 'Copiado', 'No se pudo cargar el atlas. Inténtalo más tarde.', 'Cargando el atlas…', 'Acercar', 'Alejar', 'Restablecer vista', 'Atlas interactivo de lugares históricos', 'Añadir al viaje', 'Tu viaje', 'Borrar viaje', 'Abrir ruta', 'Añadido al viaje', 'Máximo 5 paradas', 'Elige un lugar y añádelo aquí.'],
  };
  var kinds = {
    en: ['Castle', 'Fortress', 'Chateau or palace', 'Manor house', 'Historic town', 'Ancient site', 'Historic site'], cs: ['Hrad', 'Pevnost', 'Zámek nebo palác', 'Tvrz', 'Historické město', 'Starověké místo', 'Historické místo'],
    sk: ['Hrad', 'Pevnosť', 'Zámok alebo palác', 'Kaštieľ', 'Historické mesto', 'Staroveké miesto', 'Historické miesto'], de: ['Burg', 'Festung', 'Schloss oder Palast', 'Herrenhaus', 'Historische Stadt', 'Antike Stätte', 'Historischer Ort'],
    pl: ['Zamek', 'Twierdza', 'Pałac', 'Dwór', 'Historyczne miasto', 'Stanowisko starożytne', 'Miejsce historyczne'], ru: ['Замок', 'Крепость', 'Дворец', 'Усадьба', 'Исторический город', 'Древнее место', 'Историческое место'],
    sl: ['Grad', 'Trdnjava', 'Palača', 'Dvorec', 'Zgodovinsko mesto', 'Starodavno najdišče', 'Zgodovinski kraj'], hu: ['Vár', 'Erőd', 'Kastély vagy palota', 'Kúria', 'Történelmi város', 'Ókori helyszín', 'Történelmi hely'],
    uk: ['Замок', 'Фортеця', 'Палац', 'Садиба', 'Історичне місто', 'Стародавня пам’ятка', 'Історичне місце'], hr: ['Dvorac', 'Tvrđava', 'Palača', 'Dvorac', 'Povijesni grad', 'Antičko nalazište', 'Povijesno mjesto'],
    ro: ['Castel', 'Fortăreață', 'Palat', 'Conac', 'Oraș istoric', 'Sit antic', 'Loc istoric'], it: ['Castello', 'Fortezza', 'Palazzo', 'Dimora signorile', 'Città storica', 'Sito antico', 'Sito storico'],
    fr: ['Château', 'Forteresse', 'Château ou palais', 'Manoir', 'Ville historique', 'Site antique', 'Site historique'], es: ['Castillo', 'Fortaleza', 'Palacio', 'Casa señorial', 'Ciudad histórica', 'Yacimiento antiguo', 'Lugar histórico'],
  };
  var conditions = {
    en: { intact: 'Standing', restored: 'Restored', rebuilt: 'Rebuilt', ruin: 'Ruins', destroyed: 'Destroyed', unknown: 'Unknown', '': 'Not classified' },
    cs: { intact: 'Zachovalý', restored: 'Obnovený', rebuilt: 'Přestavěný', ruin: 'Zřícenina', destroyed: 'Zaniklý', unknown: 'Neznámý', '': 'Nezařazený' },
    sk: { intact: 'Zachovaný', restored: 'Obnovený', rebuilt: 'Prestavaný', ruin: 'Zrúcanina', destroyed: 'Zaniknutý', unknown: 'Neznámy', '': 'Nezaradený' },
    de: { intact: 'Erhalten', restored: 'Restauriert', rebuilt: 'Wiederaufgebaut', ruin: 'Ruine', destroyed: 'Zerstört', unknown: 'Unbekannt', '': 'Nicht eingestuft' },
    pl: { intact: 'Zachowany', restored: 'Odrestaurowany', rebuilt: 'Odbudowany', ruin: 'Ruina', destroyed: 'Zniszczony', unknown: 'Nieznany', '': 'Nie sklasyfikowano' },
    ru: { intact: 'Сохранился', restored: 'Реставрирован', rebuilt: 'Восстановлен', ruin: 'Руины', destroyed: 'Уничтожен', unknown: 'Неизвестно', '': 'Не классифицировано' },
    sl: { intact: 'Ohranjen', restored: 'Obnovljen', rebuilt: 'Ponovno zgrajen', ruin: 'Ruševina', destroyed: 'Porušen', unknown: 'Neznano', '': 'Nerazvrščeno' },
    hu: { intact: 'Épen áll', restored: 'Felújított', rebuilt: 'Újjáépített', ruin: 'Rom', destroyed: 'Elpusztult', unknown: 'Ismeretlen', '': 'Nincs besorolva' },
    uk: { intact: 'Збережений', restored: 'Відреставрований', rebuilt: 'Відбудований', ruin: 'Руїни', destroyed: 'Зруйнований', unknown: 'Невідомо', '': 'Не класифіковано' },
    hr: { intact: 'Očuvan', restored: 'Obnovljen', rebuilt: 'Ponovno izgrađen', ruin: 'Ruševina', destroyed: 'Uništen', unknown: 'Nepoznato', '': 'Nerazvrstano' },
    ro: { intact: 'Păstrat', restored: 'Restaurat', rebuilt: 'Reconstruit', ruin: 'Ruine', destroyed: 'Distrus', unknown: 'Necunoscut', '': 'Neclasificat' },
    it: { intact: 'Integro', restored: 'Restaurato', rebuilt: 'Ricostruito', ruin: 'Rovina', destroyed: 'Distrutto', unknown: 'Sconosciuto', '': 'Non classificato' },
    fr: { intact: 'Préservé', restored: 'Restauré', rebuilt: 'Reconstruit', ruin: 'Ruine', destroyed: 'Détruit', unknown: 'Inconnu', '': 'Non classé' },
    es: { intact: 'Conservado', restored: 'Restaurado', rebuilt: 'Reconstruido', ruin: 'Ruinas', destroyed: 'Destruido', unknown: 'Desconocido', '': 'Sin clasificar' },
  };
  var lang = document.documentElement.lang || 'en';
  var t = copy[lang] || copy.en;
  var kindNames = kinds[lang] || kinds.en;
  var conditionNames = conditions[lang] || conditions.en;
  var photoLabels = { en: 'Photo on Wikimedia Commons', cs: 'Fotografie na Wikimedia Commons', sk: 'Fotografia na Wikimedia Commons', de: 'Foto auf Wikimedia Commons', pl: 'Zdjęcie w Wikimedia Commons', ru: 'Фото на Wikimedia Commons', sl: 'Fotografija na Wikimedia Commons', hu: 'Fénykép a Wikimedia Commonson', uk: 'Фото на Wikimedia Commons', hr: 'Fotografija na Wikimedia Commons', ro: 'Fotografie pe Wikimedia Commons', it: 'Foto su Wikimedia Commons', fr: 'Photo sur Wikimedia Commons', es: 'Foto en Wikimedia Commons' };
  var noPhotoLabels = { en: 'No photo found on Wikimedia Commons', cs: 'Fotografie na Wikimedia Commons nebyla nalezena', sk: 'Fotografia na Wikimedia Commons sa nenašla', de: 'Kein Foto auf Wikimedia Commons gefunden', pl: 'Nie znaleziono zdjęcia w Wikimedia Commons', ru: 'На Wikimedia Commons фотография не найдена', sl: 'Na Wikimedia Commons ni bila najdena fotografija', hu: 'Nem található fénykép a Wikimedia Commonson', uk: 'На Wikimedia Commons не знайдено фото', hr: 'Fotografija nije pronađena na Wikimedia Commons', ro: 'Nu s-a găsit nicio fotografie pe Wikimedia Commons', it: 'Nessuna foto trovata su Wikimedia Commons', fr: 'Aucune photo trouvée sur Wikimedia Commons', es: 'No se encontró ninguna foto en Wikimedia Commons' };
  var categoryKeys = ['castle', 'fortress', 'chateau', 'manor', 'town', 'ancient', 'other'];
  var categoryColors = ['#56a6ff', '#d0dae0', '#ff786d', '#ffad5c', '#e879c1', '#aab55e', '#91b9a7'];
  var atlas = document.createElement('section');
  atlas.id = 'atlas'; atlas.className = 'atlas-section';
  atlas.setAttribute('aria-label', t[23]);
  atlas.innerHTML = '<div class="wrap"><div class="atlas-shell"><div class="atlas-tools"><label class="atlas-search-label"><span></span><input class="atlas-search" type="search" autocomplete="off"></label><label class="atlas-select-label atlas-kind-label"><span></span><select class="atlas-kind"></select></label><label class="atlas-select-label atlas-country-label"><span></span><select class="atlas-country"></select></label><button class="atlas-button atlas-surprise" type="button"></button><button class="atlas-button atlas-reset" type="button"></button></div><div class="atlas-grid"><div class="atlas-mapbox"><canvas class="atlas-canvas" tabindex="0" role="img"></canvas><div class="atlas-zoom"><button type="button" data-zoom="in" aria-label=""></button><button type="button" data-zoom="out" aria-label=""></button><button type="button" data-zoom="reset" aria-label=""></button></div><div class="atlas-map-caption"></div><div class="atlas-attribution"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a><span> · </span><a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noopener noreferrer">Report a map issue</a></div></div><aside class="atlas-side"><div class="atlas-count"></div><div class="atlas-selection" aria-live="polite"></div><div class="atlas-results"></div></aside></div><div class="atlas-journey"><div class="atlas-journey-head"><h3></h3><p></p></div><ol class="atlas-journey-list" aria-live="polite"></ol><div class="atlas-journey-actions"><button class="atlas-clear-journey" type="button"></button><a class="atlas-directions" target="_blank" rel="noopener noreferrer"></a></div></div></div></div>';
  mount.appendChild(atlas);
  var pageTitle = document.getElementById('atlas-title');
  var pageIntro = document.getElementById('atlas-intro');
  if (pageTitle) pageTitle.textContent = t[0];
  if (pageIntro) pageIntro.textContent = t[1];
  atlas.querySelector('.atlas-search-label span').textContent = t[2];
  atlas.querySelector('.atlas-search').placeholder = t[3];
  atlas.querySelector('.atlas-search').setAttribute('aria-label', t[2]);
  atlas.querySelector('.atlas-kind-label span').textContent = t[4];
  atlas.querySelector('.atlas-country-label span').textContent = t[5];
  atlas.querySelector('.atlas-surprise').textContent = t[7];
  atlas.querySelector('.atlas-reset').textContent = t[8];
  atlas.querySelector('.atlas-canvas').setAttribute('aria-label', t[23]);
  atlas.querySelector('.atlas-map-caption').textContent = t[10];
  atlas.querySelector('.atlas-journey-head h3').textContent = t[25];
  atlas.querySelector('.atlas-journey-head p').textContent = t[30];
  atlas.querySelector('.atlas-clear-journey').textContent = t[26];
  atlas.querySelector('.atlas-directions').textContent = t[27];
  atlas.querySelector('[data-zoom="in"]').textContent = '+';
  atlas.querySelector('[data-zoom="out"]').textContent = '−';
  atlas.querySelector('[data-zoom="reset"]').textContent = '⌂';
  atlas.querySelector('[data-zoom="in"]').setAttribute('aria-label', t[20]);
  atlas.querySelector('[data-zoom="out"]').setAttribute('aria-label', t[21]);
  atlas.querySelector('[data-zoom="reset"]').setAttribute('aria-label', t[22]);
  var type = atlas.querySelector('.atlas-kind');
  var country = atlas.querySelector('.atlas-country');
  function option(select, value, label) { var o = document.createElement('option'); o.value = value; o.textContent = label; select.appendChild(o); }
  option(type, '', t[6]);
  categoryKeys.forEach(function (key, i) { option(type, key, kindNames[i]); });

  var data = null;
  var filtered = [];
  var selected = null;
  var initialSelectionMade = false;
  var journey = [];
  var surprisePending = false;
  var zoom = 1; var panX = 0; var panY = 0;
  var canvas = atlas.querySelector('.atlas-canvas');
  var ctx = canvas.getContext('2d');
  var palette = { castle: 0, fortress: 1, chateau: 2, manor: 3, town: 4, ancient: 5, other: 6 };
  var tileCache = Object.create(null);
  var tileUrlTemplate = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  function dimensions() {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    if (!rect.width || !rect.height) return null;
    if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
      canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: rect.width, h: rect.height };
  }
  function mercatorY(lat) { var safe = Math.max(-85.0511, Math.min(85.0511, lat)); return (1 - Math.log(Math.tan(Math.PI / 4 + safe * Math.PI / 360)) / Math.PI) / 2; }
  function xy(lon, lat, w, h) { var world = w * zoom; return [w / 2 + panX + lon / 360 * world, h / 2 + panY + (mercatorY(lat) - .5) * world]; }
  function drawTiles(w, h) {
    var level = Math.min(19, Math.max(2, Math.round(Math.log(zoom) / Math.LN2) + 2));
    var count = Math.pow(2, level), world = w * zoom, tileSize = world / count;
    var left = w / 2 + panX - world / 2, top = h / 2 + panY - world / 2;
    var minX = Math.floor(-left / tileSize), maxX = Math.floor((w - left) / tileSize);
    var minY = Math.max(0, Math.floor(-top / tileSize)), maxY = Math.min(count - 1, Math.floor((h - top) / tileSize));
    for (var ty = minY; ty <= maxY; ty++) for (var tx = minX; tx <= maxX; tx++) {
      var wrappedX = ((tx % count) + count) % count;
      var key = level + '/' + wrappedX + '/' + ty;
      var image = tileCache[key];
      var dx = left + tx * tileSize, dy = top + ty * tileSize;
      if (!image) {
        image = new Image(); tileCache[key] = image;
        image.onload = draw;
        image.src = tileUrlTemplate.replace('{z}', level).replace('{x}', wrappedX).replace('{y}', ty);
      }
      if (image.complete && image.naturalWidth) ctx.drawImage(image, dx, dy, tileSize + .5, tileSize + .5);
    }
  }
  function clampPan(w, h) {
    var world = w * zoom;
    var limitX = Math.max(0, (world - w) / 2);
    var limitY = Math.max(0, (world - h) / 2);
    panX = Math.max(-limitX, Math.min(limitX, panX));
    panY = Math.max(-limitY, Math.min(limitY, panY));
  }
  function draw() {
    var size = dimensions(); if (!size) return;
    var w = size.w, h = size.h;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#d5e2dd'; ctx.fillRect(0, 0, w, h);
    drawTiles(w, h);
    ctx.save(); ctx.strokeStyle = 'rgba(30,54,54,.16)'; ctx.lineWidth = 1;
    for (var lon = -150; lon <= 180; lon += 30) { var gx = xy(lon, 0, w, h)[0]; ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
    for (var lat = -60; lat <= 60; lat += 30) { var gy = xy(0, lat, w, h)[1]; ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.globalAlpha = filtered.length > 18000 ? .68 : .88;
    var stride = Math.max(1, Math.ceil(filtered.length / Math.min(16000, Math.round(3000 * zoom * zoom))));
    for (var placeIndex = 0; placeIndex < filtered.length; placeIndex += stride) { var p = filtered[placeIndex], point = xy(p[1], p[0], w, h); if (point[0] < -4 || point[0] > w + 4 || point[1] < -4 || point[1] > h + 4) continue; ctx.beginPath(); ctx.arc(point[0], point[1], filtered.length > 30000 ? 1.5 : 2.2, 0, Math.PI * 2); ctx.fillStyle = categoryColors[palette[p[4]] ?? 0]; ctx.fill(); }
    if (journey.length) { ctx.beginPath(); journey.forEach(function (p, i) { var pt = xy(p[1], p[0], w, h); if (i) ctx.lineTo(pt[0], pt[1]); else ctx.moveTo(pt[0], pt[1]); }); ctx.strokeStyle = '#f2ce7e'; ctx.lineWidth = 2.5; ctx.shadowColor = '#f2ce7e'; ctx.shadowBlur = 9; ctx.stroke(); ctx.shadowBlur = 0; journey.forEach(function (p, i) { var pt = xy(p[1], p[0], w, h); ctx.beginPath(); ctx.arc(pt[0], pt[1], 5, 0, Math.PI * 2); ctx.fillStyle = '#f2ce7e'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#10232b'; ctx.stroke(); ctx.font = 'bold 10px system-ui'; ctx.fillStyle = '#10232b'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), pt[0], pt[1]); }); }
    if (selected) { var selectedPoint = xy(selected[1], selected[0], w, h); ctx.beginPath(); ctx.arc(selectedPoint[0], selectedPoint[1], 8, 0, Math.PI * 2); ctx.strokeStyle = '#ffe49b'; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.arc(selectedPoint[0], selectedPoint[1], 3, 0, Math.PI * 2); ctx.fillStyle = '#fff2c5'; ctx.fill(); }
    ctx.restore();
  }
  function countryName(code) { var entry = data.countries[code] || {}; return entry[lang] || entry.en || code; }
  function searchText(value) {
    return String(value || '').toLocaleLowerCase(lang).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function refreshCountryOptions() {
    var previous = country.value;
    country.textContent = ''; option(country, '', t[6]);
    Object.keys(data.countries).sort(function (a, b) { return countryName(a).localeCompare(countryName(b), lang); }).forEach(function (code) { option(country, code, countryName(code)); });
    country.value = previous;
  }
  function matchData() {
    if (!data) return;
    var query = searchText(atlas.querySelector('.atlas-search').value.trim());
    var k = type.value, c = country.value;
    var selectionBefore = selected;
    filtered = data.items.filter(function (p) {
      if (k && p[4] !== k) return false;
      if (c && p[3] !== c) return false;
      if (!query) return true;
      if (searchText(p[2]).indexOf(query) !== -1 || searchText(countryName(p[3])).indexOf(query) !== -1 || searchText(p[3]).indexOf(query) !== -1 || searchText(p[6]).indexOf(query) !== -1) return true;
      var aliases = p[7] || {};
      if (Object.keys(aliases).some(function (key) { return searchText(aliases[key]).indexOf(query) !== -1; })) return true;
      var countryAliases = data.countries[p[3]] || {};
      return Object.keys(countryAliases).some(function (key) { return searchText(countryAliases[key]).indexOf(query) !== -1; });
    });
    atlas.querySelector('.atlas-count').textContent = new Intl.NumberFormat(lang).format(filtered.length) + ' / ' + new Intl.NumberFormat(lang).format(data.total) + ' ' + t[9];
    renderResults();
    if (selected && filtered.indexOf(selected) < 0) selected = null;
    if (!selected && filtered.length && !initialSelectionMade) { selected = filtered[0]; initialSelectionMade = true; }
    if (selected !== selectionBefore || !initialSelectionMade) renderSelection();
    draw();
  }
  function renderResults() {
    var list = atlas.querySelector('.atlas-results'); list.textContent = '';
    var query = atlas.querySelector('.atlas-search').value.trim();
    filtered.slice(0, 8).forEach(function (p) { var b = document.createElement('button'); b.type = 'button'; b.className = 'atlas-result'; b.textContent = p[2] + ' · ' + countryName(p[3]); b.addEventListener('click', function () { select(p, true); }); list.appendChild(b); });
    if (!filtered.length) { var empty = document.createElement('p'); empty.className = 'atlas-empty'; empty.textContent = t[10]; list.appendChild(empty); }
  }
  function select(p, panTo) {
    selected = p; renderSelection();
    if (panTo) { zoom = Math.max(zoom, 3); var size = dimensions(); if (size) { var pt = xy(p[1], p[0], size.w, size.h); panX += size.w / 2 - pt[0]; panY += size.h / 2 - pt[1]; clampPan(size.w, size.h); } }
    draw();
  }
  function renderSelection() {
    var box = atlas.querySelector('.atlas-selection'); box.textContent = '';
    if (!selected) { var prompt = document.createElement('p'); prompt.textContent = t[10]; box.appendChild(prompt); return; }
    var title = document.createElement('p'); title.className = 'atlas-selected-kicker'; title.textContent = t[11];
    var name = document.createElement('h3'); name.textContent = selected[2];
    var countryLine = document.createElement('p'); countryLine.className = 'atlas-country-name'; countryLine.textContent = countryName(selected[3]);
    var photo = document.createElement('div'); photo.className = 'atlas-photo'; photo.setAttribute('aria-live', 'polite');
    photo.classList.add('is-loading');
    box.appendChild(title); box.appendChild(name); box.appendChild(countryLine); box.appendChild(photo);
    loadPhoto(selected, photo);
    var dl = document.createElement('dl'); dl.className = 'atlas-metadata';
    [[t[12], kindNames[Math.max(0, categoryKeys.indexOf(selected[4]))] || kindNames[6]], [t[13], conditionNames[selected[5]] || conditionNames['']], [t[14], selected[0].toFixed(4) + ', ' + selected[1].toFixed(4)]].forEach(function (pair) { var wrap = document.createElement('div'); var dt = document.createElement('dt'); dt.textContent = pair[0]; var dd = document.createElement('dd'); dd.textContent = pair[1]; wrap.appendChild(dt); wrap.appendChild(dd); dl.appendChild(wrap); });
    var actions = document.createElement('div'); actions.className = 'atlas-card-actions';
    var source = document.createElement('a'); source.className = 'atlas-link'; source.href = selected[6] ? 'https://www.wikidata.org/wiki/' + selected[6] : 'https://www.openstreetmap.org/?mlat=' + selected[0] + '&mlon=' + selected[1] + '#map=15/' + selected[0] + '/' + selected[1]; source.target = '_blank'; source.rel = 'noopener noreferrer'; source.textContent = t[15];
    var copy = document.createElement('button'); copy.type = 'button'; copy.className = 'atlas-copy'; copy.textContent = t[16];
    copy.addEventListener('click', function () { if (!navigator.clipboard || !navigator.clipboard.writeText) return; navigator.clipboard.writeText(selected[0].toFixed(5) + ', ' + selected[1].toFixed(5)).then(function () { copy.textContent = t[17]; setTimeout(function () { copy.textContent = t[16]; }, 1800); }).catch(function () {}); });
    var add = document.createElement('button'); add.type = 'button'; add.className = 'atlas-add'; add.textContent = t[24];
    add.addEventListener('click', function () {
      if (journey.length >= 5) { add.textContent = t[29]; setTimeout(function () { add.textContent = t[24]; }, 1600); return; }
      if (!journey.some(function (p) { return p[0] === selected[0] && p[1] === selected[1] && p[2] === selected[2]; })) journey.push(selected);
      add.textContent = t[28]; setTimeout(function () { if (add.isConnected) add.textContent = t[24]; }, 1600);
      renderJourney(); draw();
    });
    actions.appendChild(source); actions.appendChild(copy); actions.appendChild(add);
    box.appendChild(dl); box.appendChild(actions);
  }
  function loadPhoto(place, target) {
    var request;
    function noPhoto() { target.classList.remove('is-loading'); target.classList.add('is-empty'); target.textContent = noPhotoLabels[lang] || noPhotoLabels.en; }
    function commonsFile(title) {
      var api = 'https://commons.wikimedia.org/w/api.php?action=query&titles=' + encodeURIComponent(title) + '&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=900&format=json&origin=*';
      return fetch(api).then(function (r) { return r.json(); }).then(function (json) { var pages = json.query && json.query.pages; return pages ? pages[Object.keys(pages)[0]] : null; });
    }
    function commonsSearch() {
      if (place[8] && /^Category:/i.test(place[8])) {
        var categoryApi = 'https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=' + encodeURIComponent(place[8]) + '&cmtype=file&cmlimit=1&format=json&origin=*';
        return fetch(categoryApi).then(function (r) { return r.json(); }).then(function (json) {
          var member = json.query && json.query.categorymembers && json.query.categorymembers[0];
          if (member) return commonsFile(member.title);
          return commonsSearchByName();
        });
      }
      return commonsSearchByName();
    }
    function commonsSearchByName() {
      var term = place[8] ? 'file:' + place[8] : place[2];
      var api = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' + encodeURIComponent(term) + '&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=900&format=json&origin=*';
      return fetch(api).then(function (r) { return r.json(); }).then(function (json) { var pages = json.query && json.query.pages; return pages ? pages[Object.keys(pages)[0]] : null; });
    }
    if (place[6]) {
      request = fetch('https://www.wikidata.org/w/api.php?action=wbgetentities&ids=' + encodeURIComponent(place[6]) + '&props=claims&format=json&origin=*')
        .then(function (r) { return r.json(); }).then(function (json) {
          var claims = json.entities && json.entities[place[6]] && json.entities[place[6]].claims;
          var filename = claims && claims.P18 && claims.P18[0] && claims.P18[0].mainsnak.datavalue.value;
          if (!filename) return commonsSearch();
          return commonsFile('File:' + filename);
        });
    } else request = commonsSearch();
    request.then(function (page) {
      if (!target.isConnected) return;
      if (!page || !page.imageinfo || !page.imageinfo[0]) { noPhoto(); return; }
      var info = page.imageinfo[0], meta = info.extmetadata || {};
      target.classList.remove('is-loading'); target.textContent = '';
      var image = document.createElement('img'); image.loading = 'lazy'; image.alt = place[2]; image.addEventListener('error', noPhoto); image.src = info.thumburl || info.url; target.appendChild(image);
      var credit = document.createElement('p'); credit.className = 'atlas-photo-credit';
      var sourceLink = document.createElement('a'); sourceLink.href = info.descriptionurl; sourceLink.target = '_blank'; sourceLink.rel = 'noopener noreferrer'; sourceLink.textContent = photoLabels[lang] || photoLabels.en; credit.appendChild(sourceLink);
      var artist = meta.Artist && meta.Artist.value ? meta.Artist.value.replace(/<[^>]*>/g, '').trim() : '';
      var license = meta.LicenseShortName && meta.LicenseShortName.value ? meta.LicenseShortName.value : '';
      if (artist || license) credit.appendChild(document.createTextNode(' · ' + [artist, license].filter(Boolean).join(' · ')));
      target.appendChild(credit);
    }).catch(function () { if (target.isConnected) noPhoto(); });
  }
  function renderJourney() {
    var list = atlas.querySelector('.atlas-journey-list'); list.textContent = '';
    if (!journey.length) { var empty = document.createElement('li'); empty.textContent = t[30]; list.appendChild(empty); }
    journey.forEach(function (p, i) { var li = document.createElement('li'); var stop = document.createElement('span'); stop.textContent = (i + 1) + '. ' + p[2] + ' · ' + countryName(p[3]); li.appendChild(stop); list.appendChild(li); });
    var directions = atlas.querySelector('.atlas-directions');
    directions.hidden = journey.length === 0;
    directions.href = journey.length ? 'https://www.google.com/maps/dir/' + journey.map(function (p) { return encodeURIComponent(p[0] + ',' + p[1]); }).join('/') : '#';
  }
  function load() {
    if (atlas.dataset.loading) return;
    atlas.dataset.loading = '1'; atlas.querySelector('.atlas-count').textContent = t[19]; draw();
    var script = document.querySelector('script[src*="site.js"]');
    var url = new URL('../atlas.json', script ? script.src : location.href);
    fetch(url.href).then(function (response) { if (!response.ok) throw new Error('Atlas request failed'); return response.json(); }).then(function (json) {
      data = json; atlas.dataset.loading = ''; refreshCountryOptions(); matchData(); renderJourney();
      if (surprisePending && filtered.length) { surprisePending = false; select(filtered[Math.floor(Math.random() * filtered.length)], true); }
    }).catch(function () { atlas.dataset.loading = ''; atlas.querySelector('.atlas-count').textContent = t[18]; });
  }
  var observer = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) { if (entries.some(function (e) { return e.isIntersecting; })) { load(); observer.disconnect(); } }, { rootMargin: '180px' }) : null;
  if (observer) observer.observe(atlas); else load();
  var searchTimer = 0;
  atlas.querySelector('.atlas-search').addEventListener('input', function () { window.clearTimeout(searchTimer); searchTimer = window.setTimeout(matchData, 120); });
  type.addEventListener('change', matchData); country.addEventListener('change', matchData);
  atlas.querySelector('.atlas-surprise').addEventListener('click', function () { if (!data) { surprisePending = true; load(); return; } if (!filtered.length) return; select(filtered[Math.floor(Math.random() * filtered.length)], true); });
  atlas.querySelector('.atlas-clear-journey').addEventListener('click', function () { journey = []; renderJourney(); draw(); });
  atlas.querySelector('.atlas-reset').addEventListener('click', function () { atlas.querySelector('.atlas-search').value = ''; type.value = ''; country.value = ''; zoom = 1; panX = panY = 0; matchData(); });
  atlas.querySelector('[data-zoom="in"]').addEventListener('click', function () { zoom = Math.min(8192, zoom * 2); var size = dimensions(); if (size) clampPan(size.w, size.h); draw(); });
  atlas.querySelector('[data-zoom="out"]').addEventListener('click', function () { zoom = Math.max(1, zoom / 2); var size = dimensions(); if (size) clampPan(size.w, size.h); draw(); });
  atlas.querySelector('[data-zoom="reset"]').addEventListener('click', function () { zoom = 1; panX = panY = 0; draw(); });
  var dragging = false, moved = false, startX = 0, startY = 0, startPanX = 0, startPanY = 0;
  canvas.addEventListener('pointerdown', function (e) { dragging = true; moved = false; startX = e.clientX; startY = e.clientY; startPanX = panX; startPanY = panY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', function (e) { if (!dragging) return; var dx = e.clientX - startX, dy = e.clientY - startY; if (Math.abs(dx) + Math.abs(dy) > 5) moved = true; if (moved) { panX = startPanX + dx; panY = startPanY + dy; var size = dimensions(); if (size) clampPan(size.w, size.h); draw(); } });
  canvas.addEventListener('pointerup', function (e) {
    if (!dragging) return; dragging = false;
    if (!moved && data && filtered.length) { var rect = canvas.getBoundingClientRect(), x = e.clientX - rect.left, y = e.clientY - rect.top, best = null, bestD = 18 * 18; filtered.forEach(function (p) { var pt = xy(p[1], p[0], rect.width, rect.height), dx = pt[0] - x, dy = pt[1] - y, d = dx * dx + dy * dy; if (d < bestD) { bestD = d; best = p; } }); if (best) select(best, false); }
  });
  canvas.addEventListener('pointercancel', function () { dragging = false; });
  canvas.addEventListener('wheel', function (e) { e.preventDefault(); zoom = Math.max(1, Math.min(8192, zoom * (e.deltaY < 0 ? 1.25 : .8))); var size = dimensions(); if (size) clampPan(size.w, size.h); draw(); }, { passive: false });
  canvas.addEventListener('keydown', function (e) { if (e.key === '+' || e.key === '=') { zoom = Math.min(8192, zoom * 2); } else if (e.key === '-') { zoom = Math.max(1, zoom / 2); } else return; var size = dimensions(); if (size) clampPan(size.w, size.h); draw(); });
  window.addEventListener('resize', draw);
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
