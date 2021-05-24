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
  telemetry: new Audio('/type3.mp3'),
  crt: new Audio('/crt.mp3'),
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
  skipIntro: false,
};
const world = {
  revealed: {
    apartment: true,
    street: true,
  },
  chumdex: {
    Fremp: {
      '12:30': [
        `Hey Pluff, waaasaaap?`,
        `We still on for 7:30pm?`,
      ],
      '16:12': [
        `Pfft, what'd you do, forget to wake up again?`,
        `Well whatever, I'll be over at Vesuvio's like we said.`,
      ],
      '16:41': [
        `PLUFF! RESPOND, NOW.`,
      ],
    },
  },
  irl: {

  },
  orientation: {
    bathroom: { s: 'apartment', n: 'secret bathroom' },
    apartment: { s: 'street' },
    street: { s: 'bistro', e: 'office building', w: 'chez fremp' },
    'office building': { e: 'secret lab' },
    'secret lab': { s: 'dark basement'},
  },
  description: {
    any: `There's sadly nothing much of note about this place.`,
    bistro: {
      first: `
        As you come in, you see Quint counting the register, and he throws you an odd glance, looking perturbed. There's definitely something on his mind.
      `,
      always: `
        Vesuvio's is directly across the street from where you live, so you come here a lot.
      `,
      clock: {
        '19:55': {
          room: 'Fremp comes in and peers around as if looking for someone. As soon as she sees you, she waves and sits down across from you.',
        },
        '22:30': {
          room: `Quint come out of the kitchen and says, "Closing time! Try to finish up by 11pm so me and the cook can go home.`,
        },
        '23:00': {
          room: `
            "All right, everybody," you hear Quint announcs, 'you don't have to go home, but you can't stay here!"
          `,
        },
      },
      check: {
        window: `You look out the window. Great.`,
      },
    },
    apartment: {
      first: `
        Welp, that was fun. Back to your life, you guess.

        For some reason, you've woken up in your day clothes, and you're sleeping on your bed sideways. Who on earth DOES that?

        People of the future, that's who.

        Also, it's after 4:30 PM. And you can't remember falling to sleep. In a brief panic, you try to remember who you are, and... you do. Fantastic.
      `,
      always: `
        So this is your pad, on the 23rd floor of a boring medium-rise. Sigh. Is it even worth living in a city this big anymore?
      `,
    },
    street: {
      first: `
        Maybe it isn't worth it.

        Just look at this street, mostly awash in the shadows of the surrounding buildings, dirty sidewalks, traffic. That poor guy who sleeps face down on the sidewalk.
      `,
      always: `
        There's an office building at the end of the street to the east; to the west is that conspicuous storybook house where Fremp lives.
      `,
    },
    'office building': {
      first: `
        What an imposing edifice. This building creeps you out so much that you always avoid passing by it.
      `,
      always: `
        For some reason, you now find yourself loitering at the foot of an ominous, brutalist facade.
      `,
    },
    'chez fremp': {
      always: `
        Fremp's house is straight out of a fairytale, painstakingly designed for maximum whimsy. Perfect dwelling for a gadget-obsessed packrat and self-proclaimed conspiracy-realist.

        Uh oh, Fremp's about to get you into a whole lot of trouble, isn't she?
      `,
    },
    'secret lab': {
      first: `
        Incredible, it's that secret lab that Fremp rambled to you about. You've never seen anything like it.
      `,
      always: `
        Uh oh, something's making you feel like you're trapped inside of a Zachtronics game all of the sudden.
      `,
      check: {
        play: 'Yeah, right.',
      }
    },
  },
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
    audio.telemetry.play();

    const lastRoomMusic = audio.music[lastLocName];
    const roomMusic = audio.music[locName];
    lastRoomMusic && lastRoomMusic.pause();
    if (roomMusic) {
      roomMusic.currentTime = 0;
      roomMusic.play();
    }

    type(description, c => {
      audio.telemetry.currentTime = 0;
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
    // Update status menu
    $('.time').innerText = (new Date(gameTime)).toLocaleString();
    //
  },
  startIntro() {
    //- audio.music['office building'].play();
    $('.zehn .logo').innerText = ascii.zehn;
    $('.zehn .backdrop').innerText = `ZEHN is a cyberpunk adventure set in 2032 that takes ZEHN minutes to complete or it resets the universe was ZEHN is ZEHN and will always be ZEHN made the suns ZEHN made the worlds ZEHN created the lives and the places they inhabit ZEHN moves them here ZEHN put them there they go as ZEHN says then do as ZEHN tells them ZEHM is and ZEHN shall always be `.repeat(100);
    audio.music.zehn.play();

    setTimeout(() => {
      audio.telemetry.play();
      type(`ARGH, STOP DREAMING ABOUT THIS KEYGEN INTRO STUFF!`, c => {
        audio.telemetry.currentTime = 0;
        $('.awaken .comment').innerText += c;
      }, 10, 50)
        .then(_ => {
          type('WAKE UP!', c => {
            audio.telemetry.currentTime = 0;
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
    this.loadLoc('apartment');
  }
});

const makeAction = (engine) => ({
  start: _ => engine.startLoop(),
  stop: _ => engine.stopLoop(),
  wakeUp: _ => {
    engine.stopIntro();
    engine.initGame();
  },
  go: _ => {
    audio.crt.play();
    $('.white').classList.add('on');
    $('.go').classList.add('off');
    setTimeout(() => engine.startIntro(), 450);
  },
  changeLocation: e => {
    const clickedLoc = e.target.innerText.split('\n')[0];
    engine.loadLoc(clickedLoc);
    $('.status .location').innerText = clickedLoc;
  },
});

const makeDomBinding = (action) => ({
  '.start': action.start,
  '.stop': action.stop,
  '.locale': action.changeLocation,
  '.awaken .link': action.wakeUp,
  '.go': action.go,
});

init();
async function init() {
  const world = window.world = await getWorld('game.yml');
  const engine = window.engine =  makeEngine(world);
  const action = window.action =  makeAction(engine);
  const domBinding = window.domBinding =  makeDomBinding(action);
  const presenter =  window.presenter = makePresenter(domBinding);

  buildMap(world); // uhh.. this goes in the presenter?
  presenter.bindEvents();
  if (_debug.skipIntro) {
    action.wakeUp();
  }

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

//- parseTime('14:30');
// Bleh, just kluding this for now
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

function getWorld(yml) {
  return fetch(yml)
    .then(r => r.text())
    .then(txt => {
      return jsyaml.load(
        txt,
      );

    })
}