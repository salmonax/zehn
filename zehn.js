const $ = document.querySelector.bind(document);
const $$ = (...args) => [].slice.apply(document.querySelectorAll(...args));
const div = (selector, style, text) => {
  const _div = document.createElement('div');
  Array.isArray(selector) ?
    _div.classList.add(...selector) :
    _div.classList.add(selector);
  Object.assign(_div.style, style);
  if (text) _div.innerText = text;
  return _div;
};
const pipe = (...fs) => fs.reduce((a, f) => f(a), null);


const ascii = {
  zehn: `
    ███████╗███████╗██╗  ██╗███╗   ██╗
    ╚══███╔╝██╔════╝██║  ██║████╗  ██║
      ███╔╝ █████╗  ███████║██╔██╗ ██║
     ███╔╝  ██╔══╝  ██╔══██║██║╚██╗██║
    ███████╗███████╗██║  ██║██║ ╚████║
    ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝
  `,
  chum: `
    C
    H
    U
    M
    |
    D
    E
    X
  `,
};

const audio = {
  fx: {
    dexGet: new Audio('/imrcv.ogg'),
    dexSend: new Audio('/imsend.ogg'),
    telemetry: new Audio('/type3.mp3'),
    crt: new Audio('/crt.mp3'),
  },
  music: {
    apartment: new Audio('/apartment.ogg'),
    'office building': new Audio('/office.ogg'),
    street: new Audio('/gangbusters.ogg'),
    bistro: new Audio('/bistro.ogg'),
    'secret lab': new Audio('/tech.ogg'),
    'chez fremp': new Audio('/fremp.ogg'),
    zehn: new Audio('/zehn.ogg'),
  },
};

const _debug = {
  skipIntro: true,
};

const makePresenter = (binding) => ({
  bindEvents() {
    Object.keys(binding).forEach(selector => {
      if (typeof binding[selector] === 'function') {
        return $$(selector).forEach($el => $el.addEventListener('click', e => {
          e.stopPropagation();
          binding[selector](e);
        }));
      }
      Object.keys(binding[selector]).forEach(action => {
        $$(selector).forEach($el => $el.addEventListener(action, binding[selector][action]));
      });
    });
  }
});
const makeEngine = (world) => ({ // just following convention
  world,
  _startTime: null,
  _elapsed: 0,
  _gameClockInterval: null,
  _playerLoc: null,
  clock: {
    start: Date.parse(`5/7/2032 15:30:00 PDT`),
    end: Date.parse(`5/8/2032 15:30:00 PDT`),
    durationInMinutes: 25,
    getGameTime(elapsed) {
      return Math.round(
        this.start + (this.end - this.start)/1000/60/this.durationInMinutes*elapsed,
      );
    }
  },
  // Hrm, definitely shouldn't be handling DOM business here:
  dex: {
    _texts: {},
    _selectedChum: null,
    selectChum(chumName) {
      this._selectedChum = chumName;
    },
    add(chum, msg) {
      const texts = this._texts;
      if (!texts[chum]) texts[chum] = [];
      texts[chum].push(msg);
      this.render(chum);
    },
    _toHTML({ label, text }) {
      return `<div class="dex-msg"><span class="in">${label}</span> ${text}</div>`;
    },
    render(chum, rootSelector = '.chum-dex .chums') {
      // This is append only and shouldn't be re-rendered from scratch every time. blargh.
      const html = this._texts[chum].map(this._toHTML).join(' ');
      const selector = `${rootSelector} .${chum}`; // NOOO!!!
      $(selector).innerHTML = html;
    },
  },
  get gameTime() {
    return this.clock.getGameTime(this._elapsed);
  },
  loadLoc(locName) {
    console.log('!!!!', locName);
    //- window.argh = this.world.description[locName].first;
    const trimAndSpace = t => t.trim().replace(/(\n+)\s*/g,'$1').replace(/\n{1}/g, '\n\n');
    const lastLocName = this._playerLoc;
    const room = this.world.description[locName] || this.world.description.any;
    if (!room) return;
    if (!room._visitCount) room._visitCount = 0;
    room._visitCount++;

    const description =
      ((typeof room === 'string') ?
        room :
        (room._visitCount === 1 ? (room.first ? trimAndSpace(room.first) + '\n\n' : '') : '') + trimAndSpace(room.always));

    $('.description').innerText = '';
    audio.fx.telemetry.play();

    const lastRoomMusic = audio.music[lastLocName];
    const roomMusic = audio.music[locName];
    lastRoomMusic && lastRoomMusic.pause();
    if (roomMusic) {
      roomMusic.currentTime = 0;
      roomMusic.play();
    }

    type(description, c => {
      audio.fx.telemetry.currentTime = 0;
      $('.description').innerText += c;
    }, 10, 50);

    this._playerLoc = locName;
  },
  startLoop() {
    if (this._startTime) return;
    this._startTime = Date.now();
    this.loop();
    this._gameClockInterval = window.setInterval(this.loop.bind(this), 100);
  },
  stopLoop() {
    window.clearInterval(this._gameClockInterval);
    this._reset();
  },
  _reset() {
    this._gameClockInterval = null;
    this._startTime = null;
  },
  loop() {
    // Get current gameTime
    const { clock } = this;
    const elapsed = this._elapsed = Date.now() - this._startTime;
    const gameTime = clock.getGameTime(elapsed);
    // End game, if applicable
    if (gameTime > this.clock.end) {
      alert('GAME OVER');
      this.stopLoop();
    }

    const { dex } = world;
    Object.keys(dex).forEach(chum => {
      Object.keys(dex[chum]).forEach(time => {
        const texts = dex[chum][time];
        const parsedMsgTime = parseTime(time);
        if (parsedMsgTime <= gameTime && !texts._triggered) {
          const startSecs = Math.random()*40;
          let delay, slack; // leave undefined, use function default by default
          const isBeforeGame = parsedMsgTime < this.clock.start;
          if (isBeforeGame) delay = slack = 0;
          pester(chum, texts, (text, i, d) => {
            if (!isBeforeGame) audio.fx.dexGet.play();
            const secs = Math.min(59,((startSecs + i*d/25)|0)).toFixed().padStart(2, '0'); // formatting
            // bleh, move this into the dex:
            const label = `${time}:${secs} ${cap(chum)}:`;
            // console.log(msg);
            this.dex.add(chum, { label, text });
          }, delay, slack);
          texts._triggered = true;
        }
      });
    });
    // Update status menu±
    $('.time').innerText = (new Date(gameTime)).toLocaleString();
    //
  },
  startIntro() {
    //- audio.music['office building'].play();
    $('.zehn .logo').innerText = ascii.zehn;
    $('.zehn .backdrop').innerText = `ZEHN is a transistorpunk adventure set in 2032 that takes ZEHN minutes to complete or it resets the universe was ZEHN is ZEHN and will always be ZEHN made the suns ZEHN made the worlds ZEHN created the lives and the places they inhabit ZEHN moves them here ZEHN put them there they go as ZEHN says then do as ZEHN tells them ZEHM is and ZEHN shall always be `.repeat(100);
    audio.music.zehn.play();

    setTimeout(() => {
      audio.fx.telemetry.play();
      type(`ARGH, STOP DREAMING ABOUT THIS KEYGEN INTRO STUFF!`, c => {
        audio.fx.telemetry.currentTime = 0;
        $('.awaken .comment').innerText += c;
      }, 10, 50)
        .then(_ => {
          type('WAKE UP!', c => {
            audio.fx.telemetry.currentTime = 0;
            $('.awaken .link').innerText += c;
          }, 10, 50);
        });
    }, 6000);

  },
  stopIntro() {
    audio.music.zehn.pause();
    $('.zehn').classList.add('hidden');
  },
  initGame() {
    $('.chum-dex .side').innerText = ascii.chum;
    this.startLoop();
    this.loadLoc('bistro');
    $('.status .location').innerText = 'bistro';
  }
});

// This is glue between engine, dom, and input methods
const makeAction = (engine) => ({
  start: _ => engine.startLoop(),
  stop: _ => engine.stopLoop(),
  wakeUp: _ => {
    engine.stopIntro();
    engine.initGame();
  },
  go: _ => {
    audio.fx.crt.play();
    $('.white').classList.add('on');
    $('.go').classList.add('off');
    setTimeout(() => engine.startIntro(), 450);
  },
  selectChum: ({ target }) => {
    console.log('fucoisdosia');
    const chumName = target.innerText.toLowerCase(); // TODO: switch to class, make chum-bar creation programmatic
    $$('.chum-dex .body .chums > *').forEach($el => {
      engine.dex.selectChum(chumName);
      $el.classList[$el.classList.contains(chumName) ? 'add' : 'remove']('on');
    });
  },
  changeLocation: (e, loc) => {
    const clickedLoc = loc || e.target.innerText.split('\n')[0];
    engine.loadLoc(clickedLoc);
    $('.status .location').innerText = clickedLoc;
  },
});

const makeDomBinding = (action) => ({
  '.chum-bar .icon': action.selectChum,
  '.start': action.start,
  '.stop': action.stop,
  '.locale': action.changeLocation,
  '.awaken .link': action.wakeUp,
  '.go': action.go,
});

async function init() {
  const world = window.world = await fetchWorld('game.yml');
  const engine = window.engine =  makeEngine(world);
  const action = window.action =  makeAction(engine);
  const domBinding = window.domBinding =  makeDomBinding(action);
  const presenter =  window.presenter = makePresenter(domBinding);

  buildMap(world); // uhh.. this goes in the presenter?
  presenter.bindEvents();
  if (_debug.skipIntro) action.wakeUp();
  parseTime('14:40');

}


//- engine.startIntro();


function buildMap(world, $root = $('.map')) {
  const locMap = world.orientation;
  const offsets = {
    n: { top: -35 },
    s: { top: 35 },
    w: { left: -130 },
    e: { left: 130 },
  };
  const reg = {};
  Object.keys(locMap).forEach(loc => {
    const $parent = _addOrGet(loc);
    Object.keys(locMap[loc]).forEach(dir => {
      const subLoc = locMap[loc][dir];
      //- console.log(dir)
      _addOrGet(subLoc, $parent, offsets[dir]);
    });
  });
  _fixPosition();

  function _addOrGet(loc, $parent = $root, style) {
    if (reg[loc]) {
      if ($parent !== $root) {
        Object.assign(reg[loc].style, style);
        $parent.appendChild(reg[loc]);
      }
      return reg[loc];
    }
    const locClass = loc.replace(/\s/,'-');
    let $el = reg[loc] = div(['locale', locClass], style, loc);
    $parent.appendChild($el);
    return $el;
  }
  function _fixPosition(_$root = $root) {
    const { x: xo, y: yo } = _$root.getBoundingClientRect();
    const $$locales = $$('.locale');
    const { width, height } = $$locales[0].getBoundingClientRect(); // assumes all same
    const relPos = $$locales.map($el => {
      const { x, y } = $el.getBoundingClientRect();
      return [x-xo,y-yo] ;
    });
    const [xMin, yMin]= Array(2).fill()
      .map((_, i) => Math.min.apply(null, relPos.map(n => n[i])))
    const [xMax, yMax]= Array(2).fill()
      .map((_, i) => Math.max.apply(null, relPos.map(n => n[i])));

    $$locales.forEach(($el, i) => {
      Object.assign($el.style, {
        left: relPos[i][0] - xMin,
        top: relPos[i][1] - yMin,
      });
      _$root.appendChild($el);
    });
    Object.assign(_$root.style, {
      width: xMax-xMin + width,
      height: yMax-yMin + height,
      bottom: 40,
      left: 40,
    });
  }
}

function cap(txt) {
  return txt[0].toUpperCase() + txt.substr(1);
}

function type(text, cb = console.log, delay = 200, slack = 100) {
  clearInterval(type.interval);
  return text.split('')
    .map((n, i) => _ =>
      new Promise(r => {
        const adjustedDelay = delay + Math.round((Math.random()*slack*2)-slack);
        type.interval = setTimeout(_ => r(cb(n, i, adjustedDelay)), adjustedDelay);
      }),
    )
    .reduce((last, next) => last.then(next), Promise.resolve());
}

// DRY this with type function
function pester(chum, texts, cb = console.log, delay = 500, slack = 500) {
  if (!pester.queue) pester.queue = {};
  if (!pester.queue[chum]) pester.queue[chum] = Promise.resolve();
  pester.queue[chum] = pester.queue[chum]
    .then(_ => texts
      .map((n, i) => _ =>
        new Promise(r => {
          const adjustedDelay = delay + Math.round((Math.random()*slack*2)-slack);
          setTimeout(_ => r(cb(n, i, adjustedDelay)), adjustedDelay);
        }),
      )
      .reduce((last, next) => last.then(next), Promise.resolve()),
    );
}

// Bleh, just kludging this for now
function parseTime(timeString, startTime = engine.clock.start) {
  const dateString =
    new Date(engine.clock.start).toLocaleDateString("en-US", {timeZone: "America/Los_Angeles"});
  let [hh, mm] = timeString.split(':');
  let dayOffset = 0;
  //- hh = +hh, mm = +mm;
  if (+hh > 24 || (+hh === 24 && +mm > 0)) {
    hh = (+hh - 24).toFixed().padStart(2, '0');
    dayOffset = 8.64e7;
  }
  return Date.parse(`${dateString} ${hh}:${mm}:00 PDT`) + dayOffset;
}

function fetchWorld(yml) {
  return fetch(yml).then(r => r.text()).then(jsyaml.load);
}