import _audio from './audio';
import { ascii } from './constants';
import { parseTime, pester, cap, type } from './utils';

const makeEngine = (world, audio = _audio) => ({ // just following convention
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
      console.log(selector)
      if ($(selector) === null) console.error(selector)
      $(selector).innerHTML = html;
      $(selector).scrollTo({ top: 100, behavior: 'smooth' });
    },
  },
  get gameTime() {
    return this.clock.getGameTime(this._elapsed);
  },
  loadLoc(locName) {
    //- window.argh = this.world.description[locName].first;
    const trimAndSpace = t => t.trim().replace(/(\n+)\s*/g,'$1').replace(/\n{1}/g, '\n\n');
    const lastLocName = this._playerLoc;
    const room = this.world.description[locName] || this.world.description.any; // This is junk; can be either string or object. Fix.
    if (!room) return;
    if (typeof room === 'object') {
      if (!room._visitCount) room._visitCount = 0;
      room._visitCount++;
    }

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

export default makeEngine;